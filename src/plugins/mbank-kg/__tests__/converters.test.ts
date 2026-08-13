import {
  convertAccount,
  convertTransaction,
  makeTransactionUid,
  parseFormattedNumber,
  parseMBankDate,
  signedSum
} from '../converters'
import { AccountType } from '../../../types/zenmoney'
import { MBankStatementTransaction, TransactionWithId } from '../models'

const ACCOUNT_ID = '1033220210523058'

function raw (overrides: Partial<MBankStatementTransaction>): MBankStatementTransaction {
  return {
    date: '2026-05-28T20:42:00.000',
    debit: '0,00',
    credit: '0,00',
    payee: 'ОАО "МБАНК"',
    description: '',
    uid: 'uid-1',
    ...overrides
  }
}

describe('number/date helpers', () => {
  it('parses KGS-locale numbers (space thousands, comma decimal)', () => {
    expect(parseFormattedNumber('1 805 735,73')).toBe(1805735.73)
    expect(parseFormattedNumber('1 749,13')).toBe(1749.13)
    expect(parseFormattedNumber('0,00')).toBe(0)
  })

  it('parses US-locale numbers found inside descriptions', () => {
    expect(parseFormattedNumber('1,008.75')).toBe(1008.75)
    expect(parseFormattedNumber('305.00')).toBe(305)
  })

  it('parses MBank date-time', () => {
    expect(parseMBankDate('28.05.2026 20:42')).toBe('2026-05-28T20:42:00.000')
    expect(parseMBankDate('21.06.2026')).toBe('2026-06-21T00:00:00.000')
  })

  it('signs sums: credit positive, debit negative', () => {
    expect(signedSum('1 749,13', '0,00')).toBe(-1749.13)
    expect(signedSum('0,00', '5 000,00')).toBe(5000)
    expect(signedSum('0,00', '0,00')).toBe(0)
  })

  it('treats blank/unparseable amount cells as zero', () => {
    expect(signedSum('', '5 000,00')).toBe(5000)
    expect(signedSum('1 749,13', '')).toBe(-1749.13)
    expect(signedSum('', '')).toBe(0)
  })

  it('returns NaN for degenerate number cells', () => {
    expect(parseFormattedNumber('')).toBeNaN()
    expect(parseFormattedNumber('-')).toBeNaN()
    expect(parseFormattedNumber('.')).toBeNaN()
  })

  it('parses negative amounts', () => {
    expect(parseFormattedNumber('-1 234,56')).toBe(-1234.56)
  })
})

describe('makeTransactionUid', () => {
  const P = 'ОАО "МБАНК"'
  it('is deterministic and namespaced by account', () => {
    const a = makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '1 749,13', '0,00', 'STEAMGAMES.COM')
    const b = makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '1 749,13', '0,00', 'STEAMGAMES.COM')
    expect(a).toBe(b)
    expect(a.startsWith(ACCOUNT_ID + '#')).toBe(true)
  })

  it('differs when any field differs (incl. payee)', () => {
    const base = makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '1 749,13', '0,00', 'A')
    expect(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '1 749,13', '0,00', 'B')).not.toBe(base)
    expect(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:43', P, '1 749,13', '0,00', 'A')).not.toBe(base)
    expect(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '2 000,00', '0,00', 'A')).not.toBe(base)
    expect(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '1 749,13', '5,00', 'A')).not.toBe(base)
    expect(makeTransactionUid('9999', '28.05.2026 20:42', P, '1 749,13', '0,00', 'A')).not.toBe(base)
    // same date/amount/description but a different payer must not collide
    expect(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', 'Cafe B', '1 749,13', '0,00', 'A')).not.toBe(base)
  })

  it('disambiguates identical rows via the occurrence index', () => {
    const first = makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '100,00', '0,00', 'dup', 0)
    const second = makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '100,00', '0,00', 'dup', 1)
    expect(first).not.toBe(second)
    // occurrence 0 is the plain hash (no suffix), and stays stable.
    expect(first).toBe(makeTransactionUid(ACCOUNT_ID, '28.05.2026 20:42', P, '100,00', '0,00', 'dup'))
  })
})

describe('convertAccount', () => {
  it('builds a checking account', () => {
    expect(convertAccount({ id: ACCOUNT_ID, title: 'MBank *3058', balance: 1540069.11, instrument: 'KGS', date: '' })).toEqual({
      id: ACCOUNT_ID,
      type: AccountType.checking,
      title: 'MBank *3058',
      instrument: 'KGS',
      balance: 1540069.11,
      syncIds: [ACCOUNT_ID]
    })
  })
})

const cases: Array<[string, MBankStatementTransaction, TransactionWithId]> = [
  [
    'card POS → merchant from backslash fields',
    raw({
      debit: '1 749,13',
      description: '840\\912 1844160\\STEAMGAMES.COM 4259522985\\ 479338001153467\\',
      uid: 'uid-pos'
    }),
    {
      uid: 'uid-pos',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'STEAMGAMES.COM', mcc: null, location: null },
        comment: null,
        movements: [{ id: 'uid-pos', account: { id: ACCOUNT_ID }, invoice: null, sum: -1749.13, fee: 0 }]
      }
    }
  ],
  [
    'foreign-country FX → invoice in original currency',
    raw({
      debit: '26 687,50',
      description: 'Оплата услуг. Получатель: В другую страну. 2207991309/Малайзия/160167306246/Kirill Bereza/TNG Digital/d1753d66-1346-4704-ba76-0dd5b3f19e2b/305.00 019e9598-e112-7649-8ce0-f1e367097255/ Сумма 305.00 USD; Конвертация валют (из валюты 26687.5 KGS в валюту 305 USD).;  Курс операции: 87.5.;  Счет корреспондента 00000011-00011-840-000006266763 (ГОЛОВНОЙ БАНК).',
      uid: 'uid-fx'
    }),
    {
      uid: 'uid-fx',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'TNG Digital', mcc: null, location: null },
        comment: null,
        movements: [{ id: 'uid-fx', account: { id: ACCOUNT_ID }, invoice: { sum: -305, instrument: 'USD' }, sum: -26687.5, fee: 0 }]
      }
    }
  ],
  [
    'QR payment → merchant = recipient name',
    raw({
      debit: '100 000,00',
      description: 'Оплата услуг. Получатель: Перевод по QR. 996554185519/996554185519/Simbank/100,000.00 019e8240-ea84-777e-abef-98371aced217/ Сумма 100,000.00 KGS Счет корреспондента 00000011-00011-417-000002725191 (ГОЛОВНОЙ БАНК).',
      uid: 'uid-qr'
    }),
    {
      uid: 'uid-qr',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'Simbank', mcc: null, location: null },
        comment: null,
        movements: [{ id: 'uid-qr', account: { id: ACCOUNT_ID }, invoice: null, sum: -100000, fee: 0 }]
      }
    }
  ],
  [
    'phone transfer → merchant = payee name',
    raw({
      debit: '100 000,00',
      payee: 'Рахат Б.',
      description: 'Перевод по номеру телефона. 996550366144/ Рахат Б./  / Сумма 100,000.00 KGS Счет корреспондента 00020201-00003-417-000006975775 (ФИЛИАЛ "МЕДАКАДЕМИЯ" ОАО "МБАНК").',
      uid: 'uid-phone'
    }),
    {
      uid: 'uid-phone',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'Рахат Б.', mcc: null, location: null },
        comment: null,
        movements: [{ id: 'uid-phone', account: { id: ACCOUNT_ID }, invoice: null, sum: -100000, fee: 0 }]
      }
    }
  ],
  [
    'money envelope → merchant = sender, comment = message',
    raw({
      credit: '25 500,00',
      description: 'Перевод с денежным конвертом. 996554185519 / Кирилл Б. / День рождения / Сумма 25,500.00 KGS Счет корреспондента 00020202-20202-417-000005935614 (ГОЛОВНОЙ БАНК).',
      uid: 'uid-env'
    }),
    {
      uid: 'uid-env',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'Кирилл Б.', mcc: null, location: null },
        comment: 'День рождения',
        movements: [{ id: 'uid-env', account: { id: ACCOUNT_ID }, invoice: null, sum: 25500, fee: 0 }]
      }
    }
  ],
  [
    'salary credit → comment without MBIZ prefix, no merchant',
    raw({
      credit: '1 805 735,73',
      description: 'MBIZ_MBANK Заработная плата за Май 2026 г',
      uid: 'uid-salary'
    }),
    {
      uid: 'uid-salary',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: 'Заработная плата за Май 2026 г',
        movements: [{ id: 'uid-salary', account: { id: ACCOUNT_ID }, invoice: null, sum: 1805735.73, fee: 0 }]
      }
    }
  ],
  [
    'refund → plain comment, no merchant',
    raw({
      credit: '21,80',
      description: 'Возврат после корректировки платежа',
      uid: 'uid-refund'
    }),
    {
      uid: 'uid-refund',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: 'Возврат после корректировки платежа',
        movements: [{ id: 'uid-refund', account: { id: ACCOUNT_ID }, invoice: null, sum: 21.8, fee: 0 }]
      }
    }
  ],
  [
    'generic fallback with a real payee → merchant from payee column',
    raw({
      debit: '500,00',
      payee: 'OcOO Narodnyy',
      description: 'Оплата товаров',
      uid: 'uid-payee'
    }),
    {
      uid: 'uid-payee',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'OcOO Narodnyy', mcc: null, location: null },
        comment: 'Оплата товаров',
        movements: [{ id: 'uid-payee', account: { id: ACCOUNT_ID }, invoice: null, sum: -500, fee: 0 }]
      }
    }
  ],
  [
    'currency exchange → invoice in source currency, no empty comment',
    raw({
      credit: '2,28',
      description: 'Конвертация валют (из валюты 171.34 RUB в валюту 2.28 USD).; ПЛАТЕЛЬЩИК: 000005446305 RUB ПОЛУЧАТЕЛЬ: 000003892368 USD;  Курс операции: 75.',
      uid: 'uid-conv'
    }),
    {
      uid: 'uid-conv',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: null,
        movements: [{ id: 'uid-conv', account: { id: ACCOUNT_ID }, invoice: { sum: 171.34, instrument: 'RUB' }, sum: 2.28, fee: 0 }]
      }
    }
  ],
  [
    'currency exchange (debit side) → invoice in the destination currency',
    raw({
      debit: '2,28',
      description: 'Конвертация валют (из валюты 2.28 USD в валюту 171.34 RUB).;  Курс операции: 75.',
      uid: 'uid-conv2'
    }),
    {
      uid: 'uid-conv2',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: null,
        movements: [{ id: 'uid-conv2', account: { id: ACCOUNT_ID }, invoice: { sum: -171.34, instrument: 'RUB' }, sum: -2.28, fee: 0 }]
      }
    }
  ],
  [
    'pure boilerplate description → comment is null, not empty string',
    raw({
      debit: '10,00',
      description: 'Счет корреспондента 00000011-00011-417-000002725191 (ГОЛОВНОЙ БАНК).',
      uid: 'uid-bare'
    }),
    {
      uid: 'uid-bare',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: null,
        movements: [{ id: 'uid-bare', account: { id: ACCOUNT_ID }, invoice: null, sum: -10, fee: 0 }]
      }
    }
  ],
  [
    'USD card POS → merchant from backslash fields',
    raw({
      debit: '0,09',
      description: '372\\Dublin\\Google CLOUD DP77zM\\ 479631000202594\\',
      uid: 'uid-gcp'
    }),
    {
      uid: 'uid-gcp',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: { fullTitle: 'Google CLOUD DP77zM', mcc: null, location: null },
        comment: null,
        movements: [{ id: 'uid-gcp', account: { id: ACCOUNT_ID }, invoice: null, sum: -0.09, fee: 0 }]
      }
    }
  ],
  [
    'fallback comment strips the bank boilerplate tail',
    raw({
      debit: '100,00',
      description: 'Оплата услуг. Сумма 100.00 KGS Конвертация валют (из ...). Счет корреспондента 00000011 (ГОЛОВНОЙ БАНК).',
      uid: 'uid-clean'
    }),
    {
      uid: 'uid-clean',
      transaction: {
        hold: false,
        date: new Date('2026-05-28T20:42:00.000'),
        merchant: null,
        comment: 'Оплата услуг',
        movements: [{ id: 'uid-clean', account: { id: ACCOUNT_ID }, invoice: null, sum: -100, fee: 0 }]
      }
    }
  ]
]

it.each(cases)('convertTransaction: %s', (_title, input, expected) => {
  expect(convertTransaction(ACCOUNT_ID, input)).toEqual(expected)
})
