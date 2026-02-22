import { Transaction } from '../../../types/zenmoney'

function canBeMergedAsTransfer (left: Transaction, right: Transaction): boolean {
  const leftMovement = left.movements[0]
  const rightMovement = right.movements[0]

  if (leftMovement == null || rightMovement == null) {
    return false
  }

  if (leftMovement.sum == null || rightMovement.sum == null) {
    return false
  }

  if (leftMovement.sum === 0 || rightMovement.sum === 0) {
    return false
  }

  if (leftMovement.sum < 0) {
    return rightMovement.sum > 0
  }

  return rightMovement.sum < 0
}

export function mergeTransferTransactions (transactions: Transaction[]): Transaction[] {
  const result: Transaction[] = []
  const usedIndexes = new Set<number>()

  for (let i = 0; i < transactions.length; i++) {
    if (usedIndexes.has(i)) {
      continue
    }

    const item = transactions[i]
    const movement = item.movements[0]
    const movementId = movement?.id ?? ''

    if (movement == null || movementId === '') {
      result.push(item)
      continue
    }

    let pairIndex = -1
    for (let j = i + 1; j < transactions.length; j++) {
      if (usedIndexes.has(j)) {
        continue
      }

      const candidate = transactions[j]
      const candidateMovement = candidate.movements[0]
      const candidateMovementId = candidateMovement?.id ?? ''

      if (candidateMovement == null || candidateMovementId !== movementId) {
        continue
      }

      if (canBeMergedAsTransfer(item, candidate)) {
        pairIndex = j
        break
      }
    }

    if (pairIndex === -1) {
      result.push(item)
      continue
    }

    const pair = transactions[pairIndex]
    const pairMovement = pair.movements[0]

    if (pairMovement == null) {
      result.push(item)
      continue
    }

    usedIndexes.add(pairIndex)
    result.push({
      ...item,
      movements: [movement, pairMovement],
      merchant: null
    })
  }

  return result
}
