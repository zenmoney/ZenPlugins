import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product:
            {
              productId: '9077580',
              productType: 'CARD',
              productCurrency: 'UAH'
            },
          availableFunds: 9000000,
          name: 'КК ВИГОДА',
          type: 'credit',
          subType: 'epithentr',
          contractNumber: '631524047',
          signDate: '2020-11-20',
          iban: 'UA903003460000026205912151337',
          infoLink: 'https://alfabank.ua/storage/files/personal-data-transfer-notice.pdf',
          creditCardProductInfo:
            {
              accountBalance: 0,
              creditLimit: 9000000,
              graceDebt: 0,
              installmentDebt: null,
              totalDebt: 0,
              minPayment: 0,
              nextPaymentDate: '2021-09-17',
              nextBillingDate: '2021-09-20',
              overdueDebt: 0
            },
          cardSafeInfo: null,
          tariffLink: 'https://alfabank.ua/upload/mobile_tariffs/tariff_cc_epicentr.pdf',
          cards:
            [
              {
                cardId: '35091858',
                cardGUID: 'A1E33272E98446F1AF45AE2FA6797D8A',
                cardName: 'Visa Rewards',
                cardMask: '4102xxxxxxxx1337',
                cardNumber: '4102325111821337',
                expireDate: '2025-06-30',
                primary: true,
                cardStatus: 'active',
                mBankingStatus: true,
                mBankingPhone: '+380936281337',
                readyForActivation: false,
                index: 1,
                prefixId: '410232',
                digitalCard: false
              }
            ],
          isTerms: false
        }
      ],
      [
        {
          account: {
            available: 90000,
            creditLimit: 90000,
            gracePeriodEndDate: new Date('2021-09-17T00:00:00.000+03:00'),
            id: '9077580',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA903003460000026205912151337',
              '4102325111821337'
            ],
            title: 'КК ВИГОДА',
            totalAmountDue: 0,
            type: 'ccard'
          },
          product: {
            productCurrency: 'UAH',
            productId: '9077580',
            productType: 'CARD'
          }
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
