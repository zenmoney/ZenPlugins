import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        deposits: [
          {
            internalAccountId: '3989778',
            currency: '840',
            openDate: 1591909200000,
            productName: 'USD Вклад "Плюс к стабильности" 95 дней (Ягодный промокод) СДБО',
            balanceAmount: 409.61,
            accountStatus: 'OPEN',
            bankCode: '964',
            rkcCode: '116',
            accountType: '3989',
            ibanNum: 'BY11BAPB34140000000003989778',
            percentRate: 1.25,
            lastDocumentSymbols: '965',
            plannedEndDate: 1600117200000
          },
          {
            internalAccountId: '9715726',
            currency: '840',
            openDate: 1596747600000,
            productName: 'USD Вклад "ПЛЮС к ЛЕТУ" 35 дней СДБО',
            balanceAmount: 200.00,
            accountStatus: 'OPEN',
            bankCode: '964',
            rkcCode: '116',
            accountType: '9715',
            ibanNum: 'BY52BAPB34140000000009715726',
            percentRate: 1.25,
            lastDocumentSymbols: '965',
            plannedEndDate: 1599771600000
          },
          {
            internalAccountId: '9715769',
            currency: '840',
            openDate: 1597179600000,
            productName: 'USD Вклад "ПЛЮС к ЛЕТУ" 35 дней СДБО',
            balanceAmount: 400.00,
            accountStatus: 'OPEN',
            bankCode: '964',
            rkcCode: '116',
            accountType: '9715',
            ibanNum: 'BY55BAPB34140000000009715769',
            percentRate: 1.25,
            lastDocumentSymbols: '965',
            plannedEndDate: 1600203600000
          }
        ],
        cards: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            type: 'deposit',
            accountType: '3989',
            bankCode: '964',
            currencyCode: '840',
            internalAccountId: '3989778',
            rkcCode: '116'
          },
          account: {
            id: '3989778',
            type: 'deposit',
            title: 'USD Вклад "Плюс к стабильности" 95 дней (Ягодный промокод) СДБО',
            instrument: 'USD',
            syncID: [
              'BY11BAPB34140000000003989778'
            ],
            balance: 409.61,
            startBalance: 409.61,
            startDate: new Date(1591909200000),
            percent: 1.25,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 95,
            payoffInterval: 'month',
            payoffStep: 1
          }
        },
        {
          mainProduct: {
            type: 'deposit',
            accountType: '9715',
            bankCode: '964',
            currencyCode: '840',
            internalAccountId: '9715726',
            rkcCode: '116'
          },
          account: {
            id: '9715726',
            type: 'deposit',
            title: 'USD Вклад "ПЛЮС к ЛЕТУ" 35 дней СДБО',
            instrument: 'USD',
            syncID: [
              'BY52BAPB34140000000009715726'
            ],
            balance: 200.00,
            startBalance: 200.00,
            startDate: new Date(1596747600000),
            percent: 1.25,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 35,
            payoffInterval: 'month',
            payoffStep: 1
          }
        },
        {
          mainProduct: {
            type: 'deposit',
            accountType: '9715',
            bankCode: '964',
            currencyCode: '840',
            internalAccountId: '9715769',
            rkcCode: '116'
          },
          account: {
            id: '9715769',
            type: 'deposit',
            title: 'USD Вклад "ПЛЮС к ЛЕТУ" 35 дней СДБО',
            instrument: 'USD',
            syncID: [
              'BY55BAPB34140000000009715769'
            ],
            balance: 400.00,
            startBalance: 400.00,
            startDate: new Date(1597179600000),
            percent: 1.25,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 35,
            payoffInterval: 'month',
            payoffStep: 1
          }
        }
      ]
    ],
    [
      {
        deposits: [
          {
            internalAccountId: '0201273440',
            currency: '933',
            openDate: 1536440400000,
            accountNumber: 'BY81BAPB66708001500180000000',
            productCode: '201',
            productName: 'Неподвижные для договоров с БПК BYN',
            balanceAmount: 0.06,
            contractId: '90262117',
            interestRate: 0,
            accountStatus: 'OPEN',
            bankCode: '964',
            rkcCode: '1160040000',
            rkcName: 'ЦБУ №116/4 в г.Брест РД по Брестской области',
            accountType: '201',
            ibanNum: 'BY90BAPB66700000000201273440',
            canSell: false,
            canCloseSameCurrency: false,
            canCloseOtherCurrency: false,
            canClose: false,
            canRefillSameCurrency: false,
            canRefillOtherCurrency: false,
            canRefill: false,
            percentRate: 0,
            lastDocumentSymbols: '374',
            bare: false,
            possibilityOfExecution: true,
            canReopenSameCurrency: false
          }
        ],
        cards: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            type: 'deposit',
            accountType: '201',
            bankCode: '964',
            currencyCode: '933',
            internalAccountId: '0201273440',
            rkcCode: '1160040000'
          },
          account: {
            id: '0201273440',
            type: 'checking',
            title: 'Неподвижные для договоров с БПК BYN',
            instrument: 'BYN',
            syncID: [
              'BY90BAPB66700000000201273440'
            ],
            balance: 0.06,
            savings: true
          }
        }
      ]
    ],
    [
      {
        deposits: [
          {
            internalAccountId: '96333913',
            currency: '933',
            openDate: 1628024400000,
            endDate: 1644008400000,
            accountNumber: 'BY17BAPB34141000100180000000',
            productCode: '9633',
            productName: 'BYN Вклад "Плюс к стабильности" 185 дней СДБО',
            balanceAmount: 1260.86,
            contractId: '783727294',
            interestRate: 20.25,
            accountStatus: 'OPEN',
            bankCode: '964',
            rkcCode: '5420420000',
            rkcName: 'ЦБУ №542 в г.Слуцк РД по Минской области',
            accountType: '9633',
            ibanNum: 'BY52BAPB34140000000096333913',
            url: 'https://www.ibank.belapb.by:4443/media/public/depozit14_1.png',
            canSell: false,
            canCloseSameCurrency: false,
            canCloseOtherCurrency: false,
            canClose: false,
            canRefillSameCurrency: true,
            canRefillOtherCurrency: true,
            canRefill: false,
            lastDocumentSymbols: '354',
            plannedEndDate: 1644008400000,
            bare: false,
            possibilityOfExecution: true,
            canReopenSameCurrency: true
          }
        ],
        cards: [],
        current: [],
        loans: []
      },
      [
        {
          account: {
            balance: 1260.86,
            capitalization: true,
            endDateOffset: 185,
            endDateOffsetInterval: 'day',
            id: '96333913',
            instrument: 'BYN',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 20.25,
            startBalance: 1260.86,
            startDate: new Date('2021-08-04T00:00:00.000+03:00'),
            syncID: [
              'BY52BAPB34140000000096333913'
            ],
            title: 'BYN Вклад "Плюс к стабильности" 185 дней СДБО',
            type: 'deposit'
          },
          mainProduct: {
            accountType: '9633',
            bankCode: '964',
            currencyCode: '933',
            internalAccountId: '96333913',
            rkcCode: '5420420000',
            type: 'deposit'
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
