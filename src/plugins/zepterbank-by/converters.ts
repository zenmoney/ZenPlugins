import { Account, AccountType, Transaction } from '../../types/zenmoney'
import {
  FetchCardAccount,
  FetchCurrentAccount,
  FetchCardTransaction,
  FetchStatementOperation,
  FetchCardAccountMeta,
  FetchCurrentAccountMeta
} from './types/fetch.types'
import { convertIsoDateStringToDate } from './helpers'

export const convertCardAccount = (fetchAccount: FetchCardAccount): Account & FetchCardAccountMeta => {
  return {
    id: fetchAccount.productCardId,
    title: fetchAccount.cardProductKindName,
    balance: Number(fetchAccount.amount),
    instrument: fetchAccount.currencyIso,
    syncIds: [
      fetchAccount.ibanNum,
      fetchAccount.contractNumber,
      fetchAccount.cardPAN.slice(-4)
    ],
    type: AccountType.ccard,
    _meta: {
      cardTransactionsFetchId: fetchAccount.productCardId,
      productStatementFetchId: fetchAccount.productId
    }
  }
}

export const convertCurrentAccount = (fetchAccount: FetchCurrentAccount): Account & FetchCurrentAccountMeta => {
  return {
    id: fetchAccount.productId,
    title: fetchAccount.contractKindName, // could be the same for some accounts, for check
    balance: Number(fetchAccount.contractCurrentRest),
    instrument: fetchAccount.contractCurrencyIso,
    syncIds: [fetchAccount.ibanNum, fetchAccount.contractNumber],
    type: AccountType.checking,
    _meta: {
      productStatementFetchId: fetchAccount.productId
    }
  }
}

export const convertCardTransaction = (fetchTransaction: FetchCardTransaction, account: Account): Transaction => {
  const isInDifferentCurrency = fetchTransaction.currencyIso !== account.instrument
  const amount = Number(`${fetchTransaction.transOperType === 'debit' ? '-' : ''}${fetchTransaction.amount}`)

  return {
    hold: null,
    date: convertIsoDateStringToDate(fetchTransaction.effectiveDate),
    comment: '',
    movements: [
      {
        id: null, // no transaction id presented
        account: { id: account.id },
        fee: 0,
        invoice: isInDifferentCurrency ? { sum: amount, instrument: fetchTransaction.currencyIso } : null,
        sum: isInDifferentCurrency ? null : amount
      }
    ],
    merchant: {
      fullTitle: fetchTransaction.cardAcceptor,
      mcc: Number(fetchTransaction.transMcc.replace(/\D/g, '')),
      location: null
    }
  }
}

export const convertStatementTransaction = (fetchTransaction: FetchStatementOperation, account: Account): Transaction => {
  const operationAmount = Number(fetchTransaction.operationSum) * fetchTransaction.operationSign
  const transactionAmount = Number(fetchTransaction.transactionSum) * fetchTransaction.operationSign
  const hasInvoice = fetchTransaction.operationCurrencyIso !== fetchTransaction.transactionCurrencyISO

  const payee = fetchTransaction.terminalLocation ?? ''
  const [country = '', city = ''] = (fetchTransaction.merchant ?? '').split(' ')
  const mcc = fetchTransaction.MCC != null ? Number(fetchTransaction.MCC.replace(/\D/g, '')) : null

  return {
    hold: null,
    date: convertIsoDateStringToDate(fetchTransaction.transactionDate),
    comment: '',
    movements: [
      {
        id: null, // no transaction id presented
        account: { id: account.id },
        fee: 0,
        invoice: hasInvoice ? { sum: transactionAmount, instrument: fetchTransaction.transactionCurrencyISO } : null,
        sum: operationAmount
      }
    ],
    merchant: mcc !== null
      ? {
          title: payee,
          mcc,
          country,
          city,
          location: null
        }
      : null
  }
}
