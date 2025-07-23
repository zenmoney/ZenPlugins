import { Account, AccountType, ExtendedTransaction, Merchant, NonParsedMerchant } from '../../types/zenmoney'
import { getOptNumber, getOptString } from '../../types/get'
import { ConvertResult, OtpAccount, OtpTransaction } from './models'

export function convertAccounts (apiAccounts: OtpAccount[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: OtpAccount, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = apiAccount.accountNumber
  const balance = apiAccount.balance
  let newAccount = false
  let account = accountsByCba[cba]
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.description ?? cba,
        instrument: apiAccount.currencyCode,
        balance,
        creditLimit: 0,
        syncIds: [cba]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: apiAccount.accountNumber,
    transactionNode: ''
  })

  const pan = getOptString(apiAccount, 'pan')
  if (pan != null) {
    account.account.syncIds.push(pan)
  }

  const moneyAmount = getOptNumber(apiAccount, 'moneyAmount.value')
  if (moneyAmount != null) {
    account.account.creditLimit = moneyAmount - balance
  }
  return newAccount ? account : null
}

function parseMerchant (title: string, merchantTitle: unknown = null): Merchant | NonParsedMerchant | null {
  if (merchantTitle !== '') {
    return {
      fullTitle: String(merchantTitle).trim(),
      mcc: null,
      location: null
    }
  }

  if (title.includes(':')) {
    const [, rest] = title.split(':')
    if (rest?.includes('>')) {
      const [merchantName, location] = rest.split('>')
      if (location === '') {
        return {
          title: merchantName.trim(),
          country: null,
          city: null,
          mcc: null,
          location: null
        }
      }

      const locationParts = location.trim().split(/\s+/)
      const country = locationParts.length >= 2 && locationParts[locationParts.length - 1].length === 2
        ? locationParts[locationParts.length - 1]
        : null
      const city = (country != null)
        ? locationParts.slice(0, -1).join(' ').trim()
        : location.trim()

      return {
        title: merchantName.trim(),
        city: city !== '' ? city : null,
        country,
        mcc: null,
        location: null
      }
    }
  }

  if (title.includes(' - ')) {
    const [, merchantName] = title.split(' - ')
    return {
      title: merchantName.trim(),
      country: null,
      city: null,
      mcc: null,
      location: null
    }
  }

  const [merchantName, location] = title.split('/')
  if (location != null && location !== '') {
    return {
      title: merchantName.trim(),
      city: location.trim(),
      country: null,
      mcc: null,
      location: null
    }
  }

  return {
    title: title.trim(),
    country: null,
    city: null,
    mcc: null,
    location: null
  }
}

export function convertTransaction (apiTransaction: OtpTransaction, account: Account): ExtendedTransaction {
  const merchant = parseMerchant(apiTransaction.title, apiTransaction.merchant)

  const transaction: ExtendedTransaction = {
    date: apiTransaction.date,
    hold: (apiTransaction.status == null) || apiTransaction.status === '',
    movements: [
      {
        id: `${account.id}_${apiTransaction.date.getTime()}`,
        account: { id: account.id },
        sum: apiTransaction.amount,
        fee: 0,
        invoice: null
      }
    ],
    merchant,
    comment: merchant === null ? apiTransaction.title : null
  }

  return transaction
}
