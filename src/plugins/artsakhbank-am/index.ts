import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { TemporaryError } from '../../errors'
import { login } from './api'
import { convertAccounts, convertTransactions, parseStatement } from './converters'
import { fetchStatementXls, formatBankDate, parseExportUid } from './fetchApi'
import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  // Обе страницы приходят из входа: банк отдаёт грид только при первой
  // загрузке, а на повторный запрос вернёт пустую форму
  const { session, accountsPage, cardsPage } = await login(preferences, isInBackground)
  const converted = convertAccounts(accountsPage, cardsPage)
  if (converted.length === 0) {
    // Иначе наружу вылезет голое 'Assertion failed' из общего кода
    throw new TemporaryError('Банк не отдал список счетов. Повторите синхронизацию.')
  }
  // Идентификатор выгрузки банк подставляет в ссылки на этой же странице
  const uid = parseExportUid(accountsPage)
  if (uid == null && converted.some(({ account }) => !ZenMoney.isAccountSkipped(account.id))) {
    // Без него выписку не запросить. Молча вернуть счета без единой операции
    // нельзя: синхронизация зачлась бы как успешная, и пропущенные дни
    // больше никогда не запросятся
    throw new TemporaryError('Банк не отдал ссылку на выписку. Повторите синхронизацию.')
  }

  const accounts: Account[] = []
  const transactions: ExtendedTransaction[] = []

  for (const { account, accountNumber } of converted) {
    accounts.push(account)
    if (uid == null || ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    const statement = await fetchStatementXls(
      session, session.context, uid, accountNumber,
      formatBankDate(fromDate), formatBankDate(toDate ?? new Date())
    )
    transactions.push(...convertTransactions(parseStatement(statement), account))
  }

  // Перевод между своими счетами приходит двумя строками, по одной в выписке
  // каждого счёта; здесь они сходятся в одну операцию
  return { accounts, transactions: adjustTransactions({ transactions }) }
}
