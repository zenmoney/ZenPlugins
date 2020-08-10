import {
  convertUzcardCardTransaction
  // convertHumoCardTransaction,
  // convertVisaCardTransaction,
  // convertWalletTransaction,
  // convertAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '860049***2185',
        utime: 1595668623000,
        udate: 1595668623000,
        terminal: '92900678',
        resp: '-1',
        city: 'Uzbekiston',
        reqamt: '160 000,00',
        merchant: '90510000205',
        merchantName: 'CHZAKB DAVR BANK',
        reversal: false,
        street: 'Navoiy   Zarkaynar Blok A',
        credit: false,
        transType: '683',
        utrnno: 9053825023,
        actamt: 16000000
      },
      {
        date: new Date('2020-07-25T09:17:03.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: 'Uzbekiston',
          title: 'CHZAKB DAVR BANK',
          // mcc: null,
          location: 'Navoiy   Zarkaynar Blok A'
        },
        movements: [
          {
            id: '9053825023',
            // account: { id: 'account' },
            invoice: null,
            sum: -160000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        hpan: '860049***2185',
        utime: 1594792387000,
        udate: 1594792387000,
        terminal: '91100024',
        resp: '-1',
        city: '-',
        reqamt: '2 000 000,00',
        merchant: '90490007772',
        merchantName: 'YASHNABADSKIY FILIAL OAKB',
        reversal: false,
        street: 'Toshkent shahri, Yashnobod tuma',
        credit: true,
        transType: '760',
        utrnno: 8991874667,
        actamt: 200000000
      },
      {
        date: new Date('2020-07-15T05:53:07.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: '-',
          title: 'YASHNABADSKIY FILIAL OAKB',
          // mcc: null,
          location: 'Toshkent shahri, Yashnobod tuma'
        },
        movements: [
          {
            id: '8991874667',
            // account: { id: 'account' },
            invoice: null,
            sum: 2000000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome', (rawTransaction, transaction) => {
    const cardId = { id: 'cardId', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(cardId, rawTransaction)).toEqual(transaction)
  })
})

/*
    [
      {
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '646097163642126012',
        title: 'Дополнительное списание по операции',
        amount: 6.71,
        direction: 'out',
        datetime: '2020-06-21T23:26:03Z',
        status: 'success',
        type: 'payment-shop',
        spendingCategories: [{ name: 'Deposition', sum: -6.71 }],
        amount_currency: 'RUB',
        is_sbp_operation: false
      },
      {
        date: new Date('2020-06-21T23:26:03.000Z'),
        hold: false,
        comment: 'Дополнительное списание по операции',
        merchant: null,
        movements: [
          {
            id: '646097163642126012',
            account: { id: 'account' },
            invoice: null,
            sum: -6.71,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '645754267315047012',
        title: 'Дополнительное зачисление по операции',
        amount: 0.31,
        direction: 'in',
        datetime: '2020-06-18T00:11:07Z',
        status: 'success',
        type: 'deposition',
        spendingCategories: [{ name: 'Deposition', sum: 0.31 }],
        amount_currency: 'RUB',
        is_sbp_operation: false
      },
      {
        date: new Date('2020-06-18T00:11:07.000Z'),
        hold: false,
        comment: 'Дополнительное зачисление по операции',
        merchant: null,
        movements: [
          {
            id: '645754267315047012',
            account: { id: 'account' },
            invoice: null,
            sum: 0.31,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        pattern_id: 'p2p',
        operation_id: '549866839017090007',
        title: 'Поддержка проекта «Скрытый смысл»',
        amount: 100,
        direction: 'out',
        datetime: '2017-06-04T04:47:22Z',
        status: 'success',
        type: 'outgoing-transfer',
        group_id: 'type_history_p2p_outgoing_all',
        label: ''
      },
      {
        date: new Date('2017-06-04T04:47:22Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'Скрытый смысл',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '549866839017090007',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        amount: 100,
        datetime: '2017-03-11T10:04:34Z',
        direction: 'out',
        group_id: 'type_history_p2p_outgoing_all',
        operation_id: '542541865986110009',
        pattern_id: 'p2p',
        status: 'success',
        title: 'Благодарность проекту BSP',
        type: 'outgoing-transfer'
      },
      {
        date: new Date('2017-03-11T10:04:34Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'BSP',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '542541865986110009',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it.each([
    [
      {
        amount: 60,
        datetime: '2017-08-30T11:30:53Z',
        direction: 'out',
        group_id: 'mcc_8999',
        operation_id: '557364654240923932',
        status: 'success',
        title: 'PP*2649CODE',
        type: 'payment-shop'
      },
      {
        comment: null,
        date: new Date('2017-08-30T11:30:53.000Z'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'PP*2649CODE',
          mcc: 8999,
          location: null
        },
        movements: [
          {
            id: '557364654240923932',
            account: {
              id: 'account'
            },
            invoice: null,
            sum: -60,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome with mcc', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  it.each([
    [
      {
        group_id: 'mcc_5411',
        operation_id: '618645189097589255',
        title: 'SHOP "EVROOPT" MVV',
        amount: 27.31,
        direction: 'out',
        datetime: '2019-08-09T17:53:09Z',
        status: 'success',
        type: 'payment-shop',
        spendingCategories: [{ name: 'Groceries', sum: 27.31 }],
        amount_currency: 'BYN'
      },
      {
        hold: false,
        date: new Date('2019-08-09T17:53:09.000Z'),
        movements: [
          {
            id: '618645189097589255',
            account: { id: 'account' },
            invoice: {
              sum: -27.31,
              instrument: 'BYN'
            },
            sum: null,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'SHOP "EVROOPT" MVV',
          mcc: 5411,
          location: null
        },
        comment: null
      }
    ]
  ])('converts currency outcome', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})

 */
