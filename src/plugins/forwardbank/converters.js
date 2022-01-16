import { dateInTimezone } from '../../common/dateUtils'

const TRANSACTION_STATUSES = {
  ERROR: 'Error',
  PENDING: 'Pending',
  SUCCESS: 'Success'
}

const CATEGORY_MCC_MAP = {
  taxi: 4121,
  poshtovi_ta_inshi_poslugy: 9402,
  apteky: 5912,
  produkty_ta_supermerkety: 5411,
  cafe_ta_restorany: 5814,
  sport_ta_fitness: 5655,
  podarunki_ta_prykrasy: 5947,
  kino_ta_rozvagy: 7832,
  AZS: 5541,
  marketplaisy: 5399,
  budivelni_tovary_ta_mebli: 5200,
  avto_service: 7538,
  komunalni_poslugy: 4900,
  krasa_ta_doglyad: 7230,
  odyag_ta_vzuttya: 5651,
  zoomagaziny: 5995,
  dityachi_tovary: 5641,
  technika: 5722,
  medichniy_service: 8011,
  knigy: 5942,
  vinomarkety: 5921,
  shtrafy_ta_platezhi: 9222,
  podorozhi: 3771,
  kvity: 5992,
  blagodiynist_ta_kluby: 8398
}

function isTransactionPending (apiTransaction) {
  return apiTransaction.Status === TRANSACTION_STATUSES.PENDING
}

function isTransactionError (apiTransaction) {
  return apiTransaction.Status === TRANSACTION_STATUSES.ERROR
}

export function convertAccounts (apiAccounts) {
  const accountsByIban = {}
  const accounts = []

  for (const apiAccount of apiAccounts) {
    const product = {
      id: apiAccount.CardId
    }
    const balance = apiAccount.PassiveAmount / 100
    const creditLimit = apiAccount.AvailableAmount / 100
    const title = apiAccount.ProductName || apiAccount.CardNumber

    let account = accountsByIban[apiAccount.AccountNumber]
    if (!account) {
      account = {
        products: [],
        account: {
          id: apiAccount.AccountNumber,
          type: 'ccard',
          title: title,
          instrument: apiAccount.Currency,
          balance: balance,
          creditLimit: creditLimit,
          syncIds: [apiAccount.AccountNumber + '']
        }
      }
      accounts.push(account)
      accountsByIban[apiAccount.AccountNumber] = account
    }
    account.products.push(product)
    account.account.syncIds.push(apiAccount.CardId + '')
    account.account.syncIds.push(apiAccount.CardNumber + '')
  }
  return accounts
}

export function convertTransaction (apiTransaction, account) {
  const hold = isTransactionPending(apiTransaction)
  const type = apiTransaction.Mark

  if (type !== 'Debet' && type !== 'Credit') {
    return null
  }

  if (isTransactionError(apiTransaction)) {
    return null
  }

  const isDebet = isTransactionDebet(apiTransaction)

  let sum = apiTransaction.AccountAmount / 100
  if (isDebet) {
    sum = -sum
  }

  let invoice = null
  if (apiTransaction.AccountCurrencyCode !== apiTransaction.CurrencyCode) {
    invoice = {
      sum: (isDebet ? -1 : 1) * (apiTransaction.Amount / 100),
      instrument: apiTransaction.CurrencyCode
    }
  }

  const fee = apiTransaction.Fee ? apiTransaction.Fee / 100 : 0

  const transaction = {
    hold,
    date: dateInTimezone(new Date(apiTransaction.Date), -120),
    movements: [
      {
        id: apiTransaction.Id || null,
        account: { id: account.id },
        invoice,
        sum,
        fee
      }
    ],
    merchant: parseTransactionMerchant(apiTransaction),
    comment: parseTransactionComment(apiTransaction)
  }

  if (isTransactionInternal(apiTransaction)) {
    const otherTransactionName = apiTransaction.Name || (apiTransaction.Merchant ? (apiTransaction.Merchant.Name || '') : '') || ''
    transaction.movements.push({
      id: null,
      account: { id: parseIban(otherTransactionName) },
      invoice: null,
      sum: (isDebet ? 1 : -1) * (apiTransaction.Amount / 100),
      fee: 0
    })
  }

  if (isTransactionExternal(apiTransaction)) {
    const otherTransactionName = apiTransaction.Name || (apiTransaction.Merchant ? (apiTransaction.Merchant.Name || '') : '') || ''
    transaction.movements.push({
      id: null,
      account: {
        type: null,
        instrument: apiTransaction.CurrencyCode,
        company: null,
        syncIds: [parseCardMasked(otherTransactionName)]
      },
      invoice: null,
      sum: (isDebet ? 1 : -1) * (apiTransaction.Amount / 100),
      fee: 0
    })
  }

  return transaction
}

function parseTransactionMerchant (apiTransaction) {
  if (!apiTransaction.Merchant) {
    return null
  }

  if (isTransactionInternal(apiTransaction) || isTransactionExternal(apiTransaction)) {
    return null
  }

  const apiMerchant = apiTransaction.Merchant

  if (!apiMerchant.Id && !apiMerchant.Name) {
    return null
  }

  if (apiMerchant.City || apiMerchant.Country) {
    return {
      country: apiMerchant.Country,
      city: apiMerchant.City,
      location: null,
      title: parseTransactionMerchantTitle(apiTransaction),
      mcc: parseTransactionMerchantMcc(apiTransaction)
    }
  }
  return {
    location: null,
    fullTitle: parseTransactionMerchantFullTitle(apiTransaction),
    mcc: parseTransactionMerchantMcc(apiTransaction)
  }
}

function parseTransactionMerchantMcc (apiTransaction) {
  const category = getTransactionCategory(apiTransaction)

  if (!category || !CATEGORY_MCC_MAP[category]) {
    return null
  }

  return CATEGORY_MCC_MAP[category]
}

function parseTransactionMerchantTitle (apiTransaction) {
  if (!apiTransaction.Merchant) {
    return ''
  }

  return apiTransaction.Merchant.Name || ''
}

function parseTransactionMerchantFullTitle (apiTransaction) {
  return parseTransactionMerchantTitle(apiTransaction)
}

function parseTransactionComment (apiTransaction) {
  const chunks = []

  // if (apiTransaction.CategoryName) {
  //   chunks.push(apiTransaction.CategoryName)
  // }

  // if (apiTransaction.Name && !['Purchase'].includes(apiTransaction.Name)) {
  //   chunks.push(apiTransaction.Name)
  // }

  if (apiTransaction.StatusMessage &&
    !['Переказ грошових коштів.'].includes(apiTransaction.StatusMessage) &&
    apiTransaction.StatusMessage !== apiTransaction.Name
  ) {
    chunks.push(apiTransaction.StatusMessage)
  }

  if (!chunks.length) {
    return null
  }

  return chunks.join('. ')
}

function getTransactionCategory (apiTransaction) {
  if (!apiTransaction.CategoryIconUrl) {
    return null
  }

  return apiTransaction.CategoryIconUrl.split('name=')[1].split('.')[0]
}

function isTransactionInternal (apiTransaction) {
  const category = getTransactionCategory(apiTransaction)
  const transactionName = apiTransaction.Name || (apiTransaction.Merchant ? (apiTransaction.Merchant.Name || '') : '') || ''

  if (category !== 'debet_operation' && category !== 'credit_operation') {
    return false
  }

  let iban

  try {
    if (!/^(На рахунок|З рахунку) UA\.*/.test(transactionName)) {
      return false
    }

    iban = parseIban(transactionName)

    if (!iban) {
      return false
    }
  } catch (e) {
    return false
  }

  return true
}

function isTransactionExternal (apiTransaction) {
  const category = getTransactionCategory(apiTransaction)
  const transactionName = apiTransaction.Name || (apiTransaction.Merchant ? (apiTransaction.Merchant.Name || '') : '') || ''

  if (category !== 'mccless_5') {
    return false
  }

  if (!isTransactionDebet(apiTransaction)) {
    return false
  }

  let cardMasked

  try {
    if (!/^(На картку)/.test(transactionName)) {
      return false
    }

    cardMasked = parseCardMasked(transactionName)

    if (!cardMasked) {
      return false
    }
  } catch (e) {
    return false
  }

  return true
}

function isTransactionDebet (apiTransaction) {
  return apiTransaction.Mark === 'Debet'
}

function parseIban (str) {
  if (!str) {
    return false
  }
  const matches = str.match(/UA[0-9]{27}/)

  if (!matches.length) {
    return false
  }

  return matches[0]
}

function parseCardMasked (str) {
  if (!str) {
    return false
  }
  const matches = str.match(/[0-9]{6}\*{6}[0-9]{4}/)

  if (!matches.length) {
    return false
  }

  return matches[0]
}
