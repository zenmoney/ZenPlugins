import { fetch, ParseError } from '../../common/network'
import { toISODateString } from '../../common/dateUtils'
import forge from 'node-forge'
import { parseXml } from '../../common/xmlUtils'
import { byteArrayToByteString, byteStringToByteArray } from '../../common/byteStringUtils'
import { decodeString } from '../../common/stringEncodingUtils'
import { InvalidLoginOrPasswordError, BankMessageError, InvalidOtpCodeError, UserInteractionError, TemporaryUnavailableError } from '../../errors'

const host = 'otpsmart.com.ua'
const gzip = require('./gzipLib/gzip')

function getCommonHeaders () {
  return {
    'User-Agent': 'ksoap2-android/2.6.0+',
    SOAPAction: ' ',
    'Content-Type': 'text/xml;charset=utf-8',
    Host: host,
    Connection: 'close'
  }
}

export function parseBody (body) {
  const xmlBody = parseXml(body)
  const gzipData = byteStringToByteArray(forge.util.decode64(xmlBody['soapenv:Envelope']['soapenv:Body']['ns1:callServiceResponse'].callServiceReturn))
  const xmlString = decodeString(byteArrayToByteString(gzip.unzip(gzipData)), 'win1251')
  return parseXml(xmlString)
}

function ifobsHash (str) {
  const bytes = byteStringToByteArray(str)
  const newBytes = []
  for (const byte of bytes) {
    newBytes.push(byte)
    newBytes.push(0)
  }
  const md = forge.md.md5.create()
  md.update(byteArrayToByteString(newBytes))
  return md.digest().toHex()
}

async function fetchApi (url, options = {}) {
  try {
    return await fetch(url, {
      ...options,
      headers: getCommonHeaders(),
      body: { ...options },
      stringify: (body) => {
        return `<v:Envelope xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:d="http://www.w3.org/2001/XMLSchema" xmlns:c="http://schemas.xmlsoap.org/soap/encoding/" xmlns:v="http://schemas.xmlsoap.org/soap/envelope/"><v:Header /><v:Body><n0:callService id="o0" c:root="1" xmlns:n0="http://wm.webservices.ifobs.cs.com/"><Param1 i:type="d:string">${forge.util.encode64(byteArrayToByteString(gzip.zip(`<iFOBSWebServicePacket>
        <PacketBody>
          <CallingService servicename="${body.serviceName}">
              ${body.parameters
? `<Parameters>
                ${body.parameters}
              </Parameters>`
: '<Parameters/>'}
          </CallingService>
        </PacketBody>
        <PacketHeader>
          <AuthInfo>
              <User login="${body.login}"${body.password ? ' password="' + ifobsHash(body.password) + '"' : ''}/>
          </AuthInfo>
          <SenderInfo>
              <Application apiVersion="1.0.6" device="0" entity="Private" hard="Android" name="iFOBS-WebMobile" os="Android: 8.0.0, Api-version: 26" version="70.0"/>
              <SessionInfo dns="" osuser=""${body.sessionId ? ' id="' + body.sessionId + '"' : ''}/>
              <Locale lang="en"/>
          </SenderInfo>
        </PacketHeader>
        <PacketSign></PacketSign>
    </iFOBSWebServicePacket>`)))}</Param1></n0:callService></v:Body></v:Envelope>`
      },
      parse: parseBody,
      sanitizeRequestLog: { body: { login: true, password: true, sessionId: true } },
      sanitizeResponseLog: { body: { Response: { SenderInfo: { SessionInfo: { id: true } }, Parameters: { Certificate: true } } } }
    })
  } catch (e) {
    if (e instanceof ParseError) {
      if (e.response.body.match(/з проведенням технічних робіт сервіс системи дистанційного банківського обслуговування OTP Smart недоступний/i)) {
        throw new TemporaryUnavailableError()
      }
    }
    throw e
  }
}

async function getUserLoginInfo (login) {
  const response = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'GetUserLoginInfo',
    login
  })
  if (response.body.Response.StatusBlock.Status.match(/ERROR/i)) {
    if ([
      /^.*USER_NOT_FOUND.*$/i
    ].some(regexp => regexp.test(response.body.Response.StatusBlock.ErrorCode))) {
      throw new InvalidLoginOrPasswordError()
    }
    if ([
      /^.*INACTIVE_USER.*$/i
    ].some(regexp => regexp.test(response.body.Response.StatusBlock.ErrorCode))) {
      throw new BankMessageError(response.body.Response.StatusBlock.ErrorText)
    }
  }
  console.assert(response.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown GetUserLoginInfo error')
  return response
}

async function userGetAuthType (login, password) {
  const response = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'UserGetAuthType',
    parameters: '<RescueChannel>false</RescueChannel>',
    login,
    password
  })
  if (response.body.Response.StatusBlock.Status.match(/ERROR/i)) {
    if ([
      /^.*BAD_CREDENTIALS.*$/i
    ].some(regexp => regexp.test(response.body.Response.StatusBlock.ErrorCode))) {
      throw new InvalidLoginOrPasswordError()
    }
  }
  console.assert(response.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown userGetAuthType error')
  return response
}

async function userWithCertificates (login, password) {
  const code = await ZenMoney.readLine('Введите код из SMS', { inputType: 'number' })
  if (!code || code.length === 0) {
    throw new InvalidOtpCodeError('Ви не ввели код з смс, якщо смс не прийшло, повторіть синхронізацію пізніше')
  }
  const response = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'UserWithCertificates',
    parameters: `<AuthCode>${code}</AuthCode>
    <TransportCertId>321654632132</TransportCertId>
    <UserCertId>54561354684</UserCertId>`,
    login,
    password
  })
  if (!response.body.Response.StatusBlock.Status.match(/OK/i)) {
    if (response.body.Response.StatusBlock.ErrorText.match(/Error during verify authorize code/i)) {
      throw new InvalidOtpCodeError()
    }
    console.assert(false, 'Unknown GetUserLoginInfo error')
  }

  return {
    response,
    code
  }
}

async function userWebSettings (login, password, auth, code) {
  const response = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'UserWebSettings',
    parameters: `<AuthCode>${code}</AuthCode>
    <TransportCertId>321654632132</TransportCertId>
    <UserCertId>54561354684</UserCertId>`,
    login,
    password,
    sessionId: auth.sessionId
    // sanitizeRequestLog: { body: { Login: true, Password: true } }
  })
  console.assert(response.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown GetUserLoginInfo error')
  return response
}

export async function login ({ login, password }, isInBackground) {
  await getUserLoginInfo(login)
  let response = await userGetAuthType(login, password)
  if (response.body.Response.Parameters.AuthType.match(/NONE/i)) {
    return {
      sessionId: response.body.Response.SenderInfo.SessionInfo.id
    }
  }

  if (isInBackground) {
    throw new UserInteractionError()
  }
  console.assert(response.body.Response.Parameters.AuthType.match(/VIRTUAL_TOKEN/i), 'Unknown user Auth type')
  response = await userWithCertificates(login, password)
  const auth = {
    sessionId: response.response.body.Response.SenderInfo.SessionInfo.id
  }
  await userWebSettings(login, password, auth, response.code)
  return auth
}

export async function fetchAccounts ({ login, password }, auth) {
  const depositResponse = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'DealList',
    parameters: `<LastTxId>1</LastTxId>
    <MaxTxCount>2147483647</MaxTxCount>
    <DealType>DEPOSIT</DealType>`,
    login,
    password,
    sessionId: auth.sessionId
    // sanitizeRequestLog: { body: { Login: true, Password: true } }
  })
  console.assert(depositResponse.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown DealList DEPOSIT error')

  const creditResponse = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'DealList',
    parameters: `<LastTxId>1</LastTxId>
    <MaxTxCount>2147483647</MaxTxCount>
    <DealType>CREDIT</DealType>`,
    login,
    password,
    sessionId: auth.sessionId
    // sanitizeRequestLog: { body: { Login: true, Password: true } }
  })
  console.assert(creditResponse.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown DealList CREDIT error')

  const cardsResponse = await fetchApi(`https://${host}/WMService/services/WMService`, {
    method: 'POST',
    serviceName: 'CardList',
    parameters: `<LastTxId>1</LastTxId>
    <MaxTxCount>2147483647</MaxTxCount>
    <NeedLoyaltyProgramInfo>true</NeedLoyaltyProgramInfo>
    <NeedOnlineBalance>NO</NeedOnlineBalance>`,
    login,
    password,
    sessionId: auth.sessionId
    // sanitizeRequestLog: { body: { Login: true, Password: true } }
  })
  console.assert(cardsResponse.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown CardList error')
  return {
    deposits: getDataArray(depositResponse.body.Response.Parameters.AccountDetails),
    credits: getDataArray(creditResponse.body.Response.Parameters.AccountDetails),
    cards: getDataArray(cardsResponse.body.Response.Parameters.AccountDetails)
  }
}

export async function fetchTransactions ({ login, password }, auth, mainProduct, fromDate, toDate) {
  let transactions = []
  if (mainProduct.type === 'ccard') {
    transactions = {
      cardTransactions: [],
      accountTransactions: []
    }
    for (const id of mainProduct.cardIds) {
      const transactionsResponse = await fetchApi(`https://${host}/WMService/services/WMService`, {
        method: 'POST',
        serviceName: 'CardOperationByPeriodLog',
        parameters: `<CardId>${id}</CardId>
        <From>${getBankDateFormat(fromDate)}</From>
        <Till>${getBankDateFormat(toDate)}</Till>`,
        login,
        password,
        sessionId: auth.sessionId
        // sanitizeRequestLog: { body: { Login: true, Password: true } }
      })
      if (transactionsResponse.body.Response.StatusBlock.Status.match(/ERROR/i)) {
        if (transactionsResponse.body.Response.StatusBlock.ErrorCode.match(/CARD_NOT_FOUND/i)) {
          continue
        }
      }
      console.assert(transactionsResponse.body.Response.StatusBlock.Status.match(/OK/i), 'Unknown CardOperationByPeriodLog error')
      transactions.cardTransactions.push(...(transactionsResponse.body.Response.Parameters?.CardOperationLog ? setApiAccountId(getDataArray(transactionsResponse.body.Response.Parameters.CardOperationLog), mainProduct.id) : []))
    }
  } else {
    const transactionsResponse = await fetchApi(`https://${host}/WMService/services/WMService`, {
      method: 'POST',
      serviceName: 'DepositDealDocuments',
      parameters: `<LastTxId>1</LastTxId>
      <MaxTxCount>10</MaxTxCount>
      <BranchId>${mainProduct.branchId}</BranchId>
      <ByDate>
        <From>${getBankDateFormat(fromDate)}</From>
        <Till>${getBankDateFormat(toDate)}</Till>
      </ByDate>
      <DealId>${mainProduct.dealId}</DealId>`,
      login,
      password,
      sessionId: auth.sessionId
      // sanitizeRequestLog: { body: { Login: true, Password: true } }
    })
    if (transactionsResponse.body.Response.StatusBlock.Status.match(/OK/i)) {
      transactions = {
        cardTransactions: [],
        accountTransactions: transactionsResponse.body.Response.Parameters?.Document ? setApiAccountId(getDataArray(transactionsResponse.body.Response.Parameters.Document), mainProduct.dealId) : []
      }
    } else {
      if (!transactionsResponse.body.Response.StatusBlock.ErrorText.match(/ABS access error/i)) {
        console.assert(false, 'Unknown DepositDealDocuments error')
      }
    }
  }
  return transactions
}

function getDataArray (data) {
  return data ? Array.isArray(data) ? data : [data] : []
}

function setApiAccountId (dataArray, id) {
  return dataArray.map((data) => {
    data.apiAccountId = id
    return data
  })
}

function getBankDateFormat (date) {
  const dateData = toISODateString(date).match(/(\d{4})-(\d{2})-(\d{2})/)
  return dateData[3] + '-' + dateData[2] + '-' + dateData[1]
}
