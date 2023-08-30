import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        deposits: [],
        cards: [],
        current: [
          {
            internalAccountId: '64622657',
            currency: '933',
            openDate: 1638651600000,
            accountNumber: 'BY76BAPB30141001500180000000',
            productCode: '6462',
            productName: 'BYN Текущие счета СДБО',
            balanceAmount: 0,
            contractId: '858709396',
            interestRate: 0.01,
            accountStatus: 'OPEN',
            rkcCode: '3380400000',
            rkcName: 'ЦБУ №338/40 в г.Мозырь РД по Гомельской области',
            accountType: '5',
            ibanNum: 'BY08BAPB30140000000064622657',
            promoCodes: [{ key: 'WITH_CARE_PROMO', value: '858709396' }],
            canSell: false,
            canCloseSameCurrency: false,
            canCloseOtherCurrency: false,
            canClose: false,
            canRefillSameCurrency: false,
            canRefillOtherCurrency: true,
            canRefill: false,
            operationsProhibited: false
          }
        ],
        loans: []
      },
      [
        {
          mainProduct: {
            type: 'account',
            accountType: '5',
            bankCode: '3380400000',
            currencyCode: '933',
            internalAccountId: '64622657',
            rkcCode: '3380400000'
          },
          account: {
            id: '64622657',
            type: 'checking',
            title: 'BYN Текущие счета СДБО',
            syncID: [
              'BY08BAPB30140000000064622657'
            ],
            balance: 0,
            instrument: 'BYN',
            percent: 0.01,
            savings: true // ???
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
