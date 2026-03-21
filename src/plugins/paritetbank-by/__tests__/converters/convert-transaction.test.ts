import { convertCardAccount, convertCurrentAccount, convertTransaction } from '../../converters'
import { FetchTransaction } from '../../types/fetch'
import { Movement, Transaction } from '../../../../types/zenmoney'
import { TEST_TRANSACTIONS } from '../../__mocks__/transactions.sample'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.sample'

describe('convertTransaction', () => {
  const rawCardAccount = TEST_ACCOUNTS.CARD.find(acc => acc.contractNumber === '8479823740280')

  if (rawCardAccount == null) {
    throw new Error('Card account not found')
  }

  const cardAccount = convertCardAccount(rawCardAccount)

  it.each([
    [
      TEST_TRANSACTIONS['8479823740280'][0],
      {
        hold: null,
        date: new Date('2025-10-17T17:35:47.000Z'),
        comment: 'Перевод с карты на счет',
        movements: [
          {
            id: '1001',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: null,
            sum: -1.45
          }
        ] as [Movement],
        merchant: null
      }
    ],
    [
      TEST_TRANSACTIONS['8479823740280'][1],
      {
        hold: null,
        date: new Date('2025-10-16T15:29:13.000Z'),
        comment: '',
        movements: [
          {
            id: '1002',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: { sum: -11.73, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          country: 'BY',
          city: 'MINSK',
          mcc: 5411,
          title: 'SHOP "EVROOPT"',
          location: null,
          category: ''
        }
      }
    ],
    [
      TEST_TRANSACTIONS['8479823740280'][2],
      {
        hold: null,
        date: new Date('2025-10-16T14:46:42.000Z'),
        comment: '',
        movements: [
          {
            id: '1003',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: { sum: -4.49, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          country: 'BY',
          city: 'G. MINSK',
          mcc: 5411,
          title: 'SUPERMARKET "GREEN-25"',
          location: null,
          category: ''
        }
      }
    ],
    [
      TEST_TRANSACTIONS['8479823740280'][3],
      {
        hold: null,
        date: new Date('2025-10-16T14:33:17.000Z'),
        comment: '',
        movements: [
          {
            id: '1004',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: { sum: 20, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          mcc: 6010,
          title: 'DO CBU-2 PARITETBANK PVN',
          location: null,
          category: ''
        }
      }
    ],
    [
      TEST_TRANSACTIONS['8479823740280'][4],
      {
        hold: null,
        date: new Date('2025-10-16T14:20:29.000Z'),
        comment: '',
        movements: [
          {
            id: '1005',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: { sum: -20, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          country: 'BY',
          city: 'MINSK',
          mcc: 6011,
          title: 'URM CBU 2 PARITET ATM',
          location: null,
          category: ''
        }
      }
    ],
    [
      TEST_TRANSACTIONS['8479823740280'][5],
      {
        hold: null,
        date: new Date('2025-10-16T14:13:26.000Z'),
        comment: '',
        movements: [
          {
            id: '1007',
            account: { id: '8479823740280' },
            fee: 0,
            invoice: { sum: 50, instrument: 'BYN' },
            sum: null
          }
        ] as [Movement],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          mcc: 4900,
          title: 'POPOLNENIE KART. PARITET',
          location: null,
          category: ''
        }
      }
    ]
  ])('converts transactions for card account', (apiTransaction: FetchTransaction, transaction: Transaction) => {
    expect(convertTransaction(apiTransaction, cardAccount)).toEqual(transaction)
  })

  const rawCurrentAccount = TEST_ACCOUNTS.CURRENT.find(acc => acc.contractNumber === '425367558876986')

  if (rawCurrentAccount == null) {
    throw new Error('Current account not found')
  }

  const currentAccount = convertCurrentAccount(rawCurrentAccount)

  it.each([
    [
      TEST_TRANSACTIONS['425367558876986'][0],
      {
        hold: null,
        date: new Date('2025-10-23T10:36:43.000Z'),
        comment: 'life:) по № телефона',
        movements: [
          {
            id: '1102',
            account: { id: '425367558876986' },
            fee: 0,
            invoice: null,
            sum: -1
          }
        ] as [Movement],
        merchant: null
      }
    ],
    [
      TEST_TRANSACTIONS['425367558876986'][1],
      {
        hold: null,
        date: new Date('2025-10-17T17:40:02.000Z'),
        comment: 'Перевод со счета на карту',
        movements: [
          {
            id: '1103',
            account: { id: '425367558876986' },
            fee: 0,
            invoice: { sum: -1, instrument: 'EUR' },
            sum: null
          }
        ] as [Movement],
        merchant: null
      }
    ],
    [
      TEST_TRANSACTIONS['425367558876986'][2],
      {
        hold: null,
        date: new Date('2025-10-17T17:35:49.000Z'),
        comment: 'On-line пополнение со списанием со счета в другой валюте',
        movements: [
          {
            id: '1201',
            account: { id: '425367558876986' },
            fee: 0,
            invoice: null,
            sum: 5
          }
        ] as [Movement],
        merchant: null
      }
    ]
  ])('converts transactions for current account', (apiTransaction: FetchTransaction, transaction: Transaction) => {
    expect(convertTransaction(apiTransaction, currentAccount)).toEqual(transaction)
  })
})
