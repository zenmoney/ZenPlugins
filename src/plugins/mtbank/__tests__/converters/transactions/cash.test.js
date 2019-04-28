import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const accounts = [{
    id: '1113333',
    type: 'card',
    title: 'PayOkay',
    productType: 'PC',
    instrument: 'BYN',
    balance: 99.9,
    syncID: [
      'BY36MTBK10110008000001111000',
      '1111'
    ]
  }]

  it('should convert cash replenishment transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '135.82',
      balance: '148.35',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Пополнение наличными в ПВН МТБанка',
      error: '',
      operationDate: '2019-03-18',
      orderStatus: '1',
      place: 'MTB RKC 68                / MINSK         / BY',
      status: 'T',
      transAmount: '135.82',
      transDate: '2019-03-18 10:54:57'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-18T10:54:57+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: 135.82,
        fee: 0,
        invoice: null
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'BYN', syncIds: null },
        sum: -135.82,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert cash withdraw transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '80.0',
      balance: '7412.51',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Снятие наличных в АТМ МТБанка',
      error: '',
      operationDate: '2019-03-07',
      orderStatus: '1',
      place: 'MTB INSTITUTION           / MINSK         / BY',
      status: 'T',
      transAmount: '80.0',
      transDate: '2019-03-07 13:29:59'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T13:29:59+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -80,
        fee: 0,
        invoice: null
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'BYN', syncIds: null },
        sum: 80,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert cash withdraw transaction other ATM', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '50.0',
      balance: '',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Выдача наличных',
      error: '',
      operationDate: null,
      orderStatus: '2',
      place: 'BELGAZPROMBANK            / MINSK        / BY',
      status: 'A',
      transAmount: '50.0',
      transDate: '2019-03-07 13:29:59'
    }, accounts)

    expect(transaction).toEqual({
      hold: true,
      date: new Date('2019-03-07T13:29:59+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -50,
        fee: 0,
        invoice: null
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'BYN', syncIds: null },
        sum: 50,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert cash USD withdraw transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '1900.0',
      balance: '425.45',
      cardPan: '111111******1111',
      curr: 'USD',
      debitFlag: '0',
      description: 'Снятие наличных в АТМ МТБанка',
      error: '',
      operationDate: '2019-01-18',
      orderStatus: '1',
      place: 'MTB INSTITUTION           / MINSK         / BY',
      status: 'T',
      transAmount: '4098.3',
      transDate: '2019-01-18 19:09:49'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-18T19:09:49+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -4098.3,
        fee: 0,
        invoice: {
          sum: -1900,
          instrument: 'USD'
        }
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'USD', syncIds: null },
        sum: 1900,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })
})
