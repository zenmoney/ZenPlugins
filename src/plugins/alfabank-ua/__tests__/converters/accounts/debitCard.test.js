import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product: {
            productId: '8569841',
            productType: 'CARD',
            productCurrency: 'UAH'
          },
          availableFunds: 55048,
          name: 'Пакет Ультра',
          type: 'debit',
          subType: null,
          contractNumber: '618349831',
          signDate: '2019-12-26',
          iban: 'UA643003460000026202910824129',
          infoLink: null,
          creditCardProductInfo: null,
          cardSafeInfo: {
            rate: 5,
            amount: 0
          },
          tariffLink: 'https://alfabank.ua/upload/mobile_tariffs/tariff_ultra.pdf',
          cards: [
            {
              cardId: '27431226',
              cardGUID: '40C28DE1877042C684FC2DD68B4A3D24',
              cardName: 'Visa Rewards',
              cardMask: '4102xxxxxxxx1355',
              cardNumber: '4102321255831355',
              expireDate: '2024-12-31',
              primary: true,
              cardStatus: 'active',
              mBankingStatus: true,
              mBankingPhone: '+380636800381',
              readyForActivation: false,
              index: 1,
              prefixId: '410232',
              digitalCard: false
            }
          ],
          isTerms: true
        }
      ],
      [{
        account: {
          available: 0,
          id: '8569841-safe',
          instrument: 'UAH',
          savings: true,
          syncIds: [
            'UA6430034600000262029108241295473'
          ],
          title: 'Пакет Ультра Сейф',
          type: 'checking'
        },
        product: null
      },
      {
        account: {
          available: 550.48,
          id: '8569841',
          instrument: 'UAH',
          savings: false,
          syncIds: [
            'UA643003460000026202910824129',
            '4102321255831355'
          ],
          title: 'Пакет Ультра',
          type: 'ccard'
        },
        product: {
          productCurrency: 'UAH',
          productId: '8569841',
          productType: 'CARD'
        }
      }
      ]
    ]
  ])('converts debit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
