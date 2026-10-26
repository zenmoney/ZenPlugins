import { adjustTransactions, mergeTransfersHandler } from '../../common/transactionGroupHandler'
import { ExtendedTransaction, Transaction } from '../../types/zenmoney'

const boilerplate = new Set(['Перевод себе', 'Перевод собственных средств. Без налога (НДС).'])

export function groupTransactions (transactions: ExtendedTransaction[]): Transaction[] {
  return adjustTransactions({
    transactions,
    groupHandlers: [items => mergeTransfersHandler(items, {
      mergeComments: (outgoing, incoming) => {
        // Remove only the observed generic labels after both real sides match.
        const comments = [outgoing.transaction.comment, incoming.transaction.comment]
          .flatMap(comment => comment == null ? [] : comment.split('\n'))
          .filter(comment => comment !== '' && !boilerplate.has(comment))
        const comment = Array.from(new Set(comments)).join('\n')
        return comment === '' ? null : comment
      }
    })]
  })
}
