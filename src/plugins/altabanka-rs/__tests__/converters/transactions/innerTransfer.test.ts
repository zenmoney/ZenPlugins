import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq4A6ZxYgnIfCIjdZ8FtfOJSQCtD%2FmrjSgj1zHjx%2Btw4sQ%3D',
        date: new Date('2025-09-15T00:00:00+03:00'),
        address: 'Interni transfer - Isplata DS',
        amount: -40000,
        currency: 'RSD',
        description: ''
      },
      {
        accountNumber: '0011000110401',
        cardNumber: '',
        id: '0011000110401',
        name: 'Tekući račun',
        currency: 'RSD',
        balance: 1
      },
      {
        hold: false,
        date: new Date('2025-09-15T00:00:00+03:00'),
        movements: [
          {
            id: 'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq4A6ZxYgnIfCIjdZ8FtfOJSQCtD%2FmrjSgj1zHjx%2Btw4sQ%3D',
            account: { id: '0011000110401' },
            sum: -40000,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Interni transfer - Isplata DS',
        groupKeys: [
          '2025-09-15_RSD_40000',
          'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq4A6ZxYgnIfCIjdZ8FtfOJSQCtD'
        ]
      }
    ],
    [
      {
        id: 'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq41DLFWmga94nrZNHdx0JxXiC5bJi8cVub5jCblKRgIp4%3D',
        date: new Date('2025-09-15T00:00:00+03:00'),
        address: 'Interni transfer - Uplata TR',
        amount: 40000,
        currency: 'RSD',
        description: ''
      },
      {
        accountNumber: '0001000277092',
        cardNumber: '',
        id: '0001000277092',
        name: 'Tekući račun',
        currency: 'RSD',
        balance: 12
      },
      {
        hold: false,
        date: new Date('2025-09-15T00:00:00+03:00'),
        movements: [
          {
            id: 'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq41DLFWmga94nrZNHdx0JxXiC5bJi8cVub5jCblKRgIp4%3D',
            account: { id: '0001000277092' },
            sum: 40000,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Interni transfer - Uplata TR',
        groupKeys: [
          '2025-09-15_RSD_40000',
          'id_wt7rXfmUMmVgroIlNmVEvMfHyEX8Ldq41DLFWmga94nrZNHdx0JxXiC5bJi8cVub5jCblKRgIp4'
        ]
      }
    ]
  ])('converts inner transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it.each([
    [
      {
        id: 'id_viqYbg6BsBuDFJFg3r77%2ByeZvsYr6X7fmRAo6AuNYQYBfY2cH7MAJ8g8iCUfQ3Yie6bTzJdpehE%3D',
        date: new Date('2025-12-06T00:00:00+03:00'),
        address: 'Kupovina deviza',
        amount: -58957,
        currency: 'RSD',
        description: ''
      },
      {
        accountNumber: '0001000384425',
        cardNumber: '',
        id: '0001000384425',
        name: 'Tekući račun',
        currency: 'RSD',
        balance: 1234
      },
      {
        hold: false,
        date: new Date('2025-12-06T00:00:00+03:00'),
        movements: [
          {
            id: 'id_viqYbg6BsBuDFJFg3r77%2ByeZvsYr6X7fmRAo6AuNYQYBfY2cH7MAJ8g8iCUfQ3Yie6bTzJdpehE%3D',
            account: { id: '0001000384425' },
            sum: -58957,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Kupovina deviza',
        groupKeys: [
          '2025-12-06_RSD_58957',
          'id_viqYbg6BsBuDFJFg3r77'
        ]
      }
    ],
    [
      {
        id: 'id_viqYbg6BsBuDFJFg3r77%2ByeZvsYr6X7f4nRf9PIIC9Mess7n7trIZFF4KADMvYR2ivh%2BXrHnFI4%3D',
        date: new Date('2025-12-06T00:00:00+03:00'),
        address: 'Kupovina deviza',
        amount: 500,
        currency: 'EUR',
        description: ''
      },
      {
        accountNumber: '0001000384425',
        cardNumber: '',
        id: '0031000457887',
        name: 'Tekući račun',
        currency: 'EUR',
        balance: 0
      },
      {
        hold: false,
        date: new Date('2025-12-06T00:00:00+03:00'),
        movements: [
          {
            id: 'id_viqYbg6BsBuDFJFg3r77%2ByeZvsYr6X7f4nRf9PIIC9Mess7n7trIZFF4KADMvYR2ivh%2BXrHnFI4%3D',
            account: { id: '0031000457887' },
            sum: 500,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Kupovina deviza',
        groupKeys: [
          '2025-12-06_EUR_500',
          'id_viqYbg6BsBuDFJFg3r77'
        ]
      }
    ]
  ])('converts inner currency transfer', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
