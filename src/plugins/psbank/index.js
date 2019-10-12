import { login, fetchCards, fetchAccounts, fetchTransactions, fetchLoans, fetchLoan, fetchLoanTransactions } from './api'
import { convertAccount, convertTransaction, convertLoan } from './converters'
import { flattenDeep, omit, concat } from 'lodash'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  let auth = ZenMoney.getData('auth', {})
  auth = await login(preferences, auth)

  let accounts = []

  const fetchedCards = await fetchCards(auth)
  accounts = concat(accounts, fetchedCards.cardAccounts.map(account => convertAccount(account)))

  const fetchedAccounts = await fetchAccounts(auth)
  accounts = concat(accounts, fetchedAccounts.map(account => convertAccount(account)))

  let fLoans = []
  const fetchedLoans = await fetchLoans(auth)
  for (const l of fetchedLoans) {
    let loan = await fetchLoan(auth, l.contractId.toString())
    let cloan = convertLoan(loan)
    accounts = concat(accounts, cloan)
    fLoans = concat(fLoans, cloan)
  }

  /* За основу работы с транзакциями кредитов взята особенность, что на каждое действие кредита создается набор операций request с единым идентификатором.
  TODO Предположение: кредит взаимодействует только со счетами в пределах существующих счетов клиента внутри банка
  Таким образом достаточно найти среди транзакций по обычным (карточным) счетам найти таковые с тем же идентификатором.
  Из них мы выделяем списание процентов, оно остается транзакцией списания денег со счета, остальные становятся операциями перемещения средств
  между кредитом и счетом  */
  // собираем словарь соответствий: операция по кредиту - кредитный аккаунт
  let ltransactions = {}
  await Promise.all(
    fLoans.map(
      async account => {
        const fetchedTransactions = await fetchLoanTransactions(auth, account, fromDate, toDate || new Date())
        ltransactions = Object.assign(ltransactions, fetchedTransactions)
      }
    )
  )
  const transactions = []
  transactions.push(
    await Promise.all(
      accounts.map(
        async account => {
          const fetchedTransactions = await fetchTransactions(auth, account.id, account._type, fromDate, toDate || new Date())
          return fetchedTransactions.map(transaction => convertTransaction(transaction, account, ltransactions)).filter(item => item)
        }
      )
    )
  )

  // хранить accessToken не нужно
  delete auth.accessToken

  if (!accounts || accounts.length === 0) {
    throw new Error('Пустой список счетов')
  }

  return {
    accounts: accounts.map(account => omit(account, ['_type', '_contract', '_bankname'])),
    transactions: flattenDeep(transactions)
  }
}
