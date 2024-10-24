import { Auth, Preferences, Product, Session } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions, fetchRequestOtp, fetchSendOtp } from './fetchApi'
import { generateRandomString } from '../../common/utils'



/**
 * Device registration
 */
export async function registerDevice (preferences: Preferences) {
  let auth = {
    accessToken: '',
    deviceKey: '',
    refNo: '',
    deviceReg:  '',
    passwordSha512: ''
  }
  auth.deviceReg = generateRandomString(32, 'abcdef0123456789') + ':WEB:WEB:246:WEB:desktop:zenmoney'
  
  console.log(auth.passwordSha512)
  auth = await fetchRequestOtp(preferences, auth)
  const otpCode = await ZenMoney.readLine('Введите OTP-код из СМС/email/приложения')
  auth = await fetchSendOtp(preferences, auth, otpCode)
  
  return auth
}

export async function login (preferences: Preferences, auth: Auth): Promise<Session> {
  return { auth: await fetchAuthorization(preferences, auth) }
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  return await fetchProductTransactions(product, session, fromDate, toDate)
}


