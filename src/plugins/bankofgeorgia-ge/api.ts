import { Auth, ConvertedProduct, FetchedAccount, Preferences, Session } from './models'
import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError } from '../../errors'
import {
  Contact,
  fetchAccountOperations,
  fetchAccountsWithDetails,
  fetchAuth,
  fetchCards,
  fetchCheckOperation,
  fetchDepositsAndBondsWithDetails,
  fetchGetClientInfo,
  fetchGetCustomerDeviceInfoQuery,
  fetchGetToken,
  fetchGetUserContacts,
  fetchLoans,
  fetchLogIn,
  fetchPasscodeLogin,
  fetchPerformScaQuery,
  fetchRegisterDevice,
  fetchRequestOTP,
  fetchSaveUserOnDevice,
  fetchSetupSecurityParameters,
  fetchStatements,
  fetchTriggerLogin,
  fetchVerifyOTP
} from './fetchApi'
import { getNumber, getOptArray } from '../../types/get'
import { generateDevice, generateECDSAKey } from './utils'

async function askOtpCode(text: string): Promise<string> {
  const sms = await ZenMoney.readLine(text, { inputType: 'number' })
  if (sms == null) {
    throw new InvalidOtpCodeError()
  }
  return sms
}

async function chooseContact(contacts: Contact[]): Promise<Contact> {
  if (contacts.length === 1) {
    return contacts[0]
  }
  while (true) {
    let msg = 'Select confirmation method, enter a number eg. 1, 2\n'
    for (let i = 0; i < contacts.length; ++i) {
      msg += `${i + 1}. ${contacts[i].contact}\n`
    }

    const ind = await ZenMoney.readLine(msg, { inputType: 'number' })
    if (ind?.match(/^\d+$/) != null) {
      const n = parseInt(ind) - 1
      if (n >= 0 && n < contacts.length) {
        return contacts[n]
      }
    }
  }
}

export async function login(preferences: Preferences, auth?: Auth): Promise<Session> {
  let session: Session
  if (auth?.tmp != null) {
    const { authorizationBearer } = await fetchAuth({ auth })
    await fetchGetCustomerDeviceInfoQuery({ username: preferences.login }, { auth, authorizationBearer })
    const { processReference } = await fetchPasscodeLogin({ username: preferences.login }, { auth, authorizationBearer })
    const { accessToken, refreshToken } = await fetchGetToken({ processReference }, { auth, authorizationBearer })
    session = { auth: { ...auth, tmp: true }, authorizationBearer, accessToken, refreshToken, requestIndex: 0 }
  } else {
    const device = generateDevice()
    const { privateKey, publicKey } = generateECDSAKey()

    const { authorizationBearer } = await fetchAuth({ auth: { device } })
    const { extCustomerId, extDeviceId } = await fetchRegisterDevice({ publicKey }, { authorizationBearer, auth: { device } })
    const lightSession = { authorizationBearer, auth: { device, extDeviceId, extCustomerId } }

    const { processReference } = await fetchLogIn(preferences, lightSession)
    const contact = await chooseContact(await fetchGetUserContacts({ processReference }, lightSession))
    await fetchRequestOTP({ processReference, contact }, lightSession)
    const loginSmsCode = await askOtpCode('Enter verification code from text message (SMS)')
    await fetchVerifyOTP({ smsCode: loginSmsCode, processReference }, lightSession)
    const { accessToken, refreshToken } = await fetchGetToken({ processReference }, lightSession)
    const lightSession2 = { authorizationBearer, accessToken, requestIndex: 0, auth: { device, extDeviceId, extCustomerId, privateKey } }
    await fetchSaveUserOnDevice(lightSession2)
    await fetchTriggerLogin(lightSession2)

    const passCode = generateRandomString(4, '0123456789')
    const { operationReference } = await fetchCheckOperation({ passCode, processReference }, lightSession2)
    await fetchRequestOTP({ processReference, contact }, lightSession2)
    const passSmsCode = await askOtpCode('Enter verification code from the second text message (SMS)')
    const { scaAuthCode } = await fetchPerformScaQuery({ smsCode: passSmsCode, operationReference }, lightSession2)
    const { passcodeAuthToken } = await fetchSetupSecurityParameters({ passCode, operationReference, processReference, scaAuthCode }, lightSession2)
    session = {
      auth: { passcodeAuthToken, passCode, privateKey, device, extDeviceId, extCustomerId, tmp: true },
      accessToken,
      refreshToken,
      authorizationBearer,
      requestIndex: lightSession2.requestIndex
    }
    // await fetchGetClientInfo(processReference, session)
  }

  return session
}

export async function fetchAccounts(session: Session): Promise<FetchedAccount[]> {
  const accountsWithDetails = await fetchAccountsWithDetails(session)
  const cards = await fetchCards(session)
  const accounts = accountsWithDetails.map(x => {
    const acctKey = getNumber(x.product, 'acctKey')
    x.cards = getOptArray(cards, acctKey.toString()) ?? []
    return x
  })
  const deposits = await fetchDepositsAndBondsWithDetails(session)
  const loans = await fetchLoans(session)
  return [...accounts, ...deposits, ...loans]
}

export async function fetchTransactions(
  clientKey: string,
  product: ConvertedProduct,
  fromDate: Date,
  toDate: Date,
  session: Session
): Promise<unknown[]> {
  if (product.tag === 'account' || product.tag === 'deposit' || product.tag === 'loan') { // not yet implemented for loans
    await fetchStatements(clientKey, fromDate, toDate, session)
    return await fetchAccountOperations(product.acctKey, fromDate, toDate, session)
  }
  return []
}
