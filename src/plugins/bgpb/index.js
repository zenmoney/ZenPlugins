import _ from 'lodash'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import {
  activateDeviceToken,
  fetchAccounts,
  fetchBalance,
  fetchFullTransactions,
  fetchLastTransactions,
  fetchTransactionsAccId,
  login,
  loginDeviceToken,
  logoff,
  parseTransactionsAndOverdraft,
  registerDeviceToken
} from './api'
import { addOverdraftInfo, convertAccount, convertLastTransaction, convertTransaction, mergeStatementAndLastTransactions } from './converters'
import {
  buildActivationDescriptor,
  createDeviceIdentity,
  createDeviceState,
  generateDeviceOtp,
  hashAccountLogin,
  openDeviceState,
  sealDeviceState,
  validateDevicePin
} from './deviceOtp'

const DEVICE_TOKEN_DATA_KEY = 'deviceOtp/v1'
const ACTIVATION_CODE_TIMEOUT_MS = 180000

/**
 * Full mailbox statements provide complete history when device authorization is
 * available. History API is merged separately for recent and pending operations.
 */
export function shouldFetchFullStatement (account, deviceBound) {
  return Boolean(deviceBound && account.transactionsAccId)
}

export async function scrape ({ preferences, fromDate, toDate }) {
  const session = await initializeDeviceSession(preferences)
  const token = session.sid

  let accounts = await allAccounts(token)
  if (accounts.length === 0) {
    // если активация первый раз, но карточки все еще не выпущены
    return {
      accounts: [],
      transactions: []
    }
  }

  const transactionsStatement = []
  accounts = await Promise.all(accounts.map(async account => {
    if (shouldFetchFullStatement(account, session.deviceBound)) {
      const mails = await fetchFullTransactions(token, account, fromDate, toDate, session.getDeviceAuthorization)
      const { overdraft, transactions } = parseTransactionsAndOverdraft(mails, account)
      account = addOverdraftInfo(account, overdraft)
      for (const apiTransaction of transactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactionsStatement.push(transaction)
        }
      }
    }
    return account
  }))

  const transactionsLast = (await fetchLastTransactions(token, accounts, fromDate, toDate))
    .map(transaction => convertLastTransaction(transaction, accounts))
    .filter(function (op) {
      if (op === null) {
        // удаляем лишние уведомления
        return false
      } else if (op.movements[0].invoice !== null && isNaN(op.movements[0].invoice.sum)) {
        // удаляем все операции, что были сделаны в отличной от счета валюте, пока не понятно как узнать реальное списание
        return false
      }
      return true
    })
  const transactions = mergeStatementAndLastTransactions(transactionsStatement, transactionsLast)
    .filter(transaction => transaction.movements[0].sum !== 0)
  return {
    accounts,
    transactions: adjustTransactions({ transactions: _.sortBy(transactions, transaction => transaction.date) })
  }
}

async function readActivationCode () {
  const code = await ZenMoney.readLine('Введите 8-значный код активации устройства BGPB', {
    inputType: 'text',
    time: ACTIVATION_CODE_TIMEOUT_MS
  })
  const normalized = String(code || '').trim()
  if (normalized.length !== 8) {
    throw new InvalidPreferencesError('Не введен корректный 8-значный код активации BGPB')
  }
  return normalized
}

async function initializeDeviceSession (preferences) {
  const pin = String(preferences.appPin || '').trim()
  if (pin.length === 0) {
    return {
      sid: await login(preferences.login, preferences.password),
      activated: false,
      deviceBound: false
    }
  }
  validateDevicePin(pin)

  const expectedAccountHash = hashAccountLogin(preferences.login)
  const storedEnvelope = ZenMoney.getData(DEVICE_TOKEN_DATA_KEY)
  let state = null
  if (storedEnvelope) {
    const storedState = openDeviceState(storedEnvelope, pin)
    if (storedState.accountHash === expectedAccountHash) {
      state = storedState
    }
  }

  if (!state) {
    const sid = await login(preferences.login, preferences.password)
    console.log('>>> Регистрация устройства для выписок BGPB...')
    const identity = createDeviceIdentity()
    const nonce = String(Date.now())
    const registration = await registerDeviceToken(sid, identity, nonce)
    let activationPassword = registration.activationPassword.trim()
    if (activationPassword.length !== 8) {
      activationPassword = await readActivationCode()
    }
    const descriptor = buildActivationDescriptor({
      xfad: registration.xfad,
      activationPassword,
      nonce,
      pin,
      identity
    })
    const activationSid = await login(preferences.login, preferences.password)
    await activateDeviceToken(activationSid, registration.deviceNo, descriptor.derivationOtp)
    state = createDeviceState({
      login: preferences.login,
      deviceNo: registration.deviceNo,
      otpKey: descriptor.otpKey,
      identity
    })
    ZenMoney.setData(DEVICE_TOKEN_DATA_KEY, sealDeviceState(state, pin))
    ZenMoney.saveData()
    console.log('>>> Устройство BGPB активировано.')
    try {
      await logoff(activationSid)
    } catch (_error) {
      console.log('>>> Не удалось закрыть парольную сессию BGPB после активации.')
    }
    return {
      sid: await loginDeviceToken(state.deviceNo, generateDeviceOtp(state, pin)),
      activated: true,
      deviceBound: true,
      getDeviceAuthorization: () => ({
        deviceNo: state.deviceNo,
        otp: generateDeviceOtp(state, pin)
      })
    }
  }

  return {
    sid: await loginDeviceToken(state.deviceNo, generateDeviceOtp(state, pin)),
    activated: false,
    deviceBound: true,
    getDeviceAuthorization: () => ({
      deviceNo: state.deviceNo,
      otp: generateDeviceOtp(state, pin)
    })
  }
}

async function allAccounts (token) {
  const accounts = (await fetchAccounts(token))
    .map(convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].productType !== 'DEPOSIT') {
      accounts[i].balance = await fetchBalance(token, accounts[i])
      if (accounts[i].balance === null) {
        continue
      }
    }
    if (!accounts[i].transactionsAccId || !accounts[i].conditionsAccId) {
      const accIDs = await fetchTransactionsAccId(token, accounts[i])
      accounts[i].transactionsAccId = accounts[i].transactionsAccId || accIDs.transactionsAccId
      accounts[i].conditionsAccId = accounts[i].conditionsAccId || accIDs.conditionsAccId
    }
  }

  return accounts
}
