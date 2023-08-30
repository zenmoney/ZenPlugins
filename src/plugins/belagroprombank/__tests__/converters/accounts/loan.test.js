import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        deposits: [],
        cards: [],
        current: [],
        loans: [{
          internalAccountId: '2088420',
          currency: '933',
          agreementDate: 1596142800000,
          openDate: 1596142800000,
          endDate: 1688072400000,
          accountNumber: '2088420',
          productCode: '3337',
          productName: 'Онлайн Кредит на приобретение товаров в ИМ - 36 мес.',
          contractId: '457677588',
          rkcCode: '964',
          personalizedName: 'PS4Pro',
          percentRate: 18.41,
          residualAmount: '987',
          plannedEndDate: 1598734800000,
          amountInitial: 1032,
          status: 'OPEN',
          currencyCode: '933',
          passportKey: '594',
          creditHolderName: 'Николаев Н. Н.',
          overdraftLimit: 1032,
          docBanPayments: 0
        }]
      },
      [
        {
          mainProduct: {
            type: 'credit',
            accountType: '3337',
            bankCode: '964',
            currencyCode: '933',
            internalAccountId: '2088420',
            rkcCode: '964'
          },
          account: {
            id: '2088420',
            type: 'loan',
            title: 'Онлайн Кредит на приобретение товаров в ИМ - 36 мес.',
            instrument: 'BYN',
            syncID: [
              '2088420'
            ],
            balance: -987,
            startBalance: 1032,
            startDate: new Date(1596142800000),
            percent: 18.41,
            capitalization: true,
            endDateOffsetInterval: 'month',
            endDateOffset: 35,
            payoffInterval: 'month',
            payoffStep: 1
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
