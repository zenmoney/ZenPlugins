import { flatten } from 'lodash'
import { Movement, AccountType } from '../../../types/zenmoney'
import { ConvertedTransaction, ConvertedAccount, StatementTransaction } from '../models'

export const transactionType = {
  INCOME: 'income',
  OUTCOME: 'outcome',
  TRANSFER: 'transfer',
  CASH: 'cash'
}

const transactionTypeStrings = {
  TRANSFER: ['Перевод', 'Transfers', 'Аударым', 'Со счета другого банка', 'From an account in another bank', 'Басқа банктің шотынан'],
  INCOME: ['Пополнение', 'Вознаграждение', 'Replenishment', 'Толықтыру'],
  OUTCOME: ['Покупка', 'Purchases', 'Зат сатып алу'],
  CASH: ['Снятие', 'Withdrawals', 'Ақша алу']
}

function parseTransactionType (text: string): string | null {
  let type = null
  if (transactionTypeStrings.OUTCOME.find(str => text.includes(str)) != null || text.includes('плата')) {
    type = transactionType.OUTCOME
  } else if (transactionTypeStrings.TRANSFER.find(str => text.includes(str) || /(\w|[^\d\s])+\s[^\d\s]\./.test(text)) != null) {
    type = transactionType.TRANSFER
  } else if (transactionTypeStrings.CASH.find(str => text.includes(str) || text.includes('анкомат') || /atm/i.test(text)) != null) {
    type = transactionType.CASH
  } else if (transactionTypeStrings.INCOME.find(str => text.includes(str)) != null) {
    type = transactionType.INCOME
  }
  return type
}

function parseDescription (text: string | null): string | null {
  const descriptionOmitStrs = [...flatten(Object.values(transactionTypeStrings)), '₸', /\$?\d{1,3}\s?[.,₸]?/]
  let description = null
  if (text != null) {
    description = text
    for (const str of descriptionOmitStrs) {
      description = description.replace(str, '')
    }
    description = description.trim()
    if (description.length === 0) {
      description = null
    }
  }
  return description
}

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: ConvertedAccount): ConvertedTransaction {
  const invoice = rawTransaction.originalAmount !== null
    ? {
        sum: parseFloat(rawTransaction.originalAmount.replace(',', '.').replace(/[^\d.-]/g, '')),
        instrument: rawTransaction.originalAmount.replace(/[^A-Z]/g, '')
      }
    : null
  const sum = parseFloat(rawTransaction.amount.replace(',', '.').replace(/[\s+$]/g, ''))
  const movements: [Movement] = [
    {
      id: null,
      account: { id: rawAccount.account.id },
      invoice,
      sum,
      fee: 0
    }
  ]
  const parsedType = parseTransactionType(rawTransaction.originString)
  if ((parsedType != null) && [transactionType.CASH, transactionType.TRANSFER].includes(parsedType)) {
    movements.push({
      id: null,
      account: {
        type: parsedType === transactionType.CASH ? AccountType.cash : AccountType.ccard,
        instrument: rawAccount.account.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -1 * sum,
      fee: 0
    })
  }
  let comment = null
  let merchantFullTitle = ''
  const description = parseDescription(rawTransaction.description)
  if (description !== null) {
    const commentStr = ['по номеру счета', 'В Kaspi Банкомате', 'by account number', 'At Kaspi ATM', 'Kaspi банкоматында', 'шот нөмірі бойынша']
    merchantFullTitle = description
    for (const item of commentStr) {
      if (description.includes(item)) {
        comment = item
        merchantFullTitle = description.replace(item, '')
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
