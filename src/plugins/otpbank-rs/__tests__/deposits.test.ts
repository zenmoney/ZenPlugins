import fetchMock from 'fetch-mock'
import { adjustTransactions } from '../../../common/transactionGroupHandler'
import { ZPAPIError } from '../../../errors'
import { getString } from '../../../types/get'
import { AccountType, ExtendedTransaction } from '../../../types/zenmoney'
import { ConvertResult } from '../models'
import { fetchAllAccounts, fetchProductTransactions } from '../fetchApi'
import { convertAccounts, convertTransaction, mergeTransactionsByMovementId } from '../converters'
import { parseAccounts, parseTransactions } from '../parsers'

// Authorized browser reproduction, 2026-10-18; complete sanitized records and source metadata.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixture = require('../__fixtures__/deposit-opening.json') as {
  accounts: string[][]
  depositTurnover: string[][][][]
  checkingTurnover: string[][][][]
  rejectedTurnover: Record<string, string>
}
const baseUrl = 'https://ebank.otpbanka.rs/RetailV4/Protected/Services/DataService.svc/'
const depositUrl = baseUrl + 'GetTimeDepositAccountTurnoverOTPV4'
const checkingUrl = baseUrl + 'GetTransactionalAccountTurnover'
const session = { login: 'fixture-user', auth: { cookieHeader: '' } }
const fromDate = new Date(2026, 8, 20)
const toDate = new Date(2026, 9, 18)
const plans = (): ConvertResult[] => convertAccounts(parseAccounts(fixture.accounts))
const depositTitle = 'Otvaranje partije dinarske štednje - dugoročni ulozi'

beforeEach(() => {
  global.ZenMoney = { getData: jest.fn().mockReturnValue(''), setData: jest.fn(), saveData: jest.fn() } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('ACCOUNT-002/003/004: preserves the complete account graph, product codes and a stable deposit identity', async () => {
  fetchMock.post(baseUrl + 'GetAllAccountBalance', { status: 200, body: fixture.accounts })
  const result = convertAccounts(await fetchAllAccounts(session))
  expect(result).toEqual([
    {
      account: { id: '325000000000000101', type: AccountType.ccard, title: 'Tekući računi fizičkih lica u RSD', instrument: 'RSD', balance: 1000, creditLimit: 0, syncIds: ['325000000000000101'] },
      products: [{ id: '325000000000000101', source: 'accountTurnover', accountNumber: '325000000000000101', productCodeCore: '1', currencyCodeNumeric: '941' }]
    },
    {
      account: { id: '325000000000000201', type: AccountType.ccard, title: 'Tekući računi fizičkih lica u EUR', instrument: 'EUR', balance: 49, creditLimit: 0, syncIds: ['325000000000000201'] },
      products: [{ id: '325000000000000201', source: 'accountTurnover', accountNumber: '325000000000000201', productCodeCore: '4', currencyCodeNumeric: '978' }]
    },
    {
      account: { id: '325000000000000301', type: AccountType.ccard, title: 'Oročeni depozit - isplata kamate po isteku roka - 6m u RSD', instrument: 'RSD', balance: 100000, creditLimit: 0, savings: true, syncIds: ['325000000000000301'] },
      products: [{ id: '325000000000000301', source: 'depositTurnover', accountNumber: '325000000000000301', productCodeCore: '3', currencyCodeNumeric: '941' }]
    }
  ])
})

it('uses the deposit endpoint, product code and grid and converts every observed transaction field', async () => {
  fetchMock.post(depositUrl, { status: 200, body: fixture.depositTurnover })
  const { account, products } = plans()[2]
  const transactions = await fetchProductTransactions(session, products[0], 'RSD', fromDate, toDate)
  expect(JSON.parse(getString(fetchMock.lastOptions(depositUrl), 'body'))).toEqual({
    accountNumber: '325000000000000301',
    productCoreID: '3',
    filterParam: { CurrencyCodeNumeric: '941', FromDate: '20.09.2026', ToDate: '18.10.2026', ItemType: '', ItemCount: '', FromAmount: 0, ToAmount: 0, Description: '' },
    gridName: 'RetailAccountTurnoverTimeDepositDomesticPreviewMasterDetail-L'
  })
  expect(transactions).toEqual([{
    source: 'depositTurnover',
    id: 'FOV00000000001',
    date: new Date(2026, 9, 5),
    amount: 100000,
    currencyCode: 'RSD',
    currencyCodeNumeric: '941',
    title: depositTitle,
    bookingDate: '05.10.2026 00:00:00',
    status: 'Izvršen',
    merchant: ''
  }])
  expect(convertTransaction(transactions[0], account)).toEqual({
    date: new Date(2026, 9, 5),
    hold: false,
    movements: [{ id: '325000000000000301_FOV00000000001', account: { id: '325000000000000301' }, sum: 100000, fee: 0, invoice: null }],
    merchant: null,
    comment: depositTitle,
    groupKeys: [`deposit|325000000000000301|RSD|${new Date(2026, 9, 5).getTime()}|100000`]
  })
  expect(fetchMock.calls(checkingUrl)).toHaveLength(0)
})

it('[model] preserves the actual EUR product code instead of sending the former hardcoded value', async () => {
  // The recorded RSD response is not interpreted here; this model verifies request routing only.
  fetchMock.post(checkingUrl, { status: 200, body: fixture.checkingTurnover })
  await fetchProductTransactions(session, plans()[1].products[0], 'EUR', fromDate, toDate)
  const request = JSON.parse(getString(fetchMock.lastOptions(checkingUrl), 'body')) as Record<string, unknown>
  expect(request.productCoreID).toBe('4')
  expect(fetchMock.calls(depositUrl)).toHaveLength(0)
})

it('TRANSFER-002/003/004: groups the two recorded opening movements once with stable IDs', async () => {
  fetchMock.post(depositUrl, { status: 200, body: fixture.depositTurnover })
  const accounts = plans().map(({ account }) => account)
  const incoming = await fetchProductTransactions(session, plans()[2].products[0], 'RSD', fromDate, toDate)
  const outgoing = parseTransactions(fixture.checkingTurnover[0][1])
  const transactions = [
    convertTransaction(outgoing[0], accounts[0], accounts),
    convertTransaction(incoming[0], accounts[2], accounts)
  ]
  const expected = [{
    date: new Date(2026, 9, 5),
    hold: false,
    movements: [
      { id: '325000000000000101_FOV00000000002', account: { id: '325000000000000101' }, sum: -100000, fee: 0, invoice: null },
      { id: '325000000000000301_FOV00000000001', account: { id: '325000000000000301' }, sum: 100000, fee: 0, invoice: null }
    ],
    merchant: null,
    comment: 'Prenos na partiju oročenog depozita 0000000000003'
  }]
  const group = (items: typeof transactions): ExtendedTransaction[] => adjustTransactions({ transactions: mergeTransactionsByMovementId(items) })
  expect(group(transactions)).toEqual(expected)
  expect(group([...transactions].reverse())).toEqual(expected)
  expect(group([...transactions, ...transactions])).toEqual(expected)
})

it('TRANSFER-001: leaves the recorded debit one-sided when deposit history is skipped or outside the interval', () => {
  const accounts = plans().map(({ account }) => account)
  const outgoing = parseTransactions(fixture.checkingTurnover[0][1])[0]
  const converted = convertTransaction(outgoing, accounts[0], accounts)
  expect(adjustTransactions({ transactions: [converted] })).toEqual([{
    date: new Date(2026, 9, 5),
    hold: false,
    movements: [{ id: '325000000000000101_FOV00000000002', account: { id: '325000000000000101' }, sum: -100000, fee: 0, invoice: null }],
    merchant: null,
    comment: 'Prenos na partiju oročenog depozita 0000000000003'
  }])
})

it('keeps the recorded product rejection reportable instead of returning partial data or a temporary outage', async () => {
  // Replay the observed rejection against its observed endpoint and request shape.
  fetchMock.post(checkingUrl, { status: 400, body: fixture.rejectedTurnover })
  const product = { ...plans()[2].products[0], source: 'accountTurnover' as const, productCodeCore: '1' }
  const error: unknown = await fetchProductTransactions(session, product, 'RSD', fromDate, toDate).catch(error => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(String(error)).toContain('Err_96460/2')
})

it('[model] propagates deposit transport errors unchanged', async () => {
  // This invariant must hold for every history source without successful partial results.
  const error = new Error('connection failed')
  fetchMock.post(depositUrl, { throws: error })
  await expect(fetchProductTransactions(session, plans()[2].products[0], 'RSD', fromDate, toDate)).rejects.toBe(error)
})
