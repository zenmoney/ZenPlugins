import { parseTransactionDate, parseTransactions, processTransactions } from './converters'
import { AccountHelper } from './helpers'

const ACCOUNT1 = '123400001'
const ACCOUNT2 = '123400701'
const ACCOUNT_USD = '123400002'
const accountHelper1 = () =>
  new AccountHelper([
    {
      id: ACCOUNT1,
      title: 'account',
      instrument: 'AMD'
    },
    {
      id: ACCOUNT2,
      title: 'card',
      instrument: 'AMD'
    },
    {
      id: ACCOUNT_USD,
      title: 'account usd',
      instrument: 'USD'
    }
  ])
const getTransaction = data => ({
  _fromAccount: ACCOUNT1,
  comment: '',
  date: 1612787065000,
  id: '123',
  income: 30000,
  incomeAccount: ACCOUNT1,
  outcome: 30000,
  outcomeAccount: ACCOUNT2,
  payee: 'transfer',
  ...(data || {})
})

describe('parseTransactions', () => {
  /** @var {AccountHelper} helper */
  let helper

  const csv1 = `,,,,,,,This document was printed from InecoOnline System,
,,,,,,,09/02/2021,
Account Statement,,,,,,,,
Client,,,ANTON KARPOV,,,,,
Account Number,,,123400001,,,,,
Currency,,,AMD,,,,,
Period,,,[09/01/2021] - [09/02/2021],,,,,
n/n,Number,Date,Currency,Income,Expense,Receiver/Payer Account,Receiver/Payer,Details
149709453,498536382,08/02/2021,AMD,"30,000.00",.00,123400701,transfer,"int, trans, InecoOnline, 08/02/2021 12:24:25"
149530002,498277410,05/02/2021,AMD,"49,733.70",.00,123400701,transfer,"int, trans, InecoOnline, 05/02/2021 18:43:09"
`
  const csv2 = `,,,,,,,This document was printed from InecoOnline System,
148236962,495501315,29/01/2021,AMD,.00,"779,890.10",123400002,transfer,"int, trans 779890.10 AMD / 521 = 1496.91 USD, InecoOnline, 29/01/2021 13:35:32"
`
  beforeEach(() => {
    helper = accountHelper1()
  })

  it('should convert transactions', () => {
    const result = parseTransactions(helper, helper.account(ACCOUNT1), csv1)

    expect(result).toEqual([{
      _fromAccount: ACCOUNT1,
      comment: 'int, trans, InecoOnline, 08/02/2021 12:24:25',
      date: new Date(1612787065000),
      id: '498536382',
      income: 30000,
      incomeAccount: ACCOUNT1,
      outcome: 30000,
      outcomeAccount: ACCOUNT2,
      payee: 'transfer'
    }, {
      _fromAccount: '123400001',
      comment: 'int, trans, InecoOnline, 05/02/2021 18:43:09',
      date: new Date(1612550589000),
      id: '498277410',
      income: 49733.7,
      incomeAccount: ACCOUNT1,
      outcome: 49733.7,
      outcomeAccount: ACCOUNT2,
      payee: 'transfer'
    }])
  })

  it('should convert transactions with currency exchange', () => {
    const result = parseTransactions(helper, helper.account(ACCOUNT1), csv2)

    expect(result).toEqual([{
      _fromAccount: ACCOUNT1,
      comment: 'int, trans 779890.10 AMD / 521 = 1496.91 USD, InecoOnline, 29/01/2021 13:35:32',
      date: new Date(1611927332000),
      id: '495501315',
      income: 1496.91,
      incomeAccount: ACCOUNT_USD,
      outcome: 779890.10,
      outcomeAccount: ACCOUNT1,
      opOutcome: 1496.91,
      opOutcomeInstrument: 'USD',
      payee: 'transfer'
    }])
  })
})

describe('processTransactions', () => {
  let helper

  beforeEach(() => {
    helper = accountHelper1()
  })

  it('removes duplicated transactions', () => {
    const result = processTransactions(helper, [
      getTransaction(),
      getTransaction()
    ])

    expect(result).toEqual([getTransaction()])
  })
})

describe('parseTransactionDate', () => {
  it('get date from details', () => {
    const result = parseTransactionDate('some text 17/03/2020 14:13:12 with date', '')

    expect(result).toEqual(new Date(2020, 2, 17, 14, 13, 12))
  })

  it('get date from date with dots', () => {
    const result = parseTransactionDate('some text 1703/2020 14:13:12 with date', '04.05.2019')

    expect(result).toEqual(new Date(2019, 4, 4))
  })

  it('get date from date with dots', () => {
    const result = parseTransactionDate('some text 17/03/202014:13:12 with date', '04/04/2019')

    expect(result).toEqual(new Date(2019, 3, 4))
  })
})
