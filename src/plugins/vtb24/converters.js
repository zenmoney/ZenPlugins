import * as _ from 'lodash'

export const GRAMS_IN_OZ = 31.1034768

export function convertAccounts (apiPortfolios) {
  const accounts = []
  apiPortfolios.forEach(portfolio => {
    portfolio.productGroups.forEach(product => {
      let converter = null
      let apiAccount = product.mainProduct
      switch (portfolio.id) {
        case 'CARDS':
          const types = [
            { card: 'CreditCardMto', account: 'CreditCardAccountMto' },
            { card: 'DebitCardMto', account: 'DebitCardAccountMto' },
            { card: 'MasterAccountCardMto', account: 'MasterAccountMto' },
            { card: 'MultiCurrencyDebitCardMto', account: 'DebitCardAccountMto' }
          ]
          if (types.some(type => {
            return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`
          })) {
            converter = convertAccount
          } else if (apiAccount.cardAccount && types.some(type => {
            return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.card}` &&
                            apiAccount.cardAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`
          })) {
            converter = convertAccount
            apiAccount = apiAccount.cardAccount
          }
          break
        case 'SAVINGS':
          if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.MetalAccountMto') {
            converter = convertMetalAccount
          } else {
            converter = convertAccount
          }
          break
        case 'ACCOUNTS':
          converter = convertAccount
          break
        case 'LOANS':
          if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto' &&
                            apiAccount.account &&
                            apiAccount.account.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto') {
            converter = convertAccount
            apiAccount = {
              ...apiAccount.account,
              contract: {
                ..._.omit(apiAccount, 'account'),
                account: null
              }
            }
          } else if (apiAccount.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto' &&
                            apiAccount.account &&
                            apiAccount.account.__type === 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto') {
            converter = convertLoan
          }
          break
        default:
          break
      }
      console.assert(converter, `unsupported portfolio ${portfolio.id} object ${apiAccount.id}`)
      const account = converter(apiAccount)
      if (_.isArray(account)) {
        accounts.push(...account)
      } else if (account) {
        accounts.push(account)
      }
    })
  })
  return accounts
}

export function convertMetalAccount (apiAccount) {
  const instrument = parseMetalInstrument(apiAccount.amount.currency.currencyCode)
  console.assert(instrument, 'Unknown metal account code', apiAccount.amount.currency.currencyCode)
  return {
    products: [
      {
        id: apiAccount.id,
        instrument
      }
    ],
    zenAccount: {
      id: apiAccount.id,
      type: 'checking',
      title: apiAccount.name,
      instrument,
      syncID: [apiAccount.number],
      balance: apiAccount.amount.sum / GRAMS_IN_OZ
    }
  }
}

export function convertAccount (apiAccount) {
  const zenAccount = {
    syncID: []
  }
  const accounts = [
    {
      id: apiAccount.id,
      type: apiAccount.__type,
      zenAccount
    }
  ]
  const cards = apiAccount.cards ? apiAccount.cards.filter(card => {
    return card && card.status && card.status.id === 'ACTIVE' && !card.archived
  }) : []
  const isMasterAccount = ['ru.vtb24.mobilebanking.protocol.product.MasterAccountMto'].indexOf(apiAccount.__type) >= 0

  if (isMasterAccount) {
    accounts[0].cards = apiAccount.cards
      ? apiAccount.cards
        .filter(card => card && card.status && card.status.id === 'ACTIVE' && !card.archived)
        .map(card => card ? ({ type: card.__type, id: card.id }) : null)
      : []
  }

  const isCardAccount = [
    'ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto',
    'ru.vtb24.mobilebanking.protocol.product.DebitCardAccountMto'].indexOf(apiAccount.__type) >= 0
  let amount = apiAccount.amount
  if (cards.length > 0) {
    zenAccount.type = 'ccard'
    zenAccount.title = cards[0].name
    if (cards[0].balance) {
      amount = {
        sum: cards[0].balance.amountSum,
        currency: cards[0].baseCurrency
      }
    }
    cards.forEach((card, i) => {
      if (card.number) {
        zenAccount.syncID.push(card.number.replace(/X/g, '*'))
      }
      if (isCardAccount) {
        if (i < accounts.length) {
          accounts[i].id = card.id
          accounts[i].type = card.__type
        } else {
          accounts.push({
            id: card.id,
            type: card.__type,
            zenAccount
          })
        }
      }
    })
  } else {
    if (isCardAccount) {
      return null
    }
    zenAccount.type = 'checking'
    zenAccount.title = apiAccount.name
    if (apiAccount.contract &&
                apiAccount.contract.__type === 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto') {
      accounts[0].id = apiAccount.contract.id
      accounts[0].type = apiAccount.contract.__type
    }
  }
  if (!amount) {
    return null
  }
  zenAccount.id = accounts[0].id
  zenAccount.balance = amount.sum
  zenAccount.instrument = getInstrument(amount.currency.currencyCode)
  const accountSyncId = apiAccount.number.replace(/X/g, '*')
  if (zenAccount.syncID.indexOf(accountSyncId) < 0) {
    zenAccount.syncID.push(accountSyncId)
  }
  if (typeof apiAccount.creditLimit === 'number') {
    zenAccount.creditLimit = apiAccount.creditLimit
  }
  if ([
    'ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto',
    'ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto'
  ].indexOf(apiAccount.__type) >= 0) {
    zenAccount.savings = true
  }
  return accounts.length === 1 ? accounts[0] : accounts
}

export function convertLoan (apiAccount) {
  const zenAccount = {
    type: 'loan',
    title: apiAccount.name,
    instrument: getInstrument(apiAccount.creditSum.currency.currencyCode),
    startDate: apiAccount.openDate,
    startBalance: apiAccount.creditSum.sum,
    balance: -apiAccount.account.amount.sum,
    percent: 1,
    capitalization: true,
    payoffInterval: 'month',
    payoffStep: 1,
    syncID: [apiAccount.account.number.replace(/[^\d]/g, '')]
  }
  const contractPeriod = apiAccount.contractPeriod || apiAccount.account.contract.contractPeriod
  switch (contractPeriod.unit.id.toLowerCase()) {
    case 'month':
    case 'year':
      zenAccount.endDateOffsetInterval = contractPeriod.unit.id.toLowerCase()
      zenAccount.endDateOffset = contractPeriod.value
      break
    default:
      console.assert(false, `unsupported loan contract period ${contractPeriod.unit.id}`)
  }
  const account = {
    id: apiAccount.id,
    type: apiAccount.__type,
    zenAccount
  }
  zenAccount.id = account.id
  return account
}

export function convertTransaction (apiTransaction, apiAccount) {
  if (apiTransaction.details && [
    'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
    'ru.vtb24.mobilebanking.protocol.product.DebitCardMto'
  ].indexOf(apiTransaction.debet.__type) >= 0 && apiAccount.id !== apiTransaction.debet.id) {
    return null
  }
  const origin = getOrigin(apiTransaction)
  if (origin.amount === 0) {
    return null
  }
  const transaction = {
    comment: null,
    date: apiTransaction.transactionDate,
    hold: apiTransaction.isHold,
    merchant: null,
    movements: [
      {
        id: apiTransaction.id,
        account: { id: apiAccount.id || apiAccount.zenAccount.id || apiTransaction.debet.id },
        invoice: origin.invoice,
        sum: origin.amount,
        fee: origin.fee
      }
    ]
  }

  if (apiTransaction.details) {
    [
      parseInnerTransfer,
      parseCashTransaction,
      parsePayee
    ].some(parser => parser(apiTransaction, transaction))
  }
  return transaction
}

function parseInnerTransfer (apiTransaction, transaction) {
  const origin = getOrigin(apiTransaction)
  if (![
    /Зачисление с другой карты \(Р2Р\)/,
    /Перевод на другую карту \(Р2Р\)/,
    /^Перевод с карты \*(\d{4})/,
    /^Перевод на счет \*(\d{4})/,
    /^Зачисление со счета \*(\d{4})/,
    /^Зачисление с накопительного счета \*(\d{4})/,
    /^Перевод между собственными счетами и картами/
  ].some(pattern => {
    const match = apiTransaction.details.match(pattern)
    if (match && match[1]) {
      console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
      transaction.movements.push({
        id: null,
        account: {
          type: 'ccard',
          instrument: origin.instrument,
          syncIds: [
            match[1]
          ],
          company: null
        },
        invoice: null,
        sum: -origin.amount,
        fee: 0
      })
    }
    return Boolean(match)
  }) && !(() => {
    if (apiTransaction.order && apiTransaction.order.operationInfo && apiTransaction.order.operationInfo.categoryId === '47') {
      // Перевод другому клиенту ВТБ
      transaction.merchant = {
        title: apiTransaction.order.description,
        city: null,
        country: null,
        location: null,
        mcc: null
      }

      return true
    }
  })()) {
    return false
  }

  if ((!apiTransaction.order || !apiTransaction.order.id) && !apiTransaction.processedDate) {
    return true
  }

  return true
}

function parseCashTransaction (apiTransaction, transaction) {
  if (![
    'Снятие в банкомате',
    'Пополнение через банкомат'
  ].some(pattern => apiTransaction.details.indexOf(pattern) >= 0)) {
    return false
  }
  const origin = getOrigin(apiTransaction)
  console.assert(transaction.movements.length < 2, 'Too much movements', { transaction, apiTransaction })
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: origin.instrument,
      syncIds: null,
      company: null
    },
    invoice: null,
    sum: -origin.amount,
    fee: 0
  })

  return true
}

function parsePayee (apiTransaction, transaction) {
  if ([
    /^Карта \*\d{4} (.+)/,
    /^(.\*\*\*\*\*\*. .+)/
  ].some(pattern => {
    const match = apiTransaction.details.match(pattern)
    if (match) {
      transaction.merchant = {
        city: null,
        country: null,
        mcc: null,
        location: null,
        title: match[1]
      }
      return true
    }
    return false
  })) {
    return false
  }
  if (
    apiTransaction.__type === 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto'
  ) {
    if (
      [
        'Пополнение',
        'Зачисление',
        'Списание по карте',
        'Начисленные %'
      ].some(description => description === apiTransaction.details)
    ) {
      transaction.comment = apiTransaction.details
      if (apiTransaction.order && apiTransaction.order.operationInfo && apiTransaction.order.operationInfo.categoryId === '6') {
        transaction.merchant = {
          title: apiTransaction.order.description,
          city: null,
          country: null,
          location: null,
          mcc: null
        }
      }
    } else {
      transaction.merchant = {
        city: null,
        country: null,
        mcc: null,
        location: null,
        title: apiTransaction.details
      }
    }
  } else {
    transaction.comment = apiTransaction.details
  }
  return false
}

function getInstrument (code) {
  switch (code) {
    case 'RUR': return 'RUB'
    default: return parseMetalInstrument(code) || code
  }
}

function parseMetalInstrument (code) {
  switch (code) {
    case 'GLD': return 'XAU'
    case 'SLR': return 'XAG'
    case 'PLT': return 'XPT'
    case 'PLD': return 'XPD'
    default: return null
  }
}

function getOrigin (apiTransaction) {
  let transactionAmount
  if (apiTransaction.transactionAmountInAccountCurrency && apiTransaction.transactionAmountInAccountCurrency.sum !== 0) {
    transactionAmount = apiTransaction.transactionAmountInAccountCurrency
  } else {
    transactionAmount = apiTransaction.transactionAmount
  }

  let invoice = null
  if (apiTransaction.transactionAmountInAccountCurrency &&
    apiTransaction.transactionAmountInAccountCurrency.currency.currencyCode !== apiTransaction.transactionAmount.currency.currencyCode) {
    invoice = {
      instrument: apiTransaction.transactionAmount.currency.currencyCode,
      sum: apiTransaction.transactionAmount.sum
    }
  }

  let transactionFeeSum = (apiTransaction.feeAmount && apiTransaction.feeAmount.sum) || 0

  if (parseMetalInstrument(apiTransaction.transactionAmount.currency.currencyCode)) {
    invoice.sum /= GRAMS_IN_OZ
  }

  return {
    amount: transactionAmount.sum,
    instrument: getInstrument(transactionAmount.currency.currencyCode),
    invoice,
    fee: transactionFeeSum
  }
}
