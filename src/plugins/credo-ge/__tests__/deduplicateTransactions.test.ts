import { Account, AccountType, ExtendedTransaction } from '../../../types/zenmoney'
import { deduplicateTransactions } from '../deduplicateTransactions'
import { Transaction as CredoTransaction } from '../models'

function createAccount (): Account {
  return {
    id: '42401358',
    type: AccountType.ccard,
    title: 'Main',
    instrument: 'GEL',
    syncIds: ['42401358'],
    balance: 100,
    available: 100
  }
}

function createApiTransaction (overrides: Partial<CredoTransaction> = {}): CredoTransaction {
  return {
    credit: null,
    currency: 'GEL',
    operationId: null,
    transactionType: null,
    transactionId: 'FT26082HPCTX',
    debit: 29.43,
    description: 'გადახდა - WOLT GEORGIA LTD 29.43 GEL 23.03.2026',
    isCardBlock: false,
    operationDateTime: '2026-03-23 16:17:00',
    stmtEntryId: '205140745526585.000001',
    canRepeat: false,
    canReverse: false,
    amountEquivalent: 29.43,
    operationType: 'Card transaction' as CredoTransaction['operationType'],
    operationTypeId: null,
    ...overrides
  }
}

function createTransaction (account: Account, overrides: Partial<ExtendedTransaction> = {}): ExtendedTransaction {
  return {
    hold: false,
    date: new Date('2026-03-23T16:17:00+03:00'),
    movements: [
      {
        id: 'FT26082HPCTX',
        account: { id: account.id },
        invoice: { sum: -29.43, instrument: 'GEL' },
        sum: -29.43,
        fee: 0
      }
    ],
    merchant: {
      fullTitle: 'WOLT GEORGIA LTD',
      mcc: null,
      location: null
    },
    comment: null,
    groupKeys: [null],
    ...overrides
  }
}

describe('deduplicateTransactions', () => {
  it('keeps one posted purchase when operationId matches and transactionId differs', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082HPCTX',
        stmtEntryId: 'stmt-1'
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082HPCTX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }
    const second = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082XG4YX',
        stmtEntryId: 'stmt-2'
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction])
  })

  it('keeps one exact posted duplicate when only the fallback fingerprint matches', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082HPCTX',
        stmtEntryId: ''
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082HPCTX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }
    const second = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082XG4YX',
        stmtEntryId: ''
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction])
  })

  it('prefers the posted transaction when operationId is absent and stmtEntryId differs', () => {
    const account = createAccount()
    const hold = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082HPCTX',
        stmtEntryId: 'hold-stmt-1',
        isCardBlock: true
      }),
      transaction: createTransaction(account, {
        hold: true
      })
    }
    const posted = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082XG4YX',
        stmtEntryId: 'posted-stmt-2'
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([hold, posted])).toEqual([posted.transaction])
  })

  it('keeps distinct transactions when operationId and stmtEntryId both differ', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082HPCTX',
        stmtEntryId: 'stmt-1'
      }),
      transaction: createTransaction(account)
    }
    const second = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-2',
        transactionId: 'FT26082XG4YX',
        stmtEntryId: 'stmt-2'
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction, second.transaction])
  })

  it('keeps repeated purchases when timestamps differ', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082HPCTX',
        stmtEntryId: ''
      }),
      transaction: createTransaction(account, {
        date: new Date('2026-03-23T16:17:00+03:00')
      })
    }
    const second = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082XG4YX',
        stmtEntryId: '',
        operationDateTime: '2026-03-23 16:18:00'
      }),
      transaction: createTransaction(account, {
        date: new Date('2026-03-23T16:18:00+03:00'),
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction, second.transaction])
  })

  it('keeps same-timestamp purchases when merchant or comment differs', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082HPCTX',
        stmtEntryId: ''
      }),
      transaction: createTransaction(account)
    }
    const second = {
      apiTransaction: createApiTransaction({
        transactionId: 'FT26082XG4YX',
        stmtEntryId: '',
        description: 'გადახდა - BOLT FOOD 29.43 GEL 23.03.2026'
      }),
      transaction: createTransaction(account, {
        merchant: {
          fullTitle: 'BOLT FOOD',
          mcc: null,
          location: null
        },
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction, second.transaction])
  })

  it('prefers the posted transaction when hold and posted share the same logical key', () => {
    const account = createAccount()
    const hold = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        isCardBlock: true,
        transactionId: 'FT26082HPCTX',
        stmtEntryId: 'stmt-1'
      }),
      transaction: createTransaction(account, {
        hold: true
      })
    }
    const posted = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082XG4YX',
        stmtEntryId: 'stmt-2'
      }),
      transaction: createTransaction(account, {
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([hold, posted])).toEqual([posted.transaction])
  })

  it('leaves transfers untouched even when stable ids match', () => {
    const account = createAccount()
    const first = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082HPCTX'
      }),
      transaction: createTransaction(account, {
        comment: 'Transfer between own accounts',
        groupKeys: ['FT26082HPCTX']
      })
    }
    const second = {
      apiTransaction: createApiTransaction({
        operationId: 'OP-1',
        transactionId: 'FT26082XG4YX'
      }),
      transaction: createTransaction(account, {
        comment: 'Transfer between own accounts',
        groupKeys: ['FT26082XG4YX'],
        movements: [{
          id: 'FT26082XG4YX',
          account: { id: account.id },
          invoice: { sum: -29.43, instrument: 'GEL' },
          sum: -29.43,
          fee: 0
        }]
      })
    }

    expect(deduplicateTransactions([first, second])).toEqual([first.transaction, second.transaction])
  })
})
