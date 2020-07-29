import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        operation_id: '550751313786113004',
        title: 'Сбербанк, пополнение',
        amount: 100.00,
        direction: 'in',
        datetime: '2017-06-14T10:28:33Z',
        status: 'success',
        type: 'deposition',
        group_id: 'type_history_non_p2p_deposit'
      },
      {
        date: new Date('2017-06-14T10:28:33.000Z'),
        hold: false,
        comment: 'Сбербанк, пополнение',
        merchant: null,
        movements: [
          {
            id: '550751313786113004',
            account: { id: 'account' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        amount: 1404.94,
        datetime: '2018-04-13T06:43:14Z',
        direction: 'in',
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '576916994317014012',
        status: 'success',
        title: 'travelpayouts.ru, пополнение',
        type: 'deposition'
      },
      {
        date: new Date('2018-04-13T06:43:14.000Z'),
        hold: false,
        comment: 'travelpayouts.ru, пополнение',
        merchant: null,
        movements: [
          {
            id: '576916994317014012',
            account: { id: 'account' },
            invoice: null,
            sum: 1404.94,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        amount: 900,
        datetime: '2018-04-11T12:56:39Z',
        direction: 'in',
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '576766599818039004',
        status: 'success',
        title: 'Пополнение с банковской карты',
        type: 'deposition'
      },
      {
        date: new Date('2018-04-11T12:56:39.000Z'),
        hold: false,
        comment: 'Пополнение с банковской карты',
        merchant: null,
        movements: [
          {
            id: '576766599818039004',
            account: { id: 'account' },
            invoice: null,
            sum: 900,
            fee: 0
          }
        ]
      }
    ]
  ])('converts replenishment', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
