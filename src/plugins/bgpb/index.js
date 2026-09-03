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
  generateDevicePin,
  generateDeviceOtp,
  hashAccountLogin,
  openDeviceState,
  sealDeviceState,
  validateDevicePin
} from './deviceOtp'

const DEVICE_TOKEN_DATA_KEY = 'deviceOtp/v1'
const DEVICE_PIN_DATA_KEY = 'deviceOtp/pin/v1'
const DEVICE_PIN_DATA_VERSION = 1
const ACTIVATION_CODE_TIMEOUT_MS = 180000
const LEGACY_PIN_RECOVERY_ERROR = 'Не удалось открыть сохраненную активацию BGPB. Укажите прежний PIN токена в настройках для переноса.'

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

function readStoredPinEntry (entry) {
  if (!entry || typeof entry.accountHash !== 'string') {
    return null
  }
  const pin = String(entry.pin || '').trim()
  try {
    validateDevicePin(pin)
  } catch (_error) {
    return null
  }
  return { accountHash: entry.accountHash, pin }
}

async function initializeDeviceSession (preferences) {
  const expectedAccountHash = hashAccountLogin(preferences.login)
  const storedEnvelope = ZenMoney.getData(DEVICE_TOKEN_DATA_KEY)
  const storedPinData = ZenMoney.getData(DEVICE_PIN_DATA_KEY)
  const activePinEntry = storedPinData?.version === DEVICE_PIN_DATA_VERSION
    ? readStoredPinEntry(storedPinData.active)
    : null
  const pendingPinEntry = storedPinData?.version === DEVICE_PIN_DATA_VERSION
    ? readStoredPinEntry(storedPinData.pending)
    : null
  const pendingPinForCurrentAccount = pendingPinEntry?.accountHash === expectedAccountHash
  const legacyPin = String(preferences.appPin || '').trim()
  const pinCandidates = []
  if (activePinEntry) {
    pinCandidates.push(activePinEntry.pin)
  }
  if (legacyPin && !pinCandidates.includes(legacyPin)) {
    pinCandidates.push(legacyPin)
  }

  let pin = null
  let state = null
  let openedDifferentAccount = false
  if (storedEnvelope && !pendingPinForCurrentAccount) {
    for (const candidate of pinCandidates) {
      try {
        validateDevicePin(candidate)
      } catch (_error) {
        continue
      }
      let storedState
      try {
        storedState = openDeviceState(storedEnvelope, candidate)
      } catch (error) {
        if (error instanceof InvalidPreferencesError) {
          continue
        }
        throw error
      }
      if (storedState.accountHash === expectedAccountHash) {
        pin = candidate
        state = storedState
        break
      }
      openedDifferentAccount = true
    }
    if (!state && !openedDifferentAccount) {
      throw new InvalidPreferencesError(LEGACY_PIN_RECOVERY_ERROR)
    }
    if (state && (activePinEntry?.accountHash !== expectedAccountHash || activePinEntry.pin !== pin)) {
      ZenMoney.setData(DEVICE_PIN_DATA_KEY, {
        version: DEVICE_PIN_DATA_VERSION,
        active: { accountHash: expectedAccountHash, pin },
        pending: pendingPinEntry?.accountHash === expectedAccountHash ? null : pendingPinEntry
      })
      ZenMoney.saveData()
    }
  }

  if (!state) {
    if (pendingPinForCurrentAccount) {
      pin = pendingPinEntry.pin
    } else if (!storedEnvelope && activePinEntry?.accountHash === expectedAccountHash) {
      pin = activePinEntry.pin
    }
    if (!pin) {
      pin = generateDevicePin()
    }
    if (!pendingPinForCurrentAccount) {
      ZenMoney.setData(DEVICE_PIN_DATA_KEY, {
        version: DEVICE_PIN_DATA_VERSION,
        active: activePinEntry,
        pending: { accountHash: expectedAccountHash, pin }
      })
      ZenMoney.saveData()
    }
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
    ZenMoney.setData(DEVICE_PIN_DATA_KEY, {
      version: DEVICE_PIN_DATA_VERSION,
      active: { accountHash: expectedAccountHash, pin },
      pending: null
    })
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
