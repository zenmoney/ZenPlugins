import { convertTransaction } from '../../../converters'

const accounts = [{
  id: 'card-1',
  type: 'card',
  instrument: 'BYN',
  syncID: ['card-1']
}]

const checkingAccounts = [{
  id: 'account-1',
  type: 'checking',
  instrument: 'BYN',
  syncID: ['account-1']
}]

function makeOperation (overrides = {}) {
  return {
    id: 'operation-1',
    productId: 'card-1',
    productType: 'CARD',
    paymentDate: '2026-07-28T12:30:00+03:00',
    operationName: 'Покупка',
    operationDetail: {
      statusCode: 'EXECUTED',
      authorizationCode: '123456'
    },
    operationSum: { amount: '32.15', currency: 'BYN', sign: 'MINUS' },
    transactionSum: { amount: '10.00', currency: 'USD', sign: 'MINUS' },
    ...overrides
  }
}

describe('Iskra transactions', () => {
  it('uses the amount in the account currency and keeps the foreign invoice', () => {
    expect(convertTransaction(makeOperation(), accounts)).toMatchObject({
      date: new Date('2026-07-28T09:30:00.000Z'),
      movements: [{
        account: { id: 'card-1' },
        sum: -32.15,
        invoice: { sum: -10, instrument: 'USD' }
      }],
      hold: false
    })
  })

  it('uses paymentDate as the real transaction date instead of the later statement date', () => {
    const transaction = convertTransaction(makeOperation({
      paymentDate: '2026-07-27T18:45:00+03:00',
      operationDetail: {
        statusCode: 'EXECUTED',
        operationDate: '2026-07-28T09:00:00+03:00'
      }
    }), accounts)

    expect(transaction.date).toEqual(new Date('2026-07-27T15:45:00.000Z'))
  })

  it('falls back to operationDate when paymentDate is malformed', () => {
    const transaction = convertTransaction(makeOperation({
      paymentDate: '-',
      operationDetail: {
        statusCode: 'EXECUTED',
        operationDate: '2026-07-28T09:00:00+03:00'
      }
    }), accounts)

    expect(transaction.date).toEqual(new Date('2026-07-28T06:00:00.000Z'))
  })

  it('uses operationSum when transactionSum is absent', () => {
    const transaction = convertTransaction(makeOperation({
      operationSum: { amount: '32.15', currency: 'BYN', sign: 'MINUS' },
      transactionSum: null
    }), accounts)

    expect(transaction).toMatchObject({
      movements: [{
        account: { id: 'card-1' },
        sum: -32.15,
        invoice: null
      }]
    })
  })

  it('uses the API operation type and id instead of a reusable authorization code', () => {
    const transaction = convertTransaction(makeOperation({
      idType: 'CARD_OPERATION',
      operationDetail: {
        statusCode: 'EXECUTED',
        authorizationCode: '123456'
      }
    }), accounts)

    expect(transaction.movements[0].id).toBe('CARD_OPERATION:operation-1')
  })

  it('keeps ACCOUNT movement identity stable when the API changes its operation id', () => {
    const operation = makeOperation({
      productId: 'account-1',
      productType: 'ACCOUNT',
      operationName: 'Кэшбек',
      operationDetail: {
        operationDate: '2026-07-28T12:30:00+03:00',
        source: 'ACCOUNT'
      },
      operationSum: null,
      transactionSum: { amount: '0.57', currency: 'BYN', sign: 'PLUS' }
    })

    const first = convertTransaction({
      ...operation,
      id: '123456789_11111111-1111-4111-8111-111111111111',
      idType: 'actionId'
    }, checkingAccounts)
    const second = convertTransaction({
      ...operation,
      id: '123456789_22222222-2222-4222-8222-222222222222',
      idType: 'actionId'
    }, checkingAccounts)

    expect(first.movements[0].id).toBe('123456789')
    expect(second.movements[0].id).toBe(first.movements[0].id)
  })

  it('does not merge separate ACCOUNT actions with otherwise identical details', () => {
    const operation = makeOperation({
      id: '123456789_11111111-1111-4111-8111-111111111111',
      idType: 'actionId',
      productId: 'account-1',
      productType: 'ACCOUNT',
      operationName: 'Кэшбек',
      operationDetail: { operationDate: '2026-07-28T12:30:00+03:00', source: 'ACCOUNT' },
      operationSum: null,
      transactionSum: { amount: '0.57', currency: 'BYN', sign: 'PLUS' }
    })
    const nextOperation = {
      ...operation,
      id: '987654321_22222222-2222-4222-8222-222222222222'
    }

    const first = convertTransaction(operation, checkingAccounts)
    const second = convertTransaction(nextOperation, checkingAccounts)

    expect(second.movements[0].id).not.toBe(first.movements[0].id)
  })

  it('parses a single fractional digit as hundredths', () => {
    const transaction = convertTransaction(makeOperation({
      transactionSum: {
        integerPart: 10,
        fractionalPart: 5,
        currency: 'USD',
        sign: 'MINUS'
      }
    }), accounts)

    expect(transaction.movements[0].invoice).toEqual({ sum: -10.05, instrument: 'USD' })
  })

  it('marks only in-progress operations as holds', () => {
    const transaction = convertTransaction(makeOperation({
      operationDetail: { statusCode: 'IN_PROGRESS' }
    }), accounts)

    expect(transaction.hold).toBe(true)
  })

  it('skips cancelled operations', () => {
    expect(convertTransaction(makeOperation({
      operationDetail: { statusCode: 'CANCELLED' }
    }), accounts)).toBeNull()
  })

  it.each(['CANCELLED', 'IN_PROGRESS'])('treats %s status as executed for non-card products', statusCode => {
    const transaction = convertTransaction(makeOperation({
      productId: 'account-1',
      productType: 'ACCOUNT',
      operationDetail: { statusCode },
      operationSum: null,
      transactionSum: { amount: '25.00', currency: 'BYN', sign: 'PLUS' }
    }), checkingAccounts)

    expect(transaction).toMatchObject({
      movements: [{ sum: 25, invoice: null }],
      hold: false
    })
  })
})
