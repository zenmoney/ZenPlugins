import { MD5 } from 'jshashes'
import { convertTransaction, merge } from '../../../converters'

describe('convertTransaction', () => {
  let consoleLogSpy
  const md5 = new MD5()
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
  const transactionIdSource = (date, amount, merchant, duplicateIndex = 1) => {
    return `${account.id}|${date}|${amount}|933|${merchant}|${duplicateIndex}`
  }
  const transactionId = (date, amount, merchant, duplicateIndex = 1) => {
    return md5.hex(transactionIdSource(date, amount, merchant, duplicateIndex))
  }

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
          id: transactionId('2019-02-14', '-1.00', 'BANK RESHENIE- OPLATA USL'),
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

  it('uses hashed canonical transaction id independent from bank transaction id', () => {
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
    expect(transaction.movements[0].id).toEqual(transactionId('2019-02-14', '-1.00', 'BANK RESHENIE- OPLATA USL'))
    expect(transaction.movements[0].id).toMatch(/^[a-f0-9]{32}$/)
    expect(transaction.movements[0].id).not.toEqual('123456')
  })

  it('generates stable hashed transaction id when bank id is missing', () => {
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
    expect(transaction.movements[0].id).toEqual(transactionId('2019-02-14', '-18.00', 'MOCK POST; TESTCITY; BY'))
    expect(transaction.movements[0].id).not.toEqual(anotherTransaction.movements[0].id)
  })

  it('keeps posted operation when hold becomes posted operation', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-02T11:30:22+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -30.5,
      merchant: 'MOCK CAFE',
      hold: true
    }
    const postedOperation = {
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
    }
    const merged = merge([hold], [postedOperation])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(convertTransaction(merged[0]).movements[0].id).toEqual(transactionId('2026-06-02', '-30.50', 'MOCK CAFE'))
  })

  it('normalizes XML escaped merchant when matching hold with posted operation', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-02T17:11:29+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -13.92,
      merchant: 'MOCK SHOP &quot;ALPHA&quot;',
      hold: true
    }
    const postedOperation = {
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
    }
    const merged = merge([hold], [postedOperation])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(convertTransaction(merged[0]).movements[0].id).toEqual(transactionId('2026-06-02', '-13.92', 'MOCK SHOP ALPHA'))
  })

  it('matches operation when one merchant has a trailing quote trimmed by the bank', () => {
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
    expect(convertTransaction(merged[0]).movements[0].id).toEqual(transactionId('2026-06-11', '-37.36', 'APTEKA N1 OOO FARMPROEKT'))
  })

  it('matches operation when one merchant has a short extra suffix after the bank prefix', () => {
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
    expect(convertTransaction(merged[0]).movements[0].id).toEqual(transactionId('2026-06-11', '-17.52', 'APTEKA PYATOI KATEGORII V'))
  })

  it('matches operation when full statement merchant is a safe shorter prefix', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-20T08:05:41+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -19.3,
      merchant: 'SHOP "KERAMIKA" / STOLITSA',
      hold: true
    }
    const postedOperation = {
      id: '519980',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-23T10:48:17+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -19.3,
      transactionDate: new Date('2026-06-20T00:00:00+03:00'),
      transactionAmount: -19.3,
      transactionCurrencyCode: '933',
      merchant: 'SHOP "KERAMIKA" / STOLITS',
      hold: false
    }
    const merged = merge([hold], [postedOperation])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(convertTransaction(merged[0]).movements[0].id).toEqual(transactionId('2026-06-20', '-19.30', 'SHOP KERAMIKA / STOLITSA'))
  })

  it('matches account capitalization when mini statement has generic income name', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-30T14:42:03+03:00'),
      transactionName: 'Зачисление на счет',
      transactionCurrencyCode: '933',
      transactionAmount: 0.1,
      hold: true
    }
    const postedOperation = {
      account_id: 'mock-account-001',
      operationName: 'Капитализация (%% тек.периода ко вкладу)',
      operationDate: new Date('2026-06-30T14:00:50+03:00'),
      operationCurrencyCode: '933',
      operationAmount: 0.1,
      transactionDate: new Date('2026-06-30T14:00:50+03:00'),
      transactionAmount: 0,
      transactionCurrencyCode: '933',
      hold: false
    }
    const merged = merge([hold], [postedOperation])
    const transaction = convertTransaction(merged[0])

    expect(merged).toHaveLength(1)
    expect(merged[0].hold).toEqual(false)
    expect(transaction.movements[0].sum).toEqual(0.1)
    expect(transaction.movements[0].id).toEqual(transactionId('2026-06-30', '0.10', 'Зачисление на счет'))
  })

  it('does not merge unrelated no-merchant income operation names', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-30T14:42:03+03:00'),
      transactionName: 'Зачисление на счет',
      transactionCurrencyCode: '933',
      transactionAmount: 0.1,
      hold: true
    }
    const postedOperation = {
      account_id: 'mock-account-001',
      operationName: 'Пополнение счета',
      operationDate: new Date('2026-06-30T14:00:50+03:00'),
      operationCurrencyCode: '933',
      operationAmount: 0.1,
      transactionDate: new Date('2026-06-30T14:00:50+03:00'),
      transactionAmount: 0,
      transactionCurrencyCode: '933',
      hold: false
    }
    const transactions = merge([hold], [postedOperation]).map(transaction => convertTransaction(transaction))

    expect(transactions).toHaveLength(2)
    expect(transactions.map(transaction => transaction.hold)).toEqual([false, true])
    expect(transactions.map(transaction => transaction.movements[0].id)).toEqual([
      transactionId('2026-06-30', '0.10', 'Пополнение счета'),
      transactionId('2026-06-30', '0.10', 'Зачисление на счет')
    ])
  })

  it('does not merge merchants when the shared prefix is too short', () => {
    const hold = {
      account_id: 'mock-account-001',
      accountCurrencyCode: '933',
      transactionDate: new Date('2026-06-11T11:23:00+03:00'),
      transactionName: '*Оплата* Безналичная операция',
      transactionCurrencyCode: '933',
      transactionAmount: -9.99,
      merchant: 'SHORT MERCHANT',
      hold: true
    }
    const postedOperation = {
      id: '453993',
      account_id: 'mock-account-001',
      operationName: 'Оплата товаров (услуг)',
      operationDate: new Date('2026-06-12T11:23:00+03:00'),
      operationCurrencyCode: '933',
      operationAmount: -9.99,
      transactionDate: new Date('2026-06-11T00:00:00+03:00'),
      transactionAmount: -9.99,
      transactionCurrencyCode: '933',
      merchant: 'SHORT MERCHANT EXTRA',
      hold: false
    }
    const transactions = merge([hold], [postedOperation]).map(transaction => convertTransaction(transaction))

    expect(transactions).toHaveLength(2)
    expect(transactions.map(transaction => transaction.hold)).toEqual([false, true])
    expect(transactions.map(transaction => transaction.movements[0].id)).toEqual([
      transactionId('2026-06-11', '-9.99', 'SHORT MERCHANT EXTRA'),
      transactionId('2026-06-11', '-9.99', 'SHORT MERCHANT')
    ])
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
    expect(transactions.map(transaction => transaction.movements[0].sum)).toEqual([-2.79, -31.37])
    expect(transactions.map(transaction => transaction.movements[0].id)).toEqual([
      transactionId('2026-06-11', '-2.79', 'MAGAZIN EUROOPT PRIME'),
      transactionId('2026-06-11', '-31.37', 'MAGAZIN EUROOPT PRIME')
    ])
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

    const merged = merge([firstHold, secondHold], [])

    expect(merged).toHaveLength(2)
    expect(merged.map(transaction => transaction.duplicateIndex)).toEqual([1, 2])
    expect(merged.map(transaction => convertTransaction(transaction).movements[0].id)).toEqual([
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 1),
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2)
    ])
  })

  it('keeps first repeated hold index stable when another same operation appears later', () => {
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

    const firstOnlyIndex = merge([firstHold], [])[0].duplicateIndex
    const firstWithDuplicateIndex = merge([firstHold, secondHold], [])[0].duplicateIndex

    expect(firstOnlyIndex).toEqual(firstWithDuplicateIndex)
  })

  it('keeps repeated posted operations when holds become posted operations', () => {
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

    const merged = merge(holds, postedOperations)
    const postedIds = merged.map(transaction => convertTransaction(transaction).movements[0].id)

    expect(merged).toHaveLength(2)
    expect(merged.map(transaction => transaction.hold)).toEqual([false, false])
    expect(postedIds).toEqual([
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 1),
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2)
    ])
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
    expect(transactions[0].movements[0].id).toEqual(transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 1))
    expect(transactions[1].movements[0].id).toEqual(transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2))
  })

  it('keeps repeated operations matched when same operations clear on different days', () => {
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

    const partiallyCleared = merge(holds, [firstClearedOperation])
    const partiallyClearedIds = partiallyCleared.map(transaction => convertTransaction(transaction).movements[0].id)
    const fullyCleared = merge([], [firstClearedOperation, secondClearedOperation])
    const fullyClearedIds = fullyCleared.map(transaction => convertTransaction(transaction).movements[0].id)

    expect(partiallyCleared).toHaveLength(2)
    expect(partiallyCleared.map(transaction => transaction.hold)).toEqual([false, true])
    expect(partiallyClearedIds).toEqual([
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 1),
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2)
    ])
    expect(fullyCleared).toHaveLength(2)
    expect(fullyCleared.map(transaction => transaction.hold)).toEqual([false, false])
    expect(fullyClearedIds).toEqual([
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 1),
      transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2)
    ])
  })

  it('logs readable transaction id source for merged transactions', () => {
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

    expect(transaction.movements[0].id).toEqual(transactionId('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2))
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'SolutionBank transaction id source',
      transactionIdSource('2026-06-05', '-4.00', 'MOCK TRANSFER SERVICE', 2)
    )
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK POST; TESTCITY; BY'),
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK ONLINE SHOP; TESTCIT'),
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK TOKEN SERVICE; ; BY'),
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK ELECTRONICS; TESTCIT'),
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK COURSES; ONLINE; TES'),
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
          id: transactionId('2019-02-14', '-18.00', 'MOCK-FOOD.EXAMPLE'),
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
