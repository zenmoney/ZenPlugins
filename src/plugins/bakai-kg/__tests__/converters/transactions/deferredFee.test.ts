import { convertTransactions } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { AccountType } from '../../../../../types/zenmoney'

const account = { id: '1006', type: AccountType.ccard as const, title: 'Test card', instrument: 'USD', syncIds: [] }
const from = new Date('2026-04-01T00:00:00+06:00')

it('books the issuer fee on its own date while retaining the complete statement', () => {
  // mail_inbound 172741, build 3. Complete card.online_statement operation array; public-safe references retained from the existing fixture.
  const records = [
    {
      amount: -300.9,
      currency: 'USD',
      date: '2026-10-21T11:36:38+06:00',
      date2: '2026-10-21T05:36:13+06:00',
      location: 'Hobbiton Movie Set Tou',
      operation_amount: -520,
      operation_currency: 'NZD',
      type: 'Покупка',
      type_code: '680',
      utrnno: '723660074',
      merchant_id: '733333333521850',
      balance: 5451,
      rrn: '952738330867',
      terminal_id: '3334',
      mcc: 7991,
      comment: null
    },
    {
      amount: 336.95,
      currency: 'USD',
      date: '2026-10-21T04:48:17+06:00',
      date2: '2026-10-21T04:48:17+06:00',
      location: 'Online Bank CBS',
      operation_amount: 336.95,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '723444419',
      merchant_id: 'OB100001',
      balance: 355.41,
      rrn: '333723444419',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: -254.16,
      currency: 'USD',
      date: '2026-10-21T02:38:34+06:00',
      date2: '2026-10-20T20:38:33+06:00',
      location: 'Immigration New Zealan',
      operation_amount: -441,
      operation_currency: 'NZD',
      type: 'Покупка',
      type_code: '680',
      utrnno: '723329018',
      merchant_id: '63364232541',
      balance: 1846,
      rrn: '952653646047',
      terminal_id: 'WNZS5I75',
      mcc: 9399,
      comment: null
    },
    {
      amount: 22.46,
      currency: 'USD',
      date: '2026-10-21T02:34:56+06:00',
      date2: '2026-10-21T02:34:56+06:00',
      location: 'Online Bank CBS',
      operation_amount: 22.46,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '723329549',
      merchant_id: 'OB100001',
      balance: 355.41,
      rrn: '333723329549',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: 235.86,
      currency: 'USD',
      date: '2026-10-21T02:31:35+06:00',
      date2: '2026-10-21T02:31:35+06:00',
      location: 'Online Bank CBS',
      operation_amount: 235.86,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '723328956',
      merchant_id: 'OB100001',
      balance: 355.41,
      rrn: '333723328956',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: -299.69,
      currency: 'USD',
      date: '2026-10-18T20:07:27+06:00',
      date2: '2026-10-18T14:06:48+06:00',
      location: 'Hobbiton Movie Set Tou',
      operation_amount: -520,
      operation_currency: 'NZD',
      type: 'Покупка',
      type_code: '680',
      utrnno: '710317684',
      merchant_id: '733333333521850',
      balance: 1430,
      rrn: '952447862766',
      terminal_id: '3334',
      mcc: 7991,
      comment: null
    },
    {
      amount: 302.86,
      currency: 'USD',
      date: '2026-10-18T20:02:24+06:00',
      date2: '2026-10-18T20:02:24+06:00',
      location: 'Online Bank CBS',
      operation_amount: 322.86,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '710301130',
      merchant_id: 'OB100001',
      balance: 14.3,
      rrn: '333710301130',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: 11.13,
      currency: 'USD',
      date: '2026-10-18T20:01:12+06:00',
      date2: '2026-10-18T20:01:12+06:00',
      location: 'Online Bank CBS',
      operation_amount: 11.13,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '710300985',
      merchant_id: 'OB100001',
      balance: 14.3,
      rrn: '333710300985',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-10-05T00:00:00+06:00',
      date2: '2026-10-05T10:40:26+06:00',
      location: null,
      operation_amount: -20,
      operation_currency: 'USD',
      type: 'Комиссия эмитента',
      type_code: 'OPTP0119',
      utrnno: null,
      merchant_id: null,
      balance: -20,
      rrn: null,
      mcc: null,
      terminal_id: null
    }
  ]
  expect(adjustTransactions({ transactions: convertTransactions(records, account, from) })).toEqual([
    {
      hold: null,
      date: new Date('2026-10-21T11:36:38+06:00'),
      movements: [
        {
          id: '723660074:debit',
          account: {
            id: '1006'
          },
          invoice: {
            sum: -520,
            instrument: 'NZD'
          },
          sum: -300.9,
          fee: 0
        }
      ],
      merchant: {
        title: 'Hobbiton Movie Set Tou',
        city: null,
        country: null,
        mcc: 7991,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-21T04:48:17+06:00'),
      movements: [
        {
          id: '723444419:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 336.95,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-21T02:38:34+06:00'),
      movements: [
        {
          id: '723329018:debit',
          account: {
            id: '1006'
          },
          invoice: {
            sum: -441,
            instrument: 'NZD'
          },
          sum: -254.16,
          fee: 0
        }
      ],
      merchant: {
        title: 'Immigration New Zealan',
        city: null,
        country: null,
        mcc: 9399,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-21T02:34:56+06:00'),
      movements: [
        {
          id: '723329549:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 22.46,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-21T02:31:35+06:00'),
      movements: [
        {
          id: '723328956:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 235.86,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-18T20:07:27+06:00'),
      movements: [
        {
          id: '710317684:debit',
          account: {
            id: '1006'
          },
          invoice: {
            sum: -520,
            instrument: 'NZD'
          },
          sum: -299.69,
          fee: 0
        }
      ],
      merchant: {
        title: 'Hobbiton Movie Set Tou',
        city: null,
        country: null,
        mcc: 7991,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-18T20:02:24+06:00'),
      movements: [
        {
          id: '710301130:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 322.86,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-18T20:01:12+06:00'),
      movements: [
        {
          id: '710300985:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 11.13,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-05T00:00:00+06:00'),
      movements: [
        {
          id: null,
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -20,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссия эмитента'
    }
  ])
})

it('keeps the full P2P credit and the earlier issuer charge separate', () => {
  // mail_inbound 169869, build 3. Complete selected credit and fee records from card.online_statement; public-safe counterparty retained from the existing fixture.
  const records = [
    {
      amount: 10,
      currency: 'USD',
      date: '2026-07-09T00:00:00+06:00',
      date2: '2026-07-14T07:37:25+06:00',
      location: 'UNID*IVAN IVANOV',
      operation_amount: 30,
      operation_currency: 'USD',
      type: 'P2P Credit',
      type_code: 'OPTP0026',
      utrnno: '606951158',
      merchant_id: '3811I381130',
      balance: 17.4,
      rrn: null,
      mcc: '6012',
      terminal_id: 'I381130 '
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-06-30T00:00:00+06:00',
      date2: '2026-06-30T20:00:09+06:00',
      location: null,
      operation_amount: -20,
      operation_currency: 'USD',
      type: 'Комиссия эмитента',
      type_code: 'OPTP0119',
      utrnno: null,
      merchant_id: null,
      balance: -11.54,
      rrn: null,
      mcc: null,
      terminal_id: null
    }
  ]
  expect(adjustTransactions({ transactions: convertTransactions(records, account, from) })).toEqual([
    {
      hold: null,
      date: new Date('2026-07-09T00:00:00+06:00'),
      movements: [
        {
          id: '606951158:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 30,
          fee: 0
        }
      ],
      merchant: {
        title: 'UNID*IVAN IVANOV',
        city: null,
        country: null,
        mcc: 6012,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-06-30T00:00:00+06:00'),
      movements: [
        {
          id: null,
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -20,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссия эмитента'
    }
  ])
})

it('imports an issuer charge without requiring a later replenishment', () => {
  // mail_inbound 222248, build 10, 2026-11-17. Complete card.online_statement operation array. The running balance drops from 70 to 58 on the 12 USD charge.
  const records = [
    {
      amount: -22.39,
      currency: 'USD',
      date: '2026-11-16T21:31:11+06:00',
      date2: '2026-11-16T15:31:11+06:00',
      location: 'GOOGLE*GOOGLE*ONE 15A',
      operation_amount: -22.39,
      operation_currency: 'USD',
      type: 'Покупка',
      type_code: '680',
      utrnno: '520065526',
      merchant_id: '18777015',
      balance: 561,
      rrn: '632015741183',
      terminal_id: 'WPGTID01',
      mcc: 7372,
      comment: null
    },
    {
      amount: -30,
      currency: 'USD',
      date: '2026-11-09T12:25:14+06:00',
      date2: '2026-11-09T12:25:14+06:00',
      location: 'MB BAKAI BANK',
      operation_amount: -30,
      operation_currency: 'USD',
      type: 'Р2Р списание',
      type_code: 'OPTP0010',
      utrnno: '511314599',
      merchant_id: 'MB100001',
      balance: 28,
      rrn: '000511314599',
      mcc: '6532',
      terminal_id: 'MB100001'
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-10-27T00:00:00+06:00',
      date2: '2026-10-27T20:00:06+06:00',
      location: null,
      operation_amount: -12,
      operation_currency: 'USD',
      type: 'Комиссия эмитента',
      type_code: 'OPTP0119',
      utrnno: null,
      merchant_id: null,
      balance: 58,
      rrn: null,
      mcc: null,
      terminal_id: null
    },
    {
      amount: -7.72,
      currency: 'USD',
      date: '2026-09-16T21:30:10+06:00',
      date2: '2026-09-16T21:30:10+06:00',
      location: 'MB BAKAI BANK',
      operation_amount: -7.72,
      operation_currency: 'USD',
      type: 'Р2Р списание',
      type_code: 'OPTP0010',
      utrnno: '450154468',
      merchant_id: 'MB100001',
      balance: 70,
      rrn: '000450154468',
      mcc: '6532',
      terminal_id: 'MB100001'
    },
    {
      amount: -5,
      currency: 'USD',
      date: '2026-08-07T09:24:41+06:00',
      date2: '2026-08-07T09:24:41+06:00',
      location: 'MB BAKAI BANK',
      operation_amount: -5,
      operation_currency: 'USD',
      type: 'Р2Р списание',
      type_code: 'OPTP0010',
      utrnno: '402216985',
      merchant_id: 'MB100001',
      balance: 77.72,
      rrn: '000402216985',
      mcc: '6532',
      terminal_id: 'MB100001'
    },
    {
      amount: -20,
      currency: 'USD',
      date: '2026-08-03T15:20:04+06:00',
      date2: '2026-08-03T15:20:04+06:00',
      location: 'MB BAKAI BANK',
      operation_amount: -20,
      operation_currency: 'USD',
      type: 'Р2Р списание',
      type_code: 'OPTP0010',
      utrnno: '398096197',
      merchant_id: 'MB100001',
      balance: 82.72,
      rrn: '000398096197',
      mcc: '6532',
      terminal_id: 'MB100001'
    },
    {
      amount: -4.99,
      currency: 'USD',
      date: '2026-05-21T00:00:00+06:00',
      date2: '2026-05-26T07:26:26+06:00',
      location: 'APPLE.COM/BILL',
      operation_amount: -4.99,
      operation_currency: 'USD',
      type: 'Покупка',
      type_code: 'OPTP0000',
      utrnno: '325451448',
      merchant_id: '207002000200925',
      balance: 102.72,
      rrn: null,
      mcc: '5818',
      terminal_id: '        '
    }
  ]
  expect(convertTransactions(records, account, from)).toEqual([
    {
      hold: null,
      date: new Date('2026-11-16T21:31:11+06:00'),
      movements: [
        {
          id: '520065526:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -22.39,
          fee: 0
        }
      ],
      merchant: {
        title: 'GOOGLE*GOOGLE*ONE 15A',
        city: null,
        country: null,
        mcc: 7372,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-11-09T12:25:14+06:00'),
      movements: [
        {
          id: '511314599:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -30,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'USD',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 30,
          fee: 0
        }
      ],
      merchant: {
        title: 'MB BAKAI BANK',
        city: null,
        country: null,
        mcc: 6532,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-10-27T00:00:00+06:00'),
      movements: [
        {
          id: null,
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -12,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссия эмитента'
    },
    {
      hold: null,
      date: new Date('2026-09-16T21:30:10+06:00'),
      movements: [
        {
          id: '450154468:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -7.72,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'USD',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 7.72,
          fee: 0
        }
      ],
      merchant: {
        title: 'MB BAKAI BANK',
        city: null,
        country: null,
        mcc: 6532,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-08-07T09:24:41+06:00'),
      movements: [
        {
          id: '402216985:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -5,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'USD',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 5,
          fee: 0
        }
      ],
      merchant: {
        title: 'MB BAKAI BANK',
        city: null,
        country: null,
        mcc: 6532,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-08-03T15:20:04+06:00'),
      movements: [
        {
          id: '398096197:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -20,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'USD',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 20,
          fee: 0
        }
      ],
      merchant: {
        title: 'MB BAKAI BANK',
        city: null,
        country: null,
        mcc: 6532,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-05-21T00:00:00+06:00'),
      movements: [
        {
          id: '325451448:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -4.99,
          fee: 0
        }
      ],
      merchant: {
        title: 'APPLE.COM/BILL',
        city: null,
        country: null,
        mcc: 5818,
        location: null
      },
      comment: null
    }
  ])
})

it('preserves full and partial replenishments after issuer charges', () => {
  // mail_inbound 222265, build 10, 2026-11-17. Complete card.online_statement operation array. The 15 USD credit clears the -15 balance; the 19.97 USD credit clears -19.97 after a 20 USD fee.
  const records = [
    {
      amount: 5.99,
      currency: 'USD',
      date: '2026-11-18T00:33:07+06:00',
      date2: '2026-11-18T00:33:07+06:00',
      location: 'Online Bank CBS',
      operation_amount: 5.99,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: '760',
      utrnno: '521522615',
      merchant_id: 'OB100001',
      balance: 599,
      rrn: '000521522615',
      terminal_id: 'OB100001',
      mcc: 6010,
      comment: 'perevod sam sebe'
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-11-12T14:21:38+06:00',
      date2: '2026-11-12T14:21:38+06:00',
      location: 'Online Bank CBS',
      operation_amount: 15,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '515090855',
      merchant_id: 'OB100001',
      balance: 0,
      rrn: '000515090855',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-11-11T14:57:52+06:00',
      date2: '2026-11-11T14:57:52+06:00',
      location: null,
      operation_amount: -15,
      operation_currency: 'USD',
      type: 'Комиссия эмитента',
      type_code: 'OPTP0119',
      utrnno: null,
      merchant_id: null,
      balance: -15,
      rrn: null,
      mcc: null,
      terminal_id: null
    },
    {
      amount: 0.03,
      currency: 'USD',
      date: '2026-10-12T16:30:28+06:00',
      date2: '2026-10-12T16:30:28+06:00',
      location: 'Online Bank CBS',
      operation_amount: 19.97,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '479723676',
      merchant_id: 'OB100001',
      balance: 0,
      rrn: '000479723676',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: 0,
      currency: 'USD',
      date: '2026-10-09T00:00:00+06:00',
      date2: '2026-10-09T20:00:06+06:00',
      location: null,
      operation_amount: -20,
      operation_currency: 'USD',
      type: 'Комиссия эмитента',
      type_code: 'OPTP0119',
      utrnno: null,
      merchant_id: null,
      balance: -19.97,
      rrn: null,
      mcc: null,
      terminal_id: null
    },
    {
      amount: 6,
      currency: 'USD',
      date: '2026-10-04T01:39:44+06:00',
      date2: '2026-10-04T01:39:44+06:00',
      location: 'Online Bank CBS',
      operation_amount: 6,
      operation_currency: 'USD',
      type: 'Пополнение счета',
      type_code: 'OPTP0422',
      utrnno: '470125951',
      merchant_id: 'OB100001',
      balance: 0.03,
      rrn: '000470125951',
      mcc: '6010',
      terminal_id: 'OB100001'
    },
    {
      amount: -5.99,
      currency: 'USD',
      date: '2026-10-04T00:00:00+06:00',
      date2: '2026-10-07T10:16:24+06:00',
      location: 'APPLE.COM/BILL',
      operation_amount: -5.99,
      operation_currency: 'USD',
      type: 'Покупка',
      type_code: 'OPTP0000',
      utrnno: '470126217',
      merchant_id: '207002000200925',
      balance: 0.03,
      rrn: null,
      mcc: '5818',
      terminal_id: '        '
    },
    {
      amount: -5.99,
      currency: 'USD',
      date: '2026-09-02T00:00:00+06:00',
      date2: '2026-09-07T07:24:38+06:00',
      location: 'APPLE.COM/BILL',
      operation_amount: -5.99,
      operation_currency: 'USD',
      type: 'Покупка',
      type_code: 'OPTP0000',
      utrnno: '431659349',
      merchant_id: '207002000200925',
      balance: 0.02,
      rrn: null,
      mcc: '5818',
      terminal_id: '        '
    }
  ]
  expect(convertTransactions(records, account, from)).toEqual([
    {
      hold: null,
      date: new Date('2026-11-18T00:33:07+06:00'),
      movements: [
        {
          id: '521522615:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 5.99,
          fee: 0
        }
      ],
      merchant: {
        title: 'Online Bank CBS',
        city: null,
        country: null,
        mcc: 6010,
        location: null
      },
      comment: 'perevod sam sebe'
    },
    {
      hold: null,
      date: new Date('2026-11-12T14:21:38+06:00'),
      movements: [
        {
          id: '515090855:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 15,
          fee: 0
        }
      ],
      merchant: null,
      comment: null,
      groupKeys: [
        'bakai:USD:15:29907861'
      ]
    },
    {
      hold: null,
      date: new Date('2026-11-11T14:57:52+06:00'),
      movements: [
        {
          id: null,
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -15,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссия эмитента'
    },
    {
      hold: null,
      date: new Date('2026-10-12T16:30:28+06:00'),
      movements: [
        {
          id: '479723676:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 19.97,
          fee: 0
        }
      ],
      merchant: null,
      comment: null,
      groupKeys: [
        'bakai:USD:19.97:29863350'
      ]
    },
    {
      hold: null,
      date: new Date('2026-10-09T00:00:00+06:00'),
      movements: [
        {
          id: null,
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -20,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссия эмитента'
    },
    {
      hold: null,
      date: new Date('2026-10-04T01:39:44+06:00'),
      movements: [
        {
          id: '470125951:credit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: 6,
          fee: 0
        }
      ],
      merchant: null,
      comment: null,
      groupKeys: [
        'bakai:USD:6:29850939'
      ]
    },
    {
      hold: null,
      date: new Date('2026-10-04T00:00:00+06:00'),
      movements: [
        {
          id: '470126217:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -5.99,
          fee: 0
        }
      ],
      merchant: {
        title: 'APPLE.COM/BILL',
        city: null,
        country: null,
        mcc: 5818,
        location: null
      },
      comment: null
    },
    {
      hold: null,
      date: new Date('2026-09-02T00:00:00+06:00'),
      movements: [
        {
          id: '431659349:debit',
          account: {
            id: '1006'
          },
          invoice: null,
          sum: -5.99,
          fee: 0
        }
      ],
      merchant: {
        title: 'APPLE.COM/BILL',
        city: null,
        country: null,
        mcc: 5818,
        location: null
      },
      comment: null
    }
  ])
})

it('[model] keeps duplicate ingested movements reportable', () => {
  // Repeating one observed source record models an ingestion overlap, not a new bank response.
  // mail_inbound 172741, build 3, complete selected card.online_statement credit.
  const record = {
    amount: 302.86,
    currency: 'USD',
    date: '2026-10-18T20:02:24+06:00',
    date2: '2026-10-18T20:02:24+06:00',
    location: 'Online Bank CBS',
    operation_amount: 322.86,
    operation_currency: 'USD',
    type: 'Пополнение счета',
    type_code: 'OPTP0422',
    utrnno: '710301130',
    merchant_id: 'OB100001',
    balance: 14.3,
    rrn: '333710301130',
    mcc: '6010',
    terminal_id: 'OB100001'
  }
  expect(() => convertTransactions([record, record], account, from)).toThrow('Duplicate bank movement identity requires protocol research')
})
