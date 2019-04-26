import { convertApiAbortedTransactionToReadableTransaction, mergeTransfers } from './converters'

const transferOutcome = {
  accountId: 'test(accountId1)',
  accountCurrency: 'BYN',
  abortedTransaction: {
    amount: -100,
    transAmount: 100,
    transCurrIso: 'BYN',
    transDetails: 'CH Payment BLR MINSK P2P SDBO NO FEE',
    transDate: '2018-01-01T00:00:00+03:00',
    transDateSpecified: true,
    transTime: '12:34:56',
    hce: false
  }
}
const transferIncome = {
  accountId: 'test(accountId2)',
  accountCurrency: 'USD',
  abortedTransaction: {
    amount: 49.99,
    transAmount: 100,
    transCurrIso: 'BYN',
    transDetails: 'CH Debit BLR MINSK P2P SDBO NO FEE',
    transDate: '2018-01-01T00:00:00+03:00',
    transDateSpecified: true,
    transTime: '12:34:56',
    hce: false
  }
}

test('it chooses correct debit side sign', () => {
  expect(convertApiAbortedTransactionToReadableTransaction(transferOutcome))
    .toMatchObject({ movements: [{ sum: -100 }] })

  expect(convertApiAbortedTransactionToReadableTransaction(transferIncome))
    .toMatchObject({ movements: [{ sum: 49.99 }] })
})

test('it merges correctly', () => {
  expect(mergeTransfers({
    items: [transferIncome, transferOutcome].map((transaction) => ({
      apiTransaction: { type: 'abortedTransaction', payload: transaction.abortedTransaction, card: { clientObject: { currIso: transaction.accountCurrency } } },
      readableTransaction: convertApiAbortedTransactionToReadableTransaction(transaction)
    }))
  })).toEqual([
    {
      'movements': [
        { 'id': null, 'account': { 'id': 'test(accountId1)' }, 'sum': -100, 'invoice': null, 'fee': 0 },
        { 'id': null, 'account': { 'id': 'test(accountId2)' }, 'sum': 49.99, 'invoice': { sum: +100, instrument: 'BYN' }, 'fee': 0 }
      ],
      'date': new Date('2018-01-01T00:00:00+03:00'),
      'hold': true,
      'merchant': null,
      'comment': '(rate=1/2.0004)'
    }
  ])
})
