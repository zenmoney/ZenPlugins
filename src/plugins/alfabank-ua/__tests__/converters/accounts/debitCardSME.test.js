import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product:
            {
              productId: '26005096862901-UAH',
              productType: 'CARD_SME',
              productCurrency: 'UAH'
            },
          name: 'Бизнес-карта',
          type: 'debit',
          subType: '',
          contractNumber: 'БК26005096862901',
          signDate: '2020-12-24',
          iban: 'UA423003460000026005096862901',
          cards:
            [
              {
                cardGUID: '18F3D64ED7564EFECD0C87278B33E76C',
                cardMask: '5351xxxxxxx1590',
                cardName: 'MasterCard Business',
                expireDate: '2023-06-30',
                primary: true,
                cardStatus: 'blocked',
                cardStatusId: '119',
                codeCardId: '6923',
                readyForActivation: true,
                mBankingStatus: false,
                mBankingPhone: '',
                iconUrl: 'https://insync.alfabank.com.ua/icon/MCBusinessUAH.png',
                iconCardUrl: 'https://insync.alfabank.com.ua/iconCard/MCBusinessUAH.png',
                index: 100,
                type: 'debit',
                terms: false
              }
            ],
          terms: false
        }
      ],
      [
        {
          account: {
            id: '26005096862901-UAH',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA423003460000026005096862901',
              '5351*******1590'
            ],
            title: 'Бизнес-карта',
            type: 'ccard'
          },
          product: {
            productCurrency: 'UAH',
            productId: '26005096862901-UAH',
            productType: 'CARD_SME'
          }
        }
      ]
    ]
  ])('converts SME card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
