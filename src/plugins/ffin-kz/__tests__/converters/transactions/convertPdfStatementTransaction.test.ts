import { convertPdfStatementTransaction } from '../../../converters/transactions'
import { AccountType } from '../../../../../types/zenmoney'

describe('convertPdfStatementTransaction', () => {
  it('parses outcome with merchant location and strips city/country from title', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-10-14T00:00:00.000Z',
      originalAmount: null,
      amount: '-1 400,00 ₸',
      description: 'Покупка COFFEE BOOM COFFEE HOUSE ALMATY KZ',
      statementUid: 'statement-uid',
      originString: '14.10.2025 Покупка COFFEE BOOM COFFEE HOUSE ALMATY KZ -1 400,00 ₸'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(1)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: -1400,
      invoice: null
    }))
    expect(tx.merchant).toEqual({
      title: 'COFFEE BOOM COFFEE HOUSE',
      city: 'Almaty',
      country: 'Kazakhstan',
      mcc: null,
      location: null,
      category: null
    })
    expect(tx.comment).toBeNull()
    expect(tx.hold).toBe(false)
    expect(tx.date).toEqual(new Date(rawTransaction.date))
  })

  it('creates transfer stub for cash operations', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-11-01T00:00:00.000',
      originalAmount: null,
      amount: '-10 000,00 ₸',
      description: 'Снятие наличных',
      statementUid: 'cash-uid',
      originString: '01.11.2025 Снятие наличных -10 000,00 ₸'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    const [m1, m2] = tx.movements
    if (m1 == null || m2 == null) {
      throw new Error('Movements missing')
    }
    expect(m1.account).toEqual({ id: 'KZCARD0001' })
    expect(m2.account).toEqual({
      type: AccountType.cash,
      instrument: 'KZT',
      company: null,
      syncIds: null
    })
    expect(m1.sum).toBe(-10000)
    expect(m2.sum).toBe(10000)
    expect(tx.merchant).toBeNull()
  })

  it('internal purchase without merchant info results in single movement', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-15T00:00:00.000Z',
      originalAmount: null,
      amount: '-2 500,00 ₸',
      description: 'Покупка',
      statementUid: 'internal-uid',
      originString: 'ТОО Arbuz Group (Арбуз Груп) За оплату билета/услугу/продукты /товар заказ 1234567 Arbuz'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(1)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: -2500,
      invoice: null
    }))
    expect(tx.comment).toEqual('заказ 1234567 Arbuz')
    expect(tx.merchant).toEqual({
      title: 'ТОО Arbuz Group',
      city: null,
      country: null,
      mcc: null,
      location: null,
      category: null
    })
  })

  it('percents', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-01T00:00:00.000Z',
      originalAmount: '+0.44 KZT',
      amount: '+0.44',
      description: '. Выплата процентов по вкладу No KZDEPOSTIKZT от 26.01.2025 за период с 01-го по 30.11.25. Вкладчик Иванов Иван Иванович',
      statementUid: 'internal-uid',
      originString: '01.12.2025 +0.44 ₸ KZT Пополнение Пополнение. Выплата процентов по вкладу No KZDEPOSTIKZT от 26.01.2025 за период с 01-го по 30.11.25. Вкладчик Иванов Иван Иванович'
    }
    const account = { id: 'KZDEPOSTIKZT', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(1)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZDEPOSTIKZT' },
      sum: 0.44,
      invoice: null
    }))
    expect(tx.comment).toEqual('Выплата процентов по вкладу')
    expect(tx.merchant).toBeNull()
  })
})
