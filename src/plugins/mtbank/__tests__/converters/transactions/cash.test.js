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
      transDate: '2019-03-18 10:54:57',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-18T10:54:57+03:00'),
      movements: [{
        id: '1111111',
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

  it('should convert cash withdraw transaction in bank', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '1000.00',
      balance: '1050.01',
      cardPan: '111111******1111',
      curr: 'EUR',
      debitFlag: '0',
      description: 'Снятие наличных в ПВН МТБанка 14171718',
      error: null,
      operationDate: '2019-03-18',
      orderStatus: null,
      place: 'MTB RKC 68',
      country: 'BY',
      city: 'MINSK',
      status: 'T',
      transAmount: '2351.00',
      transDate: '2019-03-18 10:54:57',
      mcc: '6010',
      transactionId: '1111111',
      rrn: '916407791111',
      approvalCode: '111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-18T10:54:57+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -2351,
        fee: 0,
        invoice: {
          instrument: 'EUR',
          sum: -1000
        }
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'EUR', syncIds: null },
        sum: 1000,
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
      transDate: '2019-03-07 13:29:59',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T13:29:59+03:00'),
      movements: [{
        id: '1111111',
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
      amount: '50.00',
      balance: null,
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: null,
      error: null,
      operationDate: null,
      orderStatus: null,
      place: 'BELGAZPROMBANK',
      country: 'BY',
      city: 'MINSK',
      status: 'A',
      transAmount: '50.00',
      transDate: '2019-03-07 13:29:59',
      mcc: '6011',
      transactionId: '1111111',
      rrn: null,
      approvalCode: null
    }, accounts)

    expect(transaction).toEqual({
      hold: true,
      date: new Date('2019-03-07T13:29:59+03:00'),
      movements: [{
        id: '1111111',
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

  it('should convert extra fees during cash withdraw in other ATM', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '0.25',
      balance: '77.82',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Комиссия за снятие наличных в чужих ATM',
      error: null,
      operationDate: '2019-06-03',
      orderStatus: null,
      place: 'SHOP "MARTINFUD" BR.51',
      country: null,
      city: null,
      status: 'T',
      transAmount: '0.25',
      transDate: '2019-03-07 13:29:59',
      mcc: '6011',
      transactionId: '1111111',
      rrn: '915017611211',
      approvalCode: '000000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T13:29:59+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -0.25,
        fee: 0,
        invoice: null
      }],
      merchant: {
        fullTitle: 'SHOP "MARTINFUD" BR.51',
        location: null,
        mcc: 6011
      },
      comment: 'Комиссия за снятие наличных в чужих ATM'
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
      transDate: '2019-01-18 19:09:49',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-18T19:09:49+03:00'),
      movements: [{
        id: '1111111',
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

  it('should convert cash to card info-kiosk transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '300.00',
      balance: '305.79',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Внесение наличных',
      error: null,
      operationDate: '2019-01-18',
      orderStatus: null,
      place: 'MTB PST 26',
      country: 'BY',
      city: 'MINSK',
      status: 'T',
      transAmount: '300.00',
      transDate: '2019-01-18 19:09:49',
      mcc: '6012',
      transactionId: '1111111',
      rrn: '915820610192',
      approvalCode: '000000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-18T19:09:49+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: 300,
        fee: 0,
        invoice: null
      }, {
        id: null,
        account: { company: null, type: 'cash', instrument: 'BYN', syncIds: null },
        sum: -300,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })
})
