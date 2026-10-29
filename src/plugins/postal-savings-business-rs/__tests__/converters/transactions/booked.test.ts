import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { convertAccounts, convertTransaction, convertTransactions } from '../../../converters'
import { parseAccounts, parseHistoryPage } from '../../../parsers'
import { fixture } from '../../../testFixtures'

const accounts = convertAccounts(parseAccounts(fixture('accounts.html'))).map(plan => plan.account)
const rsd = parseHistoryPage(fixture('transactions-rsd.html')).transactions
const eur = parseHistoryPage(fixture('transactions-eur.html')).transactions

it('ID-001 removes the user-confirmed duplicate SEPA receipts while preserving older non-SEPA income', () => {
  const selected = parseHistoryPage(fixture('transactions-eur.html')).transactions
  const incoming = selected.filter(item => item.fields.creditAmount !== '')
  const result = adjustTransactions({ transactions: convertTransactions(incoming, accounts[1], accounts) })
  expect(result).toEqual([
    { hold: false, date: new Date('2026-10-13T22:00:00.000Z'), movements: [{ id: 'SBPORSBG107V058TAS116D22', account: { id: accounts[1].id }, sum: 10000, fee: 0, invoice: null }], merchant: { title: 'EJEMPLO SL', city: null, country: 'ES', mcc: null, location: null }, comment: 'Payment for invoice 20261012-1' },
    { hold: false, date: new Date('2026-07-06T22:00:00.000Z'), movements: [{ id: 'SBPORSBG109805PKA9NXX53G', account: { id: accounts[1].id }, sum: 10400, fee: 0, invoice: null }], merchant: { title: 'EJEMPLO SL', city: 'VALENCIA', country: 'ES', mcc: null, location: null }, comment: 'Payment for invoice 20260701-1' },
    { hold: false, date: new Date('2026-04-12T22:00:00.000Z'), movements: [{ id: 'SBPORSBG10AA03S39TTYNF0Q', account: { id: accounts[1].id }, sum: 10000, fee: -15, invoice: null }], merchant: { title: 'EJEMPLO SL.', city: null, country: 'ES', mcc: null, location: null }, comment: 'Payment for invoice 20260402-1' }
  ])
  expect(adjustTransactions({ transactions: convertTransactions([...incoming].reverse(), accounts[1], accounts) })).toEqual([...result].reverse())
})

it('AMOUNT-002 counts the confirmed fee on a net incoming EUR receipt once', () => {
  const selected = parseHistoryPage(fixture('transactions-eur.html')).transactions
  const receipt = selected.find(item => item.id === 'SBPORSBG10AA03S39TTYNF0Q')
  assert(receipt !== undefined, 'Missing recorded foreign receipt')
  expect(convertTransaction(receipt, accounts[1], accounts)).toEqual({
    // DATE-001: execution is 13 April, while the booking date is 14 April.
    hold: false,
    date: new Date('2026-04-12T22:00:00.000Z'),
    movements: [{ id: receipt.id, account: { id: accounts[1].id }, sum: 10000, fee: -15, invoice: null }],
    merchant: { title: 'EJEMPLO SL.', city: null, country: 'ES', mcc: null, location: null },
    comment: 'Payment for invoice 20260402-1',
    groupKeys: [null]
  })
})

it('AMOUNT-001/002, MERCHANT-001 and COMMENT-001 preserve a tax expense and purpose', () => {
  expect(convertTransaction(rsd[0], accounts[0], accounts)).toEqual({
    hold: false,
    date: new Date('2026-10-12T22:00:00.000Z'),
    movements: [{ id: 'SBPORSBG11FR524TARU49GCC', account: { id: accounts[0].id }, sum: -15052.41, fee: 0, invoice: null }],
    merchant: { title: 'Poreska uprava Republike Srbije', city: null, country: null, mcc: null, location: null },
    comment: 'Doprinos za PIO za 2026. godinu',
    groupKeys: [null]
  })
})

it('AMOUNT-002 and MERCHANT-003 keep a separately charged fee without inventing a counterparty', () => {
  expect(convertTransaction(rsd[1], accounts[0], accounts)).toEqual({
    hold: false,
    date: new Date('2026-10-12T22:00:00.000Z'),
    movements: [{ id: 'SBPORSBG11FR524TARRK6SSC', account: { id: accounts[0].id }, sum: -220, fee: 0, invoice: null }],
    merchant: null,
    comment: 'Provizija banke po osnovu naloga platnog prometa za period od 12.10.26 do 13.10.26',
    groupKeys: [null]
  })
})

it('ID-001 preserves source identities before batch SEPA deduplication; merchant and invoice stay separate', () => {
  const expected = ['SBPORSBG107V059BAS116D2C', 'SBPORSBG107V058TAS116D22'].map(id => ({
    hold: false,
    date: new Date('2026-10-13T22:00:00.000Z'),
    movements: [{ id, account: { id: accounts[1].id }, sum: 10000, fee: 0, invoice: null }],
    merchant: { title: 'EJEMPLO SL', city: null, country: 'ES', mcc: null, location: null },
    comment: 'Payment for invoice 20261012-1'
  }))
  const converted = eur.slice(0, 2).map(item => convertTransaction(item, accounts[1], accounts))
  expect(adjustTransactions({ transactions: converted })).toEqual(expected)
  expect(adjustTransactions({ transactions: [...converted].reverse() })).toEqual([...expected].reverse())
  // A lone real SEPA record must retain its own identity, even if its paired record is unavailable.
  expect(adjustTransactions({ transactions: convertTransactions([eur[0]], accounts[1], accounts) })).toEqual([expected[0]])
})

it('TRANSFER-001/002/003/004 groups two real currency-exchange movements', () => {
  const credit = rsd[2]
  const debit = eur[2]
  const sides = [convertTransaction(credit, accounts[0], accounts), convertTransaction(debit, accounts[1], accounts)]
  expect(sides).toEqual([
    { hold: false, date: new Date('2026-10-01T22:00:00.000Z'), movements: [{ id: credit.id, account: { id: accounts[0].id }, sum: 351600, fee: 0, invoice: null }], merchant: null, comment: 'Kupoprodaja deviza', groupKeys: ['exchange:02.10.2026:35160000'] },
    { hold: false, date: new Date('2026-10-01T22:00:00.000Z'), movements: [{ id: debit.id, account: { id: accounts[1].id }, sum: -3000, fee: 0, invoice: null }], merchant: null, comment: 'Zaduzenje racuna za otkup 3.000,00 EUR po kursu EUR=117.2', groupKeys: ['exchange:02.10.2026:35160000'] }
  ])
  expect(adjustTransactions({ transactions: sides })).toEqual([{
    hold: false,
    date: new Date('2026-10-01T22:00:00.000Z'),
    movements: [{ id: debit.id, account: { id: accounts[1].id }, sum: -3000, fee: 0, invoice: null }, { id: credit.id, account: { id: accounts[0].id }, sum: 351600, fee: 0, invoice: null }],
    merchant: null,
    comment: 'Zaduzenje racuna za otkup 3.000,00 EUR po kursu EUR=117.2'
  }])
  // COMMENT-001/002: an unmatched movement retains its useful purpose too.
  expect(adjustTransactions({ transactions: [sides[1]] })).toEqual([{ ...sides[1], groupKeys: undefined }].map(({ groupKeys, ...transaction }) => transaction))
})
