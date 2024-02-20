import { Auth, Preferences, Product, Session } from './models'
import { en_json, workflow, fetchAllAccounts, fetchAuthorization, fetchProductTransactions, authInitiate, fetchCloudFlareCookie, initiate2FA, authConfirm, getMyIp } from './fetchApi'

function parseJwt (token: string) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

export async function login (preferences: Preferences, auth?: Auth): Promise<Session> {
  console.log('>>> Login')
  if (auth != null) {
    const tokenPayload = parseJwt(auth.accessToken)
    const nowTimestamp = Math.floor(Date.now() / 1000);

    if(tokenPayload.exp > nowTimestamp) {
      return { auth }
    }
    /* return { auth } */
  }

  if(!preferences.login || !preferences.password) {
    throw new InvalidLoginOrPasswordError()
  }

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

export async function fetchTransactions (session: Session, account_id: string, fromDate: Date, toDate: Date): Promise<unknown[]> {
  console.log('>>> Fethching transactions')
  return await fetchProductTransactions(account_id, session, fromDate, toDate)
}
