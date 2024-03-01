import { AccountType, Amount, ExtendedTransaction, Merchant, Transaction } from '../../types/zenmoney'
import { ConvertedAccount, ConvertedCard, ConvertedCreditCard, ConvertedDeposit, ConvertedLoan, ConvertedProduct, FetchedAccount, FetchedAccounts } from './models'
import { getArray, getBoolean, getNumber, getOptArray, getOptNumber, getOptString, getString } from '../../types/get'
import { padStart, pullAll, uniqBy } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

function mergeAccountsByCoreAccounts (apiAccounts: FetchedAccount[]): FetchedAccount[] {
  const result = apiAccounts.slice()
  const accounts = result.filter(x => x.tag === 'account')
  pullAll(result, accounts)
  result.push(...uniqBy(accounts, 'product.coreAccountId'))
  return result
}

function findDebitCardWithBlockations (debitCard: unknown, debitCardsWithBlockations: unknown[]): unknown | undefined {
  const iban = getString(debitCard, 'iban')
  return debitCardsWithBlockations.find(x => getString(x, 'iban') === iban)
}

function findCreditCardWithBlockations (creditCard: unknown, creditCardsWithBlockations: unknown[]): unknown | undefined {
  const iban = getString(creditCard, 'iban')
  return creditCardsWithBlockations.find(x => getString(x, 'iban') === iban)
}

function findCreditCards (creditCard: unknown, creditCards: unknown[]): unknown | undefined {
  const iban = getString(creditCard, 'iban')
  return creditCards.find(x => getString(x, 'iban') === iban)
}

export function convertAccounts (apiAccounts: FetchedAccounts): ConvertedProduct[] {
  const accounts: ConvertedProduct[] = []
  for (const apiAccount of mergeAccountsByCoreAccounts(apiAccounts.accounts)) {
    let account: ConvertedProduct
    switch (apiAccount.tag) {
      case 'loan':
        account = convertLoan(apiAccount)
        break
      case 'deposit':
        account = convertDeposit(apiAccount)
        break
      case 'account': {
        const accountTypes = getArray(apiAccount.product, 'accountMatrixCategorisations')
        assert(accountTypes.length === 1, 'multiple account types found', accountTypes)
        const accountType = getString(accountTypes, '[0]')
        if (accountType === 'DEBIT_CARDS') {
          account = convertDebitCard(apiAccount.product, findDebitCardWithBlockations(apiAccount.product, apiAccounts.debitCardsWithBlockations))
        } else if (accountType === 'CREDIT_CARDS') {
          account = convertCreditCard(apiAccount.product,
            findCreditCardWithBlockations(apiAccount.product, apiAccounts.creditCardsWithBlockations),
            findCreditCards(apiAccount.product, apiAccounts.creditCards))
        } else if (accountType === 'SAVING_ACCOUNTS') {
          account = convertSavingAccount(apiAccount.product)
        } else if (accountType === 'CURRENT_ACCOUNTS') {
          account = convertCurrentAccount(apiAccount.product)
        } else {
          assert(false, 'unknown account type found', accountType, apiAccounts)
        }
        break
      }
    }
    accounts.push(account)
  }
  return accounts
}

function convertDebitCard (apiAccount: unknown, blockations: unknown): ConvertedCard {
  let balance: number | null = getOptNumber(apiAccount, 'availableBalance') ?? null
  const holdTransactions = []
  const coreAccountId = getNumber(apiAccount, 'coreAccountId')
  const instrument = getString(apiAccount, 'currency')
  const syncIds = [getString(apiAccount, 'iban')]
  let balanceHoldTransactions = 0

  if (blockations != null) {
    const cards = getArray(blockations, 'cards')
    for (const card of cards) {
      if ((getString(cards[0], 'tibcoCard.priorityCurrency') === getString(card, 'tibcoCard.priorityCurrency')) &&
        (getNumber(cards[0], 'tibcoCard.availableAmount') === getNumber(card, 'tibcoCard.availableAmount'))) {
        syncIds.push(getString(card, 'tibcoCard.cardNumber'))
      } else {
        assert(cards.length === 1, 'multiple blocked movements card found', cards)
      }
      const arrayHoldTransactions = getArray(card, 'blockedMovements')
      for (const arrayHoldTransaction of arrayHoldTransactions) {
        if (arrayHoldTransaction && (instrument === getString(arrayHoldTransaction, 'blockedCurrency'))) {
          const arrayTransaction = convertBlockedMovementTransaction(arrayHoldTransaction, { id: coreAccountId.toString(), instrument })
          const balanceHoldTransaction = getNumber(arrayTransaction, 'movements[0].sum')
          balanceHoldTransactions = balanceHoldTransactions + balanceHoldTransaction
          holdTransactions.push(arrayTransaction)
        }
      }
    }
  }
  balance = (balance !== null && balanceHoldTransactions !== 0) ? Math.round((balance + balanceHoldTransactions) * 100) / 100 : balance

  return {
    tag: 'card',
    coreAccountId,
    account: {
      id: coreAccountId.toString(),
      type: AccountType.ccard,
      title: getString(apiAccount, 'friendlyName'),
      instrument,
      balance,
      syncIds
    },
    holdTransactions
  }
}

function convertCreditCard (apiAccount: unknown, blockations: unknown, creditCards: unknown): ConvertedCreditCard {
  const availableBalances = getArray(creditCards, 'availableBalances')
  const available: number | null = getOptNumber(availableBalances[0], 'amount') ?? null
  const creditLimit: number | null = getOptNumber(creditCards, 'creditLimit') ?? null
  const totalAmountDue: number | null = getOptNumber(creditCards, 'invoiceTotalPayment') ?? null
  const gracePeriodEndDate = new Date(getNumber(creditCards, 'invoiceNextBillingDate'))
  const holdTransactions = []
  const coreAccountId = getNumber(apiAccount, 'coreAccountId')
  const instrument = getString(apiAccount, 'currency')
  const syncIds = [getString(apiAccount, 'iban')]
  let balanceHoldTransactions = 0

  if (blockations != null) {
    const cards = getArray(blockations, 'cards')
    for (const card of cards) {
      if ((getString(cards[0], 'tibcoCard.priorityCurrency') === getString(card, 'tibcoCard.priorityCurrency')) &&
        (getNumber(cards[0], 'tibcoCard.availableAmount') === getNumber(card, 'tibcoCard.availableAmount'))) {
        syncIds.push(getString(card, 'tibcoCard.cardNumber'))
      } else {
        assert(cards.length === 1, 'multiple blocked movements card found', cards)
      }
      const arrayHoldTransactions = getArray(card, 'blockedMovements')
      for (const arrayHoldTransaction of arrayHoldTransactions) {
        if (arrayHoldTransaction && (instrument === getString(arrayHoldTransaction, 'blockedCurrency'))) {
          const arrayTransaction = convertBlockedMovementTransaction(arrayHoldTransaction, { id: coreAccountId.toString(), instrument })
          const balanceHoldTransaction = getNumber(arrayTransaction, 'movements[0].sum')
          balanceHoldTransactions = balanceHoldTransactions + balanceHoldTransaction
          holdTransactions.push(arrayTransaction)
        }
      }
    }
  }

  return {
    tag: 'card',
    coreAccountId,
    account: {
      id: coreAccountId.toString(),
      type: AccountType.ccard,
      title: getString(apiAccount, 'friendlyName'),
      instrument,
      available,
      creditLimit,
      totalAmountDue,
      gracePeriodEndDate,
      syncIds
    },
    holdTransactions
  }
}

function convertSavingAccount (apiAccount: unknown): ConvertedAccount {
  const coreAccountId = getNumber(apiAccount, 'coreAccountId')
  const balance: number | null = getOptNumber(apiAccount, 'availableBalance') ?? null
  return {
    tag: 'account',
    coreAccountId,
    account: {
      id: coreAccountId.toString(),
      type: AccountType.checking,
      title: getString(apiAccount, 'friendlyName'),
      instrument: getString(apiAccount, 'currency'),
      balance,
      syncIds: [
        getString(apiAccount, 'iban')
      ],
      savings: true
    }
  }
}

function convertCurrentAccount (apiAccount: unknown): ConvertedAccount {
  const coreAccountId = getNumber(apiAccount, 'coreAccountId')
  const balance: number | null = getOptNumber(apiAccount, 'availableBalance') ?? null
  return {
    tag: 'account',
    coreAccountId,
    account: {
      id: coreAccountId.toString(),
      type: AccountType.checking,
      title: getString(apiAccount, 'friendlyName'),
      instrument: getString(apiAccount, 'currency'),
      balance,
      syncIds: [
        getString(apiAccount, 'iban')
      ]
    }
  }
}

function convertDeposit (apiAccount: FetchedAccount): ConvertedDeposit {
  assert(apiAccount.tag === 'deposit')
  const coreAccountId = getNumber(apiAccount.product, 'coreAccountId')
  const depositId = getNumber(apiAccount.depositProduct, 'id')
  const startDate = new Date(getNumber(apiAccount.details, 'depositDetails.startDate'))
  const endDate = new Date(getNumber(apiAccount.details, 'depositDetails.endDate'))
  const { interval: endDateOffsetInterval, count: endDateOffset } = getIntervalBetweenDates(startDate, endDate)
  return {
    tag: 'deposit',
    depositId,
    account: {
      id: coreAccountId.toString(),
      type: AccountType.deposit,
      title: getString(apiAccount.product, 'friendlyName'),
      instrument: getString(apiAccount.product, 'currency'),
      syncIds: [
        getString(apiAccount.product, 'iban')
      ],
      balance: getNumber(apiAccount.depositProduct, 'currentAmount'),
      startDate,
      startBalance: getNumber(apiAccount.details, 'interestCalculationUponCancellation.amount'),
      capitalization: true,
      percent: getNumber(apiAccount.details, 'depositDetails.existingEffectiveInterestRate'),
      endDateOffsetInterval,
      endDateOffset,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function convertLoan (apiAccount: FetchedAccount): ConvertedLoan {
  assert(apiAccount.tag === 'loan')
  const startDate = new Date(getNumber(apiAccount.product, 'approvementDate'))
  const endDate = new Date(getNumber(apiAccount.product, 'endDate'))
  const { interval: endDateOffsetInterval, count: endDateOffset } = getIntervalBetweenDates(startDate, endDate)
  return {
    tag: 'loan',
    account: {
      id: getString(apiAccount.product, 'id'),
      type: AccountType.loan,
      title: getOptString(apiAccount.product, 'friendlyName') ?? getString(apiAccount.product, 'typeText'),
      instrument: getString(apiAccount.product, 'currencyCode'),
      syncIds: [
        getString(apiAccount.product, 'contractNumber')
      ],
      balance: -getNumber(apiAccount.product, 'outstandingPrincipalAmount'),
      startDate,
      startBalance: getNumber(apiAccount.product, 'totalLoanAmount'),
      capitalization: true,
      percent: getNumber(apiAccount.product, 'interestRate'),
      endDateOffsetInterval,
      endDateOffset,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function parseInstrument (code: string): string {
  switch (code) {
    case 'BYB':
      return 'BYN'
    case 'UKG':
      return 'UAH'
    default:
      return code
  }
}

export function convertBlockedMovementTransaction (apiTransaction: unknown, account: { id: string, instrument: string }): Transaction {
  const sign = getBoolean(apiTransaction, 'credit') || getBoolean(apiTransaction, 'reversal') ? 1 : -1
  const blockedAmount = getNumber(apiTransaction, 'blockedAmount')
  const blockedCurrency = parseInstrument(getString(apiTransaction, 'blockedCurrency'))
  const operationAmount = getNumber(apiTransaction, 'operationAmount')
  const operationCurrency = parseInstrument(getString(apiTransaction, 'operationCurrency'))
  const comment = getString(apiTransaction, 'location')
  const merchant = tryParseBlockedMovementMerchant(comment)
  const transaction: Transaction = {
    hold: true,
    date: new Date(getNumber(apiTransaction, 'dateTime')),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: (blockedCurrency !== operationCurrency)
          ? { sum: sign * operationAmount, instrument: operationCurrency }
          : null,
        sum: sign * blockedAmount,
        fee: 0
      }
    ],
    merchant: merchant != null ? merchant : null,
    comment: merchant != null ? null : comment
  };
  [
    parseOuterTransfer
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function tryParseBlockedMovementMerchant (data: string): Merchant | undefined {
  if (data.match(/P2P/) !== null) {
    return undefined
  }
  const splitted = data.split('>')
  if (splitted.length !== 2) {
    return
  }
  const cityCountry = splitted[1].split(' ')
  return {
    country: cityCountry[cityCountry.length - 1] ?? null,
    city: cityCountry[0] !== 'Visa' ? cityCountry[0] : null,
    title: splitted[0],
    mcc: null,
    location: null
  }
}

function parseOuterTransfer (transaction: Transaction, apiTransaction: unknown, account: { id: string, instrument: string }): boolean {
  const location = getString(apiTransaction, 'location')
  if ([
    /Visa Direct/i,
    /P2P/i
  ].some(regexp => regexp.test(location))) {
    const amount: Amount = transaction.movements[0].invoice != null
      ? {
          instrument: transaction.movements[0].invoice.instrument,
          sum: -transaction.movements[0].invoice.sum
        }
      : {
          instrument: account.instrument,
          sum: -transaction.movements[0].sum!
        }
    transaction.movements.push({
      id: null,
      account: {
        type: AccountType.ccard,
        instrument: amount.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: amount.sum,
      fee: 0
    })
    return true
  }
  return false
}

export function convertTransaction (apiTransaction: unknown, product: ConvertedProduct): ExtendedTransaction | null {
  const movementDate: number | undefined = getOptNumber(apiTransaction, 'movementDate')
  const groupKeys = []
  if (movementDate !== undefined) {
    if (getNumber(apiTransaction, 'depositAmount') === 0 && getNumber(apiTransaction, 'withdrawnDepositAmount') === 0) {
      return null
    }
    const date = new Date(getNumber(apiTransaction, 'movementDate'))
    const instrument = product.account.instrument
    const sum = getNumber(apiTransaction, 'depositAmount') > 0 ? getNumber(apiTransaction, 'depositAmount') : -getNumber(apiTransaction, 'withdrawnDepositAmount')
    groupKeys.push(product.account.id)
    groupKeys.push(`${getNumber(apiTransaction, 'movementDate')}_${instrument}_${Math.abs(sum)}`)
    const transaction: ExtendedTransaction = {
      hold: false,
      date,
      movements: [
        {
          id: null,
          account: { id: product.account.id },
          invoice: null,
          sum,
          fee: 0
        }
      ],
      merchant: null,
      comment: null,
      groupKeys
    }
    return transaction
  }

  const date = new Date(getNumber(apiTransaction, 'date'))
  const sum = getNumber(apiTransaction, 'amount')
  const instrument = getString(apiTransaction, 'currency')
  assert(instrument === product.account.instrument, 'invoice transaction found', apiTransaction, product)

  const parentExternalTransactionId = getOptNumber(apiTransaction, 'parentExternalTransactionId')
  if (parentExternalTransactionId != null) {
    groupKeys.push(parentExternalTransactionId.toString())
    groupKeys.push(`${getNumber(apiTransaction, 'date')}_${instrument}_${Math.abs(sum)}`)
  } else {
    groupKeys.push(getString(apiTransaction, 'externalTransactionId'))
    groupKeys.push(`${getNumber(apiTransaction, 'date')}_${instrument}_${Math.abs(sum)}`)
  }

  const transaction: ExtendedTransaction = {
    hold: ['1', '2'].includes(getString(apiTransaction, 'status')),
    date,
    movements: [
      {
        id: null,
        account: { id: product.account.id },
        invoice: null,
        sum,
        fee: 0
      }
    ],
    merchant: null,
    comment: null,
    groupKeys
  };

  [
    parsePOSPurchase,
    parseCashTransfer,
    parseOtherTx
  ].some(parser => parser(transaction, apiTransaction, product))
  return transaction
}

function parseOtherTx (transaction: ExtendedTransaction, apiTransaction: unknown, product: ConvertedProduct): boolean {
  transaction.comment = getString(apiTransaction, 'description')
  return true
}

function parseCashTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, product: ConvertedProduct): boolean {
  const description = getString(apiTransaction, 'description')
  const subcategories = getOptArray(apiTransaction, 'subcategories')
  let categoryCode: string
  if (subcategories) {
    categoryCode = getString(subcategories[0], 'categoryCode')
  }
  // const subcategories: [] = getArray(apiTransaction, 'subcategories')
  if ([
    /ანგარიშზე თანხის შეტანა/i,
    /ATM/i
  ].some(regexp => regexp.test(description)) ||
    [
      /CASH/i
    ].some(regexp => regexp.test(categoryCode))) {
    const cashAmount: Amount = transaction.movements[0].invoice != null
      ? {
          instrument: transaction.movements[0].invoice.instrument,
          sum: -transaction.movements[0].invoice.sum
        }
      : {
          instrument: product.account.instrument,
          sum: -transaction.movements[0].sum!
        }
    transaction.movements.push({
      id: null,
      account: {
        type: AccountType.cash,
        instrument: cashAmount.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: cashAmount.sum,
      fee: 0
    })
    return true
  }
  return false
}

function parsePOSPurchase (transaction: ExtendedTransaction, apiTransaction: unknown, product: ConvertedProduct): boolean {
  const description = getString(apiTransaction, 'description')
  if (description.match(/^POS -/) == null) {
    return false
  }
  let mcc: number | null = null

  const mccMatch = description.match(/MCC: (\d{4})/)
  if (mccMatch != null) {
    mcc = parseInt(mccMatch[1])
  }
  const merchantMatchDate = description.match(/POS - ([^,]+),.*\d+.\d* \w+, ([\w\d\s:]+),/)
  assert(merchantMatchDate != null, 'cant parse pos merchant and date', description, apiTransaction)
  const merchant = merchantMatchDate[1]
  const dateString = merchantMatchDate[2]

  transaction.date = parsePOSDateString(dateString)
  transaction.merchant = {
    city: null,
    country: null,
    location: null,
    mcc,
    title: merchant
  }
  return true
}

function parsePOSDateString (dateString: string): Date {
  const dateParts = dateString.trim().split(/\s+/)
  assert(dateParts.length === 4, 'cant parse pos date', dateString)
  const [month, date, year, time] = dateParts
  const [hours, minutes] = parsePOSTime(time)
  const isoString = `${year}-` +
    `${padStart(parsePOSMonth(month).toString(), 2, '0')}-` +
    `${padStart(date, 2, '0')}T` +
    `${padStart(hours.toString(), 2, '0')}:` +
    `${padStart(minutes.toString(), 2, '0')}:` +
    '00.000+04:00'
  return new Date(isoString)
}

function parsePOSTime (time: string): [number, number] {
  const timeMatch = time.match(/^(\d{1,2}):(\d{1,2})(PM|AM)$/)
  assert(timeMatch != null, 'cant parse pos time', time)
  const [hoursRaw, minutes, dayTime] = timeMatch.slice(1)
  let hours = hoursRaw
  if (hours === '12') {
    hours = '0'
  }
  if (dayTime === 'PM') {
    return [parseInt(hours) + 12, parseInt(minutes)]
  } else if (dayTime === 'AM') {
    return [parseInt(hours), parseInt(minutes)]
  } else {
    assert(false)
  }
}

function parsePOSMonth (month: string): number {
  switch (month) {
    case 'Jan':
      return 1
    case 'Feb':
      return 2
    case 'Mar':
      return 3
    case 'Apr':
      return 4
    case 'May':
      return 5
    case 'Jun':
      return 6
    case 'Jul':
      return 7
    case 'Aug':
      return 8
    case 'Sep':
      return 9
    case 'Oct':
      return 10
    case 'Nov':
      return 11
    case 'Dec':
      return 12
    default:
      assert(false, 'cant parse pos month', month)
  }
}
