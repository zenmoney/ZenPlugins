import { adjustTransactions, mergeTransfersHandler } from '../../common/transactionGroupHandler'
import { ExtendedTransaction, Transaction } from '../../types/zenmoney'

const boilerplate = new Set(['Перевод себе', 'Перевод собственных средств. Без налога (НДС).'])

export function groupTransactions (transactions: ExtendedTransaction[]): Transaction[] {
  return adjustTransactions({
    transactions,
    groupHandlers: [(items: ExtendedTransaction[]) => {
      const merged = mergeTransfersHandler(items, {
        mergeComments: (outgoing, incoming) => {
          // Remove only the observed generic labels after both real sides match.
          const comments = [outgoing.transaction.comment, incoming.transaction.comment]
            .flatMap(comment => comment == null ? [] : comment.split('\n'))
            .filter(comment => comment !== '' && !boilerplate.has(comment))
          const deduplicated: string[] = []
          for (const comment of comments) {
            // The other real side supplies the same purpose without the bank prefix.
            if (comments.some(other => other !== comment && comment.endsWith('//' + other))) continue
            if (!deduplicated.includes(comment)) deduplicated.push(comment)
          }
          const comment = deduplicated.join('\n')
          return comment === '' ? null : comment
        }
      }) as Transaction[] | null
      if (merged == null) return null
      // The deposit day fallback may join a precise timestamp to a date-only
      // posting. Preserve the known time on the merged transfer.
      if (items[0].groupKeys?.[0]?.startsWith('["deposit-own"') === true) {
        for (const transaction of merged) {
          const sides = items.filter(item => item.movements.some(movement => transaction.movements.some(other => other.id === movement.id && 'id' in other.account && 'id' in movement.account && other.account.id === movement.account.id)))
          transaction.date = new Date(Math.max(...sides.map(item => item.date.getTime())))
        }
      }
      return merged
    }]
  })
}
