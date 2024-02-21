import { InvalidLoginOrPasswordError } from '../../errors'
import { Auth, Preferences, Session, accessTokenPayload } from './models'
import { fetchAllAccounts, fetchProductTransactions, authInitiate, initiate2FA, authConfirm } from './fetchApi'

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
    throw new InvalidLoginOrPasswordError()
  }

  const initiateResponse = await authInitiate(preferences)
  const operationId = initiateResponse.data.operationId
  await initiate2FA(operationId)
  const otp1 = await ZenMoney.readLine('Enter OTP from Credo Bank SMS')
  const confirmResponse = await authConfirm(otp1, operationId)
  /* TODO: implement simple login (without 2FA):
   *   + additional confirm with 2FA and ip/deviceId saving
  const myIp = await getMyIp()
  */
  return { auth: { accessToken: confirmResponse.data.operationData.token } }
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, accountId: string, fromDate: Date, toDate: Date): Promise<unknown[]> {
  console.log('>>> Fethching transactions')
  return await fetchProductTransactions(accountId, session, fromDate, toDate)
}
