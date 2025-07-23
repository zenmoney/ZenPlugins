import { Transaction } from '../../../types/zenmoney'

export function mergeTransferTransactions (transactions: Transaction[]): Transaction[] {
  const list = transactions.reduce<{ [key in string]?: Transaction }>((acc, item) => {
    const movementId = item.movements[0].id ?? ''
    const existingItem = acc[movementId]

    if (existingItem == null) {
      acc[movementId] = item
    } else {
      acc[movementId] = {
        ...existingItem,
        movements: [
          existingItem.movements[0],
          item.movements[0]
        ],
        merchant: null
      }
    }

    return acc
  }, {})

  return Object.values(list) as Transaction[]
}
