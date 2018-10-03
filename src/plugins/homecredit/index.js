import * as HomeCredit from './homecredit'
import * as Converters from './converters'
import _ from 'lodash'

export async function scrape ({ preferences, fromDate, toDate }) {
  let accountsData = []
  let transactions = []

  if (preferences.login && preferences.password && preferences.code) {
    // Авторизация в базовом приложении банка
    await HomeCredit.authBase(preferences)
    const fetchedAccounts = await HomeCredit.fetchBaseAccounts()

    if (fetchedAccounts.credits || fetchedAccounts.merchantCards) {
      if (fetchedAccounts.credits) { console.log(">>> Обнаружены кредиты, необходима синхронизация через приложение 'Мой кредит'") }
      if (fetchedAccounts.merchantCards) { console.log(">>> Обнаружены карты рассрочки, необходима синхронизация через приложение 'Мой кредит'") }
      if (!preferences.birth || !preferences.phone || !preferences.pin) {
        console.log(">>> Подключение к 'Мой кредит' не настроено. Крединые продукты пропускаем.")
        if (fetchedAccounts.credits) delete fetchedAccounts.credits
        if (fetchedAccounts.merchantCards) delete fetchedAccounts.merchantCards
      } else {
        // Авторизация в приложении "Мой кредит"
        const auth = await HomeCredit.authMyCredit(preferences)
        const fetchedMyCreditAccounts = await HomeCredit.fetchMyCreditAccounts(auth)
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
        if (fetchedAccounts.merchantCards) delete fetchedAccounts.merchantCards
      }
    }

    accountsData = await Promise.all(Object.keys(fetchedAccounts).map(async type => {
      return Promise.all(fetchedAccounts[type].map(async account => Converters.convertAccount(account, type)))
    }))

    transactions = _.flattenDeep(await Promise.all(Object.keys(accountsData).map(async type => {
      return Promise.all(accountsData[type].map(async accountData =>
        Converters.convertTransactions(accountData, await HomeCredit.fetchBaseTransactions(accountData, accountData.details.type, fromDate, toDate))))
    })))

    // отфильтруем доп.карты и пустые счета
    let tmpAccountsData = {}
    _.flattenDeep(accountsData).forEach(function (a) {
      if (!a.account) return
      if (tmpAccountsData.hasOwnProperty(a.account.id)) {
        tmpAccountsData[a.account.id].account.syncID.push(a.account.syncID)
      } else {
        if (typeof a.account.syncID === 'string') { a.account.syncID = [a.account.syncID] }
        tmpAccountsData[a.account.id] = a
      }
    })
    accountsData = Object.values(tmpAccountsData)

    let tmpTransactions = {}
    transactions.forEach(function (t) {
      if (!tmpTransactions.hasOwnProperty(t.id)) {
        tmpTransactions[t.id] = t
      }
    })
    transactions = Object.values(tmpTransactions)
  } else {
    // Авторизация в приложении "Мой кредит"
    if (!preferences.birth || !preferences.phone || !preferences.pin) {
      throw new InvalidPreferencesError('Необходимо заполнить параметры подключения к банку хотя бы для одного из способов авторизации')
    }

    const auth = await HomeCredit.authMyCredit(preferences)
    const fetchedAccounts = await HomeCredit.fetchMyCreditAccounts(auth)

    // счета
    accountsData = _.flattenDeep(await Promise.all(Object.keys(fetchedAccounts).map(type => {
      return Promise.all(fetchedAccounts[type].map(async account => Converters.convertAccount(account, type)))
    })))

    transactions = _.flattenDeep(await Promise.all(accountsData.map(async accountData => Converters.convertTransactions(accountData, await HomeCredit.fetchMyCreditTransactions(auth, accountData, fromDate, toDate)))))
  }

  let accounts = accountsData.map(account => account.account)
  return {
    accounts: accounts,
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

function getCardTW (cards, contractNumber, cardNumber) {
  console.log(">>> Преобразование карты рассрочки из 'Мой кредит' в 'Банк Хоум Кредит': ", cards, contractNumber, cardNumber)
  let result
  cards.forEach(function (card) {
    if (card.ContractNumber === contractNumber && (card.MainCardNumber === cardNumber || card.CardNumber === cardNumber)) { result = card }
  })
  return result
}
