import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { parseXml } from '../../common/xmlUtils'
import { flatMap } from 'lodash'
import { fetch } from '../../common/network'
import cheerio from 'cheerio'
import xml2js from 'xml2js'

const BASE_URL = 'https://stb24.by/mobile/xml_online'

export function terminalTime () {
  const now = new Date()
  return String(now.getFullYear()) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
}

async function fetchApi (url, xml, options, predicate = () => true, error = (message) => console.assert(false, message), rawResp = false) {
  options.method = options.method ? options.method : 'POST'
  options.headers = {
    'Content-Type': 'multipart/x-www-form-urlencoded',
    'Accept-Encoding': 'gzip',
    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 12; sdk_gphone64_arm64 Build/SPB5.210812.003)'
  }
  options.body = 'XML=' + xml

  const response = await fetch(BASE_URL + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  if (rawResp) {
    return response.body
  }
  const res = parseXml(response.body)
  if (res.BS_Response.Error && res.BS_Response.Error.ErrorLine) {
    // not good code, but in case of 'includes' - we should not use switch
    if (res.BS_Response.Error.ErrorLine === 'Ошибка авторизации: Баланс недоступен') {
      return null
    }
    if (res.BS_Response.Error.ErrorLine === 'Нет данных для отчёта') {
      return null
    }
    if (res.BS_Response.Error.ErrorLine.includes('Окончание периода - допустимый диапазон значений')) {
      // return the last available date to parse transactions
      return res.BS_Response.Error.ErrorLine.match(/\d{2}.\d{2}.\d{4}/)[0]
    }
    if (res.BS_Response.Error.ErrorLine.includes('Окончание периода - неверная длина')) {
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
  const rawResponse = await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <GetProducts ProductType="MS" GetActions="Y" GetBalance="Y"/>\r\n' +
    '   <RequestType>GetProducts</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'), true)
  let resp = null
  xml2js.parseString(rawResponse, { mergeAttrs: true }, (err, result) => {
    resp = err ? null : result
  })
  const accounts = []
  if (resp) {
    for (const account of resp.BS_Response.GetProducts[0].Product) {
      accounts.push(account)
    }
  }
  console.log(`>>> Загружено ${accounts.length} счетов.`)
  return accounts
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

async function getTransactions (accountId, fromDate, toDate, sid) {
  return await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <ExecuteAction Id="' + accountId + '">\r\n' +
    '      <Parameter Id="DateFrom">' + fromDate + '</Parameter>\r\n' +
    '      <Parameter Id="DateTo">' + toDate + '</Parameter>\r\n' +
    '   </ExecuteAction>\r\n' +
    '   <RequestType>ExecuteAction</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
}

export async function fetchFullTransactions (sid, account, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  toDate = toDate || new Date()
  toDate.setDate(toDate.getDate())

  const dates = createDateIntervals(fromDate, toDate)
  const responses = await Promise.all(dates.map(async date => {
    let response = await getTransactions(account.transactionsAccId, transactionDate(date[0]), transactionDate(date[1]), sid)
    // if the response is failed by incorrect toDate we're recalculating it
    if (/\d{2}.\d{2}.\d{4}/.test(response)) {
      response = await getTransactions(account.transactionsAccId, transactionDate(date[0]), response, sid)
    }
    return response
  }))
  const mailIDs = responses.map(response => {
    if (response === null) {
      return null
    }
    return response.BS_Response.ExecuteAction.MailId
  })
  return await Promise.all(flatMap(mailIDs.filter(Boolean), (mailId) => {
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
    if (tr.children.length >= 9) { // Значит это операция, а не просто форматирование
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

// Экспорт пополнений карточки

export async function fetchDeposits (sid, account) {
  console.log('>>> Загрузка списка пополнений...')
  const response = await fetchApi('.admin',
    '<BS_Request>\r\n' +
    '   <ExecuteAction Id="' + account.latestTrID + '"/>\r\n' +
    '   <RequestType>ExecuteAction</RequestType>\r\n' +
    '   <Session SID="' + sid + '"/>\r\n' +
    '   <TerminalId Version="1.9.12">Android</TerminalId>\r\n' +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n' +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  if (response) {
    return await fetchApi('.admin',
      '<BS_Request>\r\n' +
      '   <MailAttachment Id="' + response.BS_Response.ExecuteAction.MailId + '" No="0"/>\r\n' +
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
  }
  return null
}

export function parseDeposits (mail, fromDate) {
  const data = mail.BS_Response.MailAttachment.Attachment.Body
  const transactions = parseDepositsMail(data).filter((transaction) => transaction.amountReal > 0).filter((transaction) => {
    const [day, month, year] = transaction.date.match(/(\d{2}).(\d{2}).(\d{4})/).slice(1)
    return (new Date(`${year}-${month}-${day}`) > fromDate)
  })
  console.log(`>>> Загружено ${transactions.length} пополнений.`)
  return transactions
}

export function parseDepositsMail (html) {
  const $ = cheerio.load(html)
  const head = $('p[style="margin-right:auto;text-align:center;"]').toArray()[0]
  if (head.children.length < 3) {
    return []
  }
  const info = head.children[1]
  if (info.children.length < 3) {
    return []
  }
  const card = info.children[2].data.split(' ')[2]
  const data = []
  const arrTrans = $('table.section_1').toArray()[0].children.filter((tableRow) => { return tableRow.name === 'tbody' })
  for (const arrTran of arrTrans) {
    const arrTranChildrens = arrTran.children[0].children
    if (arrTranChildrens.length >= 7) { // Значит это операция, а не просто форматирование
      const child = arrTranChildrens[0].parent.children.filter((tableRow) => { return tableRow.name === 'td' })
      const date = child[0].children[0].data
      const type = child[2].children[0].data
      const amountReal = Number(parseFloat(child[3].children[0].data.split(' ')[0].replace(/,/g, '.')))
      const currencyReal = child[3].children[0].data.split(' ')[1]
      const place = child[6].children[0].data
      if (!date || !type || !currencyReal || !place || isNaN(amountReal)) {
        throw new Error('unexpected receipt')
      }
      const dataTran = {
        cardNum: card,
        date: date,
        description: null,
        type: type,
        amountReal: amountReal,
        currencyReal: currencyReal,
        amount: null,
        currency: null,
        place: place,
        authCode: null,
        mcc: null
      }
      data.push(dataTran)
    }
  }
  return data
}
