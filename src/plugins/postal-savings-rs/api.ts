import { accountDetailsToId, convertAccount, convertCardTransactions, convertExchangeRates, convertTransactions } from './converters'
import { AccountDetails, ExchangeRatesMap, PSAccount } from './models'
import { fetchAccountData, fetchCardTransactions, fetchExchangeRates } from './fetchApi'
import { Amount, Transaction } from '../../types/zenmoney'
import moment from 'moment'

function accountCardKey (accountId: string): string {
  return `account/${accountId}/card`
}

export async function fetchAccount (accountDetails: AccountDetails): Promise<PSAccount> {
  const accountId = accountDetailsToId(accountDetails)
  let cardNumber = ZenMoney.getData(accountCardKey(accountId)) as string | null | undefined

  if (cardNumber === undefined) {
    cardNumber = await readCardNumber(`Enter card number for account ${accountDetails.id} (optional):`)
    ZenMoney.setData(accountCardKey(accountId), cardNumber)
    ZenMoney.saveData()
  }

  const rawData = await fetchAccountData(accountDetails)
  const account = convertAccount(accountDetails, rawData)
  if (cardNumber !== null) {
    account.syncIds.push(cardNumber)
  }

  return {
    ...account,
    cardNumber,
    rawData
  }
}

async function readCardNumber (prompt: string): Promise<string | null> {
  let cardNumber: string | undefined
  while (cardNumber === undefined) {
    const input = (await ZenMoney.readLine(prompt, { inputType: 'number' }) ?? '').replace(/\D/g, '')
    if (input.length === 16) {
      cardNumber = input
    } else {
      await ZenMoney.alert('Card number should contain exactly 16 digits. You can leave the field empty if you don\'t have a card')
    }
  }
  return cardNumber === '' || cardNumber === '0' ? null : cardNumber
}

export async function fetchTransactions (account: PSAccount, fromDate: Date, toDate: Date): Promise<Transaction[]> {
  const accountTransactions = convertTransactions(account.id, account.rawData)

  if (account.cardNumber !== null) {
    const cardTransactions = convertCardTransactions(await fetchCardTransactions(account.cardNumber, fromDate, toDate))

    for (const transaction of cardTransactions) {
      // Calculate amount in account currency to be able to match account and card transactions
      const accountCurrencyAmount = await convertAmount(
        transaction.authorizationDate ?? transaction.date,
        transaction.amount,
        account.instrument
      )
      transaction.accountSum = accountCurrencyAmount?.sum
    }
    // TODO: Remove after debug
    console.log(cardTransactions)
  }

  return accountTransactions.filter(transaction => transaction.date >= fromDate && transaction.date <= toDate)
}

async function convertAmount (date: Date, amount: Amount, targetCurrency: string): Promise<Amount | undefined> {
  if (amount.instrument === targetCurrency) {
    return amount
  }

  const sourceRate = await getExchangeRate(date, amount.instrument)
  if (sourceRate === undefined) {
    return undefined
  }
  const targetRate = await getExchangeRate(date, targetCurrency)
  if (targetRate === undefined) {
    return undefined
  }

  return {
    sum: amount.sum * sourceRate / targetRate,
    instrument: targetCurrency
  }
}

async function getExchangeRate (date: Date, currency: string): Promise<number | undefined> {
  if (currency === 'RSD') {
    return 1
  }

  const exchangeRates = await getExchangeRates(date)
  return exchangeRates.get(currency)
}

const exchangeRatesByDate = new Map<string, ExchangeRatesMap>()

async function getExchangeRates (date: Date | null): Promise<ExchangeRatesMap> {
  const dateKey = date !== null ? moment(date).format('DD.MM.YYYY') : 'latest'
  let exchangeRates = exchangeRatesByDate.get(dateKey)
  if (exchangeRates === undefined) {
    const rawData = await fetchExchangeRates(date)
    exchangeRates = convertExchangeRates(rawData)

    // The bank can just not update exchange rates at holidays.
    // Use the latest known exchange rate in this case.
    if (exchangeRates.size === 0) {
      exchangeRates = await getExchangeRates(null)
    }
    exchangeRatesByDate.set(dateKey, exchangeRates)
  }

  return exchangeRates
}
