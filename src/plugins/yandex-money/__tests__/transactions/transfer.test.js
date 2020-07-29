import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  const account = { id: 'account', instrument: 'RUB' }
  it.each([
    [
      {
        pattern_id: 'p2p',
        operation_id: '550751409179120010',
        title: 'Перевод на счет 4100148118398',
        amount: 100.00,
        direction: 'out',
        datetime: '2017-06-14T10:30:12Z',
        status: 'success',
        type: 'outgoing-transfer',
        group_id: 'type_history_p2p_outgoing_all'
      },
      {
        date: new Date('2017-06-14T10:30:12.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'YM 4100148118398',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '550751409179120010',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['4100148118398'],
              company: null
            },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        pattern_id: '4601',
        group_id: 'pattern_4601',
        operation_id: '645418930452788631',
        title: 'Перевод на карту 553691******2743',
        amount: 450.82,
        direction: 'out',
        datetime: '2020-06-14T15:02:13Z',
        status: 'success',
        type: 'payment-shop',
        showcase_format: 'json',
        spendingCategories: [{ name: 'TransferWithdraw', sum: 450.82 }],
        amount_currency: 'RUB',
        is_sbp_operation: false
      },
      {
        date: new Date('2020-06-14T15:02:13.000Z'),
        hold: false,
        comment: 'Перевод на карту 553691******2743',
        merchant: null,
        movements: [
          {
            id: '645418930452788631',
            account: { id: 'account' },
            invoice: null,
            sum: -450.82,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['2743'],
              company: null
            },
            invoice: null,
            sum: 450.82,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to Yandex Money wallet', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it('skips in_progress transactions', () => {
    expect(convertTransaction({
      pattern_id: 'p2p',
      group_id: 'type_history_p2p_outgoing_all',
      operation_id: '607535685291020110',
      title: 'Перевод на счет 410012481246213',
      amount: 3500,
      direction: 'out',
      datetime: '2019-04-02T15:54:50Z',
      status: 'in_progress',
      type: 'outgoing-transfer',
      spendingCategories: [{ name: 'TransferWithdraw', sum: 3500 }],
      amount_currency: 'RUB'
    }, account)).toBeNull()
  })

  it('skips transactions with amount = 0', () => {
    expect(convertTransaction({
      group_id: 'type_history_non_p2p_deposit',
      operation_id: '639014474966232004',
      title: 'Корректировка: списание бонусов',
      amount: 0,
      direction: 'in',
      datetime: '2020-04-01T00:01:14Z',
      status: 'success',
      type: 'deposition',
      spendingCategories: [{ name: 'Deposition', sum: 0 }],
      amount_currency: 'RUB',
      is_sbp_operation: false
    }, account)).toBeNull()
  })
})

/*

const toReadableTransactionForAccount = account => transaction => convertTransaction(transaction, account)

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'RUB'
  }

  it('converts transfer to Yandex Money wallet', () => {
    const apiTransactions = [
      {
        pattern_id: 'p2p',
        operation_id: '550751409179120010',
        title: 'Перевод на счет 4100148118398',
        amount: 100.00,
        direction: 'out',
        datetime: '2017-06-14T10:30:12Z',
        status: 'success',
        type: 'outgoing-transfer',
        group_id: 'type_history_p2p_outgoing_all'
      },
      {
        pattern_id: '4601',
        group_id: 'pattern_4601',
        operation_id: '645418930452788631',
        title: 'Перевод на карту 553691******2743',
        amount: 450.82,
        direction: 'out',
        datetime: '2020-06-14T15:02:13Z',
        status: 'success',
        type: 'payment-shop',
        showcase_format: 'json',
        spendingCategories: [{ name: 'TransferWithdraw', sum: 450.82 }],
        amount_currency: 'RUB',
        is_sbp_operation: false
      }
    ]

    const expectedReadableTransactions = [
      {
        date: new Date('2017-06-14T10:30:12.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'YM 4100148118398',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '550751409179120010',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['4100148118398'],
              company: null
            },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2020-06-14T15:02:13.000Z'),
        hold: false,
        comment: 'Перевод на карту 553691******2743',
        merchant: null,
        movements: [
          {
            id: '645418930452788631',
            account: { id: 'account' },
            invoice: null,
            sum: -450.82,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: ['2743'],
              company: null
            },
            invoice: null,
            sum: 450.82,
            fee: 0
          }
        ]
      }
    ]

    const toReadableTransaction = toReadableTransactionForAccount(account)
    const readableTransactions = apiTransactions.map(toReadableTransaction)
    expect(readableTransactions).toEqual(expectedReadableTransactions)
  })

 */
