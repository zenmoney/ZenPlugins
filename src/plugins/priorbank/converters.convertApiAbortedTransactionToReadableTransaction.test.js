import { convertApiAbortedTransactionToReadableTransaction, mergeTransfers } from './converters'
import { formatCommentDateTime } from '../../common/dateUtils'

const transferIncome = {
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
const transferOutcome = {
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
  expect(convertApiAbortedTransactionToReadableTransaction(transferIncome))
    .toMatchObject({ movements: [{ sum: 100 }] })

  expect(convertApiAbortedTransactionToReadableTransaction(transferOutcome))
    .toMatchObject({ movements: [{ sum: -49.99 }] })
})

test('it merges correctly', () => {
  expect(mergeTransfers({
    items: [transferOutcome, transferIncome].map((transaction) => ({
      apiTransaction: { type: 'abortedTransaction', payload: transaction.abortedTransaction, card: { clientObject: { currIso: transaction.accountCurrency } } },
      readableTransaction: convertApiAbortedTransactionToReadableTransaction(transaction)
    }))
  })).toEqual([
    {
      movements: [
        { id: null, account: { id: 'test(accountId2)' }, sum: -49.99, invoice: { sum: -100, instrument: 'BYN' }, fee: 0 },
        { id: null, account: { id: 'test(accountId1)' }, sum: 100, invoice: null, fee: 0 }
      ],
      date: new Date('2018-01-01T12:34:56+03:00'),
      hold: true,
      merchant: null,
      comment: '(rate=2.0004)'
    }
  ])
})

describe('comment', () => {
  const transaction = convertApiAbortedTransactionToReadableTransaction({
    accountId: 'test(accountId)',
    accountCurrency: 'USD',
    abortedTransaction: {
      amount: 75.37,
      transAmount: 165.89,
      transCurrIso: 'BYN',
      transDetails: 'Retail BLR MINSK SHOP VINO VINO BPSB',
      transDate: '2020-02-22T00:00:00+03:00',
      transDateSpecified: true,
      transTime: '12:34:56',
      hce: false
    },
    includeDateTimeInComment: true
  })
  it('includes transaction datetime', () => {
    expect(transaction.comment).toEqual(expect.stringContaining(formatCommentDateTime(transaction.date)))
  })

  it('includes transaction invoice price', () => {
    expect(transaction.comment).toEqual(expect.stringContaining('165.89 BYN'))
  })

  it('includes transaction conversion rate', () => {
    expect(transaction.comment).toEqual(expect.stringContaining('(rate=2.2010)'))
  })
})
