import { AccountType, Movement } from '../../../types/zenmoney'
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
  let movements: [Movement] | [Movement, Movement] = [
    {
      id: null,
      account: { id: rawAccount.account.id },
      invoice: null,
      sum,
      fee: 0
    }
  ]
  const merchantTitle = merchantFromDescription(rawTransaction.description)
  const isCashWithdrawal = merchantTitle === 'Банкомат Home Credit Bank' &&
    rawTransaction.description?.endsWith(' — Снятия, комиссии и другое') === true && sum < 0
  if (isCashWithdrawal) {
    movements = [movements[0], {
      id: null,
      account: { type: AccountType.cash, instrument: rawAccount.account.instrument, company: null, syncIds: null },
      invoice: null,
      sum: -sum,
      fee: 0
    }]
  }
  const isLoanPayment = ['Платежи по кредиту', 'Кредит бойынша төлемдер']
    .some(operation => rawTransaction.description?.endsWith(` — ${operation}`) === true)
  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      comment: isLoanPayment ? merchantTitle : null,
      movements,
      hold: rawTransaction.hold,
      date: new Date(rawTransaction.date),
      merchant: merchantTitle === null || isLoanPayment
        ? null
        : isCashWithdrawal
          ? { title: 'Home Credit Bank', city: null, country: null, mcc: null, location: null }
          : {
              fullTitle: merchantTitle,
              mcc: null,
              location: null
            }
    }
  }
}
