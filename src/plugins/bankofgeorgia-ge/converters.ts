import { Account, AccountType, ExtendedTransaction, Merchant, Movement, Amount } from '../../types/zenmoney'
import { ConvertedAccount, ConvertedProduct, FetchedAccount, ConvertedLoan } from './models'
import get, { getArray, getNumber, getOptNumber, getOptString, getString } from '../../types/get'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

function parseAmount (data: unknown, path: string): number {
  const value = get(data, path)
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    assert(!isNaN(parsed), `cant parse amount as number at "${path}" from `, data)
    return parsed
  }
  assert(false, `cant get number at "${path}" from `, data)
}

export function getAmountFromDescription (description: string | undefined): Amount | null {
  if (description == null || description === undefined) {
    return null
  }

  const amountAndInstrumentRegexp = /([A-Z]{3})([0-9,]+[0-9]+\.[0-9]{2})/g
  const found = description.match(amountAndInstrumentRegexp)
  if (found != null) {
    const normalizedSum = found[0].slice(3).replace(',', '')
    const sum = parseFloat(normalizedSum)
    const instrument = found[0].slice(0, 3)
    return { sum, instrument }
  }
  return null
}

function getSignByPrintFormType (printFormType: string): number {
  const expensePrintFormTypes = ['UTILITY_PAYMENT', 'PAYMENT', 'OUT_TRANSFER', 'CASH_WITHDRAWAL', 'OTHER']
  return expensePrintFormTypes.includes(printFormType) ? -1 : 1
}

function invertMovement (movement: Movement, account: Account, invertedAccount: { id?: string, type?: AccountType, companyId?: string }): Movement {
  const sum = movement.invoice != null ? movement.invoice.sum : movement.sum
  return {
    id: null,
    account:
    invertedAccount.id != null
      ? { id: invertedAccount.id }
      : {
          type: invertedAccount.type ?? null,
          instrument: movement.invoice != null ? movement.invoice.instrument : account.instrument,
          company: invertedAccount.companyId != null ? { id: invertedAccount.companyId } : null,
          syncIds: null
        },
    invoice: null,
    sum: sum != null ? -sum : null,
    fee: 0
  }
}

export function convertAccounts (apiAccounts: FetchedAccount[]): ConvertedProduct[] {
  const accounts: ConvertedProduct[] = []
  for (const apiAccount of apiAccounts) {
    let converted: ConvertedProduct[]
    switch (apiAccount.tag) {
      case 'account': {
        converted = convertAccount(apiAccount)
        break
      }
      case 'deposit':
        converted = [convertDeposit(apiAccount)]
        break
      case 'loan':
        converted = [convertLoan(apiAccount)]
        break
    }
    accounts.push(...converted)
  }
  return accounts
}

function convertAccount (apiAccount: FetchedAccount): ConvertedAccount[] {
  assert(apiAccount.tag === 'account')
  const acctNo = getString(apiAccount.details, 'acctNo')
  return getArray(apiAccount.details, 'subAccounts').map(subAccount => {
    const acctKey = getNumber(subAccount, 'acctKey').toString()
    const instrument = getString(subAccount, 'ccy')
    return {
      tag: 'account',
      acctKey,
      account: {
        id: acctKey,
        type: apiAccount.cards.length > 0 ? AccountType.ccard : AccountType.checking,
        title: getString(apiAccount.product, 'productDictionaryValue'),
        instrument,
        balance: getNumber(subAccount, 'realAmount'),
        syncIds: [
          acctNo + instrument
        ]
      }
    }
  })
}

function convertDeposit (apiAccount: FetchedAccount): ConvertedAccount {
  assert(apiAccount.tag === 'deposit')
  const startDate = new Date(getNumber(apiAccount.details, 'startDate'))
  const endDate = new Date(getOptNumber(apiAccount.details, 'maturityDate') ?? new Date('2099-01-01T00:00:00.000+04:00').getTime())
  const { count: endDateOffset, interval: endDateOffsetInterval } = getIntervalBetweenDates(startDate, endDate)
  const acctKey = getNumber(apiAccount.details, 'accountKey').toString()
  return {
    tag: 'deposit',
    acctKey,
    account: {
      id: acctKey,
      type: AccountType.deposit,
      title: getOptString(apiAccount.details, 'name') ?? getString(apiAccount.details, 'depositProdType'),
      instrument: getString(apiAccount.details, 'ccy'),
      syncIds: [getString(apiAccount.details, 'agreeNo')],
      balance: getNumber(apiAccount.details, 'totalBalance'),
      startDate,
      startBalance: getNumber(apiAccount.details, 'currentBalance'),
      capitalization: true,
      percent: getNumber(apiAccount.details, 'interestRate'),
      endDateOffsetInterval,
      endDateOffset,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertLoan (apiAccount: FetchedAccount): ConvertedLoan {
  assert(apiAccount.tag === 'loan')
  const startDate = new Date(getNumber(apiAccount.details, 'lndDetails.signedDate'))
  const endDate = new Date(getOptNumber(apiAccount.details, 'lndDetails.matureDate') ?? new Date('2099-01-01T00:00:00.000+04:00').getTime())
  const { count: endDateOffset, interval: endDateOffsetInterval } = getIntervalBetweenDates(startDate, endDate)
  const acctKey = getNumber(apiAccount.details, 'loanKey').toString()
  return {
    tag: 'loan',
    acctKey,
    account: {
      id: acctKey,
      type: AccountType.loan,
      title: getOptString(apiAccount.product, 'loanName') ?? getString(apiAccount.product, 'prodType'),
      instrument: getString(apiAccount.product, 'ccy'),
      syncIds: [acctKey],
      balance: -getNumber(apiAccount.details, 'lndDetails.restAmount'),
      startDate,
      startBalance: getNumber(apiAccount.details, 'lndDetails.initialPrincipal'),
      capitalization: true,
      percent: getNumber(apiAccount.details, 'lndDetails.interestRate'),
      endDateOffsetInterval,
      endDateOffset,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

export function convertTransaction (apiTransaction: unknown, product: ConvertedProduct): ExtendedTransaction | null {
  const printFormType = getString(apiTransaction, 'printFormType')
  const entryType = getString(apiTransaction, 'entryType')
  // Handle both old API (entryGroupDKey) and new API (entryGroupDValue) field names
  const entryGroupDKey = getOptString(apiTransaction, 'entryGroupDKey') ?? getOptString(apiTransaction, 'entryGroupDValue')
  const instrument = getString(apiTransaction, 'ccy')

  // Handle date parsing for both old and new API formats
  let date: Date
  if (getOptString(apiTransaction, 'postDate') !== undefined) {
    // New API format: uses ISO date string in postDate
    date = new Date(getString(apiTransaction, 'postDate'))
  } else {
    // Old API format: uses timestamp in inpSysdate
    date = new Date(getNumber(apiTransaction, 'inpSysdate'))
  }

  // Handle auth date for both formats
  const authDateField = getOptString(apiTransaction, 'authDate') ?? getOptString(apiTransaction, 'authDateStr')
  if (authDateField !== undefined) {
    const authDateStr = parseTransactionDate(authDateField)
    if (authDateStr !== null) {
      date = new Date(authDateStr)
    }
  }

  assert(instrument === product.account.instrument, 'invoice tx found', apiTransaction)

  // Handle transaction ID for both old and new API formats
  let transactionId: string
  if (getOptString(apiTransaction, 'entryId') !== undefined) {
    // New API format: uses entryId
    transactionId = getString(apiTransaction, 'entryId')
  } else {
    // Old API format: uses statmentId
    transactionId = getNumber(apiTransaction, 'statmentId').toString()
  }

  const transaction: ExtendedTransaction = {
    hold: getString(apiTransaction, 'status') === 'F',
    date,
    movements: [
      {
        id: transactionId,
        account: { id: product.account.id },
        invoice: null,
        sum: -parseAmount(apiTransaction, 'amount'),
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }

  const cashAmount = getAmountFromDescription(getString(apiTransaction, 'nomination'))
  const invoiceNeeded = !!((cashAmount != null) && cashAmount.instrument !== product.account.instrument)

  switch (printFormType) {
    case 'UTILITY_PAYMENT':
    case 'PAYMENT': {
      const title: string | undefined = getOptString(apiTransaction, 'merchantNameInt')
      // Bank fees transaction contains original payment info in description, so we shouldn't parse it
      if (entryGroupDKey !== 'text.entry.group.name.FEE' && invoiceNeeded) {
        transaction.movements[0].invoice = invoiceNeeded ? { sum: cashAmount.sum * getSignByPrintFormType(printFormType), instrument: cashAmount?.instrument } : null
      }
      if (title !== undefined) {
        transaction.merchant = parseMerchant(title, getString(apiTransaction, 'nominationOriginal'))
      } else {
        transaction.comment = getString(apiTransaction, 'nominationOriginal')
      }
      break
    }
    case 'OUT_TRANSFER':
    case 'IN_TRANSFER': {
      switch (entryGroupDKey) {
        case 'text.entry.group.name.Currency.Exchange':
        case 'text.entry.group.name.Transfer':
        case 'text.entry.group.name.Income': {
          const beneficiary = getOptString(apiTransaction, 'beneficiary')
          transaction.merchant = beneficiary != null
            ? {
                title: beneficiary,
                country: null,
                city: null,
                mcc: null,
                location: null
              }
            : null
          transaction.comment = getOptString(apiTransaction, 'docNomination') ?? null
          transaction.movements.push(
            invertMovement(transaction.movements[0], product.account, { type: AccountType.ccard })
          )

          // Handle groupKeys for both old and new API formats
          let statementId: number | string
          let docKeyId: number | string

          if (getOptString(apiTransaction, 'entryId') !== undefined) {
            // New API format
            statementId = getString(apiTransaction, 'entryId')
            docKeyId = getNumber(apiTransaction, 'docKey')
          } else {
            // Old API format
            statementId = getNumber(apiTransaction, 'statmentId')
            docKeyId = getNumber(apiTransaction, 'docKey')
          }

          if (statementId.toString() !== docKeyId.toString()) {
            transaction.groupKeys = [docKeyId.toString()]
          }
        }
      }
      break
    }
    case 'CASH_DEPOSIT': {
      const title: string | undefined = getOptString(apiTransaction, 'merchantNameInt') ?? getOptString(apiTransaction, 'beneficiary')
      if (title !== undefined) {
        transaction.merchant = parseMerchant(title, getString(apiTransaction, 'nominationOriginal'))
      }
      transaction.movements[0].invoice = invoiceNeeded ? { sum: cashAmount.sum * getSignByPrintFormType(printFormType), instrument: cashAmount.instrument } : null
      transaction.movements.push(
        invertMovement(transaction.movements[0], product.account, { type: AccountType.cash })
      )
      const nominationOriginal = getOptString(apiTransaction, 'nominationOriginal')
      transaction.comment = nominationOriginal ?? 'Cash deposit'
      break
    }
    case 'CASH_WITHDRAWAL': {
      const title: string | undefined = getOptString(apiTransaction, 'merchantNameInt') ?? getOptString(apiTransaction, 'beneficiary')
      if (title !== undefined) {
        transaction.merchant = parseMerchant(title, getString(apiTransaction, 'nominationOriginal'))
      }

      if (entryType === 'COM') { // cash withdrawal fee
        transaction.comment = 'Cash withdrawal comission / ' + getString(apiTransaction, 'nominationOriginal')
      } else {
        transaction.comment = 'Cash withdrawal'
        const txAmount = parseAmount(apiTransaction, 'amount')
        if (cashAmount != null) {
          if (cashAmount.instrument !== product.account.instrument) {
            transaction.movements[0].invoice = { sum: -cashAmount.sum, instrument: cashAmount.instrument }
            transaction.movements[0].sum = -txAmount
          } else {
            const fee = txAmount - cashAmount.sum
            transaction.movements[0].sum = -(txAmount - fee)
            transaction.movements[0].fee = fee !== 0 ? -Math.abs(Math.round(fee * 100) / 100) : 0
          }
        }
        transaction.movements.push(
          invertMovement(transaction.movements[0], product.account, { type: AccountType.cash })
        )
      }
      break
    }
    case 'OTHER': {
      switch (entryGroupDKey) {
        case 'text.entry.group.name.withdrawal':
        case 'text.entry.group.name.widthroval': {
          if (entryType === 'COM') { // cash withdrawal fee
            transaction.comment = 'cash withdrawal fee'
            break
          }
          const txAmount = parseAmount(apiTransaction, 'amount')
          if (cashAmount != null) {
            if (cashAmount.instrument !== product.account.instrument) {
              transaction.movements[0].invoice = { sum: -cashAmount.sum, instrument: cashAmount.instrument }
              transaction.movements[0].sum = -txAmount
            } else {
              const fee = txAmount - cashAmount.sum
              transaction.movements[0].sum = -(txAmount - fee)
              transaction.movements[0].fee = fee !== 0 ? -Math.abs(Math.round(fee * 100) / 100) : 0
            }
          }
          transaction.movements.push(
            invertMovement(transaction.movements[0], product.account, { type: AccountType.cash })
          )
          const title: string | undefined = getOptString(apiTransaction, 'merchantNameInt') ?? getOptString(apiTransaction, 'beneficiary')
          if (title !== undefined) {
            transaction.merchant = parseMerchant(title, getString(apiTransaction, 'nominationOriginal'))
          }
          transaction.comment = 'Cash withdrawal'
          break
        }
        case 'text.entry.group.name.FEE': {
          transaction.comment = getString(apiTransaction, 'nominationOriginal')
          break
        }
        case 'text.entry.group.name.El.Money.Box': {
          transaction.movements.push(
            invertMovement(transaction.movements[0], product.account, { type: AccountType.checking })
          )
          break
        }
        case 'text.entry.group.name.Payment': {
          const beneficiary = getOptString(apiTransaction, 'beneficiary')
          transaction.merchant = beneficiary != null
            ? {
                title: beneficiary,
                country: null,
                city: null,
                mcc: null,
                location: null
              }
            : null
          transaction.comment = getString(apiTransaction, 'nominationOriginal')
          break
        }
        case 'text.entry.group.name.overdraft':
        case 'text.entry.group.default.OTHER':
        case 'text.entry.group.name.Loan.Repayment':
        case 'text.entry.group.name.Income': {
          transaction.comment = getString(apiTransaction, 'nominationOriginal')
          break
        }
        case 'text.entry.group.name.Interest.Accrue':
          // it usually has a copy of card's outcome operation with same docKey, but different statmentId & entryId
          if (product.account.type === AccountType.deposit && transaction.movements[0].sum != null && transaction.movements[0].sum < 0) {
            return null
          }
          transaction.groupKeys = [getNumber(apiTransaction, 'docKey').toString()]
          break
        case 'text.entry.group.name.Currency.Exchange': {
          transaction.groupKeys = [getNumber(apiTransaction, 'docKey').toString()]
          break
        }
        case 'text.entry.group.name.Other':
          transaction.groupKeys = [getNumber(apiTransaction, 'docKey').toString()]
          break
        default:
          assert(false, 'new other entryGroupDKey found', entryGroupDKey, apiTransaction)
      }
      break
    }
    default:
      assert(false, 'new printFormType found', printFormType, apiTransaction)
  }

  return transaction
}

function parseTransactionDate (authDateStr: string): string | null {
  const dateDataTime = authDateStr.match(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})\s(\d{2}:\d{2})/)
  if (dateDataTime == null) {
    return null
  }
  return `${dateDataTime[3]}-${dateDataTime[2]}-${dateDataTime[1]}T${dateDataTime[4]}+04:00`
}

function tryParseMcc (nominationOriginal: string): number | null {
  const match = nominationOriginal.match(/MCC:(\d{4})/i)
  if (match == null) {
    return null
  }
  return parseInt(match[1])
}

function parseMerchant (merchantNameInt: string, nominationOriginal: string): Merchant {
  const merchantTitle = merchantNameInt.split(',')
  let title = merchantTitle[0].trim()
  const country = merchantTitle.length === 1 || merchantTitle.length > 2 ? null : merchantTitle[1]?.trim()
  let city = merchantTitle.length > 2 && merchantTitle[1] !== '' ? merchantTitle[1]?.trim() : null
  const titleCity = title.split('>')
  if (titleCity.length > 1) {
    city = titleCity[1] !== '' ? titleCity[1] : null
    title = titleCity[0]
  }
  return {
    country: country !== '' ? country : null,
    city: ((city?.match(/\\+/)) != null) ? null : city,
    title,
    mcc: tryParseMcc(nominationOriginal),
    location: null
  }
}
