import { Transaction } from '../../types/zenmoney'

export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>()
  return transactions.filter(tx => {
    const id = tx.movements[0]?.id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}
