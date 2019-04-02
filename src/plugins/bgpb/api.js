import { flatMap } from 'lodash'
import { fetch, parseXml } from '../../common/network'
import { generateRandomString } from '../../common/utils'

const baseUrl = 'https://mobapp-frontend.bgpb.by/'

export function generateBoundary () {
  return generateRandomString(8) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(12)
}

export function terminalTime () {
  const now = new Date()
  return String(now.getFullYear()) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDay()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
}

async function fetchApi (url, xml, predicate = () => true, error = (message) => console.assert(false, message)) {
  let boundary = generateBoundary()
  let boundaryStart = '--' + boundary + '\r\n'
  let boundaryLast = '--' + boundary + '--\r\n'

  let options = {
    method: 'POST',
    body: boundaryStart +
    'Content-Disposition: form-data; name="XML"\r\n' +
    'Content-Transfer-Encoding: binary\r\n' +
    'Content-Type: application/xml; charset=windows-1251\r\n' +
    'Content-Length: ' + xml.length + '\r\n\r\n' +
    xml +
    boundaryLast,
    headers: {
      'User-Agent': 'BGPB mobile/5.17.1 (Android; unknownAndroidSDKbuiltforx86; Android 6.0)',
      'Content-Type': 'multipart/form-data; boundary=' + boundary
    }
  }

  const response = await fetch(baseUrl + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  let res = parseXml(response.body)

  if (res.BS_Response.Error && res.BS_Response.Error.ErrorLine) {
    const errorDescription = res.BS_Response.Error.ErrorLine
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Неверный логин') >= 0) { throw new InvalidPreferencesError(errorMessage) }
    throw new TemporaryError(errorMessage)
  }
  return res
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export function parseMail (html) {
  const cheerio = require('cheerio')
  let $ = cheerio.load(html)
  $ = cheerio.load($().children()[0].children[0].Body)
  let card = $('table tr td[style="border: none;width:17cm;"]').toArray()[2].children[0].data.split(' ')[7]

  let counter = 0
  let i = 0
  let data = []
  flatMap($('table[class="section_3"] tr td').toArray().slice(2), td => {
    if (td.children[0] && td.children[0].type === 'text') {
      if (counter === 11) {
        counter = 0
        i++
      }
      if (counter === 0) {
        data[i] = {
          cardNum: card,
          date: null,
          operation: null,
          type: null,
          amountReal: null,
          currencyReal: null,
          amount: null,
          currency: null,
          location: null
        }
      }
      switch (counter) {
        case 0:
          data[i].date = td.children[0].data
          break
        case 2:
          data[i].operation = td.children[0].data
          break
        case 3:
          data[i].type = td.children[0].data
          break
        case 4:
          data[i].amountReal = td.children[0].data
          break
        case 5:
          data[i].currencyReal = td.children[0].data
          break
        case 6:
          data[i].amount = td.children[0].data
          break
        case 7:
          data[i].currency = td.children[0].data
          break
        case 8:
          data[i].location = td.children[0].data
          break
      }
      counter++
    }
  })
  data.pop() // Удаляем последний багнутый элемент
  return data
}

export async function login (login, password) {
  let res = await fetchApi('sou/xml_online.admin',
    '<BS_Request>\r\n' +
    '   <Login Biometric="N" IpAddress="10.0.2.15" Type="PWD">\r\n' +
    '      <Parameter Id="Login">' + login + '</Parameter>\r\n' +
    '      <Parameter Id="Password">' + password + '</Parameter>\r\n' +
    '   </Login>\r\n' +
    '   <RequestType>Login</RequestType>\r\n' +
    '   <TerminalId>41742991</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', response => true, message => new InvalidPreferencesError('Неверный логин или пароль'))
  if (res.BS_Response.Login && res.BS_Response.Login.SID) {
    return res.BS_Response.Login.SID
  }

  return null
}

export async function fetchAccounts (sid) {
  console.log('>>> Загрузка списка счетов...')

  let res = await fetchApi('sou/xml_online.admin',
    '<BS_Request>\r\n' +
    '   <GetProducts GetActions="N" ProductType="MS"/>\r\n' +
    '   <RequestType>GetProducts</RequestType>\r\n' +
    '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n' +
    '   <TerminalId>41742991</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>', response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.GetProducts && res.BS_Response.GetProducts.Product && res.BS_Response.GetProducts.Product.length > 0) {
    return res.BS_Response.GetProducts.Product
  }
  return []
}

export async function fetchBalance (sid, account) {
  console.log('>>> Загрузка баланса для ' + account.title)

  let res = await fetchApi('sou/xml_online.request',
    '<BS_Request>\r\n' +
    '   <Balance Currency="' + account.currencyCode + '"/>\r\n' +
    '   <RequestType>Balance</RequestType>\r\n' +
    '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n' +
    '   <TerminalId>41742991</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <ClientId IdType="' + account.productType + '">' + account.cardNumber + '</ClientId>\r\n' +
    '   <TerminalCapabilities>\r\n' +
    '      <LongParameter>Y</LongParameter>\r\n' +
    '      <ScreenWidth>99</ScreenWidth>\r\n' +
    '      <AnyAmount>Y</AnyAmount>\r\n' +
    '      <BooleanParameter>Y</BooleanParameter>\r\n' +
    '      <CheckWidth>39</CheckWidth>\r\n' +
    '      <InputDataSources>\r\n' +
    '         <InputDataSource>Lookup</InputDataSource>\r\n' +
    '      </InputDataSources>\r\n' +
    '   </TerminalCapabilities>\r\n' +
    '</BS_Request>', response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.Balance && res.BS_Response.Balance.Amount) {
    return Number.parseFloat(res.BS_Response.Balance.Amount.replace(',', '.'))
  }
  return 0
}

export async function fetchTransactionsAccId (sid, account) {
  console.log('>>> Загрузка id аккаунта для транзакций для ' + account.title)

  let res = await fetchApi('sou/xml_online.admin',
    '<BS_Request>\r\n' +
    '   <GetActions ProductId="' + account.id + '"/>\r\n' +
    '   <RequestType>GetActions</RequestType>\r\n' +
    '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n' +
    '   <TerminalId>41742991</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>', response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.GetActions && res.BS_Response.GetActions.Action && res.BS_Response.GetActions.Action.length > 2) {
    return res.BS_Response.GetActions.Action[2].Id
  }
  return null
}

// function formatDate (date) {
//   return date.toISOString().replace('T', ' ').split('.')[0]
// }

export function createDateIntervals (fromDate, toDate) {
  const interval = 10 * 24 * 60 * 60 * 1000 // 10 days interval for fetching data
  const dates = []

  let time = fromDate.getTime()
  let prevTime = null
  while (time < toDate.getTime()) {
    if (prevTime !== null) {
      dates.push([new Date(prevTime), new Date(time - 1)])
    }

    prevTime = time
    time = time + interval
  }
  dates.push([new Date(prevTime), toDate])

  return dates
}

export async function fetchTransactions (sid, accounts, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(flatMap(accounts, (account) => {
    return dates.map(date => {
      return fetchApi('sou/xml_online.admin',
        '<BS_Request>\r\n' +
        '   <ExecuteAction Id="' + account.transactionsAccId + '">\r\n' +
        '      <Parameter Id="DateFrom">' + String(('0' + date[0].getDay()).slice(-2) + '.' + ('0' + (date[0].getMonth() + 1)).slice(-2) + '.' + String(date[0].getFullYear())) + '</Parameter>\r\n' +
        '      <Parameter Id="DateTill">' + String(('0' + date[1].getDay()).slice(-2) + '.' + ('0' + (date[1].getMonth() + 1)).slice(-2) + '.' + String(date[1].getFullYear())) + '</Parameter>\r\n' +
        '   </ExecuteAction>\r\n' +
        '   <RequestType>ExecuteAction</RequestType>\r\n' +
        '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n' +
        '   <TerminalId>41742991</TerminalId>\r\n' +
        '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
        '   <Subsystem>ClientAuth</Subsystem>\r\n' +
        '</BS_Request>', response => true, message => new InvalidPreferencesError('bad request'))
    })
  }))
  const mailIDs = flatMap(responses, response => {
    return response.BS_Response.ExecuteAction.MailId
  })

  const mails = await Promise.all(flatMap(mailIDs, (mailId) => {
    return fetchApi('sou/xml_online.admin',
      '<BS_Request>\r\n' +
      '   <MailAttachment Id="' + mailId + '" No="0"/>\r\n' +
      '   <RequestType>MailAttachment</RequestType>\r\n' +
      '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n' +
      '   <TerminalId>41742991</TerminalId>\r\n' +
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
      '</BS_Request>', response => true, message => new InvalidPreferencesError('bad request'))
  }))
  const transactions = await Promise.all(flatMap(mails, mail => {
    let data = mail.BS_Response.MailAttachment.Attachment
    return parseMail(data)
  }))
  console.log(transactions)

//  console.log(`>>> Загружено ${filteredOperations.length} операций.`)
//  return filteredOperations
}
