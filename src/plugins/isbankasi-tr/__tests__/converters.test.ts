import { AccountType } from '../../../types/zenmoney'
import { adjustTransactions } from '../../../common/transactionGroupHandler'
import { convertAccounts, convertTransaction } from '../converters'

const currentAccount = {
  Index: 'account-1',
  AccountTypeEnum: 1,
  AccountType: 'Vadesiz TL',
  Alias: 'Günlük Hesap',
  AccountBranch: { Code: 123, Name: 'İstanbul' },
  AccountNumber: '456789',
  Iban: 'TR12000123456789',
  Balance: { Amount: '1.234,56', IsoCode: 'TL' },
  availableAmount: { Amount: '1.200,00', IsoCode: 'TL' }
}

describe('İşCep account conversion', () => {
  it('converts current and term accounts with stable natural syncIds', () => {
    const converted = convertAccounts([currentAccount, {
      Index: 'deposit-1',
      AccountTypeEnum: 4,
      Alias: 'Vadeli Hesap',
      AccountBranch: { Code: 124 },
      AccountNumber: '987654',
      Iban: 'TR98000987654321',
      Balance: { Amount: '10.000,00', IsoCode: 'TRY' },
      inPeriodBalance: { Amount: '9.500,00', IsoCode: 'TRY' },
      TermStartDate: '2026-01-01',
      TermEndDate: '2026-07-01',
      InterestRate: '42,5'
    }])

    expect(converted[0].account).toEqual(expect.objectContaining({
      id: 'isbank:account-1',
      type: AccountType.checking,
      instrument: 'TRY',
      balance: 1234.56,
      available: 1200,
      syncIds: ['TR12000123456789', '123-456789']
    }))
    expect(converted[1].account).toEqual(expect.objectContaining({
      type: AccountType.deposit,
      balance: 10000,
      startBalance: 9500,
      capitalization: false,
      percent: 42.5,
      endDateOffsetInterval: 'day',
      endDateOffset: 181
    }))
  })

  it('adds only the minimum technical identifier when natural identifiers collide', () => {
    const first = { ...currentAccount, Iban: null, Index: 'a', AccountBranch: { Code: 1 }, AccountNumber: '1' }
    const second = { ...currentAccount, Iban: null, Index: 'b', AccountBranch: { Code: 1 }, AccountNumber: '1' }

    const converted = convertAccounts([first, second])

    expect(converted.map(({ account }) => account.syncIds)).toEqual([
      ['isbank:index:a'],
      ['isbank:index:b']
    ])
  })

  it('rejects an unknown account type instead of silently omitting it', () => {
    expect(() => convertAccounts([{ ...currentAccount, AccountTypeEnum: 99 }]))
      .toThrow('Unsupported İşCep account type')
  })

  it('keeps the current app CREDIT account type syncable without inventing loan terms', () => {
    const converted = convertAccounts([{
      ...currentAccount,
      Index: 'credit-1',
      AccountTypeEnum: 5,
      AccountType: 'Kredi Hesabı',
      Alias: 'Kredi Hesabı',
      Balance: { Amount: '-2.500,00', IsoCode: 'TRY' }
    }])

    expect(converted[0].account).toEqual(expect.objectContaining({
      id: 'isbank:credit-1',
      type: AccountType.checking,
      balance: -2500
    }))
  })

  it('rejects malformed balances instead of silently converting them to zero', () => {
    expect(() => convertAccounts([{
      ...currentAccount,
      Balance: { Amount: 'N/A', IsoCode: 'TRY' }
    }])).toThrow('invalid amount')
  })
})

describe('İşCep transaction conversion', () => {
  const account = convertAccounts([currentAccount])[0].account

  it('keeps the bank sign and interprets an unzoned timestamp in Istanbul time', () => {
    const transaction = convertTransaction({
      Amount: '-250,75',
      Balance: '983,81',
      CurrencyCode: 'TL',
      Description: 'Market alışverişi',
      OperationGroup: 'Kart işlemi',
      ReceiptValue: 'receipt-1',
      Timestamp: '2026-08-18T10:30:00',
      TimestampMicro: 123
    }, account)

    expect(transaction.date.toISOString()).toBe('2026-08-18T07:30:00.000Z')
    expect(transaction.movements).toEqual([expect.objectContaining({
      id: 'receipt-1',
      sum: -250.75,
      invoice: null,
      fee: 0
    })])
    expect(transaction.comment).toBe('Market alışverişi')
  })

  it('creates matching group keys and an external movement for transfers', () => {
    const transaction = convertTransaction({
      Amount: '-1000,00',
      CurrencyCode: 'TRY',
      Description: 'Virman kendi hesabıma',
      OperationGroup: 'Virman',
      OtherAccount: 'TR00 0000 0000',
      ReceiptValue: 'transfer-1',
      Timestamp: '2026-08-18T12:00:00'
    }, account)

    expect(transaction.movements).toHaveLength(2)
    expect(transaction.movements[1]).toEqual(expect.objectContaining({ sum: 1000 }))
    expect(transaction.groupKeys).toEqual([
      'isbank:receipt:transfer-1',
      'isbank:inner:2026-08-18:TRY:1000.00000000:TR0000000000:TR12000123456789',
      'isbank:inner:2026-08-18:TRY:1000.00000000:123-456789:TR0000000000'
    ])
    expect(transaction.comment).toBeNull()
  })

  it('keeps an unrepresentable multicurrency activity reportable', () => {
    expect(() => convertTransaction({
      Amount: '-10',
      CurrencyCode: 'USD',
      Timestamp: '2026-08-18T12:00:00'
    }, account)).toThrow('currency differs')
  })

  it('does not expose external EFT and FAST operations to internal-transfer grouping', () => {
    const transaction = convertTransaction({
      Amount: '-1000,00',
      CurrencyCode: 'TRY',
      Description: 'EFT başka bankaya',
      OperationGroup: 'EFT',
      OtherAccount: 'TR99 0000 0000',
      ReceiptValue: 'external-transfer-1',
      Timestamp: '2026-08-18T12:00:00'
    }, account)

    expect(transaction.movements).toHaveLength(2)
    expect(transaction).not.toHaveProperty('groupKeys')
    expect(transaction.comment).toBe('EFT başka bankaya')
  })

  it('matches both sides of a confirmed inner transfer by the account pair', () => {
    const secondAccount = convertAccounts([{
      ...currentAccount,
      Index: 'account-2',
      AccountBranch: { Code: 321 },
      AccountNumber: '987654',
      Iban: 'TR0000000000'
    }])[0].account
    const outcome = convertTransaction({
      Amount: '-1000,00',
      CurrencyCode: 'TRY',
      Description: 'Virman kendi hesabıma',
      OperationGroup: 'Virman',
      OtherAccount: 'TR00 0000 0000',
      ReceiptValue: 'outcome-receipt',
      Timestamp: '2026-08-18T12:00:00'
    }, account)
    const income = convertTransaction({
      Amount: '1000,00',
      CurrencyCode: 'TRY',
      Description: 'Virman kendi hesabımdan',
      OperationGroup: 'Virman',
      OtherAccount: 'TR12 0001 2345 6789',
      ReceiptValue: 'income-receipt',
      Timestamp: '2026-08-18T12:00:01'
    }, secondAccount)

    const adjusted = adjustTransactions({ transactions: [outcome, income] })

    expect(adjusted).toHaveLength(1)
    expect(adjusted[0].movements).toEqual(expect.arrayContaining([
      expect.objectContaining({ account: { id: account.id }, sum: -1000 }),
      expect.objectContaining({ account: { id: secondAccount.id }, sum: 1000 })
    ]))
  })

  it('rejects malformed transaction amounts instead of creating zero movements', () => {
    expect(() => convertTransaction({
      Amount: 'not available',
      CurrencyCode: 'TRY',
      Timestamp: '2026-08-18T12:00:00'
    }, account)).toThrow('invalid amount')
  })
})
