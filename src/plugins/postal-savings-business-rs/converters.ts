import { AccountOrCard, AccountType, ExtendedTransaction, Merchant } from '../../types/zenmoney'
import { BankAccount, BankTransaction, FetchParams } from './models'
import { parseAmount, parseDate } from './parsers'

export function convertAccounts (raw: BankAccount[]): Array<{ account: AccountOrCard, fetchParams: FetchParams }> {
  console.assert(raw.length > 0, 'No business accounts to convert')
  console.assert(new Set(raw.map(item => item.number)).size === raw.length, 'Duplicate business account identity')
  return raw.map(item => {
    // Different current/available values need evidence for holds and credit facilities.
    console.assert(item.current === item.available, 'Unverified business account balance relationship', { currency: item.currency })
    return {
      account: {
        id: item.number.replace(/-/g, ''),
        type: AccountType.checking,
        title: item.title,
        instrument: item.currency,
        balance: item.current,
        syncIds: [item.number.replace(/-/g, '')]
      },
      fetchParams: { index: item.index }
    }
  })
}

function merchant (text: string): Merchant | null {
  if (text === '') return null
  // The observed foreign sender layout appends a street address and country to the legal name.
  const foreign = text.match(/^(.+?), (?:C\/|CALLE) (.+) ES$/)
  return {
    title: foreign?.[1] ?? text,
    city: foreign !== null && /(?:^| )VALENCIA \d{5} -VALENCIA$/.test(foreign[2]) ? 'VALENCIA' : null,
    country: foreign !== null ? 'ES' : null,
    mcc: null,
    location: null
  }
}

export function convertTransactions (raw: BankTransaction[], account: AccountOrCard, accounts: AccountOrCard[]): ExtendedTransaction[] {
  const groups = new Map<string, BankTransaction[]>()
  for (const item of raw) {
    const fields = item.fields
    // User-confirmed migration duplicates: booked EUR credits with an invoice and SEPA sender block.
    // Every supplied field must match; amount/date alone never establishes duplication.
    if (account.instrument !== 'EUR' || fields.currency !== 'EUR' || fields.debitAmountOriginal !== '' || fields.creditAmount === '' || fields.transactionStatus !== 'Knjižen' || !/^Payment for invoice \S+\s+Iznos upucen od strane ino partnera .*\/\/SEPA - Pošiljalac: /.test(fields.paymentDetails)) continue
    const key = JSON.stringify(Object.entries(fields).sort(([left], [right]) => left.localeCompare(right)))
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  const duplicates = new Set<string>()
  for (const group of groups.values()) {
    // Larger/ambiguous groups remain intact until supported by bank evidence.
    if (group.length !== 2) continue
    const ids = group.map(item => item.id).sort()
    if (ids[0] !== ids[1]) duplicates.add(ids[1])
  }
  return raw.filter(item => !duplicates.has(item.id)).map(item => convertTransaction(item, account, accounts))
}

export function convertTransaction (raw: BankTransaction, account: AccountOrCard, accounts: AccountOrCard[]): ExtendedTransaction {
  const fields = raw.fields
  for (const name of ['dueDate', 'currency', 'debitAmountOriginal', 'creditAmount', 'partnerName', 'paymentDetails', 'transactionStatus']) {
    console.assert(typeof fields[name] === 'string', 'Missing transaction field', { id: raw.id, field: name })
  }
  console.assert(fields.transactionStatus === 'Knjižen', 'Unsupported transaction status', { id: raw.id, status: fields.transactionStatus })
  console.assert(fields.currency === account.instrument, 'Unexpected transaction currency', { id: raw.id, currency: fields.currency })
  const debit = fields.debitAmountOriginal !== ''
  console.assert(debit !== (fields.creditAmount !== ''), 'Ambiguous transaction direction', { id: raw.id })
  const sum = (debit ? -1 : 1) * parseAmount(debit ? fields.debitAmountOriginal : fields.creditAmount)
  let principal = sum
  let fee = 0
  let comment = fields.paymentDetails.replace(/\s+/g, ' ').trim()
  // Keep the invoice purpose and foreign cost; omit repeated sender/address blocks.
  const foreignPurpose = comment.match(/^(.*?) Iznos upucen od strane ino partnera [\d,.]+ Iznos ino troška ([\d,.]+)(?: |$)/)
  if (foreignPurpose !== null) {
    comment = foreignPurpose[1]
    const grossText = fields.paymentDetails.match(/Iznos upucen od strane ino partnera ([\d,.]+)/)?.[1]
    const costText = foreignPurpose[2]
    const foreignAmount = /^(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2}$/
    if (!debit && grossText !== undefined && foreignAmount.test(grossText) && foreignAmount.test(costText)) {
      const gross = Number(grossText.replace(/,/g, ''))
      const cost = Number(costText.replace(/,/g, ''))
      // The recorded EUR receipt is net of the stated foreign charge, with no separate EUR fee entry.
      if (account.instrument === 'EUR' && cost > 0 && Math.round((gross - cost) * 100) === Math.round(sum * 100)) {
        principal = gross
        fee = -cost
      } else if (cost !== 0) comment += `; Iznos ino troška ${costText}`
    } else if (Number(costText.replace(/,/g, '')) !== 0) comment += `; Iznos ino troška ${costText}`
  }
  const date = parseDate(fields.dueDate)
  const eurExchange = fields.paymentDetails.match(/^Zaduzenje racuna za otkup\s+([\d.,]+) EUR po kursu EUR=(\d+(?:\.\d+)?)$/)
  const rsdExchange = /^Kupoprodaja deviza, za referencu broj \d+$/.test(fields.paymentDetails)
  const oneCurrencyPair = accounts.filter(item => item.instrument === 'EUR').length === 1 && accounts.filter(item => item.instrument === 'RSD').length === 1
  let exchangeKey: string | null = null
  if (oneCurrencyPair && eurExchange !== null && account.instrument === 'EUR' && sum < 0) {
    console.assert(parseAmount(eurExchange[1]) === -sum, 'Exchange description amount mismatch', { id: raw.id })
    // This is a matching heuristic for two actual bank movements, never a synthesized amount.
    exchangeKey = `${fields.dueDate}:${Math.round(-sum * Number(eurExchange[2]) * 100)}`
  }
  if (oneCurrencyPair && rsdExchange && account.instrument === 'RSD' && sum > 0) exchangeKey = `${fields.dueDate}:${Math.round(sum * 100)}`
  if (rsdExchange) comment = 'Kupoprodaja deviza'
  return {
    hold: false,
    date,
    movements: [{ id: raw.id, account: { id: account.id }, sum: principal, fee, invoice: null }],
    merchant: eurExchange !== null || rsdExchange ? null : merchant(fields.partnerName.replace(/\s+/g, ' ').trim()),
    comment: comment !== '' ? comment : null,
    groupKeys: [exchangeKey !== null ? `exchange:${exchangeKey}` : null]
  }
}
