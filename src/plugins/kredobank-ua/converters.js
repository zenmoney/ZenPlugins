import { find } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    let account
    switch (apiAccount.providerId) {
      case 'card':
        if (apiAccount.cardsList?.length > 0) {
          account = convertCard(apiAccount)
        } else {
          account = convertChecking(apiAccount)
        }
        break
      case 'credit':
        account = convertCredit(apiAccount)
        break
      case 'deposit':
        account = convertDeposit(apiAccount)
        break
      default:
        console.assert(false, 'unknown providerId', apiAccount)
    }
    accounts.push({ account, products: getProducts(apiAccount) })
  }
  return accounts
}

function convertChecking (apiAccount) {
  return {
    id: apiAccount.id,
    type: 'checking',
    title: apiAccount.details.productTitle,
    instrument: apiAccount.mainAccountCurrency,
    syncIds: [apiAccount.iban, apiAccount.mainAccountNumber],
    savings: false,
    balance: getMoney(apiAccount.balance) || null
  }
}

function convertCard (apiAccount) {
  const activeCardDetails = find(apiAccount.cardsList, card => card.details.isActiveProduct === 'true').details
  return {
    id: apiAccount.id,
    type: 'ccard',
    title: activeCardDetails.productTitle,
    instrument: apiAccount.mainAccountCurrency,
    syncIds: [apiAccount.iban, apiAccount.mainAccountNumber, ...apiAccount.cardsList.map(card => card.cardNumberMask)],
    savings: false,
    balance: getMoney(apiAccount.balance),
    ...activeCardDetails.isCreditAccount === 'true' && {
      creditLimit: getMoney(apiAccount.creditLimit),
      ...activeCardDetails.overExpectedCloseDate && {
        totalAmountDue: -getMoney(activeCardDetails.overDebt.replace(',', '.')) || 0,
        gracePeriodEndDate: parseDate(activeCardDetails.overExpectedCloseDate)
      }
    }
  }
}

function convertCredit (apiAccount) {
  const startDate = parseDate(apiAccount.startDate)
  const endDate = parseDate(apiAccount.endDate)
  const { interval, count } = getIntervalBetweenDates(startDate, endDate)

  return {
    id: apiAccount.id,
    type: 'loan',
    title: apiAccount.productTitle,
    instrument: apiAccount.mainAccountCurrency,
    syncIds: [apiAccount.iban],
    balance: -getMoney(apiAccount.balance),
    startDate,
    startBalance: getMoney(apiAccount.dealAmount),
    capitalization: true,
    percent: apiAccount.currentInterestRate,
    endDateOffsetInterval: interval,
    endDateOffset: count,
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function convertDeposit (apiAccount) {
  const startDate = parseDate(apiAccount.startDate)
  const endDate = apiAccount.endDate ? parseDate(apiAccount.endDate) : null
  const { interval, count } = endDate ? getIntervalBetweenDates(startDate, endDate) : { interval: 'month', count: 1 }
  let payoffInterval = 'month'
  let payoffStep = 1
  if (!apiAccount.regularInterestPayment) {
    payoffInterval = interval
    payoffStep = count
  }

  return {
    id: apiAccount.id,
    type: 'deposit',
    title: apiAccount.productTitle,
    instrument: apiAccount.mainAccountCurrency,
    syncIds: [apiAccount.iban],
    balance: getMoney(apiAccount.balance),
    startDate,
    startBalance: getMoney(apiAccount.initialAmount),
    capitalization: apiAccount.capitalization,
    percent: apiAccount.currentInterestRate,
    endDateOffsetInterval: interval,
    endDateOffset: count,
    payoffInterval,
    payoffStep
  }
}

function getProducts (apiAccount) {
  if (apiAccount.providerId === 'card' && apiAccount.cardsList?.length > 0) {
    return apiAccount.cardsList.map(card => {
      return { contractType: apiAccount.providerId, id: apiAccount.id, cardId: card.id }
    })
  }
  return [{ contractType: apiAccount.providerId, id: apiAccount.id }]
}

export function convertTransaction (apiTransaction, account) {
  const transaction = {
    hold: apiTransaction.holdMarker === 'holdMarker' || !apiTransaction.finalizationDate,
    date: new Date(apiTransaction.operationDate), // parse in UTC
    movements: [
      {
        id: apiTransaction.id || null,
        account: { id: account.id },
        invoice: apiTransaction.currency === account.instrument
          ? null
          : {
              sum: getMoney(apiTransaction.amountInCents),
              instrument: apiTransaction.currency
            },
        sum: getMoney(apiTransaction.localAmountInCents),
        fee: 0
      }
    ],
    merchant: null,
    comment: apiTransaction.description
  };
  [
    parseCashTransfer,
    parseP2PTransfer,
    parseMerchant
  ].some(parser => parser(transaction, apiTransaction, account))

  return transaction
}

function parseMerchant (transaction, apiTransaction, account) {
  const sourceOrDest = apiTransaction.source || apiTransaction.destination || null
  const idSourceOrDest = sourceOrDest ? account.syncIds.find(item => item.startsWith(sourceOrDest.accountNumber)) : null
  let merchant
  if (sourceOrDest && !idSourceOrDest) {
    merchant = sourceOrDest.name || null
  } else {
    merchant = apiTransaction.description
    transaction.comment = null
  }

  transaction.merchant = {
    fullTitle: merchant,
    mcc: null,
    location: null
  }
  return true
}

function parseCashTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.description.trim().match(/^MONO/i)) {
    transaction.movements.push(invertedMovement(transaction.movements[0], account, 'cash'))
    return true
  }

  return false
}

function parseP2PTransfer (transaction, apiTransaction, account) {
  if (apiTransaction.description.trim().match(/PAY FORCE P2P/i)) {
    transaction.movements.push(invertedMovement(transaction.movements[0], account, 'ccard'))
  }
}

function invertedMovement (movement, account, type) {
  return {
    id: null,
    account: {
      company: null,
      type,
      instrument: movement.invoice?.instrument || account.instrument,
      syncIds: null
    },
    invoice: null,
    sum: -(movement.invoice?.sum || movement.sum),
    fee: 0
  }
}

function getMoney (input) {
  return parseFloat(input) / 100
}

function parseDate (dateString) {
  // 2021-07-29
  return new Date(dateString + 'T00:00:00.000+03:00')
}
