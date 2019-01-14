import * as _ from 'lodash'
import { convertAccountSyncID } from '../../common/accounts'
import { combineIntoTransferByTransferId } from '../../common/transactions'
import { fetchAccounts, fetchTransactions, login, makeTransfer as _makeTransfer } from './api'
import { convertAccounts, convertApiTransaction, convertLoanTransaction, convertPayment, convertToZenMoneyTransaction } from './converters'

function getAuth () {
  return ZenMoney.getData('auth')
}

function saveAuth (auth) {
  delete auth.api.token
  delete auth.pfm
  ZenMoney.setData('auth', auth)
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (preferences.pin.length !== 5) {
    throw new InvalidPreferencesError('Пин-код должен быть из 5 цифр')
  }

  toDate = toDate || new Date()

  const isFirstRun = !ZenMoney.getData('scrape/lastSuccessDate')
  if (isFirstRun && ZenMoney.getData('devid')) {
    fromDate = new Date(new Date().getTime() - 7 * 24 * 3600 * 1000)
  }

  const auth = await login(preferences.login, preferences.pin, getAuth())

  const zenAccounts = []
  const zenTransactions = []
  const paymentIds = {}

  const apiAccountsByType = await fetchAccounts(auth)

  await Promise.all(['account', 'loan', 'card', 'target'].map(type => {
    return Promise.all(convertAccounts(apiAccountsByType[type], type).map(async apiAccount => {
      for (const zenAccount of zenAccounts) {
        if (apiAccount.zenAccount.id === zenAccount.id) {
          apiAccount.zenAccount.syncID.forEach(id => {
            if (zenAccount.syncID.indexOf(id) < 0) {
              zenAccount.syncID.push(id)
            }
          })
          return
        }
      }

      zenAccounts.push(apiAccount.zenAccount)
      if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
        return
      }

      await Promise.all(apiAccount.ids.map(async id => {
        try {
          for (const apiTransaction of await fetchTransactions(auth, {
            id,
            type: apiAccount.type,
            instrument: apiAccount.zenAccount.instrument
          }, fromDate, toDate)) {
            let transaction
            switch (apiAccount.type) {
              case 'account':
              case 'card':
                transaction = convertPayment(apiTransaction, apiAccount.zenAccount)
                if (transaction) {
                  const id1 = transaction.movements[0].id
                  const id2 = transaction.movements[1] && transaction.movements[1].id ? transaction.movements[1].id : id1
                  if (paymentIds[id1] || paymentIds[id2]) {
                    continue
                  } else {
                    paymentIds[id1] = true
                    paymentIds[id2] = true
                  }
                }
                break
              case 'loan':
                transaction = convertLoanTransaction(apiTransaction)
                break
              default:
                transaction = convertApiTransaction(apiTransaction, apiAccount.zenAccount)
                break
            }
            const zenTransaction = transaction ? convertToZenMoneyTransaction(apiAccount.zenAccount, transaction) : null
            if (zenTransaction) {
              zenTransactions.push(zenTransaction)
            }
          }
        } catch (e) {
          if (e.toString().indexOf('временно недоступна') < 0) {
            throw e
          }
        }
      }))
    }))
  }))

  saveAuth(auth)

  return {
    accounts: convertAccountSyncID(zenAccounts, true),
    transactions: _.sortBy(combineIntoTransferByTransferId(zenTransactions), zenTransaction => zenTransaction.date)
  }
}

export async function makeTransfer (fromAccount, toAccount, sum) {
  const preferences = ZenMoney.getPreferences()
  const auth = await login(preferences.login, preferences.pin)
  await _makeTransfer(preferences.login, auth, { fromAccount, toAccount, sum })
  saveAuth(auth)
  ZenMoney.saveData()
}
