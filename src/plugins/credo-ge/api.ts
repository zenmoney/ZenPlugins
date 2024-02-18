import { Auth, Preferences, Product, Session } from './models'
import { en_json, workflow, fetchAllAccounts, fetchAuthorization, fetchProductTransactions, authInitiate, fetchCloudFlareCookie, initiate2FA, authConfirm, getMyIp } from './fetchApi'

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  console.log('>>> Login')
  if (auth != null) {
    return { auth }
  }
  /* const access_token = await ZenMoney.readLine("Enter JWT access_token from 'Authorization' header") */

  preferences.login = await ZenMoney.readLine('Credo Bank username')
  preferences.password = await ZenMoney.readLine('Credo Bank password')
  const initiate_response = await authInitiate(preferences)
  const operationId = initiate_response.data.operationId
  const init_2fa_response = await initiate2FA(operationId)
  const otp1 = await ZenMoney.readLine("Enter OTP from Credo Bank SMS")
  const confirm_response = await authConfirm(otp1, operationId)
  /* TODO: implement simple login (without 2FA):
   *   + additional confirm with 2FA and ip/deviceId saving
  const myIp = await getMyIp()
  */
  return {auth: {accessToken: confirm_response.data.operationData.token}, operationId: operationId}
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  console.log('>>> Fethching transactions')
  return await fetchProductTransactions(product, session, fromDate, toDate)
}
