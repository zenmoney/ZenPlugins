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

  it('should convert inner in-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '147.38',
      balance: '',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Пополнение при переводе между картами в Интернет-банке в рамках одного клиента',
      error: '',
      operationDate: '2019-03-11',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '147.38',
      transDate: '2019-03-07 22:17:00',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T22:17:00+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: 147.38,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert inner out-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '1500.0',
      balance: '3553.01',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Списание при переводе в Интернет-банке в рамках одного клиента',
      error: '',
      operationDate: '2019-03-07',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '1500.0',
      transDate: '2019-03-07 18:37:00',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T18:37:00+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -1500,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert outer out-p2p-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '100.0',
      balance: '28.54',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Перевод с БПК МТБ в системе Р2Р',
      error: '',
      operationDate: '2019-03-13',
      orderStatus: '1',
      place: 'P2P_MTBANK                / MINSK         / BY',
      status: 'T',
      transAmount: '100.0',
      transDate: '2019-03-13 21:18:33',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-13T21:18:33+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -100,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert outer in-p2p-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '7.2',
      balance: '606.99',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Перевод на БПК МТБ в системе Р2Р',
      error: '',
      operationDate: '2019-03-21',
      orderStatus: '1',
      place: 'P2P_MTBANK                / MINSK         / BY',
      status: 'T',
      transAmount: '7.2',
      transDate: '2019-03-21 12:28:29',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-21T12:28:29+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: 7.2,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })

  it('should convert other people out-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '4.0',
      balance: '1316.39',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Перевод на карту другого клиента',
      error: '',
      operationDate: '2019-03-11',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '4.0',
      transDate: '2019-03-07 23:10:01',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T23:10:01+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -4,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'Перевод на карту другого клиента'
    })
  })

  it('should convert other people out-transfer transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '25.45',
      balance: '0.0',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Перевод между своими картами',
      error: '',
      operationDate: '2019-01-18',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '25.45',
      transDate: '2019-01-18 19:16:11',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-18T19:16:11+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1113333' },
        sum: -25.45,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: null
    })
  })
})
