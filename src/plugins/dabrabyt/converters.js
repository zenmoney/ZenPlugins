import { MD5 } from 'jshashes'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { toISODateString, dateInTimezone } from '../../common/dateUtils'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const md5 = new MD5()

export function convertAccounts (json) {
  const accounts = []
  const cards = []
  const credits = []
  let skipAccount = 0
  for (const accountsGroup in json) {
    switch (accountsGroup) {
      case 'cardAccount':
        cards.push(...json[accountsGroup].map(parseCardAccount))
        break
      case 'corporateCardAccount':
        cards.push(...json[accountsGroup].map(parseCorporateCardAccount))
        break
      case 'depositAccount':
        accounts.push(...json[accountsGroup].map(parseDepositAccount))
        break
      case 'currentAccount':
        accounts.push(...json[accountsGroup].map(parseCheckingAccount))
        break
      case 'creditAccount':
        credits.push(...json[accountsGroup].map(parseCreditAccount))
        break
      case 'additionalCardAccount':
        cards.push(...json[accountsGroup].map(parseAdditionalCardAccount))
        break
      case 'status':
        break
      default:
        skipAccount += json[accountsGroup].length
    }
  }

  accounts.push(...creditCardsProcessing(cards, credits))

  console.log(`Не обработано ${skipAccount} счетов. Неизвестный тип счёта`)

  return accounts
}

function creditCardsProcessing (cards, credits) {
  if (credits.length === 0) {
    return cards
  }

  for (const card of cards) {
    const linkedCreditIndex = credits.findIndex(credit => card.account.id === credit.account.id)
    if (linkedCreditIndex >= 0) {
      card.account.creditLimit = credits[linkedCreditIndex].account.limit
      card.account.balance -= card.account.creditLimit
      credits.splice(linkedCreditIndex, 1)
    }
  }

  return [...cards, ...credits]
}

function parseCheckingAccount (apiAccount) {
  return {
    product: {
      id: apiAccount.internalAccountId,
      accountType: apiAccount.accountType,
      type: 'checking',
      currencyCode: apiAccount.currency
    },
    account: {
      available: 0,
      balance: Number.parseFloat(apiAccount.balanceAmount),
      creditLimit: 0,
      gracePeriodEndDate: null,
      id: apiAccount.internalAccountId,
      instrument: codeToCurrencyLookup[apiAccount.currency],
      savings: false,
      syncIds: [apiAccount.internalAccountId],
      title: `${apiAccount.personalizedName || apiAccount.productName}`,
      totalAmountDue: null,
      type: 'checking'
    }
  }
}

function parseCreditAccount (apiAccount) {
  return {
    product: {
      id: apiAccount.internalAccountId,
      accountType: apiAccount.accountType,
      type: 'loan',
      currencyCode: apiAccount.currency
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'loan',
      title: `${apiAccount.personalizedName || apiAccount.productName}`,
      instrument: codeToCurrencyLookup[apiAccount.currency],
      syncIds: [apiAccount.internalAccountId],
      balance: Number.parseFloat(apiAccount.balanceAmount),
      limit: Number.parseFloat(apiAccount.limit) || 0,
      startDate: new Date(apiAccount.openDate),
      startBalance: Number.parseFloat(apiAccount.balanceAmount),
      capitalization: true,
      percent: apiAccount.interestRate || 0,
      endDateOffsetInterval: 'day',
      endDateOffset: (new Date(apiAccount.plannedEndDate).getTime() - new Date(apiAccount.openDate).getTime()) / MS_PER_DAY,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function parseDepositAccount (apiAccount) {
  return {
    product: {
      id: apiAccount.internalAccountId,
      accountType: apiAccount.accountType,
      type: 'deposit',
      currencyCode: apiAccount.currency
    },
    account: {
      balance: Number.parseFloat(apiAccount.balanceAmount),
      capitalization: true,
      endDateOffset: (new Date(apiAccount.endDate).getTime() - new Date(apiAccount.openDate).getTime()) / MS_PER_DAY,
      endDateOffsetInterval: 'day',
      id: apiAccount.internalAccountId,
      instrument: codeToCurrencyLookup[apiAccount.currency],
      payoffInterval: 'month',
      payoffStep: 1,
      percent: apiAccount.interestRate,
      startBalance: Number.parseFloat(apiAccount.balanceAmount),
      startDate: new Date(apiAccount.openDate),
      syncIds: [apiAccount.internalAccountId],
      title: `${apiAccount.personalizedName || apiAccount.productName}`,
      type: 'deposit'
    }
  }
}

function parseCardAccount (apiAccount) {
  const card = (apiAccount.cards && apiAccount.cards[0]) || {}
  if (!card.cardHash) {
    return null
  }

  return {
    product: {
      id: apiAccount.internalAccountId,
      cardHash: card.cardHash,
      accountType: apiAccount.accountType,
      type: 'ccard',
      currencyCode: apiAccount.currency,
      rkcCode: apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'ccard',
      title: card.personalizedName || apiAccount.productName,
      instrument: codeToCurrencyLookup[apiAccount.currency],
      syncIds: [...apiAccount.cards.map(card => card.cardNumberMasked.replace(/\s/g, ''))],
      balance: Number.isFinite(apiAccount.balance) ? apiAccount.balance : null
    }
  }
}

function parseCorporateCardAccount (apiAccount) {
  const card = (apiAccount.corpoCards && apiAccount.corpoCards[0]) || {}
  if (!card.cardHash) {
    return null
  }

  return {
    product: {
      id: apiAccount.internalAccountId,
      cardHash: card.cardHash,
      accountType: '1', // apiAccount.accountType,
      type: 'ccard',
      currencyCode: card.currency, // apiAccount.currency,
      rkcCode: '2' // apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'ccard',
      title: card.personalizedName || apiAccount.productName || card.cardType.name, // ???
      instrument: codeToCurrencyLookup[card.currency], // ??? После запроса баланса понять
      syncIds: [...apiAccount.corpoCards.map(card => card.cardNumberMasked.replace(/\s/g, ''))],
      balance: apiAccount.balance // ??? После запроса баланса понять
    }
  }
}

function parseAdditionalCardAccount (apiAccount) {
  const card = (apiAccount.additionalCards && apiAccount.additionalCards[0]) || {}
  if (!card.cardHash) {
    return null
  }

  return {
    product: {
      id: apiAccount.internalAccountId,
      cardHash: card.cardHash,
      accountType: '1', // apiAccount.accountType,
      type: 'ccard',
      currencyCode: card.currency, // apiAccount.currency,
      rkcCode: '2' // apiAccount.rkcCode
    },
    account: {
      id: apiAccount.internalAccountId,
      type: 'ccard',
      title: card.personalizedName || apiAccount.productName || card.cardType.name, // ???
      instrument: codeToCurrencyLookup[card.currency], // ??? После запроса баланса понять
      syncIds: [...apiAccount.additionalCards.map(card => card.cardNumberMasked.replace(/\s/g, ''))],
      balance: apiAccount.balance // ??? После запроса баланса понять
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  if ((apiTransaction.operationAmount === 0 && apiTransaction.transactionAmount === 0) || Number.parseInt(apiTransaction.operationSign) === 0) {
    return false
  }
  const invoice = {
    sum: apiTransaction.operationAmount * Number.parseInt(apiTransaction.operationSign),
    instrument: Number.isInteger(+apiTransaction.operationCurrency) ? codeToCurrencyLookup[apiTransaction.operationCurrency] : apiTransaction.operationCurrency
  }

  const transaction = {
    hold: !apiTransaction.transactionDate,
    date: new Date(apiTransaction.operationDate),
    movements: [
      {
        id: apiTransaction.transactionAuthCode || generateMovementId(apiTransaction),
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parsePayee,
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /Перевод средств между своими карточками/i,
    /перевода с карточки/i
  ].some(regexp => apiTransaction.operationName?.match(regexp))) {
    return false
  }
  const syncIdsData = apiTransaction.operationPlace.match(/(\d+\*+\d+)/)
  const dateStr = toISODateString(dateInTimezone(transaction.date, 180)).substring(0, 10)
  let groupInstrument
  let groupSum
  let groupIdsData
  if (Number.parseInt(apiTransaction.operationSign) < 0) {
    groupInstrument = apiTransaction.transactionCurrency
    groupSum = -apiTransaction.transactionAmount
    groupIdsData = syncIdsData ? [syncIdsData[1]] : null
  } else {
    groupInstrument = invoice.instrument
    groupSum = invoice.sum
    groupIdsData = apiTransaction.cardPAN.substring(0, 6) + '******' + apiTransaction.cardPAN.slice(-4)
  }
  transaction.groupKeys = [
    `${dateStr}_${groupInstrument}_${Math.abs(groupSum).toString()}_${groupIdsData}`
  ]
  transaction.movements.push({
    id: null,
    account: {
      type: 'ccard',
      instrument: apiTransaction.transactionCurrency,
      company: null,
      syncIds: syncIdsData ? [syncIdsData[1]] : null
    },
    invoice: invoice.instrument === apiTransaction.transactionCurrency
      ? null
      : { sum: -invoice.sum, instrument: invoice.instrument },
    sum: -Number.parseInt(apiTransaction.operationSign) * apiTransaction.transactionAmount,
    fee: 0
  })
  transaction.merchant = null
  transaction.comment = apiTransaction.operationPlace

  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (([
    /Перевод средств.*другому клиенту/i
  ].some(regexp => apiTransaction.operationName?.match(regexp))) ||
    ([
      /P2P/i
    ].some(regexp => apiTransaction.operationPlace?.match(regexp)))) {
    const syncIdsData = apiTransaction.operationPlace.match(/(\d+\*+\d+)/)
    transaction.movements.push({
      id: null,
      account: {
        type: 'ccard',
        instrument: apiTransaction.transactionCurrency,
        company: null,
        syncIds: syncIdsData ? [syncIdsData[1]] : null
      },
      invoice: invoice.instrument === apiTransaction.transactionCurrency
        ? null
        : { sum: -invoice.sum, instrument: invoice.instrument },
      sum: -Number.parseInt(apiTransaction.operationSign) * apiTransaction.transactionAmount,
      fee: 0
    })
    transaction.merchant = null
    transaction.comment = apiTransaction.operationPlace

    return true
  }
  return false
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /наличных/i
  ].some(regexp => apiTransaction.operationName?.match(regexp))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })

  return true
}

function parsePayee (transaction, apiTransaction) {
  if (apiTransaction.operationPlace || apiTransaction.salaryOrganizationName) {
    transaction.merchant = {
      fullTitle: apiTransaction.operationPlace?.trim() || apiTransaction.salaryOrganizationName?.trim(),
      mcc: Number.parseInt(apiTransaction.mcc) || null,
      location: null
    }
    transaction.comment = (apiTransaction.salaryOrganizationName || apiTransaction.operationName === 'Возврат (refund)') ? apiTransaction.operationName : null
  } else if ([
    /Плата за перевод/i,
    /On-line пополнение/i
  ].some(regexp => apiTransaction.operationName?.match(regexp))) {
    transaction.merchant = {
      fullTitle: apiTransaction.clientName?.trim(),
      mcc: Number.parseInt(apiTransaction.mcc) || null,
      location: null
    }
    transaction.comment = apiTransaction.operationName || null
  } else {
    transaction.comment = apiTransaction.operationName
  }
}

function generateMovementId (apiTransaction) {
  return md5.hex(`${apiTransaction.accountId}-${apiTransaction.operationDate}-
  ${apiTransaction.operationPlace || apiTransaction.operationName}-${apiTransaction.operationAmount}-
  ${apiTransaction.operationCurrency}`)
}
