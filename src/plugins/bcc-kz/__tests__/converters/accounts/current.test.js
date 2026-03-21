import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 2389652,
          type: 'CURRENT',
          account20: 'KZ778562204108223880',
          product: 'Специальный текущий счет (для пособий и социальных выплат без начисления вознаграждения)',
          open_date: '24.04.2020',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 1,
          allow_cr: 0,
          can_close: true,
          is_epv: false,
          is_zhv: false,
          note: 'Специальный текущий счет (для пособий и социальных выплат без начисления вознаграждения)',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'FALSE',
          balance: '0',
          blocked: '0',
          structType: 'current'
        },
        {
          id: 3788239,
          type: 'CURRENT',
          account20: 'KZ248562204112013751',
          product: 'Текущий счет физического лица',
          open_date: '13.05.2021',
          accPTPSum: 0,
          visible: true,
          direct_credit: false,
          allow_db: 1,
          allow_cr: 1,
          can_close: true,
          is_epv: false,
          is_zhv: false,
          note: 'Текущий счет',
          acc_status: 'Рабочий',
          module: '01',
          currency: 'KZT',
          access_level: 2,
          for_credit: 'FALSE',
          balance: '0',
          blocked: '0',
          structType: 'current'
        }
      ],
      [
        {
          product: {
            productId: '2389652',
            productType: 'checking'
          },
          accounts: [
            {
              balance: 0,
              id: '2389652',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ778562204108223880'
              ],
              title: 'Специальный текущий счет (для пособий и социальных выплат без начисления вознаграждения)',
              type: 'checking'
            }
          ]
        },
        {
          product: {
            productId: '3788239',
            productType: 'checking'
          },
          accounts: [
            {
              balance: 0,
              id: '3788239',
              instrument: 'KZT',
              savings: false,
              syncIds: [
                'KZ248562204112013751'
              ],
              title: 'Текущий счет',
              type: 'checking'
            }
          ]
        }
      ]
    ]
  ])('converts current', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
