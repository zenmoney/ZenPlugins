import { convertApiRegularTransactionToReadableTransaction } from './converters'
import { formatCommentDateTime } from '../../common/dateUtils'

describe('comment', () => {
  const transaction = convertApiRegularTransactionToReadableTransaction({
    accountId: 'test(accountId)',
    accountCurrency: 'USD',
    regularTransaction: {
      'postingDate': '2020-02-20T00:00:00+03:00',
      'postingDateSpecified': true,
      'transDate': '2020-02-20T00:00:00+03:00',
      'transDateSpecified': true,
      'transTime': '12:34:56',
      'transCurrIso': 'BYN',
      'amount': -37,
      'feeAmount': 0,
      'accountAmount': -16.82,
      'transDetails': 'Retail BLR Minsk OOO Dzhon Dori  ',
      'hce': false
    },
    includeDateTimeInComment: true
  })

  it('includes transaction datetime', () => {
    expect(transaction.comment).toEqual(expect.stringContaining(formatCommentDateTime(transaction.date)))
  })

  it('includes transaction invoice price', () => {
    expect(transaction.comment).toEqual(expect.stringContaining('37.00 BYN'))
  })

  it('includes transaction conversion rate', () => {
    expect(transaction.comment).toEqual(expect.stringContaining('(rate=2.1998)'))
  })
})
