import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { InvalidPreferencesError } from '../../errors'
import { convertAccounts, convertTransaction } from './converters'
import { authorize, fetchAllAccounts, fetchAllTransactions } from './api'
import { Preferences } from './models'

// Точка входа плагина Altyn Wallet.
// Токен и PIN берутся из настроек (preferences.token, preferences.pin);
// если они не заполнены — спрашиваем интерактивно (ZenMoney.readLine,
// в dev-обвязке поле рендерится прямо на странице) и запоминаем ответ.
export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  preferences = await ensureCredentials(preferences)
  // Подтверждаем сессию PIN-кодом (ставит сессионную куку NextAuth)
  await authorize(preferences)

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  for (const { account } of convertAccounts(await fetchAllAccounts(preferences))) {
    accounts.push(account)
    // Пропускаем транзакции по счётам, отключённым пользователем в настройках
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    const apiTransactions = await fetchAllTransactions(preferences, fromDate, toDate)
    for (const apiTx of apiTransactions) {
      const tx = convertTransaction(apiTx, account)
      if (tx !== null) {
        transactions.push(tx)
      }
    }
  }
  return { accounts, transactions }
}

// Дозаполняет пустые токен/PIN: сначала из сохранённых данных (ZenMoney.getData),
// затем интерактивным запросом. Ответ сохраняем, чтобы не переспрашивать каждый запуск.
// Значение из настроек всегда в приоритете.
export async function ensureCredentials (preferences: Preferences): Promise<Preferences> {
  const result: Preferences = {
    token: preferences.token.trim(),
    pin: preferences.pin.trim()
  }
  if (result.token === '') {
    result.token = await askMissingCredential('token', 'Токен доступа Altyn Wallet из lk.altyn.in (без слова Bearer):')
  }
  if (result.pin === '') {
    result.pin = await askMissingCredential('pin', 'PIN-код кошелька Altyn Wallet:', 'number')
  }
  return result
}

async function askMissingCredential (key: 'token' | 'pin', message: string, inputType?: 'number'): Promise<string> {
  const saved = ZenMoney.getData(key)
  if (typeof saved === 'string' && saved !== '') {
    return saved
  }
  const answer = await ZenMoney.readLine(message, inputType === undefined ? undefined : { inputType })
  if (answer === null || answer.trim() === '') {
    throw new InvalidPreferencesError(
      `Altyn Wallet: не указан ${key === 'token' ? 'токен доступа' : 'PIN-код'} — заполните настройки или ответьте на запрос при синхронизации`
    )
  }
  const value = answer.trim()
  ZenMoney.setData(key, value)
  ZenMoney.saveData()
  return value
}
