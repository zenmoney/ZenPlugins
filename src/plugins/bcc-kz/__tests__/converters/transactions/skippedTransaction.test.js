import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        oper_date: '12.04.2023',
        oper_time: '13:49',
        is_blocked: false,
        is_income: false,
        post_time: '12.04.2023',
        amount: 0,
        cur: 'KZT',
        fee: 0,
        cms: 0,
        title: 'Списание',
        description: 'Списание',
        image: 'transactions/db.png',
        rrn: '',
        trn_id: null,
        eci: ''
      },
      null
    ],
    [
      {
        oper_date: '07.08.2025',
        oper_time: '12:50',
        is_blocked: false,
        is_income: false,
        post_time: '07.08.2025',
        amount: 0,
        cur: 'KZT',
        fee: 500,
        cms: 500,
        title: 'Николаев Николай Николаевич',
        description: 'Николаев Николай Николаевич',
        image: 'banks/caspkzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 13550779061,
        trn_code: 2560,
        eci: '',
        refer: '37415C34A264C0CA3A84AFAD384909B6'
      },
      null
    ],
    [
      {
        oper_date: '03.10.2025',
        oper_time: '16:05',
        is_blocked: false,
        is_income: false,
        post_time: '03.10.2025',
        amount: 0,
        cur: 'KZT',
        fee: 500,
        cms: 500,
        title: 'Николаев Николай Николаевич',
        description: 'Николаев Николай Николаевич',
        image: 'banks/tseskzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 14214438890,
        trn_code: 2560,
        eci: '',
        refer: '97B33172A38CF9B1D81E20C1D4DFD6F7'
      },
      null
    ],
    [
      {
        oper_date: '10.12.2025',
        oper_time: '14:24',
        is_blocked: false,
        is_income: false,
        post_time: '10.12.2025',
        amount: 0,
        cur: 'KZT',
        fee: 500,
        cms: 500,
        title: 'Николаев Николай Николаевич',
        description: 'Николаев Николай Николаевич',
        image: 'banks/tseskzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 15099016775,
        trn_code: 2560,
        eci: '',
        refer: '807748679E034AB95EE6FFCBDCFAE0DB'
      },
      null
    ],
    [
      {
        oper_date: '23.06.2025',
        oper_time: '15:35',
        is_blocked: false,
        is_income: false,
        post_time: '23.06.2025',
        amount: 0,
        cur: 'KZT',
        fee: 756.52,
        cms: 756.52,
        title: 'Корпоративный Фонд "Фонд Социального Развития"',
        description: 'Корпоративный Фонд "Фонд Социального Развития"',
        image: 'banks/hsbkkzkx.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 13060018393,
        trn_code: 2560,
        eci: '',
        refer: '48FE45629AAD03CC393D9572483D92F7'
      },
      null
    ],
    [
      {
        oper_date: '18.09.2025',
        oper_time: '17:31',
        is_blocked: false,
        is_income: false,
        post_time: '18.09.2025',
        amount: 0,
        cur: 'KZT',
        fee: 500,
        cms: 500,
        title: 'Товарищество С Ограниченной Ответственностью "Юнайтед Парсел Сервис (Каз)"',
        description: 'Товарищество С Ограниченной Ответственностью "Юнайтед Парсел Сервис (Каз)"',
        image: 'banks/citikzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 14022645461,
        trn_code: 2560,
        eci: '',
        refer: '85D4B9E65CF70F8E40425251D74F685E'
      },
      null
    ],
    [
      {
        oper_date: '29.08.2025',
        oper_time: '17:10',
        is_blocked: false,
        is_income: false,
        post_time: '29.08.2025',
        amount: 0,
        cur: 'KZT',
        fee: 3000,
        cms: 3000,
        title: 'Товарищество С Ограниченной Ответственностью "Дадиал"',
        description: 'Товарищество С Ограниченной Ответственностью "Дадиал"',
        image: 'banks/irtykzka.png',
        bonus_prc: 0,
        rrn: '',
        trn_id: 13793971982,
        trn_code: 2560,
        eci: '',
        refer: '1540661315C0606D10BBC195CFC4C1E9'
      },
      null
    ]
  ])('converts skipped transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [
      {
        id: '1337',
        instrument: 'KZT'
      }
    ])).toEqual(transaction)
  })
})
