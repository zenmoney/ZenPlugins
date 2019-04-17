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

  it('should convert hold foreign currency transaction', () => {
    const transaction = convertTransaction({
      'amount': '40.11',
      'balance': '153.99',
      'cardPan': '111111******1111',
      'curr': 'EUR',
      'debitFlag': '0',
      'description': 'Оплата товаров и услуг',
      'error': '',
      'operationDate': '2019-02-18',
      'orderStatus': '1',
      'place': 'PAYPAL',
      'status': 'T',
      'transAmount': '97.91',
      'transDate': '2019-02-14 00:00:00',
      'accountId': 'BY36MTBK10110008000001111000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -97.91,
        fee: 0,
        invoice: {
          sum: -40.11,
          instrument: 'EUR'
        }
      }],
      merchant: {
        fullTitle: 'PAYPAL',
        location: null,
        mcc: null
      },
      comment: null
    })
  })

  it('should convert salary transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '3000.41',
      balance: '3454.41',
      cardPan: '',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Фонд оплаты труда на тек.счет с банк.плат.карточкой (руб) на основании списка ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ сог. дог.№XX-1234 от 01.09.2020',
      error: '',
      operationDate: '2019-01-25',
      orderStatus: '1',
      place: '',
      status: 'T',
      transAmount: '3000.41',
      transDate: '2019-03-07 11:58:07'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T11:58:07+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: 3000.41,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'Фонд оплаты труда на тек.счет с банк.плат.карточкой (руб) на основании списка ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ сог. дог.№XX-1234 от 01.09.2020'
    })
  })

  it('should convert sms commission transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '2.3',
      balance: '3252.11',
      cardPan: '',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Плата за СМС-оповещение об операциях с использованием платежной карточки за Январь',
      error: '',
      operationDate: '2019-01-31',
      orderStatus: '1',
      place: '',
      status: 'T',
      transAmount: '2.3',
      transDate: '2019-01-31 23:25:42'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-31T23:25:42+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -2.3,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'Плата за СМС-оповещение об операциях с использованием платежной карточки за Январь'
    })
  })

  it('should convert cash-back transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '23.11',
      balance: '30.7',
      cardPan: '',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Зачисление Cash-back в рамках продукта АвтоКарта за Декабрь по номеру договора 39035705',
      error: '',
      operationDate: '2019-01-02',
      orderStatus: '1',
      place: '',
      status: 'T',
      transAmount: '23.11',
      transDate: '2019-01-02 17:55:34'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-02T17:55:34+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: 23.11,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'Зачисление Cash-back в рамках продукта АвтоКарта за Декабрь по номеру договора 39035705'
    })
  })

  it('should convert internet-bank transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '16.0',
      balance: '3358.22',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Оплата в Интернет-банке',
      error: '',
      operationDate: '2019-01-08',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '16.0',
      transDate: '2019-01-05 00:26:11'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-05T00:26:11+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -16,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'Оплата в Интернет-банке'
    })
  })

  it('should convert velcom transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '50.0',
      balance: '344.01',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'velcom по № телефона | номер услуги 381861',
      error: '',
      operationDate: '2019-01-28',
      orderStatus: '1',
      place: 'MTB INTERNET POS          / MINSK         / BY',
      status: 'T',
      transAmount: '50.0',
      transDate: '2019-01-28 07:51:13'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-28T07:51:13+03:00'),
      movements: [{
        id: null,
        account: { id: '1113333' },
        sum: -50,
        fee: 0,
        invoice: null
      }],
      merchant: null,
      comment: 'velcom по № телефона | номер услуги 381861'
    })
  })

  it('should return null for frozen operations', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '',
      balance: '0.0',
      cardPan: '',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Средства, заблокированные для погашения плановой/просроченной задолженности',
      error: '',
      operationDate: null,
      orderStatus: '3',
      place: '',
      status: 'A',
      transAmount: '92.97',
      transDate: null
    }, accounts)

    expect(transaction).toEqual(null)
  })
})
