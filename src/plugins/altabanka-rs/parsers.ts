import moment from 'moment'
import { isValidDate } from '../../common/dateUtils'
import { decodeHtmlSpecialCharacters } from '../../common/stringUtils'
import { getOptBoolean, getOptNumber, getOptString, getString } from '../../types/get'
import { AccountInfo, AccountTransaction, Card, Environment } from './models'

const exchangeRateRegex = /\d+\.\d+ \w{3} Kurs:.+/
// Card turnover uses this placeholder until the authorization is posted.
const UNCONFIRMED_CARD_DATE = '01.01.0001'

function asArray (value: unknown): unknown[] {
  // Some endpoints return an error object (e.g. for an unsupported AccountType)
  // instead of an array, so we tolerate non-arrays instead of throwing.
  return Array.isArray(value) ? value : []
}

// ReservedFunds Reference `19633484R` and CardTurnover `CC-19633484R` are the same auth.
export function canonicalTransactionReference (reference: string): string {
  return reference.replace(/^CC-/i, '')
}

function movementIdFromReference (reference: string): string {
  return 'id_' + canonicalTransactionReference(reference)
}

function normalizeAddress (text: string): string {
  return decodeHtmlSpecialCharacters(text.replace(/\s+/g, ' ').trim())
}

export function parseEnvironment (body: unknown): Environment {
  // Before login `AuthenticationType` is null and `IsAuthenticated` is already
  // `true`, so we use optional getters and rely on `AuthenticationType`/`PrincipalID`
  // to detect a successful login.
  return {
    requestToken: getOptString(body, 'd.User.RequestToken') ?? '',
    isAuthenticated: getOptBoolean(body, 'd.User.IsAuthenticated') ?? false,
    authenticationType: getOptString(body, 'd.User.AuthenticationType') ?? '',
    principalId: getOptNumber(body, 'd.User.PrincipalID') ?? 0
  }
}

export function parseAccountInfo (body: unknown): AccountInfo[] {
  const rows = asArray(body)

  const currencyCountByAccount: Record<string, number> = {}
  for (const row of rows) {
    const accountNumber = getString(row, '6')
    currencyCountByAccount[accountNumber] = (currencyCountByAccount[accountNumber] ?? 0) + 1
  }

  return rows.map(row => {
    const accountNumber = getString(row, '6')
    const currency = getString(row, '8')
    return {
      id: currencyCountByAccount[accountNumber] > 1 ? accountNumber + currency : accountNumber,
      cardNumber: '',
      accountNumber,
      productCoreID: getString(row, '2'),
      name: getString(row, '1'),
      currency,
      balance: parseFloat(getString(row, '3'))
    }
  })
}

export function parseTransactions (body: unknown, fromDate: Date): AccountTransaction[] {
  const outer = asArray(body)
  if (outer.length === 0) {
    return []
  }

  const inner = asArray(outer[0])
  const transactionRows = inner.length > 1 ? asArray(inner[1]) : []

  // Card transactions (Source === 'crd') are fetched separately from card turnover
  // (it provides the real transaction date), so we skip them here to avoid duplicates.
  return transactionRows.filter(row => getString(row, '64') !== 'crd').map(row => {
    const direction = getString(row, '5') === 'c' ? 1 : -1
    const date = moment(getString(row, '7'), 'DD.MM.YYYY HH:mm:ss').toDate()
    const rawCurrency = getString(row, '30')

    let text = normalizeAddress(getString(row, '15')).replace('Kartica: ', '')
    const description = text.match(exchangeRateRegex)?.[0] ?? ''
    text = text.replace(description, '').trim()

    return {
      id: 'id_' + getString(row, '10'),
      date: isValidDate(date) ? date : fromDate,
      address: text,
      amount: direction * parseFloat(getString(row, '27')),
      currency: rawCurrency === '' ? undefined : rawCurrency,
      description
    }
  })
}

export function parseCards (body: unknown): Card[] {
  return asArray(body).map(row => {
    const currency = getString(row, '12')
    const foreignCurrency = getOptString(row, '22') ?? ''
    const turnoverCurrencies = [currency, foreignCurrency].filter((c, i, arr) => c !== '' && arr.indexOf(c) === i)
    return {
      primaryCardID: getString(row, '4'),
      accountNumber: getString(row, '11'),
      currency,
      turnoverCurrencies
    }
  })
}

export function parseCardTurnover (body: unknown, fromDate: Date): AccountTransaction[] {
  const outer = asArray(body)
  if (outer.length === 0) {
    return []
  }

  const inner = asArray(outer[0])
  const transactionRows = inner.length > 1 ? asArray(inner[1]) : []

  return transactionRows.flatMap(row => {
    const dateRaw = getString(row, '24')
    // Unconfirmed authorizations duplicate ReservedFunds; import holds from reserved only.
    if (dateRaw.startsWith(UNCONFIRMED_CARD_DATE)) {
      return []
    }

    // Empty columns arrive as '0' (not ''), so detect a debit by a non-zero amount.
    const debit = getString(row, '9')
    const sign = debit !== '' && parseFloat(debit) !== 0 ? -1 : 1
    const domesticAmount = sign * parseFloat(getString(row, '25'))
    const accountCurrency = getString(row, '28')
    const originalCurrency = getString(row, '11')
    const date = moment(dateRaw, 'DD.MM.YYYY HH:mm:ss').toDate()

    const address = normalizeAddress(
      getString(row, '17')
        .split(': ').slice(1).join(': ')
    )

    const result: AccountTransaction = {
      id: movementIdFromReference(getString(row, '14')),
      date: isValidDate(date) ? date : fromDate,
      address: address === '' ? normalizeAddress(getString(row, '17')) : address,
      amount: domesticAmount,
      currency: accountCurrency === '' ? undefined : accountCurrency,
      description: ''
    }

    const originalAmount = sign * parseFloat(getString(row, '9'))
    if (originalCurrency !== '' && originalCurrency !== accountCurrency && originalAmount !== 0) {
      result.invoice = { sum: originalAmount, instrument: originalCurrency }
    }

    return [result]
  })
}

export function parseReservedFunds (body: unknown, fromDate: Date): AccountTransaction[] {
  const rows = asArray(body)

  return rows.map(row => {
    const amount = getOptNumber(row, 'AmountTotal') ?? 0
    const date = moment(getOptString(row, 'ValueDate') ?? '').toDate()
    const currency = getOptString(row, 'CurrencyCode') ?? ''

    return {
      id: movementIdFromReference(getOptString(row, 'Reference') ?? ''),
      date: isValidDate(date) ? date : fromDate,
      address: normalizeAddress(getOptString(row, 'Description') ?? ''),
      amount: getOptString(row, 'Category') === 'c' ? amount : -amount,
      currency: currency === '' ? undefined : currency,
      description: ''
    }
  })
}
