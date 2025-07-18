import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product:
            {
              productId: '504/89675',
              productType: 'CREDIT',
              productCurrency: 'UAH'
            },
          creditAmount: 48897185,
          name: 'Кредит',
          iban: 'UA573003460000026207000005240',
          totalDebt: 29074055,
          commissionAmount: 0,
          repaymentDebt: 29424559,
          overdueDebt: 0,
          nextPayment: 570761,
          nextPaymentDate: '2022-06-10',
          lastPayment: 220343,
          lastPaymentDate: '2022-05-02',
          creditPeriod: 299,
          contractNumber: '504/89675',
          rate: '14.0',
          signDate: '2008-05-27',
          endDate: '2033-05-26',
          infoLink: 'https://alfabank.ua/storage/files/personal-data-transfer-notice.pdf',
          collectionLink: 'https://alfabank.ua/storage/files/personal-data-collection.pdf',
          customerLink: 'https://alfabank.ua/storage/files/personal-data-customer.pdf',
          paymentAmount: 19823130
        },
        {
          product:
            {
              productId: '484173910',
              productType: 'CREDIT',
              productCurrency: 'UAH'
            },
          creditAmount: 899900,
          name: 'Интернет - кредит',
          iban: 'UA833003460000029093484173910',
          totalDebt: 719934,
          commissionAmount: 5000,
          repaymentDebt: 683940,
          overdueDebt: 0,
          nextPayment: 0,
          nextPaymentDate: '2021-09-09',
          lastPayment: 41000,
          lastPaymentDate: '2021-09-02',
          creditPeriod: 25,
          contractNumber: '484173910',
          rate: '0.01',
          signDate: '2021-03-05',
          endDate: '2023-04-09',
          infoLink: 'https://alfabank.ua/storage/files/personal-data-transfer-notice.pdf',
          collectionLink: 'https://alfabank.ua/storage/files/personal-data-collection.pdf',
          customerLink: 'https://alfabank.ua/storage/files/personal-data-customer.pdf',
          paymentAmount: 179966
        },
        {
          product:
            {
              productId: '26207000005240-UAH',
              productType: 'ACCOUNT',
              productCurrency: 'UAH'
            },
          name: 'Текущий счет',
          iban: 'UA573003460000026207000005240',
          accountBalance: 0,
          contractNumber: '26207000005240',
          signDate: '2019-10-15',
          tariffsLink: 'https://alfabank.ua/storage/files/tarifniy-zbirnik-rko-fiz-z-25062021.pdf'
        },
        {
          product:
            {
              productId: '26204000006413-UAH',
              productType: 'ACCOUNT',
              productCurrency: 'UAH'
            },
          name: 'Текущий счет',
          iban: 'UA463003460000026204000006413',
          accountBalance: 10000,
          contractNumber: '26204000006413',
          signDate: '2019-10-15',
          tariffsLink: 'https://alfabank.ua/storage/files/tarifniy-zbirnik-rko-fiz-z-25062021.pdf'
        }
      ],
      [
        {
          account: {
            balance: -290740.55,
            capitalization: true,
            endDateOffset: 25,
            endDateOffsetInterval: 'year',
            id: '504/89675',
            instrument: 'UAH',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 14,
            startBalance: 488971.85,
            startDate: new Date('2008-05-26T21:00:00.000Z'),
            syncIds: ['UA573003460000026207000005240'],
            title: 'Кредит',
            type: 'loan'
          },
          product: {
            productCurrency: 'UAH',
            productId: '504/89675',
            productType: 'CREDIT'
          }
        },
        {
          account: {
            balance: -7199.34,
            capitalization: true,
            endDateOffset: 765,
            endDateOffsetInterval: 'day',
            id: '484173910',
            instrument: 'UAH',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 0.01,
            startBalance: 8999,
            startDate: new Date('2021-03-05T00:00:00.000+03:00'),
            syncIds: [
              'UA833003460000029093484173910'
            ],
            title: 'Интернет - кредит',
            type: 'loan'
          },
          product: {
            productCurrency: 'UAH',
            productId: '484173910',
            productType: 'CREDIT'
          }
        },
        {
          account: {
            available: 100,
            id: '26204000006413-UAH',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA463003460000026204000006413'
            ],
            title: 'Текущий счет',
            type: 'checking'
          },
          product: {
            productCurrency: 'UAH',
            productId: '26204000006413-UAH',
            productType: 'ACCOUNT'
          }
        }
      ]
    ]
  ])('converts accounts duplicates', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
