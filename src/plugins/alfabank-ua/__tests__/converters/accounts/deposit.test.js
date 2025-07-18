import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product: {
            productId: 'TDRM000523818',
            productType: 'DEPOSIT',
            productCurrency: 'UAH'
          },
          accountBalance: 16902148,
          name: 'Вклад Сберегательный',
          iban: 'UA643003460000026201100847003',
          rate: '5.0',
          accruedAmount: 623786,
          interestChargeType: 'capitalization',
          fundingEnabled: true,
          withdrawalEnabled: true,
          contractNumber: 'TDRM000523818',
          signDate: '2020-06-15',
          endDate: null,
          canSendAccept: false,
          isProlongationAllowed: 'notAllowed',
          autoProlong: false,
          conditions: 'Разрешено',
          type: 'deposit_saving_mab'
        }
      ],
      [
        {
          account: {
            balance: 169021.48,
            capitalization: true,
            endDateOffset: 10,
            endDateOffsetInterval: 'year',
            id: 'TDRM000523818',
            instrument: 'UAH',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 5,
            startBalance: 169021.48,
            startDate: new Date('2020-06-15T00:00:00.000+03:00'),
            syncIds: [
              'UA643003460000026201100847003'
            ],
            title: 'Вклад Сберегательный',
            type: 'deposit'
          },
          product: {
            productCurrency: 'UAH',
            productId: 'TDRM000523818',
            productType: 'DEPOSIT'
          }
        }
      ]
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
