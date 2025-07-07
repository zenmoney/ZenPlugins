import { InvalidLoginOrPasswordError } from '../../errors'
import {
  Auth, AuthInitiateResponse,
  //  LanguageType,
  Preferences, Session, accessTokenPayload, Account as CredoAccount, Transaction as CredoTransaction
} from './models'
import {
  fetchAllAccounts,
  fetchProductTransactions,
  authInitiate,
  initiate2FA,
  // initiateAddBindedDevice,
  authConfirm
  // confirmDeviceBinding
} from './fetchApi'

function parseJwt (token: string): accessTokenPayload {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  console.log('>>> Login')
  if (auth != null) {
    const tokenPayload = parseJwt(auth.accessToken)
    const nowTimestamp = Math.floor(Date.now() / 1000)

    if (tokenPayload.exp > nowTimestamp) {
      return { auth }
    }
  }

  if (preferences.login.length === 0 || preferences.password.length === 0) {
    throw new InvalidLoginOrPasswordError('Username or password can not be empty string')
  }

  const session: Session = { auth: { accessToken: '' } }
  const initiateResponse: AuthInitiateResponse = await authInitiate(preferences)
  const operationId = initiateResponse.data.operationId

  if (initiateResponse.data.requires2FA) {
    await initiate2FA(operationId)
    const otp1 = await ZenMoney.readLine('Enter OTP from Credo Bank SMS')
    const confirmResponse = await authConfirm(otp1, operationId)
    session.auth.accessToken = confirmResponse.data.operationData.token
    /* Credo stopped binding web clients... */
    // const addBindedDeviceResponse = await initiateAddBindedDevice(session, LanguageType.english)
    // const deviceBindingOperationId = addBindedDeviceResponse.data.initiateAddBindedDevice.operationId
    // await initiate2FA(deviceBindingOperationId)
    // const otp2 = await ZenMoney.readLine('Enter OTP from Credo Bank SMS')
    // await confirmDeviceBinding(session, deviceBindingOperationId, otp2)
  } else {
    const confirmResponse = await authConfirm(null, operationId)
    session.auth.accessToken = confirmResponse.data.operationData.token
  }
  return session
}

export async function fetchAccounts (session: Session): Promise<CredoAccount[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, accountId: string, fromDate: Date): Promise<CredoTransaction[]> {
  return await fetchProductTransactions(accountId, session, fromDate)
}
