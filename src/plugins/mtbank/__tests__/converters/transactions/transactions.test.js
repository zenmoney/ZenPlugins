import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const accounts = [
    {
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
    }
  ]

  it('should convert hold foreign currency transaction', () => {
    const transaction = convertTransaction({
      amount: '40.11',
      balance: '153.99',
      cardPan: '111111******1111',
      curr: 'EUR',
      debitFlag: '0',
      description: 'Оплата товаров и услуг',
      error: '',
      operationDate: '2019-02-18',
      orderStatus: '1',
      place: 'PAYPAL',
      status: 'T',
      transAmount: '97.91',
      transDate: '2019-02-14 00:00:00',
      accountId: 'BY36MTBK10110008000001111000',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: -97.91,
          fee: 0,
          invoice: {
            sum: -40.11,
            instrument: 'EUR'
          }
        }
      ],
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
      transDate: '2019-03-07 11:58:07',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-07T11:58:07+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: 3000.41,
          fee: 0,
          invoice: null
        }
      ],
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
      transDate: '2019-01-31 23:25:42',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-31T23:25:42+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: -2.3,
          fee: 0,
          invoice: null
        }
      ],
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
      transDate: '2019-01-02 17:55:34',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-02T17:55:34+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: 23.11,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Зачисление Cash-back в рамках продукта АвтоКарта за Декабрь по номеру договора 39035705'
    })
  })

  it('payment of income under the loyalty program', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '209.00',
      balance: '1319.59',
      cardPan: '535104******0480',
      curr: 'BYN',
      debitFlag: '1',
      description: 'Выплата дохода физ.лицу в рамках программы лояльности, RRN 226711841395',
      error: null,
      operationDate: '2022-09-26',
      orderStatus: null,
      place: '3467.shop.onliner.by',
      country: 'BY',
      city: 'Minsk',
      status: 'T',
      transAmount: '148.92',
      transDate: null,
      mcc: '5732',
      transactionId: '3023266775',
      rrn: '226711841395',
      approvalCode: '009430'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2022-09-26T00:00:00+03:00'),
      movements: [
        {
          id: '3023266775',
          account: { id: '1113333' },
          sum: 148.92,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        country: 'BY',
        city: 'Minsk',
        title: '3467.shop.onliner.by',
        location: null,
        mcc: 5732
      },
      comment: 'Выплата дохода физ.лицу в рамках программы лояльности, RRN 226711841395'
    })
  })

  it('should convert internet-bank transaction', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '9.90',
      balance: '26.20',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Оплата товаров и услуг в сети МТБанка',
      error: null,
      operationDate: '2019-01-02',
      orderStatus: null,
      place: 'CINNABON',
      country: 'BY',
      city: 'MINSK',
      status: 'T',
      transAmount: '9.90',
      transDate: '2019-01-02 17:55:34',
      mcc: '5812',
      transactionId: '1111111',
      rrn: null,
      approvalCode: null
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-02T17:55:34+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: -9.9,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        country: 'BY',
        city: 'MINSK',
        title: 'CINNABON',
        location: null,
        mcc: 5812
      },
      comment: null
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
      transDate: '2019-01-28 07:51:13',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-01-28T07:51:13+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: -50,
          fee: 0,
          invoice: null
        }
      ],
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
      transDate: null,
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual(null)
  })

  it('should be hold', () => {
    const transaction = convertTransaction({
      accountId: 'BY36MTBK10110008000001111000',
      amount: '3.13',
      balance: '',
      cardPan: '111111******1111',
      curr: 'BYN',
      debitFlag: '0',
      description: 'Оплата товаров и услуг',
      error: '',
      operationDate: null,
      orderStatus: '2',
      place: 'SHOP "SOSEDI"            / MINSK        / BY',
      status: 'A',
      transAmount: '3.13',
      transDate: '2019-01-28 07:51:13',
      transactionId: '1111111'
    }, accounts)

    expect(transaction).toEqual({
      hold: true,
      date: new Date('2019-01-28T07:51:13+03:00'),
      movements: [
        {
          id: '1111111',
          account: { id: '1113333' },
          sum: -3.13,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        location: null,
        mcc: null,
        fullTitle: 'SHOP "SOSEDI"            / MINSK        / BY'
      },
      comment: null
    })
  })

  it('should be nill', () => {
    const transaction = convertTransaction({
      amount: '0.00',
      balance: '91.52',
      cardPan: '111111******1111',
      curr: 'EUR',
      debitFlag: '0',
      description: 'Верификация MasterCard',
      error: null,
      operationDate: '2019-07-01',
      orderStatus: null,
      place: 'Booking.com',
      country: 'NL',
      city: 'Amsterdam',
      status: 'T',
      transAmount: '0.00',
      transDate: '2019-07-01 20:20:15',
      mcc: '7011',
      transactionId: '1111111',
      rrn: '013445145373',
      approvalCode: '11111',
      accountId: 'BY36MTBK10110008000001111000'
    }, accounts)

    expect(transaction).toEqual(null)
  })

  it('should return null if there is no amount', () => {
    const transaction = convertTransaction({
      amount: null,
      balance: '705.32',
      cardPan: null,
      curr: null,
      debitFlag: '0',
      description: 'Погашение основного долга по договору № 42009206 от 18.01.2019. Кредитополучатель: Собко Ольга Васильевна',
      error: null,
      operationDate: '2020-12-07',
      orderStatus: null,
      place: null,
      country: null,
      city: null,
      status: 'T',
      transAmount: null,
      transDate: '2020-12-05 19:02:25',
      mcc: null,
      transactionId: null,
      rrn: null,
      approvalCode: null,
      accountId: 'BY76MTBK30140008999900143576'
    }, accounts)

    expect(transaction).toEqual(null)
  })
})
