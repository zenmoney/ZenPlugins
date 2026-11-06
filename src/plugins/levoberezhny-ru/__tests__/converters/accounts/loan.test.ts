import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts, convertLoanTransactions, convertTransactions } from '../../../converters'
import { groupTransactions } from '../../../transfers'

// Complete loanList records and getCreditSchedule responses captured 2026-11-03
// from the two closed consumer loans; identifiers and names sanitized consistently.
// The accounts graph is the same captured graph as accounts.json.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const loans = require('../../fixtures/loans.json') as Array<{ loan: unknown, schedule: unknown }>
// eslint-disable-next-line @typescript-eslint/no-var-requires
const graph = require('../../fixtures/accounts.json') as { accounts: unknown[] }
// Complete selected 2018-05-10 principal and interest operation records from
// loan-2018-all-payment-records.json; response projection is documented there.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const payment = require('../../fixtures/loan-payment-2018.json') as unknown[]
// Complete selected 2019-08-10 principal and unrelated phone-transfer records;
// loan-2018-august-and-alias.json records their projected two-page provenance.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const augustRecords = require('../../fixtures/loan-august-2019.json') as unknown[]
// Complete sanitized active mortgage, repayment account, schedule and selected
// full pfmTape operation records captured through the web client 2026-11-05.
// The 28 operations are every record in the one-year response that explicitly
// names this contract; the source response also contained 20 unrelated records.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mortgage = require('../../fixtures/active-mortgage.json') as { loan: unknown, repaymentAccount: unknown, schedule: unknown, operations: unknown[] }

function withoutRepaymentAccount (loan: unknown, id = 820001): Record<string, unknown> {
  return {
    ...(loan as Record<string, unknown>),
    id,
    repayAccountId: null,
    repayAccount: null,
    outstandingDebt: { ...((loan as { outstandingDebt: Record<string, unknown> }).outstandingDebt), repayAccountBalance: null }
  }
}

it('converts both closed loans without using repayment accounts as their identity', () => {
  const plans = convertAccounts({ accounts: graph.accounts, deposits: [], loans })
  const loanPlans = plans.filter(plan => plan.account.type === AccountType.loan)
  expect(loanPlans.map(plan => plan.account)).toEqual([
    {
      id: 'LN_810002',
      type: AccountType.loan,
      title: 'ЛББ. Кредит по программе "Хит-Кредит Зарплатник"',
      instrument: 'RUB',
      syncIds: ['000010000002/1150'],
      balance: 0,
      archived: true,
      startDate: new Date('2021-10-11T17:00:00.000Z'),
      startBalance: 500000,
      percent: 12.5,
      capitalization: true,
      endDateOffsetInterval: 'year',
      endDateOffset: 5,
      payoffInterval: 'month',
      payoffStep: 1
    },
    {
      id: 'LN_810001',
      type: AccountType.loan,
      title: 'ЛББ. Кредит по программе "Хит-Кредит Зарплатник"',
      instrument: 'RUB',
      syncIds: ['000010000001/1150'],
      balance: 0,
      archived: true,
      startDate: new Date('2018-04-09T17:00:00.000Z'),
      startBalance: 500000,
      percent: 12.9,
      capitalization: true,
      endDateOffsetInterval: 'year',
      endDateOffset: 5,
      payoffInterval: 'month',
      payoffStep: 1
    }
  ])
  expect(loanPlans.map(plan => plan.fetchParams)).toEqual([
    { accountId: '810002', historyAvailable: false }, { accountId: '810001', historyAvailable: false }
  ])
  expect(plans.filter(plan => plan.account.syncIds.includes('40817810000000000001'))).toHaveLength(1)
})

it('converts the observed active mortgage and its linked repayment account', () => {
  const plans = convertAccounts({ accounts: [mortgage.repaymentAccount], deposits: [], loans: [{ loan: mortgage.loan, schedule: mortgage.schedule }] })
  expect(plans.map(plan => plan.account)).toEqual([
    {
      id: '920001',
      type: AccountType.checking,
      title: 'Ипо',
      instrument: 'RUB',
      syncIds: ['40817810000000000001'],
      balance: 11147.04,
      archived: false
    },
    {
      id: 'LN_820001',
      type: AccountType.loan,
      title: 'ЛББ_Ипотека. Зарплатный (новый)',
      instrument: 'RUB',
      syncIds: ['ЗП00001-20'],
      balance: -2517275.4,
      archived: false,
      startDate: new Date('2020-07-23T17:00:00.000Z'),
      startBalance: 4050000,
      percent: 9.7,
      capitalization: true,
      endDateOffsetInterval: 'year',
      endDateOffset: 20,
      payoffInterval: 'month',
      payoffStep: 1
    }
  ])
  expect(plans[1].fetchParams).toEqual({ accountId: '820001', historyAvailable: false })
})

it('recognizes a supported active loan contract independently of its product category', () => {
  const loan = {
    ...(mortgage.loan as Record<string, unknown>),
    productName: 'ЛББ. Автомобильный кредит',
    loanPurpose: 'Автокредит'
  }
  const plans = convertAccounts({ accounts: [mortgage.repaymentAccount], deposits: [], loans: [{ loan, schedule: mortgage.schedule }] })
  expect(plans.find(plan => plan.account.type === AccountType.loan)?.account.title).toBe('ЛББ. Автомобильный кредит')
})

it('keeps confirmed debt without inventing a missing rate or contract number', () => {
  const loan = {
    ...(mortgage.loan as Record<string, unknown>),
    interestRate: null,
    displayNumber: null
  }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan, schedule: mortgage.schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({
    id: 'LN_820001',
    syncIds: ['820001'],
    balance: -2517275.4,
    percent: null
  }))
})

it('preserves a bank-confirmed loan term that is not a whole number of years', () => {
  const source = loans[0].loan as Record<string, unknown>
  const loan = {
    ...source,
    maturityDate: new Date('2023-04-11T17:00:00.000Z').getTime(),
    maturityDateS: '12.04.2023'
  }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan, schedule: loans[0].schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({
    id: 'LN_810002',
    endDateOffsetInterval: 'month',
    endDateOffset: 18
  }))
})

it('supports an active loan without a repayment-account relationship and skips only incompatible debt state', () => {
  const loanWithoutRepaymentAccount = withoutRepaymentAccount(mortgage.loan, 830002)
  const overdue = {
    ...(mortgage.loan as Record<string, unknown>),
    id: 830003,
    outstandingDebt: { ...((mortgage.loan as { outstandingDebt: Record<string, unknown> }).outstandingDebt), penaltyAmount: 1 }
  }
  const plans = convertAccounts({
    accounts: [],
    deposits: [],
    loans: [
      { loan: mortgage.loan, schedule: mortgage.schedule },
      { loan: loanWithoutRepaymentAccount, schedule: mortgage.schedule },
      { loan: overdue, schedule: mortgage.schedule }
    ]
  })
  expect(plans.filter(plan => plan.account.type === AccountType.loan).map(plan => plan.account.id)).toEqual(['LN_820001', 'LN_830002'])
})

it('[model] keeps a previously discovered mortgage as the same archived loan after closure', () => {
  const sourceLoan = mortgage.loan as { outstandingDebt: Record<string, unknown>, maturityDate: number, maturityDateS: string }
  const sourceSchedule = mortgage.schedule as { schedules: Array<Record<string, unknown>>, loanScheduleAmounts: unknown }
  const loan = {
    ...sourceLoan,
    closeDate: sourceLoan.maturityDate,
    closeDateS: sourceLoan.maturityDateS,
    outstandingDebt: {
      ...sourceLoan.outstandingDebt,
      amount: 0,
      principalAmount: 0,
      interestAmount: 0,
      monthInterestAmount: 0,
      repayAccountBalance: 0
    }
  }
  const schedule = { ...sourceSchedule, schedules: sourceSchedule.schedules.map(row => ({ ...row, actual: true })) }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan, schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({ id: 'LN_820001', type: AccountType.loan, balance: 0, archived: true }))
  expect(() => convertLoanTransactions(schedule, plan.account, plan.account.type === AccountType.loan ? plan.account.startDate : new Date(NaN))).not.toThrow()
})

it('imports only completed mortgage rows and reconciles the current principal', () => {
  const plan = convertAccounts({ accounts: [mortgage.repaymentAccount], deposits: [], loans: [{ loan: mortgage.loan, schedule: mortgage.schedule }] })[1]
  const transactions = convertLoanTransactions(plan.loanSchedule, plan.account, plan.account.type === AccountType.loan ? plan.account.startDate : new Date(NaN))
  const rows = (mortgage.schedule as { schedules: Array<{ actual: boolean, principalAmount: number, interestAmount: number, chargesAmount: number }> }).schedules.filter(row => row.actual)
  const expectedCount = 1 + rows.reduce((count, row) => count + (row.principalAmount > 0 ? 1 : 0) + (row.interestAmount > 0 ? 2 : 0) + (row.chargesAmount > 0 ? 2 : 0), 0)
  expect(transactions).toHaveLength(expectedCount)
  expect(new Set(transactions.flatMap(transaction => transaction.movements.map(movement => movement.id))).size).toBe(expectedCount)
  expect(transactions.flatMap(transaction => transaction.movements).reduce((sum, movement) => sum + (movement.sum ?? 0), 0)).toBeCloseTo(-2517275.4, 2)
  expect(transactions.filter(transaction => transaction.date.toISOString() === '2020-07-23T17:00:00.000Z').map(transaction => transaction.movements[0].sum)).toEqual([-4050000])
  expect(transactions.filter(transaction => transaction.date.toISOString() === '2020-07-23T21:00:00.000Z').map(transaction => transaction.movements[0].sum)).toEqual([5000, -5000])
  expect(transactions.filter(transaction => transaction.date.toISOString() === '2026-06-23T21:00:00.000Z').map(transaction => transaction.movements[0].sum)).toEqual([67609.82, 23785.18, -23785.18])
  expect(transactions.some(transaction => transaction.date.toISOString() === '2026-11-23T21:00:00.000Z')).toBe(false)
  expect(convertLoanTransactions(plan.loanSchedule, plan.account, plan.account.type === AccountType.loan ? plan.account.startDate : new Date(NaN))).toEqual(transactions)
})

it('does not require future schedule rows for an active loan with confirmed terms and debt', () => {
  const source = mortgage.schedule as { schedules: Array<Record<string, unknown>> }
  const schedule = { schedules: source.schedules.filter(row => row.actual === true) }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan: mortgage.loan, schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({ id: 'LN_820001', balance: -2517275.4, archived: false }))
  expect(plan.loanSchedule).toEqual(schedule)
})

it('does not invent monthly repayment terms when no schedule is available', () => {
  const loan = { ...(mortgage.loan as Record<string, unknown>), hasSchedule: false }
  expect(convertAccounts({ accounts: [], deposits: [], loans: [{ loan, schedule: null }] })).toEqual([])
})

it('keeps a bank-active loan with confirmed zero principal until the bank closes it', () => {
  const source = mortgage.loan as { outstandingDebt: Record<string, unknown> }
  const loan = {
    ...source,
    outstandingDebt: { ...source.outstandingDebt, principalAmount: 0 }
  }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan, schedule: mortgage.schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({ id: 'LN_820001', balance: 0, archived: false }))
  expect(plan.loanSchedule).toBeUndefined()
})

it('keeps the confirmed loan account but omits all history when a completed row does not reconcile', () => {
  const source = mortgage.schedule as { schedules: Array<Record<string, unknown>> }
  let changed = false
  const schedule = {
    schedules: source.schedules.map(row => {
      if (changed || row.actual !== true) return row
      changed = true
      return { ...row, amount: Number(row.amount) + 1 }
    })
  }
  const plan = convertAccounts({ accounts: [], deposits: [], loans: [{ loan: mortgage.loan, schedule }] })[0]
  expect(plan.account).toEqual(expect.objectContaining({ id: 'LN_820001', balance: -2517275.4 }))
  expect(plan.loanSchedule).toBeUndefined()
})

it('groups every selected repayment-account debit with the matching completed mortgage movement', () => {
  const plans = convertAccounts({ accounts: [mortgage.repaymentAccount], deposits: [], loans: [{ loan: mortgage.loan, schedule: mortgage.schedule }] })
  const repayment = plans[0].account
  const loan = plans[1]
  const from = new Date('2025-11-04T21:00:00.000Z')
  const accounts = plans.map(plan => plan.account)
  const grouped = groupTransactions([
    ...convertTransactions(mortgage.operations, repayment, from, undefined, accounts, mortgage.operations),
    ...convertLoanTransactions(loan.loanSchedule, loan.account, from)
  ])
  const withRepayment = grouped.filter(transaction => transaction.movements.some(movement => 'id' in movement.account && movement.account.id === repayment.id))
  expect(withRepayment).toHaveLength(28)
  expect(withRepayment.every(transaction => transaction.movements.length === 2 && transaction.movements.some(movement => 'id' in movement.account && movement.account.id === loan.account.id))).toBe(true)
  expect(grouped).toHaveLength(40)
})

it('groups account debits by contract even when the loan has no repayment-account relationship', () => {
  const plans = convertAccounts({
    accounts: [mortgage.repaymentAccount],
    deposits: [],
    loans: [{ loan: withoutRepaymentAccount(mortgage.loan), schedule: mortgage.schedule }]
  })
  const repayment = plans[0].account
  const loan = plans[1]
  const from = new Date('2025-11-04T21:00:00.000Z')
  const grouped = groupTransactions([
    ...convertTransactions(mortgage.operations, repayment, from, undefined, plans.map(plan => plan.account), mortgage.operations),
    ...convertLoanTransactions(loan.loanSchedule, loan.account, from)
  ])
  const withRepayment = grouped.filter(transaction => transaction.movements.some(movement => 'id' in movement.account && movement.account.id === repayment.id))
  expect(withRepayment).toHaveLength(28)
  expect(withRepayment.every(transaction => transaction.movements.length === 2 && transaction.movements.some(movement => 'id' in movement.account && movement.account.id === loan.account.id))).toBe(true)
})

it('groups confirmed account debits with the completed payment and leaves interest as one expense', () => {
  const plans = convertAccounts({ accounts: graph.accounts, deposits: [], loans })
  const current = plans.find(plan => plan.account.id === '900002')?.account
  const loan = plans.find(plan => plan.account.id === 'LN_810001')
  if (current == null || loan == null) throw new Error('Missing converted loan relationship')
  const from = new Date('2018-05-09T17:00:00Z')
  const to = new Date('2018-05-10T17:00:00Z')
  const accounts = plans.map(plan => plan.account)
  const grouped = groupTransactions([
    ...convertTransactions(payment, current, from, to, accounts, payment),
    ...convertLoanTransactions(loan.loanSchedule, loan.account, from, to)
  ])
  expect(grouped).toHaveLength(3)
  expect(grouped.map(transaction => transaction.movements.map(movement => movement.sum))).toEqual([
    [-5301.37, 5301.37], [-6049.63, 6049.63], [-5301.37]
  ])
})

it('keeps the unrelated 40000 transfer distinct from the unmatched loan reduction', () => {
  const plans = convertAccounts({ accounts: graph.accounts, deposits: [], loans })
  const current = plans.find(plan => plan.account.id === '900002')?.account
  const loan = plans.find(plan => plan.account.id === 'LN_810001')
  if (current == null || loan == null) throw new Error('Missing converted loan relationship')
  const from = new Date('2019-08-09T21:00:00Z')
  const to = new Date('2019-08-10T21:00:00Z')
  const transactions = groupTransactions([
    ...convertTransactions(augustRecords, current, from, to, plans.map(plan => plan.account), augustRecords),
    ...convertLoanTransactions(loan.loanSchedule, loan.account, from, to)
  ])
  expect(transactions).toHaveLength(5)
  expect(transactions.flatMap(transaction => transaction.movements.map(movement => [movement.id, movement.sum]))).toEqual([
    ['880003', -40000], ['880004', -8714.02],
    ['LN_810001:2019-08-10:principal', 48714.02],
    ['LN_810001:2019-08-10:interest-payment', 2636.98],
    ['LN_810001:2019-08-10:interest-expense', -2636.98]
  ])
})

it('converts completed principal and interest once with stable IDs and no invented repayment-account debit', () => {
  const plans = convertAccounts({ accounts: graph.accounts, deposits: [], loans }).filter(plan => plan.account.type === AccountType.loan)
  const from = new Date('2018-01-01T00:00:00Z')
  const transactions = plans.flatMap(plan => convertLoanTransactions(plan.loanSchedule, plan.account, from))
  expect(transactions).toHaveLength(113)
  expect(new Set(transactions.flatMap(transaction => transaction.movements.map(movement => movement.id))).size).toBe(113)
  expect(transactions.flatMap(transaction => transaction.movements).reduce((sum, movement) => sum + (movement.sum ?? 0), 0)).toBeCloseTo(0, 2)
  for (const plan of plans) {
    if (plan.account.type !== AccountType.loan) throw new Error('Expected loan account')
    const movements = convertLoanTransactions(plan.loanSchedule, plan.account, from)
    const finalBalance = movements.flatMap(transaction => transaction.movements).reduce((sum, movement) => sum + (movement.sum ?? 0), 0)
    expect(finalBalance).toBeCloseTo(0, 2)
    expect(movements[0]).toMatchObject({
      date: plan.account.startDate,
      comment: 'Выдача кредита',
      movements: [{ id: `${plan.account.id}:opening:principal`, sum: -500000 }]
    })
  }
  const august = transactions.filter(transaction => transaction.date.toISOString() === '2019-08-09T21:00:00.000Z')
  expect(august.map(transaction => transaction.movements[0].sum)).toEqual([48714.02, 2636.98, -2636.98])
  expect(august.every(transaction => 'id' in transaction.movements[0].account && transaction.movements[0].account.id === 'LN_810001')).toBe(true)
  expect(plans.flatMap(plan => convertLoanTransactions(plan.loanSchedule, plan.account, from))).toEqual(transactions)
  const period = convertLoanTransactions(plans[0].loanSchedule, plans[0].account, new Date('2022-07-11T21:00:00Z'), new Date('2022-07-11T21:00:00Z'))
  expect(period.map(transaction => transaction.movements[0].sum)).toEqual([206627.51, 4621.49, -4621.49])
})
