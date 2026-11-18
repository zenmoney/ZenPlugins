import fetchMock from 'fetch-mock'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const api = require('../api') as Record<string, () => Promise<unknown>>

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('masks owner names in each observed product response while retaining financial diagnostics', async () => {
  // mail_inbound 221805, apelsin-uz build 75, 2026-11-17, the four product endpoints below.
  // Projected to ownerName and fields needed to run existing converters; not conversion coverage.
  // Public-safe owner, account/card identifiers; model local access token and device state.
  const zenMoney: Partial<typeof ZenMoney> = { getData: (key: string) => key === 'apiAccessToken' ? 'model-access-secret' : 'model-device' }
  global.ZenMoney = zenMoney as typeof ZenMoney
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  const cases = [
    {
      endpoint: 'https://mobile.apelsin.uz/api/uzcard',
      load: 'getUzcardCards',
      body: {
        data: [
          {
            id: 1002,
            ownerName: 'TEST OWNER',
            balance: 56675522,
            currency: {
              uzscurrency: true,
              name: 'UZS',
              scale: 2
            },
            state: 'ACTIVE',
            pan: '561468******1001',
            type: 'UZCARD'
          }
        ]
      }
    },
    {
      endpoint: 'https://mobile.apelsin.uz/api/dbs/debit',
      load: 'getUzumVisaCards',
      body: {
        data: [
          {
            id: 1005,
            ownerName: 'TEST OWNER',
            balance: 20833700,
            currency: {
              uzscurrency: true,
              name: 'UZS',
              scale: 2
            },
            state: 'ACTIVE',
            pan: '416668******1002',
            type: 'UZUM_DEBIT_VISA'
          }
        ]
      }
    },
    {
      endpoint: 'https://mobile.apelsin.uz/api/wallet',
      load: 'getWallets',
      body: {
        data: [
          {
            id: 1007,
            ownerName: 'TEST OWNER',
            balance: 0,
            currency: {
              uzscurrency: true,
              name: 'UZS',
              scale: 2
            },
            account: '22616000000000001000'
          }
        ]
      }
    },
    {
      endpoint: 'https://mobile.apelsin.uz/api/account',
      load: 'getAccounts',
      body: {
        data: [
          {
            id: 1008,
            ownerName: 'TEST OWNER',
            balance: 0,
            currency: {
              uzscurrency: false,
              name: 'USD',
              scale: 2
            },
            account: '22616000000000001000'
          }
        ]
      }
    }
  ]
  for (const sample of cases) {
    fetchMock.get(sample.endpoint, { status: 200, body: sample.body })
    await api[sample.load]()
  }
  const output = JSON.stringify(debug.mock.calls)
  expect(output).not.toContain('TEST OWNER')
  expect(output).not.toContain('model-access-secret')
  const responses = debug.mock.calls.filter(([label]) => label === 'response').map(([, response]) => response.body)
  expect(responses).toEqual(cases.map(sample => ({ data: sample.body.data.map(row => ({ ...row, ownerName: '<string[10]>' })) })))
})
