import { parseTransactions } from '../parser'
import { convertTransaction } from '../converters'
import { AccountType, AccountReferenceByData, Merchant, Movement } from '../../../types/zenmoney'

describe('Transfer Parsing and Conversion', () => {
  it('should parse and convert IBAN transfer', () => {
    const text = `
    30.11.2025 -1000.00 KZT Перевод
    Ivanov I. KZ123456789012345678
    `
    const transactions = parseTransactions(text)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].parsedDetails?.receiverAccount).toBe('KZ123456789012345678')
    // normalizeText removes single spaces: "Ivanov I." -> "IvanovI."
    expect(transactions[0].parsedDetails?.receiver).toContain('IvanovI.')

    const zenTransaction = convertTransaction(transactions[0], 'my-account-id')
    expect(zenTransaction.movements).toHaveLength(2)

    const movement2 = zenTransaction.movements[1] as Movement
    const secondAccount = movement2.account as AccountReferenceByData
    expect(secondAccount.syncIds).toEqual(['KZ123456789012345678'])
    expect(secondAccount.type).toBe(AccountType.checking)

    expect(movement2.sum).toBe(1000.00)

    // Merchant should contain the name
    expect(zenTransaction.merchant).not.toBeNull()
    expect((zenTransaction.merchant as Merchant).title).toContain('IvanovI.')
  })

  it('should parse and convert full card transfer', () => {
    const text = `
    01.12.2025 -2000.00 KZT Transfer
    Petrov P. 4400111122223333
    `
    const transactions = parseTransactions(text)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].parsedDetails?.receiverAccount).toBe('4400111122223333')

    const zenTransaction = convertTransaction(transactions[0], 'my-account-id')
    expect(zenTransaction.movements).toHaveLength(2)

    const movement2 = zenTransaction.movements[1] as Movement
    const secondAccount = movement2.account as AccountReferenceByData
    expect(secondAccount.syncIds).toEqual(['4400111122223333'])
    expect(movement2.sum).toBe(2000.00)

    expect((zenTransaction.merchant as Merchant).title).toContain('PetrovP.')
  })

  it('should parse and convert masked card transfer', () => {
    const text = `
    02.12.2025 -3000.00 KZT Transfer
    Sidorov S. 123456******1234
    `
    const transactions = parseTransactions(text)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].parsedDetails?.receiverAccount).toBe('123456******1234')

    const zenTransaction = convertTransaction(transactions[0], 'my-account-id')
    expect(zenTransaction.movements).toHaveLength(2)

    const movement2 = zenTransaction.movements[1] as Movement
    const secondAccount = movement2.account as AccountReferenceByData
    expect(secondAccount.syncIds).toEqual(['123456******1234'])

    expect((zenTransaction.merchant as Merchant).title).toContain('SidorovS.')
  })

  it('should parse and convert short masked card transfer', () => {
    const text = `
    03.12.2025 -4000.00 KZT Transfer
    Sidorov S. ****1234
    `
    const transactions = parseTransactions(text)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].parsedDetails?.receiverAccount).toBe('****1234')

    const zenTransaction = convertTransaction(transactions[0], 'my-account-id')
    expect(zenTransaction.movements).toHaveLength(2)

    const movement2 = zenTransaction.movements[1] as Movement
    const secondAccount = movement2.account as AccountReferenceByData
    expect(secondAccount.syncIds).toEqual(['****1234'])
  })

  it('should fallback to merchant if no account number found', () => {
    const text = `
    04.12.2025 -5000.00 KZT Transfer
    Just Name No Number
    `
    const transactions = parseTransactions(text)
    expect(transactions).toHaveLength(1)
    expect(transactions[0].parsedDetails?.receiverAccount).toBeUndefined()
    expect(transactions[0].parsedDetails?.receiver).toBe('JustNameNoNumber')

    const zenTransaction = convertTransaction(transactions[0], 'my-account-id')
    expect(zenTransaction.movements).toHaveLength(1)

    // Merchant should be created
    expect((zenTransaction.merchant as any)?.title).toBe('JustNameNoNumber')
  })
})
