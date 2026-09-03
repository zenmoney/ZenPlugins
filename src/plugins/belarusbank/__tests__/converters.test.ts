import { AccountType } from '../../../types/zenmoney'
import { convertAccount, convertCard, convertCardTransaction, convertCredit, convertDeposit, convertPaymentHistoryTransaction } from '../converters'

// Test records are synthetic and must not be copied from real bank data.
describe('Belarusbank converters', () => {
  it('converts a card with string balance and numeric active status', () => {
    const account = convertCard({
      productId: 10,
      productCardId: 20,
      name: 'Моя карта',
      cardPAN: '**** 1234',
      currencyIso: '933',
      amount: '101.25',
      status: 0
    })

    expect(account).toMatchObject({
      id: '10',
      type: AccountType.ccard,
      title: 'Моя карта *1234',
      instrument: 'BYN',
      syncIds: ['10', '20', '1234'],
      balance: 101.25,
      available: 101.25,
      archived: false,
      _meta: {
        productId: '10',
        transactionCardId: '10',
        statementProductId: '10',
        productKind: 'card'
      }
    })
  })

  it('converts a current account and uses the product kind as a title fallback', () => {
    const account = convertAccount({
      productId: 'account-1',
      contractKindName: 'Текущий счёт',
      ibanNum: 'BY00AKBB00000000000000000000',
      contractCurrencyIso: 'BYN',
      contractCurrentRest: '55,70',
      isArchived: false
    })

    expect(account).toMatchObject({
      id: 'account-1',
      type: AccountType.checking,
      title: 'Текущий счёт',
      instrument: 'BYN',
      balance: 55.7,
      archived: false
    })
  })

  it('converts detailed deposit data including dates and interest', () => {
    const account = convertDeposit({
      productId: 'deposit-1',
      name: 'Безотзывный вклад',
      contractNumber: 'D-1',
      contractCurrencyIso: '933',
      contractCurrentRest: '1000.50',
      contractOpenDate: '2026-01-15',
      contractEndDate: '2027-01-15',
      percRate: '12.5',
      isArchived: false
    })

    expect(account).toMatchObject({
      id: 'deposit-1',
      type: AccountType.deposit,
      title: 'Безотзывный вклад',
      instrument: 'BYN',
      balance: 1000.5,
      startBalance: 1000.5,
      percent: 12.5,
      capitalization: false,
      payoffInterval: null,
      payoffStep: 0,
      archived: false
    })
    if (account.type !== AccountType.deposit) throw new Error('Expected deposit account')
    expect(account.startDate).toEqual(new Date('2026-01-15'))
  })

  it('maps deposit capitalization only when the bank description states it explicitly', () => {
    const account = convertDeposit({
      productId: 'deposit-2',
      name: 'Вклад с ежемесячной капитализацией',
      contractCurrencyIso: 'BYN',
      contractCurrentRest: '1000',
      contractOpenDate: '2026-01-15',
      contractEndDate: '2027-01-15'
    })

    expect(account).toMatchObject({
      capitalization: true,
      payoffInterval: 'month',
      payoffStep: 1
    })
  })

  it('converts a credit to a negative outstanding balance', () => {
    const account = convertCredit({
      productId: 'credit-1',
      name: 'Кредит',
      contractCurrencyIso: 'BYN',
      contractFirstSum: '5000',
      restCredit: '1200.10',
      restPerc: '10.20',
      restOverdue: '3.40',
      percRate: '11.9',
      contractOpenDate: '2025-01-01',
      returnDate: '2027-01-01',
      status: 0
    })

    expect(account).toMatchObject({
      type: AccountType.loan,
      balance: -1213.7,
      startBalance: 5000,
      percent: 11.9,
      archived: false
    })
  })

  it('uses the credit direction and account-currency amount from a card operation', () => {
    const account = convertCard({
      productId: 'card-1',
      productCardId: 'card-product-1',
      currencyIso: 'BYN',
      amount: 100
    })
    const transaction = convertCardTransaction({
      id: 777,
      authorizationDate: '2026-08-20T10:30:00+03:00',
      operationDirection: 'credit',
      amount: '10.00',
      currency: 'USD',
      amountInAccountCurrency: '3150.00',
      accountCurrency: 'BYN',
      transactionDescription: 'Покупка',
      merchantName: 'МАГАЗИН',
      merchantCountry: 'BY',
      merchantCity: 'MINSK',
      mcc: '5411'
    }, account)

    expect(transaction).toEqual({
      hold: null,
      date: new Date('2026-08-20T10:30:00+03:00'),
      comment: 'Покупка',
      movements: [{
        id: expect.stringMatching(/^[a-f0-9]{32}$/),
        account: { id: 'card-1' },
        fee: 0,
        invoice: {
          sum: 10,
          instrument: 'USD'
        },
        sum: 31.5
      }],
      merchant: {
        country: 'BY',
        city: 'MINSK',
        title: 'МАГАЗИН',
        mcc: 5411,
        location: null
      }
    })
  })

  it('converts a RUB P2P credit to the linked BYN account amount in minor units', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: '933', amount: '67.89' })
    const transaction = convertCardTransaction({
      id: 1001,
      accountCurrency: '933',
      accountNumber: 'test-account',
      amount: '123.45',
      amountInAccountCurrency: '6789.00',
      authorizationDate: '2026-02-03T12:34:56',
      currency: '643',
      mcc: '6012',
      merchantCity: 'MINSK',
      merchantCountry: 'BLR',
      merchantName: 'PERSON TO PERSON',
      operationDirection: 'credit',
      rrn: 'test-transfer-reference',
      terminalAddress: 'PERSON TO PERSON BLR TEST CITY',
      transactionDescription: 'P2P Credit part',
      transactionType: '785'
    }, account)

    expect(transaction.date).toEqual(new Date('2026-02-03T09:34:56.000Z'))
    expect(transaction).toMatchObject({
      groupKeys: ['belarusbank:p2p:2026-02-03T09:34:56.000Z:RUB:123.45'],
      movements: [{
        account: { id: 'card-1' },
        sum: 67.89,
        invoice: {
          sum: 123.45,
          instrument: 'RUB'
        }
      }]
    })

    const counterpart = convertCardTransaction({
      id: 1002,
      accountCurrency: '643',
      amount: '123.45',
      amountInAccountCurrency: '12345.00',
      authorizationDate: '2026-02-03T12:34:56',
      currency: '643',
      operationDirection: 'debit',
      rrn: 'different-transfer-reference',
      transactionDescription: 'P2P Debit part',
      transactionType: '781'
    }, convertCard({ productId: 'card-2', currencyIso: '643', amount: '0' }))

    expect(counterpart.groupKeys).toEqual(transaction.groupKeys)
  })

  it('keeps major-unit decimals, applies a negative debit sign and ignores a changing bank row id', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'RUB', amount: '456.78' })
    const first = convertCardTransaction({
      id: 2001,
      authorizationDate: '2026-02-04T08:15:30+03:00',
      operationDirection: 'DEBIT',
      amount: '456.78',
      currency: 'RUB',
      amountInAccountCurrency: '45678.00',
      accountCurrency: 'RUB',
      transactionDescription: 'Первое описание',
      rrn: 'stable-rrn'
    }, account)
    const refreshed = convertCardTransaction({
      id: 2002,
      authorizationDate: '2026-02-04T08:15:30+03:00',
      operationDirection: 'DEBIT',
      amount: '456.78',
      currency: 'RUB',
      amountInAccountCurrency: '45678.00',
      accountCurrency: 'RUB',
      transactionDescription: 'Уточнённое описание',
      rrn: 'stable-rrn'
    }, account)

    expect(account.balance).toBe(456.78)
    expect(first.movements[0].sum).toBe(-456.78)
    expect(first.movements[0].id).toBe(refreshed.movements[0].id)
  })

  it('merges linked current-account identities into the card', () => {
    const account = convertCard({
      productId: 'card-1',
      productCardId: 'physical-card-1',
      cardPAN: '**** 1234',
      cardAccountNumber: 'contract-1',
      ibanNum: 'BY00CARD',
      currencyIso: 'BYN',
      amount: '0'
    }, {
      productId: 'account-1',
      contractNumber: 'contract-1',
      ibanNum: 'BY00CARD',
      contractCurrencyIso: 'BYN',
      contractCurrentRest: '456.78'
    })

    expect(account.syncIds).toEqual([
      'card-1',
      'physical-card-1',
      'BY00CARD',
      'contract-1',
      'account-1',
      '1234'
    ])
    expect(account).toMatchObject({ balance: 0, available: 0 })
  })

  it('rejects a card operation without a valid authorization date', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'BYN' })

    expect(() => convertCardTransaction({
      id: 1,
      authorizationDate: 'not-a-date',
      operationDirection: 'debit',
      amount: 1
    }, account)).toThrow('authorizationDate')
  })

  it('ignores zero-amount rows from the app payment history', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'BYN' })

    expect(convertPaymentHistoryTransaction({
      id: 'zero-payment',
      amount: 0,
      currency: 'BYN',
      time: '2026-02-01T10:20:30Z',
      paymentName: 'Тестовая нулевая операция'
    }, account)).toBeNull()
  })

  it('includes the payment-history fee in the account movement total', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'BYN' })

    expect(convertPaymentHistoryTransaction({
      id: 'bank-transfer',
      amount: '20.00',
      feeAmount: '0.50',
      currency: 'BYN',
      time: '2026-02-05T09:10:20Z',
      timeBpc: '2026-02-05T09:10:21Z',
      paymentName: 'Тестовый банковский перевод'
    }, account)).toMatchObject({
      date: new Date('2026-02-05T12:10:21+03:00'),
      movements: [{ account: { id: 'card-1' }, sum: -20.5 }]
    })
  })
})
