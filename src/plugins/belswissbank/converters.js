import { formatCommentDateTime } from '../../common/dates'

export const floorToMinutes = (ticks) => new Date(Math.floor(ticks / 60000) * 60000).valueOf()

export function formatDetails ({ transaction, matchedPayment }) {
  const timestamp = formatCommentDateTime(new Date(transaction.transactionDate))
  if (matchedPayment) {
    return {
      payee: [matchedPayment.name, matchedPayment.target].filter(Boolean).join(', '),
      comment: [matchedPayment.comment, timestamp].filter(Boolean).join(' ')
    }
  }
  return {
    payee: [transaction.countryCode, transaction.city, transaction.transactionDetails].filter(Boolean).join(' '),
    comment: timestamp
  }
}
