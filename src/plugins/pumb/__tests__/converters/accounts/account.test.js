import { convertAccounts } from '../../../converters'

describe('convertAccounts: bank accounts', () => {
  it('merges duplicate API entities and returns final account/fetchParams links', () => {
    const links = convertAccounts({
      accounts: [{
        id: 101,
        type: 'CREDIT_CARD_ACCOUNT',
        iban: 'UA111111111111111111111111111',
        number: '26201111111111',
        currencyCode: 'UAH',
        balance: 305000,
        creditInfo: {
          ownMoney: 5000,
          useAmount: 2000,
          totalCreditLimit: 300000,
          paymentDueDate: '2026-09-01'
        },
        cards: [{ id: 'card-1', number: '535528******1234' }]
      }, {
        id: 101,
        type: 'CREDIT_CARD_ACCOUNT',
        iban: 'UA111111111111111111111111111',
        number: '26201111111111',
        currencyCode: 'UAH',
        balance: 305000,
        creditInfo: {
          ownMoney: 5000,
          useAmount: 2000,
          totalCreditLimit: 300000,
          paymentDueDate: '2026-09-01'
        },
        cards: [{ id: 'card-2', number: '431414******5678' }]
      }],
      deposits: [],
      loans: []
    })

    expect(links).toEqual([{
      account: {
        id: 'account:101',
        type: 'ccard',
        title: '*1234',
        instrument: 'UAH',
        syncIds: [
          'UA111111111111111111111111111',
          '26201111111111',
          '535528******1234',
          '431414******5678'
        ],
        balance: 30,
        creditLimit: 3000,
        totalAmountDue: 20,
        gracePeriodEndDate: new Date('2026-08-31T21:00:00.000Z')
      },
      fetchParams: { sources: [{ type: 'account', accountIds: [101] }] }
    }])
  })

  it('uses checking for a non-card current account', () => {
    const [link] = convertAccounts({
      accounts: [{
        id: 102,
        type: 'CURRENT_ACCOUNT',
        iban: 'UA222222222222222222222222222',
        number: '26202222222222',
        currencyCode: 'USD',
        balance: 12345,
        overdraftFlag: false,
        cards: []
      }],
      deposits: [],
      loans: []
    })

    expect(link.account).toMatchObject({
      id: 'account:102',
      type: 'checking',
      instrument: 'USD',
      balance: 123.45,
      syncIds: ['UA222222222222222222222222222', '26202222222222']
    })
  })

  it('adds only one technical fallback when natural identifiers collide', () => {
    const links = convertAccounts({
      accounts: [{
        id: 101,
        type: 'CURRENT_ACCOUNT',
        iban: 'UA333333333333333333333333333',
        currencyCode: 'UAH',
        balance: 0,
        cards: []
      }, {
        id: 102,
        type: 'CURRENT_ACCOUNT',
        iban: 'UA333333333333333333333333333',
        currencyCode: 'UAH',
        balance: 0,
        cards: []
      }],
      deposits: [],
      loans: []
    })

    expect(links).toHaveLength(1)
    expect(links[0].accounts.map(account => account.syncIds)).toEqual([
      ['pumb-account:101'],
      ['pumb-account:102']
    ])
    expect(links[0].fetchParams).toEqual({
      sources: [{ type: 'account', accountIds: [101, 102] }]
    })
  })
})
