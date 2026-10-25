import { MD5 } from 'jshashes'
import { saveCookies } from '../../common/network'
import { authenticate, fetchHistory } from './modernApi'
import { convertModernAccounts, convertModernTransactions } from './modernConverters'
import { generateRandomString } from '../../common/utils'
import { login, makeTransfer as _makeTransfer } from './api'

const md5 = new MD5()

function getAuth () {
  const guid = ZenMoney.getData('mGUID') || ZenMoney.getData('guid')
  if (guid) {
    ZenMoney.setData('mGUID', undefined)
    ZenMoney.setData('guid', undefined)
  }
  let auth = ZenMoney.getData('auth')
  if (guid) {
    if (auth) {
      auth.guid = guid
    } else {
      auth = { guid }
    }
    saveAuth(auth)
  }
  return auth
}

function getDevice ({ login }) {
  let device = ZenMoney.getData('device')
  if (!device) {
    if (ZenMoney.getData('devID') && ZenMoney.getData('devIDOld')) {
      device = {
        id: ZenMoney.getData('devID'),
        idOld: ZenMoney.getData('devIDOld'),
        model: 'Xperia Z2'
      }
    } else if (ZenMoney.getData('devid')) {
      device = {
        id: ZenMoney.getData('devid'),
        idOld: generateRandomString(36) + '0000',
        model: 'Xperia Z2'
      }
    } else {
      device = {
        id: md5.hex(login) + '0000',
        idOld: generateRandomString(36) + '0000',
        model: 'Zenmoney Phone'
      }
    }
    ZenMoney.setData('simId', undefined)
    ZenMoney.setData('imei', undefined)
    ZenMoney.setData('devid', undefined)
    ZenMoney.setData('devID', undefined)
    ZenMoney.setData('devIDOld', undefined)
    ZenMoney.setData('device', device)
  }
  return device
}

function saveAuth (auth) {
  ZenMoney.setData('auth', auth)
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  ZenMoney.locale = 'ru'
  if (typeof preferences.login !== 'string' || preferences.login.trim() === '') {
    throw new InvalidPreferencesError('Укажите логин Сбербанк Онлайн')
  }
  const session = await authenticate(preferences, getAuth(), getDevice(preferences), async auth => {
    saveAuth(auth)
    ZenMoney.saveData()
  }, isInBackground)
  await saveCookies()
  const graph = convertModernAccounts(session.dataModel)
  const records = graph.accounts.every(account => ZenMoney.isAccountSkipped(account.id))
    ? []
    : await fetchHistory(session, fromDate, toDate)
  const transactions = convertModernTransactions(records, graph, fromDate, toDate, id => ZenMoney.isAccountSkipped(id))
  return { accounts: graph.accounts, transactions }
}

export async function makeTransfer (fromAccount, toAccount, sum) {
  const preferences = ZenMoney.getPreferences()
  const device = getDevice(preferences)
  const auth = await login(preferences.login, preferences.pin, getAuth(), device)
  await _makeTransfer(preferences.login, auth, device, { fromAccount, toAccount, sum })
  saveAuth(auth)
  ZenMoney.saveData()
}
