import { convertAccount } from '../../../converters'

const apiAccounts = [
  [
    {
      account: {
        customerCode: '300274762',
        accountId: '40702810207500000123/044525000',
        status: 'Enabled',
        statusUpdateDateTime: '2018-11-14T06:02:03+00:00',
        currency: 'RUB',
        accountType: 'Business',
        accountSubType: 'CurrentAccount',
        registrationDate: '2016-12-14',
        accountDetails:
      [
        {
          schemeName: 'RU.CBR.AccountNumber',
          identification: '40702810207500000123/044525000',
          name: 'Счёт в банке Точка'
        }
      ]
      },
      balance: [
        {
          accountId: '40702810207500000123',
          creditDebitIndicator: 'Debit',
          type: 'OpeningAvailable',
          dateTime: '2022-09-15T06:43:24.188756+00:00',
          Amount: { amount: 100670.34, currency: 'RUB' }
        },
        {
          accountId: '40702810207500000123',
          creditDebitIndicator: 'Debit',
          type: 'ClosingAvailable',
          dateTime: '2022-09-15T06:43:24.188756+00:00',
          Amount: { amount: 100670.34, currency: 'RUB' }
        },
        {
          accountId: '40702810207500000123',
          creditDebitIndicator: 'Debit',
          type: 'Expected',
          dateTime: '2022-09-15T06:43:24.188756+00:00',
          Amount: { amount: 0, currency: 'RUB' }
        }
      ]
    },
    {
      balance: 100670.34,
      id: '40702810207500000123/044525000',
      instrument: 'RUB',
      syncID: [
        '40702810207500000123/044525000'
      ],
      title: 'Счёт в банке Точка',
      type: 'checking'
    }
  ],
  [
    {
      account: {
        customerCode: '300274763',
        accountId: '40802810907500000234/044525000',
        status: 'Enabled',
        statusUpdateDateTime: '2016-12-14T16:52:31+00:00',
        currency: 'RUB',
        accountType: 'Business',
        accountSubType: 'CurrentAccount',
        registrationDate: '2016-12-14',
        accountDetails:
        [
          {
            schemeName: 'RU.CBR.AccountNumber',
            identification: '40802810907500000234/044525000',
            name: 'Счёт в банке Точка'
          }
        ]
      },
      balance: [
        {
          accountId: '40802810907500000234',
          creditDebitIndicator: 'Debit',
          type: 'OpeningAvailable',
          dateTime: '2022-09-15T06:43:25.080033+00:00',
          Amount: { amount: 3126, currency: 'RUB' }
        },
        {
          accountId: '40802810907500000234',
          creditDebitIndicator: 'Debit',
          type: 'ClosingAvailable',
          dateTime: '2022-09-15T06:43:25.080033+00:00',
          Amount: { amount: 3126, currency: 'RUB' }
        },
        {
          accountId: '40802810907500000234',
          creditDebitIndicator: 'Debit',
          type: 'Expected',
          dateTime: '2022-09-15T06:43:25.080033+00:00',
          Amount: { amount: 0, currency: 'RUB' }
        }
      ]
    },
    {
      balance: 3126,
      id: '40802810907500000234/044525000',
      instrument: 'RUB',
      syncID: [
        '40802810907500000234/044525000'
      ],
      title: 'Счёт в банке Точка',
      type: 'checking'
    }
  ],
  [
    {
      account: {
        customerCode: '300274763',
        accountId: '40802840207500000345/044525000',
        status: 'Enabled',
        statusUpdateDateTime: '2021-02-08T22:07:14+00:00',
        currency: 'USD',
        accountType: 'Business',
        accountSubType: 'CurrentAccount',
        registrationDate: '2020-08-11',
        accountDetails:
      [
        {
          schemeName: 'RU.CBR.AccountNumber',
          identification: '40802840207500000345/044525000',
          name: 'Счёт в банке Точка'
        }
      ]
      },
      balance: [
        {
          accountId: '40802840207500000345',
          creditDebitIndicator: 'Debit',
          type: 'OpeningAvailable',
          dateTime: '2022-09-15T06:43:25.576947+00:00',
          Amount: { amount: 0, currency: 'USD' }
        },
        {
          accountId: '40802840207500000345',
          creditDebitIndicator: 'Debit',
          type: 'ClosingAvailable',
          dateTime: '2022-09-15T06:43:25.576947+00:00',
          Amount: { amount: 0, currency: 'USD' }
        },
        {
          accountId: '40802840207500000345',
          creditDebitIndicator: 'Debit',
          type: 'Expected',
          dateTime: '2022-09-15T06:43:25.576947+00:00',
          Amount: { amount: 0, currency: 'USD' }
        }
      ]
    },
    {
      balance: 0,
      id: '40802840207500000345/044525000',
      instrument: 'USD',
      syncID: [
        '40802840207500000345/044525000'
      ],
      title: 'Счёт в банке Точка',
      type: 'checking'
    }
  ],
  [
    {
      account: {
        customerCode: '301643962',
        accountId: '40802810001500161234/044525999',
        status: 'Enabled',
        statusUpdateDateTime: '2021-04-28T16:05:34+00:00',
        currency: 'RUB',
        accountType: 'Business',
        accountSubType: 'CurrentAccount',
        registrationDate: '2021-04-28',
        accountDetails:
          [{
            schemeName: 'RU.CBR.AccountNumber',
            identification: '40802810001500161234/044525999',
            name: 'Счёт в банке Точка'
          }]
      },
      balance: [
        {
          accountId: '40802810001500161234',
          creditDebitIndicator: 'Debit',
          type: 'OpeningAvailable',
          dateTime: '2022-09-16T17:23:35.647653+00:00',
          Amount: { amount: -25742.37, currency: 'RUB' }
        },
        {
          accountId: '40802810001500161234',
          creditDebitIndicator: 'Debit',
          type: 'ClosingAvailable',
          dateTime: '2022-09-16T17:23:35.647653+00:00',
          Amount: { amount: -26042.37, currency: 'RUB' }
        },
        {
          accountId: '40802810001500161234',
          creditDebitIndicator: 'Debit',
          type: 'Expected',
          dateTime: '2022-09-16T17:23:35.647653+00:00',
          Amount: { amount: 300, currency: 'RUB' }
        }
      ]
    },
    {
      balance: -26042.37,
      id: '40802810001500161234/044525999',
      instrument: 'RUB',
      syncID: [
        '40802810001500161234/044525999'
      ],
      title: 'Счёт в банке Точка',
      type: 'checking'
    }
  ]
]

describe('convertAccount', () => {
  it.each(apiAccounts)('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount.account, apiAccount.balance)).toEqual(account)
  })
})
