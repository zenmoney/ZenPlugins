import { Movement } from '../../../types/zenmoney'
import { ConvertedTransaction, ConvertedAccount, StatementTransaction } from '../models'
import { parseSumFromAmountString } from './converterUtils'

function merchantFromDescription (description: string | null): string | null {
  if (description == null) {
    return null
  }
  const parts = description.split(' — ')
  const title = parts[0]?.trim()
  return title !== '' ? title : null
}

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: ConvertedAccount): ConvertedTransaction | null {
  if (rawTransaction.amount.trim() === '') {
    return null
  }
  const sum = parseSumFromAmountString(rawTransaction.amount)
  if (sum === 0) {
    return null
  }
  const movements: [Movement] = [
    {
      id: null,
      account: { id: rawAccount.account.id },
      invoice: null,
      sum,
      fee: 0
    }
  ]
  const merchantTitle = merchantFromDescription(rawTransaction.description)
  const isLoanPayment = rawTransaction.description?.endsWith(' — Платежи по кредиту') === true
  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      comment: isLoanPayment ? merchantTitle : null,
      movements,
      hold: rawTransaction.hold,
      date: new Date(rawTransaction.date),
      merchant: merchantTitle === null || isLoanPayment
        ? null
        : {
            fullTitle: merchantTitle,
            mcc: null,
            location: null
          }
    }
  }
}
