export class TransactionsPostProcessor {
  process (transactions) {
    transactions = transactions.filter((v, i, s) => s.indexOf(v) === i) // Удаляем дубли
    transactions = this._mergeBankAndInvestingTransfers(transactions)
    transactions = this._dropUtilityFields(transactions)

    return transactions
  }

  _mergeBankAndInvestingTransfers (transactions) {
    const investingRelatedTransactions = transactions.filter(x => !!x.investingTransfer)
    const notRelatedToInvestingTransactions = transactions
      .filter(x => investingRelatedTransactions.indexOf(x) === -1)
    const withdrawalTransactions = investingRelatedTransactions.filter(x => x.investingTransfer === 'out')
    const depositTransactions = investingRelatedTransactions.filter(x => x.investingTransfer === 'in')
    withdrawalTransactions.forEach(withdrawalTransaction => {
      let relatedDepositTransaction = depositTransactions
        .filter(x => this._areMirrorTransactions(x, withdrawalTransaction))
        .sort((a, b) => this._sortByTimeProximity(withdrawalTransaction, a, b))
      if (relatedDepositTransaction.length === 0) {
        return
      }
      relatedDepositTransaction = relatedDepositTransaction[0]
      withdrawalTransaction.movements.push(relatedDepositTransaction.movements[0])
      depositTransactions.splice(depositTransactions.indexOf(relatedDepositTransaction), 1)
    })
    return notRelatedToInvestingTransactions.concat(withdrawalTransactions).concat(depositTransactions)
  }

  _areMirrorTransactions (deposit, withdrawal) {
    // Мержим операции, разница по времени между которыми не более 10 минут
    const tolerance = 10 * 60 * 1000

    return this._areTransactionsEqualBySum(deposit, withdrawal) &&
      Math.abs(deposit.date - withdrawal.date) <= tolerance
  }

  _areTransactionsEqualBySum (deposit, withdrawal) {
    return (!withdrawal.movements[0].invoice && deposit.movements[0].sum === -withdrawal.movements[0].sum) ||
      (withdrawal.movements[0].invoice && withdrawal.movements[0].invoice.instrument === deposit.accounts[0].instrument &&
        deposit.movements[0].sum === -withdrawal.movements[0].invoice.sum)
  }

  _sortByTimeProximity (reference, a, b) {
    return Math.abs(a.date - reference.date) - Math.abs(b.date - reference.date)
  }

  _dropUtilityFields (transactions) {
    return transactions.map(x => {
      delete x.accounts
      delete x.investingTransfer
      return x
    })
  }
}
