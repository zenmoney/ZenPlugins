import { Movement } from '../../../types/zenmoney'
import { ConvertedTransaction, ConvertedAccount, StatementTransaction } from '../models'

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: ConvertedAccount): ConvertedTransaction {
  const invoice = rawTransaction.originalAmount !== null
    ? {
        sum: parseFloat(rawTransaction.originalAmount.replace(',', '.').replace(/[^\d.-]/g, '')),
        instrument: rawTransaction.originalAmount.replace(/[^A-Z]/g, '')
      }
    : null
  const sum = parseFloat(rawTransaction.amount.replace(',', '.').replace(/[\s+]/g, ''))
  const movements: [Movement] = [
    {
      id: null,
      account: { id: rawAccount.account.id },
      invoice,
      sum,
      fee: 0
    }
  ]
  let comment = null
  let merchantFullTitle = ''
  if (rawTransaction.description !== null) {
    const commentStr = ['по номеру счета', 'В Kaspi Банкомате', 'by account number', 'At Kaspi ATM', 'Kaspi банкоматында', 'шот нөмірі бойынша']
    merchantFullTitle = rawTransaction.description
    for (const item of commentStr) {
      if (rawTransaction.description.includes(item)) {
        comment = item
        merchantFullTitle = rawTransaction.description.replace(item, '')
      }
      merchantFullTitle = merchantFullTitle.trim()
    }
  }
  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      comment,
      movements,
      hold: rawTransaction.hold,
      date: new Date(rawTransaction.date),
      merchant: merchantFullTitle === ''
        ? null
        : {
            fullTitle: merchantFullTitle,
            mcc: null,
            location: null
          }
    }
  }
}
