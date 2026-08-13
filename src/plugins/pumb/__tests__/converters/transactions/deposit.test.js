import { convertTransaction } from '../../../converters'

const link = {
  account: {
    id: 'deposit:201',
    type: 'deposit',
    title: 'Дохідний',
    instrument: 'UAH',
    syncIds: ['DP-201'],
    balance: 1100
  },
  fetchParams: { sources: [{ type: 'deposit', depositId: 201 }] }
}

describe('convertTransaction: deposit operations', () => {
  it('uses balance delta and emits groupKeys for transfers', () => {
    expect(convertTransaction({
      type: 'deposit',
      depositId: 201,
      data: {
        amount: 10000,
        description: 'Поповнення депозиту',
        operationId: 'deposit-operation-1',
        operationDate: '2026-08-11',
        processedDate: '2026-08-11',
        balanceBefore: 100000,
        balanceAfter: 110000,
        operationType: 'REPLENISHMENT',
        debetIban: 'UA111111111111111111111111111',
        creditIban: 'UA222222222222222222222222222',
        currencyCode: 'UAH'
      }
    }, link)).toEqual({
      hold: false,
      date: new Date('2026-08-10T21:00:00.000Z'),
      movements: [{
        id: 'deposit-operation-1',
        account: { id: 'deposit:201' },
        invoice: null,
        sum: 100,
        fee: 0
      }],
      merchant: null,
      comment: 'Поповнення депозиту',
      groupKeys: [
        'deposit-operation-1',
        '2026-08-11_UAH_100'
      ]
    })
  })

  it('swallows only recognized non-financial zero-delta events', () => {
    expect(convertTransaction({
      type: 'deposit',
      depositId: 201,
      data: {
        amount: 0,
        operationId: 'deposit-operation-2',
        operationDate: '2026-08-11',
        balanceBefore: 110000,
        balanceAfter: 110000,
        operationType: 'LONGATION_STATUS_CHANGE',
        currencyCode: 'UAH'
      }
    }, link)).toBeNull()

    expect(() => convertTransaction({
      type: 'deposit',
      depositId: 201,
      data: {
        amount: 0,
        operationId: 'deposit-operation-3',
        operationDate: '2026-08-11',
        balanceBefore: 110000,
        balanceAfter: 110000,
        operationType: 'NEW_OPERATION_TYPE',
        currencyCode: 'UAH'
      }
    }, link)).toThrow('NEW_OPERATION_TYPE')
  })
})
