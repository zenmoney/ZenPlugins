export function combineIntoTransfer (transactions, getTransferData) {
  return mapObjectsGroupedByKey(transactions,
    (transaction) => {
      const transferData = getTransferData(transaction)
      if (transferData) {
        console.assert(transferData.id !== null && transferData.id !== undefined,
          'invalid transfer id for transaction', transaction)
        console.assert(transferData.type === 'income' || transferData.type === 'outcome',
          'invalid transfer type for transaction', transaction)
        return transferData.id
      } else {
        return null
      }
    },
    (transactions, key) => {
      if (key === null || transactions.length !== 2) {
        return transactions
      }
      const type1 = getTransferData(transactions[0]).type
      const type2 = getTransferData(transactions[1]).type
      if (type1 === type2) {
        return transactions
      }
      const transaction1 = transactions[0]
      const transaction2 = transactions[1]
      if (transaction2[type1 + 'Account'] === transaction1[type2 + 'Account']) {
        return transactions
      }
      for (const postfix of ['', 'Account', 'BankID']) {
        const value = transaction2[type1 + postfix]
        if (value !== undefined) {
          transaction1[type1 + postfix] = value
        }
      }
      if ('hold' in transaction1 || 'hold' in transaction2) {
        const hold1 = 'hold' in transaction1 ? transaction1.hold : null
        const hold2 = 'hold' in transaction2 ? transaction2.hold : null
        if (hold1 === hold2) {
          transaction1.hold = hold1
        } else {
          transaction1.hold = null
        }
      }
      if ('payee' in transaction1) {
        transaction1.payee = null
      }
      if (transaction1.date && transaction2.date && transaction2.date < transaction1.date) {
        transaction1.date = transaction2.date
      }
      return [transaction1]
    })
}

export function combineIntoTransferByTransferId (transactions) {
  transactions = combineIntoTransfer(transactions, (transaction) => {
    if (transaction._transferId && transaction._transferType) {
      return {
        id: transaction._transferId,
        type: transaction._transferType
      }
    } else {
      return null
    }
  })
  for (const transaction of transactions) {
    delete transaction._transferId
    delete transaction._transferType
  }
  return transactions
}

export function mapObjectsGroupedByKey (objects, keyGetter, groupMapper) {
  const objectsByKey = new Map()
  for (const object of objects) {
    const key = keyGetter(object)
    let group = objectsByKey.get(key)
    if (!group) {
      group = []
      objectsByKey.set(key, group)
    }
    group.push(object)
  }
  let filtered = []
  for (const [key, group] of objectsByKey) {
    const objects = groupMapper(group, key)
    if (objects) {
      filtered = filtered.concat(objects)
    }
  }
  return filtered
}

export function convertTransactionAccounts (transactions, accounts) {
  const filtered = []
  for (const transaction of transactions) {
    const incomeAccount = accounts[transaction.incomeAccount]
    const outcomeAccount = accounts[transaction.outcomeAccount]
    if (!incomeAccount && !outcomeAccount) {
      continue
    }
    if (incomeAccount) {
      transaction.incomeAccount = incomeAccount.id
    }
    if (outcomeAccount) {
      transaction.outcomeAccount = outcomeAccount.id
    }
    filtered.push(transaction)
  }
  return filtered
}

export function filterTransactionDuplicates (transactions) {
  return mapObjectsGroupedByKey(transactions, transaction => {
    const payee = transaction.payee && transaction.incomeAccount === transaction.outcomeAccount
      ? transaction.payee.trim() : ''
    const date =
            typeof transaction.date === 'string' ||
            typeof transaction.date === 'number' ? transaction.date.toString() : transaction.date.getTime().toString()
    return `${date}_${payee}_${transaction.incomeAccount}_${transaction.income}_${transaction.outcomeAccount}_${transaction.outcome}`
  }, group => group[0])
}
