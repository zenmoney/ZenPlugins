import fetchMock from 'fetch-mock'

const fixture: { responses: unknown[] } = jest.requireActual('../__fixtures__/missing-card-details-157489.json')
const { fetchAccounts }: { fetchAccounts: (auth: unknown) => Promise<unknown[]> } = jest.requireActual('../api')
const { convertAccounts }: { convertAccounts: (accounts: unknown[]) => unknown } = jest.requireActual('../converters')

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('converts the complete account graph when the bank returns no additional card details', async () => {
  ;(global as { ZenMoney?: unknown }).ZenMoney = { features: {} }
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.get(/action=ACCOUNTS_INFO&/, { status: 200, body: fixture.responses[0] })
  fetchMock.get(/action=ACCOUNTS_ADDITIONAL_INFO&/, { status: 200, body: fixture.responses[1] })
  const accounts = await fetchAccounts({ accessToken: 'model-token', sessionCode: 'model-session' })
  expect(convertAccounts(accounts)).toEqual([
    {
      product: { productId: '57114377', productType: 'ccard' },
      accounts: [{
        id: '57114377',
        type: 'ccard',
        title: 'Visa Reward Virtual',
        instrument: 'KZT',
        syncIds: ['KZ901895537481043468', '3437'],
        savings: false,
        available: 308262.21,
        creditLimit: 500000,
        totalAmountDue: null,
        gracePeriodEndDate: new Date('2026-11-11T00:00:00+06:00'),
        virtual: true
      }]
    },
    {
      product: { productId: '40410587', productType: 'ccard' },
      accounts: [{
        id: '40410587',
        type: 'ccard',
        title: 'Visa SilverMonoCard Digital',
        instrument: 'KZT',
        syncIds: ['KZ131895537477208295', '5567'],
        savings: false,
        balance: 0
      }]
    },
    {
      product: { productId: '43938647', productType: 'loan' },
      accounts: [
        {
          id: '43938647',
          type: 'checking',
          title: 'Счет для погашения займа KZT',
          instrument: 'KZT',
          syncIds: ['KZ091895022464893919'],
          savings: false,
          balance: 131378.51
        },
        {
          id: '6060108',
          type: 'loan',
          title: 'Ипотека "Баспана-Хит"',
          instrument: 'KZT',
          syncIds: ['AF2/5354/F/L/361367'],
          balance: -9342119.32,
          startDate: new Date('2021-04-29T00:00:00+06:00'),
          startBalance: 13357500,
          capitalization: true,
          percent: 10.75,
          endDateOffset: 180,
          endDateOffsetInterval: 'month',
          payoffInterval: 'month',
          payoffStep: 1
        }
      ]
    }
  ])
  const log = JSON.stringify(debug.mock.calls)
  expect(log).not.toContain('IVANOV IVAN IVANOVICH')
  expect(log).not.toContain('<redacted-card-token>')
  expect(log).toContain('ACCOUNTS_ADDITIONAL_INFO')
  expect(log).toContain('308262.21')
})
