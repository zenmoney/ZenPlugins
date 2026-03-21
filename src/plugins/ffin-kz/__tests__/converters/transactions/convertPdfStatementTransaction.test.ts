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

  it('builds transfer from deposit to card using deposit sync id from origin string', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-12T00:00:00.000Z',
      originalAmount: '+70000.00 KZT',
      amount: '+70000.00',
      description: 'Другое Плательщик: Иванов Иван Получатель: Иванов Иван Назначение: Выплата вклада по Договору No KZ00000B000000002KZT от 01.02.2025',
      statementUid: 'deposit-transfer-uid',
      originString: '12.12.2025 +70,000.00 ₸ KZT Другое Плательщик: Иванов Иван Получатель: Иванов Иван Назначение: Выплата вклада по Договору No KZ00000B000000002KZT от 01.02.2025'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: 70000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.deposit,
        instrument: 'KZT',
        company: null,
        syncIds: ['KZ00000B000000002']
      },
      sum: -70000
    }))
  })

  it('removes processing marker from merchant title', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-09T00:00:00.000',
      originalAmount: '-1820.00 KZT',
      amount: '-1820.00',
      description: 'Покупка в обработке YANDEX.GO ALMATY KZ',
      statementUid: 'processing-marker-uid',
      originString: '09.12.2025 -1,820.00 ₸ KZT Сумма в обработке Покупка в обработке YANDEX.GO ALMATY KZ'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.merchant).toEqual({
      title: 'YANDEX.GO',
      city: 'Almaty',
      country: 'Kazakhstan',
      mcc: null,
      location: null,
      category: null
    })
    expect(tx.hold).toBe(true)
  })

  it('treats deposit payout by contract as transfer from deposit to card', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-20T00:00:00.000Z',
      originalAmount: '+70000.00 KZT',
      amount: '+70000.00',
      description: 'Выплата вклада по Договору №\nKZ00000B000000002KZT от 01.02.2025.\nВкладчик: Тестовый Тест',
      statementUid: 'deposit-payout-uid',
      originString: '20.12.2025 +70,000.00 ₸ KZT Выплата вклада по Договору №\nKZ00000B000000002KZT от 01.02.2025.\nВкладчик: Тестовый Тест'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT' }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: 70000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.deposit,
        instrument: 'KZT',
        company: null,
        syncIds: ['KZ00000B000000002']
      },
      sum: -70000
    }))
  })

  it('uses ccard counterpart for transfer when source account is deposit statement account', () => {
    const rawTransaction = {
      hold: false,
      date: '2025-12-20T00:00:00.000Z',
      originalAmount: '-70000.00 KZT',
      amount: '-70000.00',
      description: 'Выплата вклада по Договору № KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест',
      statementUid: 'deposit-source-uid',
      originString: '20.12.2025 -70,000.00 ₸ KZT Другое Выплата вклада по Договору № KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест'
    }
    const account = { id: 'KZ00000B000000002KZT', instrument: 'KZT', type: AccountType.deposit }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account as any, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZ00000B000000002KZT' },
      sum: -70000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.ccard,
        instrument: 'KZT',
        company: null,
        syncIds: null
      },
      sum: 70000
    }))
    expect(tx.comment).toBeNull()
  })

  it('does not set merchant or comment for contract reference transfer text', () => {
    const rawTransaction = {
      hold: false,
      date: '2026-01-10T00:00:00.000Z',
      originalAmount: '-30000.00 KZT',
      amount: '-30000.00',
      description: 'No KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест',
      statementUid: 'contract-ref-uid',
      originString: '10.01.2026 -30,000.00 ₸ KZT Другое No KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест'
    }
    const account = { id: 'KZ00000B000000002KZT', instrument: 'KZT', type: AccountType.deposit }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account as any, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.comment).toBeNull()
    expect(tx.merchant).toBeNull()
  })

  it('parses card top-up from deposit reference as transfer with deposit sync id', () => {
    const rawTransaction = {
      hold: false,
      date: '2026-01-15T00:00:00.000Z',
      originalAmount: '+35000.00 KZT',
      amount: '+35000.00',
      description: 'Другое KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест',
      statementUid: 'card-topup-from-deposit-uid',
      originString: '15.01.2026 +35,000.00 ₸ KZT Другое KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT', type: AccountType.ccard }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account as any, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: 35000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.deposit,
        instrument: 'KZT',
        company: null,
        syncIds: ['KZ00000B000000002']
      },
      sum: -35000
    }))
    expect(tx.comment).toBeNull()
    expect(tx.merchant).toBeNull()
  })

  it('does not treat ccard as deposit source even if account id ends with currency', () => {
    const rawTransaction = {
      hold: false,
      date: '2026-01-17T00:00:00.000Z',
      originalAmount: '+10000.00 KZT',
      amount: '+10000.00',
      description: 'Другое KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест',
      statementUid: 'ccard-id-format-uid',
      originString: '17.01.2026 +10,000.00 ₸ KZT Другое KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест'
    }
    const account = { id: 'KZ43551B829618809KZT', instrument: 'KZT', type: AccountType.ccard }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account as any, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZ43551B829618809KZT' },
      sum: 10000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.deposit,
        instrument: 'KZT',
        company: null,
        syncIds: ['KZ00000B000000002']
      },
      sum: -10000
    }))
  })

  it('normalizes wrong negative sign for payout transfer on card statement to income', () => {
    const rawTransaction = {
      hold: false,
      date: '2026-01-16T00:00:00.000Z',
      originalAmount: '-35000.00 KZT',
      amount: '-35000.00',
      description: 'Другое KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест',
      statementUid: 'card-topup-wrong-sign-uid',
      originString: '16.01.2026 -35,000.00 ₸ KZT Другое Выплата вклада по Договору No KZ00000B000000002KZT от 01.02.2025. Вкладчик: Тестовый Тест'
    }
    const account = { id: 'KZCARD0001', instrument: 'KZT', type: AccountType.ccard }
    const currencyRates = {}

    const converted = convertPdfStatementTransaction(rawTransaction as any, account as any, currencyRates)
    if (converted == null) {
      throw new Error('Expected conversion result')
    }
    const tx = converted.transaction
    expect(tx.movements).toHaveLength(2)
    expect(tx.movements[0]).toEqual(expect.objectContaining({
      account: { id: 'KZCARD0001' },
      sum: 35000
    }))
    expect(tx.movements[1]).toEqual(expect.objectContaining({
      account: {
        type: AccountType.deposit,
        instrument: 'KZT',
        company: null,
        syncIds: ['KZ00000B000000002']
      },
      sum: -35000
    }))
  })
})
