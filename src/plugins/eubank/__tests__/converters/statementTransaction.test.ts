import { convertPdfStatementTransaction } from '../../converters/transactions'
import { ConvertedAccount, StatementTransaction } from '../../models'
import { AccountType } from '../../../../types/zenmoney'

const kztAccount: ConvertedAccount = {
  account: {
    id: '1234567-KZT',
    balance: 5230.50,
    instrument: 'KZT',
    syncIds: ['KZ123456789B01234567', '401234******9876'],
    title: '*9876 KZT',
    type: AccountType.ccard
  },
  date: new Date('2026-04-14T00:00:00.000')
}

const usdAccount: ConvertedAccount = {
  account: {
    id: '1234567-USD',
    balance: 1.25,
    instrument: 'USD',
    syncIds: ['KZ123456789B01234567', '401234******9876'],
    title: '*9876 USD',
    type: AccountType.ccard
  },
  date: new Date('2026-04-14T00:00:00.000')
}

const accounts = [kztAccount, usdAccount]

function makeTx (overrides: Partial<StatementTransaction>): StatementTransaction {
  return {
    date: '2026-03-14T00:00:00.000',
    time: '15:52:33',
    category: 'Кафе и рестораны',
    details: 'STARBUCKS COFFEE SHOP',
    amount: 5400,
    instrument: 'KZT',
    isCardOperation: true,
    originString: '14.03.2026 15:52:33 Кафе и рестораны STARBUCKS COFFEE SHOP 5400 KZT -5400 Карта: **9876',
    statementUid: 'test-uid',
    ...overrides
  }
}

describe('convertPdfStatementTransaction', () => {
  it('should convert regular purchase (KZT)', () => {
    const result = convertPdfStatementTransaction(makeTx({}), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(-5400)
    expect(result.transaction.movements[0].account).toEqual({ id: '1234567-KZT' })
    expect(result.transaction.merchant).toEqual({
      fullTitle: 'STARBUCKS COFFEE SHOP',
      mcc: null,
      location: null
    })
  })

  it('should convert USD purchase', () => {
    const result = convertPdfStatementTransaction(makeTx({
      details: 'AIRBNB * HM3AJJZFHC',
      amount: 242.65,
      instrument: 'USD',
      category: 'Путешествия'
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements[0].sum).toBe(-242.65)
    expect(result.transaction.movements[0].account).toEqual({ id: '1234567-USD' })
  })

  it('should convert deposit income (Финансы + Депозит)', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Финансы',
      details: 'Депозит',
      amount: 20000,
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(20000)
    expect(result.transaction.comment).toBe('Депозит')
  })

  it('should convert currency account income (Финансы + Текущий счет)', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Финансы',
      details: 'Текущий счет',
      amount: 243,
      instrument: 'USD',
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(243)
    expect(result.transaction.movements[0].account).toEqual({ id: '1234567-USD' })
  })

  it('should convert outgoing finance transfer (Финансы + Visa Infinite)', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Финансы',
      details: 'Visa Infinite',
      amount: 7792.49,
      instrument: 'USD',
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(-7792.49)
  })

  it('should convert transfer to person (Финансы + name)', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Финансы',
      details: 'Алексей Ц.',
      amount: 400000,
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(-400000)
    expect(result.transaction.comment).toBe('Финансы: Алексей Ц.')
  })

  it('should convert cash topup with two movements', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Пополнение',
      details: 'В терминале',
      amount: 7792.21,
      instrument: 'USD',
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(2)
    expect(result.transaction.movements[0].sum).toBe(7792.21)
    expect(result.transaction.movements[0].account).toEqual({ id: '1234567-USD' })
    const secondMovement = result.transaction.movements[1]
    expect(secondMovement).toBeDefined()
    if (secondMovement != null) {
      expect(secondMovement.sum).toBe(-7792.21)
      expect(secondMovement.account).toEqual({
        type: AccountType.cash,
        instrument: 'USD',
        company: null,
        syncIds: null
      })
    }
  })

  it('should convert bonus topup', () => {
    const result = convertPdfStatementTransaction(makeTx({
      category: 'Пополнение',
      details: 'Пополнение с Бонусов',
      amount: 139000,
      isCardOperation: false
    }), accounts)
    expect(result).not.toBeNull()
    if (result == null) return
    expect(result.transaction.movements).toHaveLength(1)
    expect(result.transaction.movements[0].sum).toBe(139000)
    expect(result.transaction.comment).toBe('Пополнение с Бонусов')
  })

  it('should skip zero amount transactions', () => {
    const result = convertPdfStatementTransaction(makeTx({
      amount: 0
    }), accounts)
    expect(result).toBeNull()
  })
})
