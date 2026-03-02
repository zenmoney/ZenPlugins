import { Transaction, Movement } from '../../types/zenmoney'

export function mergeCounterparts (transactions: Transaction[]): Transaction[] {
  const used = new Set<number>()
  const merged: Transaction[] = []

  for (let i = 0; i < transactions.length; i++) {
    if (used.has(i)) continue
    const txA = transactions[i]
    if (txA.movements.length !== 1 || txA.movements[0].sum == null || txA.hold === true) {
      merged.push(txA)
      continue
    }
    const moveA = txA.movements[0]
    const accKeyA = accountKey(moveA.account as { id?: string, syncIds?: string[] | null })
    if (accKeyA === 'unknown') {
      merged.push(txA)
      continue
    }
    if (moveA.account == null || typeof (moveA.account as { id?: string }).id !== 'string') {
      merged.push(txA)
      continue
    }
    let mergedTx: Transaction | null = null
    for (let j = i + 1; j < transactions.length; j++) {
      if (used.has(j)) continue
      const txB = transactions[j]
      if (txB.movements.length !== 1 || txB.movements[0].sum == null || txB.hold === true) continue
      const moveB = txB.movements[0]
      if (moveB.account == null || typeof (moveB.account as { id?: string }).id !== 'string') continue
      const accKeyB = accountKey(moveB.account as { id?: string, syncIds?: string[] | null })
      if (accKeyB === 'unknown' || accKeyB === accKeyA) continue
      if (moveA.invoice != null || moveB.invoice != null) continue
      if (!isSameMinute(txA.date, txB.date)) continue
      const sumsMatch = Math.abs(normalizeSum(moveA.sum ?? 0) + normalizeSum(moveB.sum ?? 0)) < 0.01
      const oppositeSigns = (moveA.sum ?? 0) * (moveB.sum ?? 0) < 0
      const sameAccount = (moveA.account as { id: string }).id === (moveB.account as { id: string }).id
      if (!sumsMatch) continue
      if (!oppositeSigns) continue
      if (sameAccount) continue
      mergedTx = {
        hold: (txA.hold ?? false) || (txB.hold ?? false),
        date: txA.date,
        comment: txA.comment ?? txB.comment ?? null,
        merchant: txA.merchant ?? txB.merchant ?? null,
        movements: [
          moveA,
          { ...moveB, sum: moveB.sum }
        ]
      }
      used.add(j)
      break
    }
    merged.push(mergedTx ?? txA)
  }
  return merged
}

export function mergeSinglesIntoSelfTransfers (transactions: Transaction[]): Transaction[] {
  const result = [...transactions]
  const singlesUsed = new Set<number>()

  for (let i = 0; i < result.length; i++) {
    const tx = result[i]
    if (tx.movements.length !== 2 || tx.hold === true) continue
    const [m1, m2] = tx.movements as [Movement, Movement]
    if (m1.sum == null || m2.sum == null) continue
    const key1 = accountKey(m1.account as { id?: string, syncIds?: string[] | null })
    const key2 = accountKey(m2.account as { id?: string, syncIds?: string[] | null })
    if (key1 === 'unknown' || key2 === 'unknown') continue
    if (key1 !== key2) continue // ищем только "самопереводы" внутри одного счета
    const date = tx.date

    for (let j = 0; j < result.length; j++) {
      if (i === j || singlesUsed.has(j)) continue
      const single = result[j]
      if (single.movements.length !== 1 || single.movements[0].sum == null || single.hold === true) continue
      const sm = single.movements[0]
      const singleKey = accountKey(sm.account as { id?: string, syncIds?: string[] | null })
      if (singleKey === 'unknown' || singleKey === key1) continue
      if (!isSameMinute(date, single.date)) continue
      const matchFirst = Math.abs(Math.abs(normalizeSum(sm.sum ?? 0)) - Math.abs(normalizeSum(m1.sum ?? 0))) < 0.01
      const matchSecond = Math.abs(Math.abs(normalizeSum(sm.sum ?? 0)) - Math.abs(normalizeSum(m2.sum ?? 0))) < 0.01
      if (!matchFirst && !matchSecond) continue

      const counterMovement = matchFirst ? m2 : m1
      const newMovements: [Movement, Movement] = [
        { ...sm, invoice: null, fee: sm.fee ?? 0 },
        {
          ...counterMovement,
          account: counterMovement.account,
          sum: -normalizeSum(sm.sum ?? 0),
          invoice: null
        }
      ]

      result[i] = { ...tx, movements: newMovements }
      singlesUsed.add(j)
      break
    }
  }

  return result.filter((_, idx) => !singlesUsed.has(idx))
}

export function dedupeSinglesAgainstTransfers (transactions: Transaction[]): Transaction[] {
  const transferSignatures = new Set<string>()
  const result: Transaction[] = []

  // Remove exact duplicate transfers (same two movements and date)
  for (const tx of transactions) {
    if (tx.movements.length === 2 && tx.movements[0].sum != null && tx.movements[1].sum != null) {
      const sig = buildTransferSignature(tx)
      if (transferSignatures.has(sig)) {
        continue
      }
      transferSignatures.add(sig)
    }
    result.push(tx)
  }

  const finalTransactions: Transaction[] = []
  for (const tx of result) {
    if (tx.movements.length !== 1 || tx.movements[0].sum == null || tx.hold === true) {
      finalTransactions.push(tx)
      continue
    }
    const move = tx.movements[0]
    if (move.account == null || typeof (move.account as { id?: string }).id !== 'string') {
      // Try syncIds fallback
      if (!Array.isArray((move.account as { syncIds?: string[] | null }).syncIds)) {
        finalTransactions.push(tx)
        continue
      }
    }
    const accKey = accountKey(move.account as { id?: string, syncIds?: string[] | null })
    if (accKey === 'unknown') {
      finalTransactions.push(tx)
      continue
    }
    const hasTransferMatch = hasTransferWithOppositeMovement(move.sum as number, accKey, tx.date, transferSignatures)
    if (!hasTransferMatch) {
      finalTransactions.push(tx)
    }
  }

  return finalTransactions
}

export function dropOffsettingSinglesSameAccount (transactions: Transaction[]): Transaction[] {
  const used = new Set<number>()
  const result: Transaction[] = []

  for (let i = 0; i < transactions.length; i++) {
    if (used.has(i)) continue
    const txA = transactions[i]
    if (txA.movements.length !== 1 || txA.movements[0].sum == null || txA.movements[0].invoice != null || txA.hold === true) {
      result.push(txA)
      continue
    }
    const moveA = txA.movements[0]
    const accKeyA = accountKey(moveA.account as { id?: string, syncIds?: string[] | null })
    if (accKeyA === 'unknown') {
      result.push(txA)
      continue
    }
    let paired = false
    for (let j = i + 1; j < transactions.length; j++) {
      if (used.has(j)) continue
      const txB = transactions[j]
      if (txB.movements.length !== 1 || txB.movements[0].sum == null || txB.movements[0].invoice != null || txB.hold === true) continue
      const moveB = txB.movements[0]
      const accKeyB = accountKey(moveB.account as { id?: string, syncIds?: string[] | null })
      if (accKeyB !== accKeyA) continue
      if (!isSameMinute(txA.date, txB.date)) continue
      const sumsMatch = Math.abs(normalizeSum(moveA.sum ?? 0) + normalizeSum(moveB.sum ?? 0)) < 0.01
      if (!sumsMatch) continue
      used.add(j)
      paired = true
      break
    }
    if (!paired) {
      result.push(txA)
    } else {
      used.add(i)
    }
  }

  return result
}

export function dropPlaceholderTransfers (transactions: Transaction[]): Transaction[] {
  return transactions.filter(tx => {
    if (tx.movements.length !== 2) return true
    const [m1, m2] = tx.movements as [Movement, Movement]
    if (m1.sum == null || m2.sum == null) return true
    const key1 = accountKey(m1.account as { id?: string, syncIds?: string[] | null })
    const key2 = accountKey(m2.account as { id?: string, syncIds?: string[] | null })
    const oneUnknown = (key1 === 'unknown') !== (key2 === 'unknown')
    if (!oneUnknown) return true
    const sumsMatch = Math.abs(normalizeSum(m1.sum ?? 0) + normalizeSum(m2.sum ?? 0)) < 0.01
    const oppositeSigns = (m1.sum ?? 0) * (m2.sum ?? 0) < 0
    const knownMovement = key1 === 'unknown' ? m2 : m1
    const unknownMovement = key1 === 'unknown' ? m1 : m2
    const knownId = typeof (knownMovement.account as { id?: string })?.id === 'string'
      ? (knownMovement.account as { id: string }).id
      : ''
    const preserveDepositToCardTransfer =
      /^KZ[A-Z0-9]{15}(KZT|USD|EUR|RUB|CNY|TRY|AED)$/i.test(knownId) &&
      (unknownMovement.account as { type?: string })?.type === 'ccard'

    if (preserveDepositToCardTransfer && oppositeSigns && sumsMatch) {
      return true
    }
    if (oppositeSigns && sumsMatch) {
      return false
    }
    return true
  })
}

function isSameMinute (a: Date, b: Date): boolean {
  return Math.abs(a.getTime() - b.getTime()) < 60 * 1000
}

function accountKey (account: { id?: string, syncIds?: string[] | null }): string {
  if (typeof account.id === 'string' && account.id !== '') return normalizeAccountId(account.id)
  if (Array.isArray(account.syncIds) && account.syncIds.length > 0) return normalizeAccountId(account.syncIds[0])
  return 'unknown'
}

function normalizeAccountId (id: string): string {
  const trimmed = id.trim()
  const match = trimmed.match(/^([A-Z0-9]+)([A-Z]{3})$/)
  if (match?.[1] != null) {
    return match[1]
  }
  return trimmed
}

function normalizeSum (sum: number): number {
  return Number(sum.toFixed(2))
}

function buildTransferSignature (tx: Transaction): string {
  const [m1, m2] = tx.movements as [Movement, Movement]
  const part = (m: typeof m1): string => `${accountKey(m.account as { id?: string, syncIds?: string[] | null })}:${normalizeSum(m.sum ?? 0)}`
  const ordered = [part(m1), part(m2)].sort()
  const date = tx.date.toISOString().slice(0, 10)
  return `${date}|${ordered.join('|')}`
}

function hasTransferWithOppositeMovement (sum: number, accountKeyStr: string, date: Date, transferSignatures: Set<string>): boolean {
  // Build signatures matching a potential two-movement transfer where this single is one leg
  const dateStr = date.toISOString().slice(0, 10)
  const oppositeSum = normalizeSum(-(sum ?? 0))
  // Since we don't know the counter account, check any signature that contains this leg
  for (const sig of transferSignatures) {
    if (!sig.startsWith(dateStr)) continue
    if (sig.includes(`${accountKeyStr}:${oppositeSum}`)) {
      return true
    }
  }
  return false
}
