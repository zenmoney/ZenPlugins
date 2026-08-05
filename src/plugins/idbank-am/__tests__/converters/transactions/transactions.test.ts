import { convertTransaction, parseDate, parseDecimal, parseInstrument } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { Account, AccountType } from '../../../../../types/zenmoney'

const cardAccount: Account = {
  id: '12345678901200',
  type: AccountType.ccard,
  title: 'VISA GOLD USD *1200',
  instrument: 'USD',
  syncIds: ['12345678901200']
}

const bankAccount: Account = {
  id: '12345678901201',
  type: AccountType.checking,
  title: 'Bank account USD *1201',
  instrument: 'USD',
  syncIds: ['12345678901201']
}

const instrumentsByAccount = { 12345678901200: 'USD', 12345678901201: 'USD' }

describe('convertTransaction', () => {
  it.each([
    [
      'покупку по карте в валюте счёта',
      {
        Account: '12345678901200',
        Coper: 'DB',
        Currency: 'USD',
        DbAmount: '25.00',
        CrAmount: '0.00',
        Equivalent: 25,
        TransCurr: 'USD',
        CustomerName: 'EXAMPLE SHOP',
        Mcc: '5734',
        Reason: 'CPC',
        DocType: 'Payment',
        Refnum: 100000000000001,
        ValueDate: '01/02/2026 12:00:00',
        Details: 'Վճարում\r\n4111111111111111\r\n346247\r\n25\r\n840\r\n346247 7N3QWJUF\\840\\EXAMPLE.COM\\EXAMPLE SHOP \r\n5734\r\n12:00:00'
      },
      {
        hold: false,
        date: new Date('2026-02-01T08:00:00.000Z'),
        movements: [
          { id: '100000000000001', account: { id: '12345678901200' }, invoice: null, sum: -25, fee: 0 }
        ],
        merchant: { fullTitle: 'EXAMPLE.COM EXAMPLE SHOP', mcc: 5734, location: null },
        comment: null,
        groupKeys: ['100000000000001']
      }
    ],
    [
      'покупку по карте с конвертацией валюты',
      {
        Account: '12345678901200',
        Coper: 'DB',
        Currency: 'USD',
        DbAmount: '50.00',
        CrAmount: '0.00',
        Equivalent: 180,
        TransCurr: 'AED',
        CustomerName: 'EXAMPLE HOTEL',
        Mcc: '7011',
        Reason: 'CPC',
        DocType: 'Payment',
        Refnum: 100000000000002,
        ValueDate: '02/02/2026 10:30:00',
        Details: 'Վճարում\r\n4111111111111111\r\n900920\r\n180\r\n784\r\n900920 10375766\\784\\Springfield\\EXAMPLE HOTEL \r\n7011\r\n10:30:00'
      },
      {
        hold: false,
        date: new Date('2026-02-02T06:30:00.000Z'),
        movements: [
          { id: '100000000000002', account: { id: '12345678901200' }, invoice: { sum: -180, instrument: 'AED' }, sum: -50, fee: 0 }
        ],
        merchant: { fullTitle: 'Springfield EXAMPLE HOTEL', mcc: 7011, location: null },
        comment: null,
        groupKeys: ['100000000000002']
      }
    ],
    [
      'внешнее пополнение с конвертацией: устаревший код валюты RUR',
      {
        Account: '12345678901200',
        Coper: 'CR',
        Currency: 'USD',
        DbAmount: '0.00',
        CrAmount: '1,000.00',
        Equivalent: 80000,
        TransCurr: 'RUR',
        CustomerName: 'IVAN IVANOV',
        Mcc: '',
        Reason: 'BMMO',
        DocType: 'Currency exchange',
        Coracnt: '98765432109876',
        Refnum: 100000000000003,
        ValueDate: '03/02/2026 09:15:00',
        Details: '#Sender.IVAN IVANOV,\r\n Mobile number.37400000000'
      },
      {
        hold: false,
        date: new Date('2026-02-03T05:15:00.000Z'),
        movements: [
          { id: '100000000000003', account: { id: '12345678901200' }, invoice: { sum: 80000, instrument: 'RUB' }, sum: 1000, fee: 0 }
        ],
        merchant: null,
        comment: '#Sender.IVAN IVANOV, Mobile number.37400000000',
        groupKeys: ['100000000000003']
      }
    ],
    [
      'операцию без MCC, названия места и контрагента',
      {
        Account: '12345678901200',
        Coper: 'DB',
        Currency: 'USD',
        DbAmount: '10.00',
        CrAmount: '0.00',
        Equivalent: 10,
        TransCurr: 'USD',
        Mcc: '',
        Reason: 'BMMO',
        DocType: 'Transfer',
        Refnum: 100000000000004,
        ValueDate: '04/02/2026 18:00:00'
      },
      {
        hold: false,
        date: new Date('2026-02-04T14:00:00.000Z'),
        movements: [
          { id: '100000000000004', account: { id: '12345678901200' }, invoice: null, sum: -10, fee: 0 }
        ],
        merchant: null,
        comment: null,
        groupKeys: ['100000000000004']
      }
    ]
  ])('converts %s', (_, apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, cardAccount, instrumentsByAccount)).toEqual(transaction)
  })
})

describe('перевод между своими счетами', () => {
  // Банк отдаёт операцию в выписке обоих счетов с общим Refnum, а в Equivalent
  // кладёт учётную сумму в драмах, хотя обе стороны в долларах
  const outcome = {
    Account: '12345678901200',
    Coper: 'DB',
    Currency: 'USD',
    DbAmount: '40.00',
    CrAmount: '0.00',
    Equivalent: 15000,
    TransCurr: 'AMD',
    CustomerName: 'IVAN IVANOV',
    Mcc: '',
    Reason: 'BMMO',
    DocType: 'Transfer',
    Coracnt: '12345678901201',
    Refnum: 100000000000005,
    ValueDate: '05/02/2026 15:45:00',
    Details: 'Bank account replenishment'
  }
  const income = {
    ...outcome,
    Account: '12345678901201',
    Coper: 'CR',
    DbAmount: '0.00',
    CrAmount: '40.00',
    Coracnt: '12345678901200'
  }

  it('не выдумывает конвертацию валюты, которой не было', () => {
    const transaction = convertTransaction(outcome, cardAccount, instrumentsByAccount)
    expect(transaction.movements[0].invoice).toBeNull()
  })

  it('сводит обе стороны в одну операцию с двумя движениями', () => {
    const transactions = adjustTransactions({
      transactions: [
        convertTransaction(outcome, cardAccount, instrumentsByAccount),
        convertTransaction(income, bankAccount, instrumentsByAccount)
      ]
    })

    expect(transactions).toHaveLength(1)
    expect(transactions[0].movements).toEqual([
      { id: '100000000000005', account: { id: '12345678901200' }, invoice: null, sum: -40, fee: 0 },
      { id: '100000000000005', account: { id: '12345678901201' }, invoice: null, sum: 40, fee: 0 }
    ])
  })
})

describe('краевые случаи', () => {
  const purchase = {
    Account: '12345678901200',
    Coper: 'DB',
    Currency: 'USD',
    DbAmount: '20.00',
    CrAmount: '0.00',
    Equivalent: 20,
    TransCurr: 'USD',
    Mcc: '5411',
    Refnum: 100000000000006,
    ValueDate: '06/02/2026 11:00:00'
  }

  it('берёт место как название, когда контрагент не пришёл', () => {
    const details = 'Վճարում\\643\\Springfield\\'
    const { merchant } = convertTransaction({ ...purchase, Details: details }, cardAccount, instrumentsByAccount)
    expect(merchant).toEqual({ fullTitle: 'Springfield', mcc: 5411, location: null })
  })

  it('не считает мерчантом операцию с пустым MCC, а Details кладёт в комментарий', () => {
    const transaction = convertTransaction(
      { ...purchase, Mcc: '0', Details: 'Cash   withdrawal\r\n  ATM' },
      cardAccount,
      instrumentsByAccount
    )
    expect(transaction.merchant).toBeNull()
    expect(transaction.comment).toEqual('Cash withdrawal ATM')
  })

  it('не уносит номер карты из Details в комментарий операции', () => {
    const { comment } = convertTransaction(
      { ...purchase, Mcc: '', Details: 'Վճարում\r\n4111111111111111\r\n346247\r\nCash withdrawal' },
      cardAccount,
      instrumentsByAccount
    )
    expect(comment).not.toContain('4111111111111111')
    expect(comment).toContain('Cash withdrawal')
  })

  it('обходится без валюты операции: считает её валютой счёта', () => {
    const { movements } = convertTransaction({ ...purchase, TransCurr: undefined }, cardAccount, instrumentsByAccount)
    expect(movements[0].invoice).toBeNull()
  })

  it('оставляет конвертацию при переводе между своими счетами разных валют', () => {
    const transaction = convertTransaction(
      { ...purchase, TransCurr: 'AMD', Equivalent: 7700, Coracnt: '12345678901202', Mcc: '' },
      cardAccount,
      { ...instrumentsByAccount, 12345678901202: 'AMD' }
    )
    expect(transaction.movements[0].invoice).toEqual({ sum: -7700, instrument: 'AMD' })
  })
})

describe('разбор значений', () => {
  it.each([
    ['840', 'USD'],
    ['051', 'AMD'],
    ['818', 'EGP'],
    ['USD', 'USD'],
    ['AMD', 'AMD'],
    ['RUR', 'RUB']
  ])('parseInstrument(%s) === %s', (code, instrument) => {
    expect(parseInstrument(code)).toEqual(instrument)
  })

  it.each([
    ['1,234.50', 1234.5],
    ['0.00', 0],
    ['250,000.00', 250000]
  ])('parseDecimal(%s) === %s', (value, expected) => {
    expect(parseDecimal(value)).toEqual(expected)
  })

  it.each([
    ['05/02/2026 15:45:00', '2026-02-05T11:45:00.000Z'],
    ['01/01/2026', '2025-12-31T20:00:00.000Z']
  ])('parseDate(%s) === %s', (value, expected) => {
    expect(parseDate(value)).toEqual(new Date(expected))
  })
})
