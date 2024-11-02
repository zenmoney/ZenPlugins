import { Auth, Preferences, Product, Session, ApiResponseCode } from './models'
import { fetchAllAccounts, fetchAuthorization, fetchProductTransactions, fetchSendOtp } from './fetchApi'
import { getString } from '../../types/get'
import forge from 'node-forge'
import { TemporaryError, ZPAPIError } from '../../errors'


export async function login (preferences: Preferences, auth: Auth): Promise<Session> {
  let session: Session = {
    auth: auth,
    token: '',
    refNo: '',
    deviceKey: ''
  }

  const passwordSha512 = forge.md.sha512.create().update(preferences.password, 'utf8').digest().toHex()
  let response = await fetchAuthorization(preferences, auth, passwordSha512)
  
  switch(response.body.code as Number){

    case ApiResponseCode.SUCCESS:
      session.token = getString(response.body, 'data.token')
      session.deviceKey = getString(response.body, 'data.timoDeviceId') + ':WEB:WEB:246:WEB:desktop:zenmoney'
      break;

    case ApiResponseCode.OTP_REQUIRED:
      const refNo: string = getString(response.body, 'data.refNo')
      let token = getString(response.body, 'data.token')
      const otpCode = await ZenMoney.readLine('Enter OTP-code')
      response = await fetchSendOtp(auth, otpCode, token, refNo)

      session.token = getString(response.body, 'data.token')
      session.deviceKey = getString(response.body, 'data.timoDeviceId') + ':WEB:WEB:246:WEB:desktop:zenmoney'
      break;
    
    case ApiResponseCode.TECHNICAL_DIFFICULT:
      throw new TemporaryError('Connection to bank is temporary unavailable')  

    default:
      throw new ZPAPIError('Authorization failed', false, false)
  }
  
  return session
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  return await fetchAllAccounts(session)
}

export async function fetchTransactions (session: Session, product: Product, fromDate: Date, toDate: Date): Promise<unknown[]> {
  return await fetchProductTransactions(product, session, fromDate, toDate)
}


