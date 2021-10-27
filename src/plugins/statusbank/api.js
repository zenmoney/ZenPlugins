import { generateRandomString } from '../../common/utils'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { parseXml } from '../../common/xmlUtils'
import { flatMap } from 'lodash'
import cheerio from 'cheerio'

const BASE_URL = 'https://stb24.by/mobile/xml_online'

export function generateBoundary () {
  return generateRandomString(8) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(12)
}

export function terminalTime () {
  const now = new Date()
  return String(now.getFullYear()) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
}

async function fetchApi (url, xml, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const boundary = generateBoundary()
  const boundaryStart = '--' + boundary + '\r\n'
  const boundaryLast = '--' + boundary + '--\r\n'

  options.method = options.method ? options.method : 'POST'
  options.headers = {
    'Content-Type': 'multipart/form-data; boundary=' + boundary
  }
  options.body = boundaryStart +
    'Content-Disposition: form-data; name="XML"\r\n' +
    'Content-Transfer-Encoding: binary\r\n' +
    'Content-Type: application/xml; charset=windows-1251\r\n' +
    'Content-Length: ' + xml.length + '\r\n\r\n' +
    xml +
    boundaryLast

  const response = await fetch(BASE_URL + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  const res = parseXml(response._bodyText)
  if (res.BS_Response.Error && res.BS_Response.Error.ErrorLine) {
    if (res.BS_Response.Error.ErrorLine === 'Ошибка авторизации: Баланс недоступен') {
      return null
    }
    const errorDescription = res.BS_Response.Error.ErrorLine
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Неверный логин') >= 0) { throw new InvalidPreferencesError(errorMessage) }
    throw new Error(errorMessage)
  }
  return res
}

function validateResponse (response, predicate, error = (message) => console.assert(false, message)) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function login (login, password) {
  const res = await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Login Biometric="N" IpAddress="10.0.2.15" Type="PWD">\r\n' +
    '      <Parameter Id="Login">' + login + '</Parameter>\r\n' +
    '      <Parameter Id="Password">' + password + '</Parameter>\r\n' +
    '   </Login>\r\n' +
    '   <RequestType>Login</RequestType>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '</BS_Request>\r\n', { sanitizeRequestLog: { body: true } }, response => true, message => new InvalidPreferencesError('Неверный логин или пароль'))
  if (res.BS_Response.Login && res.BS_Response.Login.SID) {
    return res.BS_Response.Login.SID
  }

  return null
}

export async function fetchAccounts (sid) {
  console.log('>>> Загрузка списка счетов...')

  const res = await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <GetProducts GetActions="N" ProductType="MS"/>\r\n' +
    '   <RequestType>GetProducts</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.GetProducts && res.BS_Response.GetProducts.Product && !Array.isArray(res.BS_Response.GetProducts.Product)) {
    // Обрабатываем особенность парсинга xml.
    return [res.BS_Response.GetProducts.Product]
  } else if (res.BS_Response.GetProducts && res.BS_Response.GetProducts.Product && res.BS_Response.GetProducts.Product.length > 0) {
    return res.BS_Response.GetProducts.Product
  }
  return []
}

export async function fetchBalance (sid, account) {
  console.log('>>> Загрузка баланса для ' + account.title)

  const res = await fetchApi('.request',
    '<BS_Request>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <AuthClientId IdType="' + account.productType + '">' + account.cardNumber + '</AuthClientId>\r\n' +
    '   <Balance Currency="' + account.currencyCode + '"/>\r\n' +
    '   <RequestType>Balance</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '   <TerminalCapabilities>\r\n' +
    '      <ScreenWidth>99</ScreenWidth>\r\n' +
    '      <AnyAmount>Y</AnyAmount>\r\n' +
    '      <BooleanParameter>Y</BooleanParameter>\r\n' +
    '      <LongParameter>Y</LongParameter>\r\n' +
    '   </TerminalCapabilities>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  if (res === null) {
    return null
  }
  if (res.BS_Response.Balance && res.BS_Response.Balance.Amount) {
    return Number.parseFloat(res.BS_Response.Balance.Amount.replace(/,/g, '.'))
  }
  return 0
}

export async function fetchTransactionsAccId (sid, account) {
  console.log('>>> Загрузка id аккаунта для транзакций для ' + account.title)

  const res = await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <GetActions ProductId="' + account.productId + '"/>\r\n' +
    '   <RequestType>GetActions</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.GetActions && res.BS_Response.GetActions.Action && res.BS_Response.GetActions.Action.length > 2) {
    const actions = res.BS_Response.GetActions.Action.filter((action) => action !== null)
    const resp = {
      transactionsAccId: null,
      latestDepositsAccId: null
    }
    for (let i = 0; i < actions.length; i++) {
      if (actions[i].Name === 'Выписка по карте') {
        resp.transactionsAccId = actions[i].Id
      } else if (actions[i].Name === 'Последние операции') {
        resp.latestDepositsAccId = actions[i].Id
      }
    }
    return resp
  }
  return null
}

export function createDateIntervals (fromDate, toDate) {
  const interval = 31 * 24 * 60 * 60 * 1000 // 31 days interval for fetching data
  const gapMs = 1
  return commonCreateDateIntervals({
    fromDate,
    toDate,
    addIntervalToDate: date => new Date(date.getTime() + interval - gapMs),
    gapMs
  })
}

function transactionDate (date) {
  return String(('0' + date.getDate()).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + String(date.getFullYear()))
}

export async function fetchFullTransactions (sid, account, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()
  toDate.setDate(toDate.getDate() - 1)

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(dates.map(async date => {
    return fetchApi('.admin',
      '<BS_Request>\r\n' +
      '   <ExecuteAction Id="' + account.transactionsAccId + '">\r\n' +
      '      <Parameter Id="DateFrom">' + transactionDate(date[0]) + '</Parameter>\r\n' +
      '      <Parameter Id="DateTo">' + transactionDate(date[1]) + '</Parameter>\r\n' +
      '   </ExecuteAction>\r\n' +
      '   <RequestType>ExecuteAction</RequestType>\r\n' +
      '   <Session SID="' + sid + '"/>\r\n' +
      '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
      '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
      '   <Subsystem>ClientAuth</Subsystem>\r\n' +
      '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  }))
  const mailIDs = responses.map(response => {
    return response.BS_Response.ExecuteAction.MailId
  })
  return await Promise.all(flatMap(mailIDs, (mailId) => {
    return fetchApi('.admin',
      '<BS_Request>\r\n' +
      '   <MailAttachment Id="' + mailId + '" No="0"/>\r\n' +
      '   <RequestType>MailAttachment</RequestType>\r\n' +
      '   <Session SID="' + sid + '"/>\r\n' +
      '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
      '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
      '   <Subsystem>ClientAuth</Subsystem>\r\n' +
      '   <TerminalCapabilities>\r\n' +
      '       <LongParameter>Y</LongParameter>\r\n' +
      '       <ScreenWidth>99</ScreenWidth>\r\n' +
      '       <AnyAmount>Y</AnyAmount>\r\n' +
      '       <BooleanParameter>Y</BooleanParameter>\r\n' +
      '       <CheckWidth>39</CheckWidth>\r\n' +
      '       <InputDataSources>\r\n' +
      '           <InputDataSource>Lookup</InputDataSource>\r\n' +
      '       </InputDataSources>\r\n' +
      '   </TerminalCapabilities>\r\n' +
      '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  }))
}

export function parseTransactions (mails) {
  const transactions = flatMap(mails, mail => {
    const data = mail.BS_Response.MailAttachment.Attachment.Body
    return parseFullTransactionsMail(data)
  })
  console.log(`>>> Загружено ${transactions.length} операций.`)
  return transactions
}

export function parseFullTransactionsMail (html) {
  const $ = cheerio.load(html)
  const tdObjects = $('div[class="head"]').toArray()
  if (tdObjects.length < 2) {
    return []
  }
  const card = tdObjects[0].children[3].children[0].data.split(' ')[1]
  let counter = 0
  let i = 0
  const data = []
  flatMap($('table[class="table-schet"] tr').toArray().slice(1), tr => {
    if (tr.children.length >= 10) { // Значит это операция, а не просто форматирование
      for (const td of tr.children) {
        if (td.children && td.children[0] && td.children[0].type === 'text') {
          if (counter === 9) {
            counter = 0
            i++
          }
          if (counter === 0) {
            data[i] = {
              cardNum: card,
              date: null,
              description: null,
              type: null,
              amountReal: null,
              currencyReal: null,
              amount: null,
              currency: null,
              place: null,
              authCode: null,
              mcc: null
            }
          }
          switch (counter) {
            case 0:
              data[i].date = td.children[0].data
              break
            case 2:
              data[i].type = td.children[0].data
              break
            case 5:
              data[i].amountReal = parseFloat(td.children[0].data.split(' ')[0].replace(/,/g, '.'))
              data[i].currencyReal = td.children[0].data.split(' ')[1]
              break
            case 4:
              data[i].amount = parseFloat(td.children[0].data.replace(/,/g, '.'))
              break
            case 3:
              data[i].currency = td.children[0].data
              break
            case 6:
              data[i].place = td.children[0].data.trim()
              break
            case 7:
              data[i].authCode = td.children[0].data
              break
            case 8:
              data[i].mcc = td.children[0].data?.match(/\d{4}/) ? td.children[0].data : null
              break
          }
          counter++
        }
      }
    }
  })
  return data
}
