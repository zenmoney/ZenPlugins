import { convertTransaction, merge } from '../../../converters'

describe('convertTransaction', () => {
  let consoleLogSpy
  const account = {
    id: 'mock-account-001',
    type: 'card',
    title: 'Visa Virtual*111',
    instrument: 'BYN',
    balance: 99.9,
    syncID: [
      '1111'
    ]
  }
  const generatedId = expect.stringMatching(/^[a-f0-9]{32}$/)

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('easy transaction', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; TESTCITY;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -1
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -1,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        country: 'BY',
        city: 'TESTCITY',
        title: 'BANK RESHENIE- OPLATA USLUG',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('generates canonical id independent from bank transaction id', () => {
    const json = {
      id: '123456',
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; TESTCITY;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -1
    }

    const transaction = convertTransaction(json)
    const sameTransactionWithoutBankId = convertTransaction({ ...json, id: undefined })

    expect(transaction.movements[0].id).toEqual(sameTransactionWithoutBankId.movements[0].id)
    expect(transaction.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transaction.movements[0].id).not.toEqual('123456')
  })

  it('generates stable transaction id when bank id is missing', () => {
    const json = {
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK POST; TESTCITY; BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    }

    const transaction = convertTransaction(json)
    const sameTransaction = convertTransaction({ ...json })
    const anotherTransaction = convertTransaction({ ...json, merchant: 'mock-food.example' })

    expect(transaction.movements[0].id).toEqual(sameTransaction.movements[0].id)
    expect(transaction.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transaction.movements[0].id).not.toEqual(anotherTransaction.movements[0].id)
  })

  it('keeps same id when hold becomes posted operation', () => {
    const hold = convertTransaction({
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-02T11:30:22+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -30.5,
      merchant: 'MOCK CAFE',
      hold: true
    })
    const postedOperation = convertTransaction({
      id: '222180',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-04T13:48:23+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -30.5,
      transactionDate: new Date('2026-06-02T00:00:00+03:00'),
      transactionAmount: -30.5,
      transactionCurrencyCode: '933',
      merchant: 'MOCK CAFE',
      hold: false,
      merchantId: 'ACQ_7CD4ECE',
      mcc: '5422',
      operationCode: 3
    })

    expect(hold.movements[0].id).toEqual(postedOperation.movements[0].id)
    expect(hold.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
  })

  it('normalizes XML escaped merchant in canonical id', () => {
    const hold = convertTransaction({
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-02T17:11:29+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -13.92,
      merchant: 'MOCK SHOP &quot;ALPHA&quot;',
      hold: true
    })
    const postedOperation = convertTransaction({
      id: '453990',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-04T13:48:27+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -13.92,
      transactionDate: new Date('2026-06-02T00:00:00+03:00'),
      transactionAmount: -13.92,
      transactionCurrencyCode: '933',
      merchant: 'MOCK SHOP "ALPHA"',
      hold: false,
      merchantId: '0978441',
      mcc: '5411',
      operationCode: 3
    })

    expect(hold.movements[0].id).toEqual(postedOperation.movements[0].id)
    expect(hold.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
  })

  it('keeps same id when one merchant has a trailing quote trimmed by the bank', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-11T10:12:00+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -37.36,
      merchant: 'APTEKA N1 OOO &quot;FARMPROEKT&quot;',
      hold: true
    }
    const postedOperation = {
      id: '453991',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-12T10:12:00+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -37.36,
      transactionDate: new Date('2026-06-11T00:00:00+03:00'),
      transactionAmount: -37.36,
      transactionCurrencyCode: '933',
      merchant: 'APTEKA N1 OOO "FARMPROEKT',
      hold: false
    }
    const merged = merge([hold], [postedOperation])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(convertTransaction(hold).movements[0].id).toEqual(convertTransaction(postedOperation).movements[0].id)
  })

  it('keeps same id when one merchant has a short extra suffix after the bank prefix', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-11T11:23:00+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -17.52,
      merchant: 'APTEKA PYaTOI KATEGORII V S',
      hold: true
    }
    const postedOperation = {
      id: '453992',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-12T11:23:00+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -17.52,
      transactionDate: new Date('2026-06-11T00:00:00+03:00'),
      transactionAmount: -17.52,
      transactionCurrencyCode: '933',
      merchant: 'APTEKA PYaTOI KATEGORII V',
      hold: false
    }
    const merged = merge([hold], [postedOperation])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(convertTransaction(hold).movements[0].id).toEqual(convertTransaction(postedOperation).movements[0].id)
  })

  it('does not merge similar merchants with different amounts', () => {
    const firstHold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-11T11:23:00+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -2.79,
      merchant: 'MAGAZIN EUROOPT PRIME',
      hold: true
    }
    const secondHold = {
      ...firstHold,
      transactionDate: new Date('2026-06-11T11:24:00+03:00'),
      transactionAmount: -31.37
    }
    const transactions = merge([firstHold, secondHold], []).map(transaction => convertTransaction(transaction))

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).not.toEqual(transactions[1].movements[0].id)
  })

  it('distinguishes repeated holds with same identity', () => {
    const firstHold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-05T12:00:00+03:00'),
      transactionName: '*Перевод* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -4,
      merchant: 'MOCK TRANSFER SERVICE',
      hold: true
    }
    const secondHold = {
      ...firstHold,
      transactionDate: new Date('2026-06-05T12:01:00+03:00')
    }

    const transactions = merge([firstHold, secondHold], []).map(transaction => convertTransaction(transaction))

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transactions[1].movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transactions[0].movements[0].id).not.toEqual(transactions[1].movements[0].id)
  })

  it('keeps first repeated hold id stable when another same operation appears later', () => {
    const firstHold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-05T12:00:00+03:00'),
      transactionName: '*Перевод* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -4,
      merchant: 'MOCK TRANSFER SERVICE',
      hold: true
    }
    const secondHold = {
      ...firstHold,
      transactionDate: new Date('2026-06-05T12:01:00+03:00')
    }

    const firstOnlyId = convertTransaction(merge([firstHold], [])[0]).movements[0].id
    const firstWithDuplicateId = convertTransaction(merge([firstHold, secondHold], [])[0]).movements[0].id

    expect(firstOnlyId).toEqual(firstWithDuplicateId)
  })

  it('keeps repeated ids when holds become posted operations', () => {
    const holds = [
      {
        account_id: 'mock-account-001',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-06-05T12:00:00+03:00'),
        transactionName: '*Перевод* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -4,
        merchant: 'MOCK TRANSFER SERVICE',
        hold: true
      },
      {
        account_id: 'mock-account-001',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-06-05T12:01:00+03:00'),
        transactionName: '*Перевод* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -4,
        merchant: 'MOCK TRANSFER SERVICE',
        hold: true
      }
    ]
    const postedOperations = [
      {
        id: '111111',
        account_id: 'mock-account-001',
        operationName: 'Перевод с карты на карту',
        operationDate: new Date('2026-06-07T10:00:01+03:00'),
        operationCurrencyCode: '933',
        operationAmount: -4,
        transactionDate: new Date('2026-06-05T00:00:00+03:00'),
        transactionAmount: -4,
        transactionCurrencyCode: '933',
        merchant: 'MOCK TRANSFER SERVICE',
        hold: false
      },
      {
        id: '222222',
        account_id: 'mock-account-001',
        operationName: 'Перевод с карты на карту',
        operationDate: new Date('2026-06-07T10:00:02+03:00'),
        operationCurrencyCode: '933',
        operationAmount: -4,
        transactionDate: new Date('2026-06-05T00:00:00+03:00'),
        transactionAmount: -4,
        transactionCurrencyCode: '933',
        merchant: 'MOCK TRANSFER SERVICE',
        hold: false
      }
    ]

    const holdIds = merge(holds, []).map(transaction => convertTransaction(transaction).movements[0].id)
    const postedIds = merge([], postedOperations).map(transaction => convertTransaction(transaction).movements[0].id)

    expect(postedIds).toEqual(holdIds)
  })

  it('keeps extra repeated hold when only part of same operations are posted', () => {
    const firstHold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-05T12:00:00+03:00'),
      transactionName: '*Перевод* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -4,
      merchant: 'MOCK TRANSFER SERVICE',
      hold: true
    }
    const secondHold = {
      ...firstHold,
      transactionDate: new Date('2026-06-05T12:01:00+03:00')
    }
    const postedOperation = {
      id: '111111',
      account_id: 'mock-account-001',
      operationName: 'Перевод с карты на карту',
      operationDate: new Date('2026-06-07T10:00:01+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -4,
      transactionDate: new Date('2026-06-05T00:00:00+03:00'),
      transactionAmount: -4,
      transactionCurrencyCode: '933',
      merchant: 'MOCK TRANSFER SERVICE',
      hold: false
    }

    const merged = merge([firstHold, secondHold], [postedOperation])
    const transactions = merged.map(transaction => convertTransaction(transaction))

    expect(merged).toHaveLength(2)
    expect(merged[0].hold).toEqual(false)
    expect(merged[1].hold).toEqual(true)
    expect(transactions[0].movements[0].id).not.toEqual(transactions[1].movements[0].id)
  })

  it('keeps repeated ids stable when same operations clear on different days', () => {
    const holds = [
      {
        account_id: 'mock-account-001',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-06-05T12:00:00+03:00'),
        transactionName: '*Перевод* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -4,
        merchant: 'MOCK TRANSFER SERVICE',
        hold: true
      },
      {
        account_id: 'mock-account-001',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-06-05T12:01:00+03:00'),
        transactionName: '*Перевод* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -4,
        merchant: 'MOCK TRANSFER SERVICE',
        hold: true
      }
    ]
    const firstClearedOperation = {
      id: '222222',
      account_id: 'mock-account-001',
      operationName: 'Перевод с карты на карту',
      operationDate: new Date('2026-06-07T10:00:02+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -4,
      transactionDate: new Date('2026-06-05T00:00:00+03:00'),
      transactionAmount: -4,
      transactionCurrencyCode: '933',
      merchant: 'MOCK TRANSFER SERVICE',
      hold: false
    }
    const secondClearedOperation = {
      id: '111111',
      account_id: 'mock-account-001',
      operationName: 'Перевод с карты на карту',
      operationDate: new Date('2026-06-08T10:00:01+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -4,
      transactionDate: new Date('2026-06-05T00:00:00+03:00'),
      transactionAmount: -4,
      transactionCurrencyCode: '933',
      merchant: 'MOCK TRANSFER SERVICE',
      hold: false
    }

    const holdIds = merge(holds, []).map(transaction => convertTransaction(transaction).movements[0].id)
    const partiallyClearedIds = merge(holds, [firstClearedOperation]).map(transaction => convertTransaction(transaction).movements[0].id)
    const fullyClearedIds = merge([], [firstClearedOperation, secondClearedOperation]).map(transaction => convertTransaction(transaction).movements[0].id)

    expect(partiallyClearedIds).toEqual(holdIds)
    expect(fullyClearedIds).toEqual(holdIds)
  })

  it('does not log transaction identity data for merged transactions', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-05T12:00:00+03:00'),
      transactionName: '*Перевод* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -4,
      merchant: 'MOCK TRANSFER SERVICE',
      hold: true,
      duplicateIndex: 2
    })

    expect(transaction.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('zero sum', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; TESTCITY;BY',
      operationName: 'Оплата товаров и услуг',
      sum: 0
    })

    expect(transaction).toEqual(null)
  })

  it('merchant parsing with country', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK POST; TESTCITY; BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18,
      mcc: '9402'
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'TESTCITY',
        country: 'BY',
        location: null,
        mcc: 9402,
        title: 'MOCK POST'
      },
      comment: null
    })
  })

  it('merchant parsing MOCK ONLINE SHOP', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK ONLINE SHOP; TESTCITY;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'TESTCITY',
        country: 'BY',
        location: null,
        mcc: null,
        title: 'MOCK ONLINE SHOP'
      },
      comment: null
    })
  })

  it('merchant parsing MOCK TOKEN SERVICE', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK TOKEN SERVICE; ; BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: '',
        country: 'BY',
        location: null,
        mcc: null,
        title: 'MOCK TOKEN SERVICE'
      },
      comment: null
    })
  })

  it('merchant parsing MOCK ELECTRONICS', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK ELECTRONICS; TESTCITY;DE',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'TESTCITY',
        country: 'DE',
        location: null,
        mcc: null,
        title: 'MOCK ELECTRONICS'
      },
      comment: null
    })
  })

  it('merchant parsing Udemy', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'MOCK COURSES; ONLINE; TESTCITY; US',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'TESTCITY',
        country: 'US',
        location: null,
        mcc: null,
        title: 'MOCK COURSES; ONLINE'
      },
      comment: null
    })
  })

  it('merchant parsing without country', () => {
    const transaction = convertTransaction({
      account_id: 'mock-account-001',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'mock-food.example',
      operationName: 'Оплата товаров (услуг)',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: generatedId,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: null,
        country: null,
        location: null,
        mcc: null,
        title: 'mock-food.example'
      },
      comment: null
    })
  })
})
