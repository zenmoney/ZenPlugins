import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
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
        }
      ],
      [
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
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
