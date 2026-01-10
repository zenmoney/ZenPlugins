import { Account, AccountType, Transaction, Merchant, Movement } from '../../types/zenmoney'
import { ParsedHeader, ParsedTransaction } from './models'
import { parseMerchant, cleanTransactionComment, detectCityCountryLocation } from './merchant-utils'

function createMerchant (title: string): Merchant {
  return {
    title,
    city: null,
    country: null,
    mcc: null,
    location: null
  }
}

export function convertAccount (header: ParsedHeader): Account {
  const id = (header.accountNumber != null && header.accountNumber !== '') ? header.accountNumber : 'unknown-account'
  return {
    id,
    title: (header.accountNumber != null && header.accountNumber !== '') ? header.accountNumber : 'Fortebank Account',
    type: AccountType.checking,
    instrument: (header.currency != null && header.currency !== '') ? header.currency : 'KZT',
    syncIds: (header.accountNumber != null && header.accountNumber !== '') ? [header.accountNumber] : [],
    balance: header.balance ?? null
  }
}

export function convertTransaction (transaction: ParsedTransaction, accountId: string): Transaction {
  const [day, month, year] = transaction.date.split('.')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

  let merchant: Merchant | null = null
  let comment = transaction.description
  const movements: Movement[] = [{
    account: { id: accountId },
    sum: transaction.amount,
    invoice: null,
    fee: 0,
    id: null
  }]

  if (transaction.parsedDetails != null) {
    const { merchantName, merchantLocation, merchantBank, paymentMethod, atmCode, receiver, receiverAccount, mcc, foreignAmount, foreignCurrency } = transaction.parsedDetails

    if (foreignAmount != null && foreignCurrency != null) {
      movements[0].invoice = {
        sum: foreignAmount,
        instrument: foreignCurrency
      }
    }

    // Construct merchant
    if (merchantName != null && merchantName !== '') {
      // Use existing utils to detect city/country from the name if possible,
      // or from merchantLocation if provided
      let title = merchantName
      let city: string | null = null
      let country: string | null = null

      if (merchantLocation != null && merchantLocation !== '') {
        // If location is explicit (e.g. Cash withdrawal)
        const loc = detectCityCountryLocation(merchantLocation)
        if (loc != null) {
          city = loc.city ?? null
          country = loc.country ?? null
          // loc.locationPoint is the cleaned location string. We don't use it for title here.
        }
      } else {
        // Try to extract from title (e.g. "aliexpress Singapore SG")
        const loc = detectCityCountryLocation(merchantName)
        if (loc != null && (loc.city != null || loc.country != null)) {
          // If we found a city/country, update title to be the locationPoint (cleaned name)
          title = loc.locationPoint
          city = loc.city ?? null
          country = loc.country ?? null
        }
      }

      merchant = createMerchant(title)
      merchant.city = city
      merchant.country = country
      merchant.mcc = mcc ?? null
    } else if (receiver != null && receiver !== '') {
      // For transfers, receiver is the "payee"
      // Always create merchant to preserve the name (e.g. "Ivanov I.")
      merchant = createMerchant(receiver)
    }

    if (receiverAccount != null) {
      movements.push({
        account: {
          syncIds: [receiverAccount],
          instrument: 'KZT', // Defaulting to KZT as safest guess or optional
          type: AccountType.checking,
          company: null
        },
        sum: -transaction.amount,
        invoice: null,
        fee: 0,
        id: null
      })
    }

    // Construct comment
    const commentParts: string[] = []
    if (merchantBank != null && merchantBank !== '') commentParts.push(`Bank: ${merchantBank}`)
    if (atmCode != null && atmCode !== '') commentParts.push(`ATM: ${atmCode}`)

    if (paymentMethod != null && paymentMethod !== '') commentParts.push(paymentMethod)
    if (receiver != null && receiver !== '' && merchant === null && receiverAccount == null) commentParts.push(`Receiver: ${receiver}`)

    // If no specific parsed details other than operation, use cleaned description
    if (commentParts.length === 0 && merchant === null && receiverAccount == null) {
      comment = cleanTransactionComment(transaction.description, null)
    } else {
      comment = commentParts.join(', ')
    }
  } else {
    // Fallback
    const parsed = parseMerchant(transaction.description)
    if (parsed !== null) {
      merchant = createMerchant(parsed.title)
      merchant.city = parsed.city
      merchant.country = parsed.country
      merchant.mcc = transaction.mcc ?? null
    }
    comment = cleanTransactionComment(transaction.description, merchant)
  }

  const result: Transaction = {
    date,
    hold: false,
    merchant,
    comment,
    movements: movements as [Movement] | [Movement, Movement]
  }

  const isPurchaseOperation = ['Purchase', 'Purchase with bonuses', 'Refund', 'Покупка', 'Покупка с бонусами', 'Возврат', 'Возврат денег', 'Оплата', 'Сатып алу', 'Қайтару', 'Төлем', 'Платеж', 'Списание'].includes(transaction.operation)

  // If it's a purchase, we still want to keep the merchantBank in the comment if available,
  // but we agreed to clear the comment for purchases earlier.
  // However, the user now requests to "populate merchantBank of all the applicable transaction types".
  // This implies we should APPEND/SET it even for purchases.

  if (isPurchaseOperation) {
    // We previously cleared the comment. Now we should check if we have a bank to show.
    // The 'comment' variable currently holds the constructed comment (which includes Bank: ... if available).
    // So we just need to ensure we don't clear it blindly, but maybe ONLY keep the Bank part?
    // OR, the user might mean "populate merchant field WITH merchantBank"?
    // "populate merchantBank of all the applicable transaction types" -> usually implies the 'comment' or 'merchant' object.
    // Given the previous instruction "let's keep the comment filed empty", this new instruction "populate merchantBank" likely overrides it OR implies putting it somewhere else.
    // "merchant bank presented in the transaction details even for purchases, then populate merchantBank of all the applicable transaction types"
    // Since 'merchant' object doesn't have a 'bank' field (only title, city, country, mcc), the only place for 'merchantBank' is the COMMENT.

    // So, for purchase operations, instead of clearing the comment completely, we should set it to the Bank name if available.
    if (transaction.parsedDetails?.merchantBank != null && transaction.parsedDetails.merchantBank !== '') {
      result.comment = `Bank: ${transaction.parsedDetails.merchantBank}`
    } else {
      result.comment = ''
    }
  }

  return result
}

export function convertDeposit (header: ParsedHeader): Account {
  const id = (header.accountNumber != null && header.accountNumber !== '') ? header.accountNumber : 'unknown-deposit'
  const title = (header.productName != null && header.productName !== '') ? header.productName : 'Fortebank Deposit'
  const instrument = (header.currency != null && header.currency !== '') ? header.currency : 'KZT'

  let startDate = new Date()
  if (header.startDate != null) {
    const [year, month, day] = header.startDate.split('-').map(Number)
    startDate = new Date(year, month - 1, day)
  }

  return {
    id,
    title,
    type: AccountType.deposit,
    instrument,
    syncIds: [id],
    balance: header.balance ?? 0,
    startBalance: header.startBalance ?? 0,
    startDate,
    percent: header.percent ?? null,
    capitalization: false,
    endDateOffsetInterval: 'month',
    endDateOffset: 12, // Default to 1 year if unknown
    payoffInterval: 'month',
    payoffStep: 1
  }
}
