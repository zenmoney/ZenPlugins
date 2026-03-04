import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 5862195,
          type: 'METAL',
          account20: 'KZ308562212217750355',
          product: 'BCC Договора РКО (Металические счета - XAU)',
          open_date: '02.06.2022',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 0,
          allow_cr: 0,
          can_close: false,
          is_epv: false,
          is_zhv: false,
          note: '',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'XAU',
          access_level: 2,
          for_credit: 'FALSE',
          balance: 1,
          blocked: '0',
          structType: 'metal'
        }
      ],
      [
        {
          product: {
            productId: '5862195',
            productType: 'checking'
          },
          accounts: [
            {
              balance: 1,
              id: '5862195',
              instrument: 'A98',
              syncIds: ['KZ308562212217750355'],
              title: 'BCC Договора РКО (Металические счета - XAU)',
              type: 'checking'
            }
          ]
        }
      ]
    ]
  ])('converts metal', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
