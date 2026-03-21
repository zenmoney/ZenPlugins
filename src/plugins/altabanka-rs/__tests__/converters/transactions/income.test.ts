import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'id_%2FwwIaVbmrPrL74jpeJY%2BX4UMblwix1J%2Fzmel7U89IqszyGobwBkD4JHhV1QVbcdrxd0ta7fuTcY%3D',
        date: new Date('2025-11-28T00:00:00+03:00'),
        address: 'Uplata sa racuna 265000000721779723 NIKOLAY NIKOLAEV, NIKOLE TESLE 1, BEOGR',
        amount: 299000,
        currency: 'RSD',
        description: ''
      },
      {
        accountNumber: '0001000316640',
        cardNumber: '',
        id: '0001000316640',
        name: 'Tekući račun',
        currency: 'RSD',
        balance: 23832.94
      },
      {
        hold: false,
        date: new Date('2025-11-28T00:00:00+03:00'),
        movements: [
          {
            id: 'id_%2FwwIaVbmrPrL74jpeJY%2BX4UMblwix1J%2Fzmel7U89IqszyGobwBkD4JHhV1QVbcdrxd0ta7fuTcY%3D',
            account: { id: '0001000316640' },
            sum: 299000,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Uplata sa racuna 265000000721779723 NIKOLAY NIKOLAEV, NIKOLE TESLE 1, BEOGR'
      }
    ],
    [
      {
        id: 'id_%2FwwIaVbmrPqeTRZxtmxl9we7u%2B7Rw7P7BSyy3pEYtGY%2F8fRANSESiW6CtqAqu8Tta24gQq%2BXnvQ%3D',
        date: new Date('2025-11-28T00:00:00+03:00'),
        address: 'Uplata na tekuci racun',
        amount: 200000,
        currency: 'RSD',
        description: ''
      },
      {
        accountNumber: '0001000316640',
        cardNumber: '',
        id: '0001000316640',
        name: 'Tekući račun',
        currency: 'RSD',
        balance: 23832.94
      },
      {
        hold: false,
        date: new Date('2025-11-28T00:00:00+03:00'),
        movements: [
          {
            id: 'id_%2FwwIaVbmrPqeTRZxtmxl9we7u%2B7Rw7P7BSyy3pEYtGY%2F8fRANSESiW6CtqAqu8Tta24gQq%2BXnvQ%3D',
            account: { id: '0001000316640' },
            sum: 200000,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Uplata na tekuci racun'
      }
    ]
  ])('converts income transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
