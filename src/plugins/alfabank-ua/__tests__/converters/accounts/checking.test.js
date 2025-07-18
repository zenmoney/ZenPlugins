import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          product:
            {
              productId: '26204000006413-UAH',
              productType: 'ACCOUNT',
              productCurrency: 'UAH'
            },
          name: 'Текущий счет',
          iban: 'UA463003460000026204000006413',
          accountBalance: 0,
          contractNumber: '26204000006413',
          signDate: '2019-10-15',
          tariffsLink: 'https://alfabank.ua/storage/files/tarifniy-zbirnik-rko-fiz-z-25062021.pdf'
        }
      ],
      [
        {
          account: {
            available: 0,
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
    ],
    [
      [
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
        }
      ],
      [
        {
          account: {
            available: 0,
            id: '26207000005240-UAH',
            instrument: 'UAH',
            savings: false,
            syncIds: ['UA573003460000026207000005240'],
            title: 'Текущий счет',
            type: 'checking'
          },
          product: {
            productCurrency: 'UAH',
            productId: '26207000005240-UAH',
            productType: 'ACCOUNT'
          }
        }
      ]
    ]
  ])('converts checking', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
