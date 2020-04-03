import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import * as Api from './api'
import * as Converters from './converters'
import _ from 'lodash'

export async function scrape ({ preferences, fromDate, toDate }) {
  let accountsData = []
  let transactions = []

  // сохранение логина-пароля в данных для перехода на "Мой кредит"
  /* if (preferences.login && preferences.password && !preferences.birth && !preferences.phone) {
    ZenMoney.setData('oldAuth', {
      login: preferences.login,
      password: preferences.password,
      code: preferences.code
    })
  } */

  const oldAuth = ZenMoney.getData('oldAuth', { login: null, password: null, code: null })
  const login = preferences.login || oldAuth.login
  const password = preferences.password || oldAuth.password
  const code = preferences.code || oldAuth.code

  let auth = ZenMoney.getData('auth', null)

  if (login && password) {
    // Авторизация в базовом приложении банка ===============================================
    const deviceId = await Api.authBase(ZenMoney.getData('device_id', null), login, password, code)
    ZenMoney.setData('device_id', deviceId)

    const fetchedAccounts = await Api.fetchBaseAccounts()

    if (fetchedAccounts.credits /* || fetchedAccounts.merchantCards */) {
      console.log(">>> Обнаружены кредиты, необходима синхронизация через приложение 'Мой кредит'")
      // if (fetchedAccounts.merchantCards) { console.log(">>> Обнаружены карты рассрочки, необходима синхронизация через приложение 'Мой кредит'") }
      if (!preferences.birth || !preferences.phone || !preferences.pin) {
        console.log(">>> Подключение к 'Мой кредит' не настроено. Крединые продукты пропускаем.")
        if (fetchedAccounts.credits) delete fetchedAccounts.credits
        if (fetchedAccounts.merchantCards) delete fetchedAccounts.merchantCards
      } else {
        // Авторизация в приложении "Мой кредит" ===========================================
        const auth = await Api.authMyCredit(ZenMoney.getData('auth', null) || {}, preferences)
        const fetchedMyCreditAccounts = await Api.fetchMyCreditAccounts(auth)
        if (fetchedAccounts.credits) {
          fetchedAccounts.credits.forEach(function (account) {
            const loan = getLoan(fetchedMyCreditAccounts.CreditLoan, account.contractNumber)
            account.AccountNumber = loan.AccountNumber
            account.DateSign = loan.DateSign
            account.CreditAmount = loan.CreditAmount
            account.Contract = { Properties: { PaymentNum: loan.Contract.Properties.PaymentNum } }
            account.RepaymentAmount = loan.RepaymentAmount
            account.AccountBalance = loan.AccountBalance
          })
        }
        /* if (fetchedAccounts.merchantCards)
                    fetchedAccounts.merchantCards.forEach(function(account) {
                        const cardTw = getCardTW(fetchedMyCreditAccounts.CreditCardTW, account.contractNumber, account.cardNumber);
                        if (cardTw) {
                            account.AccountNumber = cardTw.AccountNumber;
                            account.CreditLimit = cardTw.CreditLimit;
                            account.AvailableBalance = cardTw.AvailableBalance;
                        } else
                            console.log(">>> Игнорируем карту, отсутствующую в 'Мой Кредит':", HomeCredit.getCardNumber(account.cardNumber));
                    }); */
        // карты рассрочки оставляем на обработку через базовое приложение
        // if (fetchedAccounts.merchantCards) delete fetchedAccounts.merchantCards
      }
    }

    accountsData = await Promise.all(Object.keys(fetchedAccounts).map(async type => {
      return Promise.all(fetchedAccounts[type].map(async account => Converters.convertAccount(account, type)))
    }))

    transactions = _.flattenDeep(await Promise.all(Object.keys(accountsData).map(async type => {
      return Promise.all(accountsData[type].map(async accountData =>
        Converters.convertTransactions(accountData, await Api.fetchBaseTransactions(accountData, accountData.details.type, fromDate, toDate))))
    })))

    // отфильтруем доп.карты и пустые счета
    accountsData = Api.collapseDoubleAccounts(accountsData)

    const tmpTransactions = {}
    transactions.forEach(function (t) {
      if (!Object.prototype.hasOwnProperty.call(tmpTransactions, t.id)) {
        tmpTransactions[t.id] = t
      }
    })
    transactions = Object.values(tmpTransactions)
  } else {
    // Авторизация в приложении "Мой кредит" ===================================
    if (!preferences.birth || !preferences.phone || !preferences.pin) {
      throw new InvalidPreferencesError('Необходимо заполнить параметры подключения к банку')
    }

    const newConn = auth === null
    auth = await Api.authMyCredit(auth || {}, preferences)

    const fetchedAccounts = await Api.fetchMyCreditAccounts(auth)
    console.log('>>> Список счетов загружен.')

    // счета
    accountsData = _.flattenDeep(await Promise.all(Object.keys(fetchedAccounts).map(type => {
      return Promise.all(fetchedAccounts[type].map(async account => Converters.convertAccount(account, type)))
    }))).filter(item => item !== null)

    accountsData = Api.collapseDoubleAccounts(accountsData)

    if (auth.levelup === false && accountsData.length === 0) {
      throw new InvalidPreferencesError('Для доступа к дебетовым счетам необходимо создать подключение заново и ответить на вопросы банка.')
    }

    // фикс поступлений сегодняшнего дня (чтобы не создавать лишних корректировок)
    // если в текущих сутках были поступления, баланс счёта передаём только для нового подключения
    transactions = await Promise.all(accountsData.map(async accountData => {
      const trans = Converters.convertTransactions(accountData, await Api.fetchMyCreditTransactions(auth, accountData, fromDate, toDate))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayIncomes = _.sumBy(trans, function (tran) {
        return tran.date >= today && tran.income > 0 ? tran.income : 0.0
      })
      if (todayIncomes > 0 && !newConn) delete accountData.account.balance
      return trans
    }))

    transactions = _.flattenDeep(transactions)
  }

  const accounts = accountsData.map(account => account.account)

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: transactions
  }
}

function getLoan (loans, contractNumber) {
  let result
  loans.forEach(function (loan) {
    if (loan.ContractNumber === contractNumber) { result = loan }
  })
  return result
}
