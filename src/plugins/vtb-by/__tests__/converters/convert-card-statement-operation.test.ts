import { Account, AccountType } from '../../../../types/zenmoney'
import { convertFullStatementOperation, convertMiniCardStatementOperation } from '../../converters'
import type { FetchCardStatementOperation, FetchMiniCardStatementOperation } from '../../types/fetch'

describe('convertMiniCardStatementOperation', () => {
  it('uses transaction amount sign for a VTB mini card statement operation', () => {
    const operation: FetchMiniCardStatementOperation = {
      operationDate: 1777561115000,
      operationDescription: 'Покупка',
      operationAmount: 32,
      operationCurrency: '933',
      operationPlace: 'STORE',
      operationState: 1,
      transactionAmount: -10,
      transactionCurrency: '840',
      transactionAuthCode: '999'
    }

    const account: Account = {
      id: 'test-card-contract-1',
      type: AccountType.ccard,
      title: 'Тестовая карта BYN *1111',
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001']
    }

    expect(convertMiniCardStatementOperation(operation, account)).toEqual({
      hold: false,
      date: new Date(1777561115000),
      comment: 'Покупка\nSTORE',
      movements: [
        {
          id: 'test-card-contract-1:auth:1777561115000:999',
          account: { id: 'test-card-contract-1' },
          fee: 0,
          invoice: {
            sum: -10,
            instrument: 'USD'
          },
          sum: -32
        }
      ],
      merchant: null
    })
  })

  it('keeps mini card movement id stable when a held operation clears', () => {
    const operation: FetchMiniCardStatementOperation = {
      operationDate: 1777561115000,
      operationDescription: 'Авторизация',
      operationAmount: 32,
      operationCurrency: '933',
      operationPlace: 'STORE',
      operationState: 0,
      transactionAmount: -10,
      transactionCurrency: '840',
      transactionAuthCode: '999'
    }

    const account: Account = {
      id: 'test-card-contract-1',
      type: AccountType.ccard,
      title: 'Тестовая карта BYN *1111',
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001']
    }

    const holdTransaction = convertMiniCardStatementOperation(operation, account)
    const postedTransaction = convertMiniCardStatementOperation({
      ...operation,
      operationDescription: 'Покупка',
      operationAmount: 33,
      transactionAmount: -11,
      operationState: 1
    }, account)

    expect(holdTransaction.hold).toBe(true)
    expect(postedTransaction.hold).toBe(false)
    expect(postedTransaction.movements[0].id).toBe(holdTransaction.movements[0].id)
  })

  it('keeps repeated mini card auth codes distinct across operation dates', () => {
    const operation: FetchMiniCardStatementOperation = {
      operationDate: 1777561115000,
      operationDescription: 'Покупка',
      operationAmount: 32,
      operationCurrency: '933',
      operationPlace: 'STORE',
      operationState: 1,
      transactionAmount: -10,
      transactionCurrency: '840',
      transactionAuthCode: '999'
    }

    const account: Account = {
      id: 'test-card-contract-1',
      type: AccountType.ccard,
      title: 'Тестовая карта BYN *1111',
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001']
    }

    const firstTransaction = convertMiniCardStatementOperation(operation, account)
    const secondTransaction = convertMiniCardStatementOperation({
      ...operation,
      operationDate: 1777647515000
    }, account)

    expect(secondTransaction.movements[0].id).not.toBe(firstTransaction.movements[0].id)
  })

  it('includes stable fallback details when mini card auth code is missing', () => {
    const operation: FetchMiniCardStatementOperation = {
      operationDate: 1777561115000,
      operationDescription: 'Покупка',
      operationAmount: 32,
      operationCurrency: '933',
      operationPlace: 'STORE',
      operationState: 1,
      transactionAmount: -10,
      transactionCurrency: '840',
      mcc: 5411
    }

    const account: Account = {
      id: 'test-card-contract-1',
      type: AccountType.ccard,
      title: 'Тестовая карта BYN *1111',
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001']
    }

    expect(convertMiniCardStatementOperation(operation, account).movements[0].id)
      .toBe('test-card-contract-1:details:1777561115000:-10:840:32:933:Покупка:STORE:5411')
  })

  it('converts a full statement operation for deposit accounts', () => {
    const operation: FetchCardStatementOperation = {
      accountNumber: 'deposit-account-1',
      operationName: 'Капитализация',
      transactionDate: 1778389322000,
      operationDate: 1778389322000,
      transactionAmount: 13155.4,
      transactionCurrency: '643',
      operationAmount: 13155.4,
      operationCurrency: '643',
      operationSign: '1',
      actionGroup: 19,
      operationClosingBalance: 965877.97,
      operationCode: 999
    }

    const account: Account = {
      id: 'test-deposit-contract-1',
      type: AccountType.deposit,
      title: 'Тестовый вклад',
      balance: 965877.97,
      instrument: 'RUB',
      syncIds: ['TEST-IBAN-DEPOSIT-0001'],
      startDate: new Date(1736283600000),
      startBalance: 1225.71,
      capitalization: true,
      percent: 15.9,
      endDateOffsetInterval: 'year',
      endDateOffset: 1,
      payoffInterval: 'month',
      payoffStep: 1
    }

    expect(convertFullStatementOperation(operation, account)).toEqual({
      hold: null,
      date: new Date(1778389322000),
      comment: 'Капитализация',
      movements: [
        {
          id: 'test-deposit-contract-1:1778389322000:999:19:1:13155.4:13155.4:965877.97:Капитализация',
          account: { id: 'test-deposit-contract-1' },
          fee: 0,
          invoice: null,
          sum: 13155.4
        }
      ],
      merchant: null
    })
  })

  it('keeps outgoing full statement operations distinct and negative', () => {
    const operation: FetchCardStatementOperation = {
      accountNumber: 'deposit-account-1',
      operationName: 'Списание',
      transactionDate: 1778389322000,
      operationDate: 1778389322000,
      transactionAmount: 1000,
      transactionCurrency: '643',
      operationAmount: 1000,
      operationCurrency: '643',
      operationSign: '-1',
      actionGroup: 1,
      operationClosingBalance: 964877.97,
      operationCode: 1
    }

    const account: Account = {
      id: 'test-deposit-contract-1',
      type: AccountType.deposit,
      title: 'Тестовый вклад',
      balance: 964877.97,
      instrument: 'RUB',
      syncIds: ['TEST-IBAN-DEPOSIT-0001'],
      startDate: new Date(1736283600000),
      startBalance: 1225.71,
      capitalization: true,
      percent: 15.9,
      endDateOffsetInterval: 'year',
      endDateOffset: 1,
      payoffInterval: 'month',
      payoffStep: 1
    }

    expect(convertFullStatementOperation(operation, account)).toEqual({
      hold: null,
      date: new Date(1778389322000),
      comment: 'Списание',
      movements: [
        {
          id: 'test-deposit-contract-1:1778389322000:1:1:-1:-1000:-1000:964877.97:Списание',
          account: { id: 'test-deposit-contract-1' },
          fee: 0,
          invoice: null,
          sum: -1000
        }
      ],
      merchant: null
    })
  })
})
