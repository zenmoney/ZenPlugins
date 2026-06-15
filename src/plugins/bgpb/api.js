import cheerio from 'cheerio'
import { flatMap } from 'lodash'
import { createDateIntervals as commonCreateDateIntervals } from '../../common/dateUtils'
import { fetch, fetchJson } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { generateRandomString } from '../../common/utils'
import { parseXml } from '../../common/xmlUtils'

const BASE_URL = 'https://mobapp-frontend.bgpb.by/'
const TERMINAL_ID = 41742962
const APP_VERSION = '1.5.0'
const DEVICE_PLATFORM = 'Android 11'
const PUSH_HISTORY_ENDPOINT = `push-history/api/android_${APP_VERSION}/v2/getHistory`
const HISTORY_BASE_PATH = 'history/client/2/1/'
const HISTORY_CONFIG_ENDPOINT = `${HISTORY_BASE_PATH}getConfig`
const HISTORY_EXT_OPERATIONS_ENDPOINT = `${HISTORY_BASE_PATH}ext-operations`
const EXTRA_AUTH_REQUIRED_ERROR = 'Для выполнения действия требуется дополнительная аутентификация'
const FULL_STATEMENT_REQUESTS_ENABLED = false

const SOU_ADMIN_ENDPOINT = 'sou2/xml_online.admin'
const SOU_REQUEST_ENDPOINT = 'sou2/xml_online.request'
const TERMINAL_CAPABILITIES_XML =
  '   <TerminalCapabilities>\r\n' +
  '       <LongParameter>Y</LongParameter>\r\n' +
  '       <ScreenWidth>99</ScreenWidth>\r\n' +
  '       <AnyAmount>Y</AnyAmount>\r\n' +
  '       <BooleanParameter>Y</BooleanParameter>\r\n' +
  '       <CheckWidth>39</CheckWidth>\r\n' +
  '       <InputDataSources>\r\n' +
  '           <InputDataSource>Lookup</InputDataSource>\r\n' +
  '       </InputDataSources>\r\n' +
  '   </TerminalCapabilities>\r\n'

export function generateBoundary () {
  return generateRandomString(8) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(4) + '-' + generateRandomString(12)
}

export function terminalTime () {
  const now = new Date()
  return String(now.getFullYear()) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
}

function buildTerminalInfoXml () {
  return `   <TerminalId Version="${APP_VERSION}">${TERMINAL_ID}</TerminalId>\r\n` +
    '   <TerminalTime>' + terminalTime() + '</TerminalTime>\r\n'
}

function buildSessionXml (sid) {
  return '   <Session IpAddress="10.0.2.15" Prolong="Y" SID="' + sid + '"/>\r\n'
}

function sanitizeBgpbRequestLogBody (body) {
  if (typeof body === 'string') {
    return body
      .replace(/\bSID="([^"]*)"/gi, (_match, value) => `SID="${sanitize(value, true)}"`)
      .replace(/(<Parameter\s+Id="(?:Login|Password)"[^>]*>)([^<]*)(<\/Parameter>)/gi, (_match, openTag, value, closeTag) => {
        return `${openTag}${sanitize(value, true)}${closeTag}`
      })
  }
  if (Array.isArray(body)) {
    return body.map(sanitizeBgpbRequestLogBody)
  }
  if (body && typeof body === 'object') {
    return Object.fromEntries(Object.entries(body).map(([key, value]) => [
      key,
      /^(sid|sessionId)$/i.test(key) ? sanitize(value, true) : sanitizeBgpbRequestLogBody(value)
    ]))
  }
  return body
}

function mergeSanitizeLogMask (defaults, mask) {
  if (mask === undefined) {
    return defaults
  }
  if (mask === true || typeof mask === 'function') {
    return mask
  }
  if (mask && typeof mask === 'object') {
    return {
      ...defaults,
      ...mask
    }
  }
  return mask
}

function withDefaultSanitizeLogMasks (options) {
  return {
    ...options,
    sanitizeRequestLog: mergeSanitizeLogMask({
      body: sanitizeBgpbRequestLogBody
    }, options.sanitizeRequestLog),
    sanitizeResponseLog: mergeSanitizeLogMask({
      body: sanitizeBgpbRequestLogBody
    }, options.sanitizeResponseLog)
  }
}

function buildMailAttachmentRequest (sid, mailId) {
  return '<BS_Request>\r\n' +
    '   <MailAttachment Id="' + mailId + '" No="0"/>\r\n' +
    '   <RequestType>MailAttachment</RequestType>\r\n' +
    buildSessionXml(sid) +
    buildTerminalInfoXml() +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    TERMINAL_CAPABILITIES_XML +
    '</BS_Request>\r\n'
}

async function fetchMailAttachment (sid, mailId) {
  return await fetchApi(SOU_ADMIN_ENDPOINT,
    buildMailAttachmentRequest(sid, mailId),
    {},
    response => true,
    message => new InvalidPreferencesError(message))
}

async function fetchApi (url, xml, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const boundary = generateBoundary()
  const boundaryStart = '--' + boundary + '\r\n'
  const boundaryLast = '--' + boundary + '--\r\n'

  options = withDefaultSanitizeLogMasks(options)
  options.method = options.method ? options.method : 'POST'
  options.headers = {
    'User-Agent': `BGPB mobile/${APP_VERSION} (Android; unknownAndroidSDKbuiltforx86; ${DEVICE_PLATFORM})`,
    'Content-Type': 'multipart/form-data; boundary=' + boundary
  }
  options.body = boundaryStart +
    'Content-Disposition: form-data; name="XML"\r\n' +
    'Content-Transfer-Encoding: binary\r\n' +
    'Content-Type: application/xml; charset=UTF-8\r\n' +
    'Content-Length: ' + xml.length + '\r\n\r\n' +
    xml +
    boundaryLast

  const response = await fetch(BASE_URL + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }
  const res = parseXml(response.body)

  if (!res || !res.BS_Response) {
    throw new TemporaryError('Ответ банка: получен некорректный ответ сервера')
  }

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

async function fetchApiJson (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  options = withDefaultSanitizeLogMasks(options)
  const response = await fetchJson(BASE_URL + url, options)
  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.errorCode !== 0) {
    throw new TemporaryError('Ответ банка: ' + response.body)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

function normalizeItems (item) {
  if (!item) {
    return []
  }
  return Array.isArray(item) ? item.filter(Boolean) : [item]
}

function normalizeProductsResponse (response) {
  if (!response || !response.BS_Response || !response.BS_Response.GetProducts) {
    return []
  }
  return normalizeItems(response.BS_Response.GetProducts.Product)
}

function getAttachmentHtml (attachment) {
  if (!attachment) {
    return ''
  }
  if (typeof attachment === 'string') {
    return attachment
  }
  if (typeof attachment.Body === 'string') {
    return attachment.Body
  }
  const $ = cheerio.load(attachment)
  const root = $().children()[0]
  const body = root && root.children && root.children[0] && root.children[0].Body
  return typeof body === 'string' ? body : ''
}

function parseAmount (amount) {
  if (amount === null || amount === undefined || amount === '') {
    return null
  }
  const normalized = Number.parseFloat(String(amount).replace(',', '.').replace(/\s/g, ''))
  return isNaN(normalized) ? null : normalized
}

function isStatementAction (action) {
  return /operationtxt/i.test(action.Type || '') || /statement/i.test(action.Type || '') || action.Name === 'Выписка'
}

function isConditionsAction (action) {
  return /conditions/i.test(action.Type || '') || action.Name === 'Условия обслуживания'
}

async function fetchProducts (sid, {
  productType,
  getActions = 'N',
  getBalance = 'N',
  includeHidden = 'N',
  getGroupedActions = 'N',
  sortByGroups = 'N'
}) {
  return await fetchApi(SOU_ADMIN_ENDPOINT,
    '<BS_Request>\r\n' +
    `   <GetProducts ProductType="${productType}" GetActions="${getActions}" GetBalance="${getBalance}" IncludeHidden="${includeHidden}" GetGroupedActions="${getGroupedActions}" SortByGroups="${sortByGroups}"/>\r\n` +
    '   <RequestType>GetProducts</RequestType>\r\n' +
    buildSessionXml(sid) +
    buildTerminalInfoXml() +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError(message))
}

export function parseFullTransactionsMail (html) {
  const body = getAttachmentHtml(html)
  const $ = cheerio.load(body)
  const tdObjects = $('table tr td[style="border: none;width:17cm;"]').toArray()
  if (tdObjects.length < 3) {
    return []
  }
  const card = tdObjects[tdObjects.length - 1].children[0].data.split(' ')[7]

  let counter = 0
  let i = 0
  const data = []
  flatMap($('table[class="section_3"] tr').toArray().slice(1), tr => {
    if (tr.children.length >= 12) { // Значит это операция, а не просто форматирование
      for (const td of tr.children) {
        if (td.children && td.children[0] && td.children[0].type === 'text') {
          if (counter === 12) {
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
              data[i].description = td.children[0].data
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
              data[i].place = td.children[0].data.trim()
              break
            case 9:
              data[i].authCode = td.children[0].data
              break
            case 10:
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

export function parseFullTransactionsMailCardLimit (html) {
  const body = getAttachmentHtml(html)
  const $ = cheerio.load(body)

  let isLimit = false
  let overdraft = null
  flatMap($('table[class="section_1"] tr').toArray().slice(1), tr => {
    if (tr.children.length >= 0) { // Значит это строка, а не просто форматирование
      for (const td of tr.children) {
        if (td.children && td.children[0] && td.children[0].type === 'text') {
          if (isLimit) {
            overdraft = td.children[0].data
            isLimit = false
          }
          if (td.children[0].data === 'Лимит овердрафта:') {
            isLimit = true
          }
        }
      }
    }
  })
  return overdraft
}

export function parseConditionsMail (html) {
  const body = getAttachmentHtml(html)
  const $ = cheerio.load(body)

  let isNumber = false
  let accountNumber = null
  flatMap($('table[class="mytd"] tr').toArray().slice(1), tr => {
    if (tr.children.length >= 0) { // Значит это строка, а не просто форматирование
      for (const td of tr.children) {
        if (td.children && td.children[0] && td.children[0].type === 'text') {
          if (isNumber) {
            accountNumber = td.children[0].data
            isNumber = false
          }
          if (td.children[0].data === 'Номер счета') {
            isNumber = true
          }
        }
      }
    }
  })
  return accountNumber
}

export function parseDepositTransactionsMail (html) {
  const body = getAttachmentHtml(html)
  const $ = cheerio.load(body)
  const table = $('table').toArray().find(node => {
    const headers = $(node).find('tr').first().find('td,th').toArray().map(cell => $(cell).text().replace(/\s+/g, ' ').trim())
    return ['Дата', 'Операция', 'Приход', 'Расход', 'Остаток', 'Валюта'].every(header => headers.includes(header))
  })

  if (!table) {
    return []
  }

  return $(table).find('tr').toArray().slice(1).map(row => {
    const cells = $(row).find('td').toArray().map(cell => $(cell).text().replace(/\s+/g, ' ').trim())
    if (cells.length !== 6) {
      return null
    }

    const [date, description, income, outcome, balance, currency] = cells
    if (!/\d{2}\.\d{2}\.\d{4}/.test(date) ||
      /Входящий остаток|Обороты за период|Исходящий остаток/i.test(description)) {
      return null
    }

    return {
      statementType: 'deposit',
      date,
      description,
      income,
      outcome,
      balance,
      currency
    }
  }).filter(Boolean)
}

export async function login (login, password) {
  const res = await fetchApi(SOU_ADMIN_ENDPOINT,
    '<BS_Request>\r\n' +
    '   <Login Biometric="N" IpAddress="10.0.2.15" Type="PWD">\r\n' +
    '      <Parameter Id="Login">' + login + '</Parameter>\r\n' +
    '      <Parameter Id="Password">' + password + '</Parameter>\r\n' +
    '      <Parameter Id="DevicePlatform">' + DEVICE_PLATFORM + '</Parameter>\r\n' +
    '      <Parameter Id="AppVersion">' + APP_VERSION + '</Parameter>\r\n' +
    '   </Login>\r\n' +
    '   <RequestType>Login</RequestType>\r\n' +
    buildTerminalInfoXml() +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', { sanitizeRequestLog: { body: true } }, response => true, message => new InvalidPreferencesError('Неверный логин или пароль'))
  if (res.BS_Response.Login && res.BS_Response.Login.SID) {
    return res.BS_Response.Login.SID
  }

  return null
}

export async function fetchAccounts (sid) {
  console.log('>>> Загрузка списка счетов...')
  const [cards, deposits] = await Promise.all([
    fetchProducts(sid, {
      productType: 'MS',
      getActions: 'Y',
      getGroupedActions: 'Y',
      sortByGroups: 'Y'
    }),
    fetchProducts(sid, {
      productType: 'DEPOSIT',
      getActions: 'Y',
      getBalance: 'Y',
      getGroupedActions: 'Y',
      sortByGroups: 'Y'
    })
  ])

  return normalizeProductsResponse(cards).concat(normalizeProductsResponse(deposits))
}

export async function fetchBalance (sid, account) {
  console.log('>>> Загрузка баланса для ' + account.title)

  if (account.productType === 'DEPOSIT') {
    return parseAmount(account.balance) || 0
  }

  const res = await fetchApi(SOU_REQUEST_ENDPOINT,
    '<BS_Request>\r\n' +
    '   <Balance Currency="' + account.currencyCode + '"/>\r\n' +
    '   <RequestType>Balance</RequestType>\r\n' +
    buildSessionXml(sid) +
    buildTerminalInfoXml() +
    '   <ClientId IdType="' + account.productType + '">' + account.cardNumber + '</ClientId>\r\n' +
    TERMINAL_CAPABILITIES_XML +
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

  if (account.transactionsAccId || account.conditionsAccId) {
    return {
      transactionsAccId: account.transactionsAccId || null,
      conditionsAccId: account.conditionsAccId || null
    }
  }

  const res = await fetchApi(SOU_ADMIN_ENDPOINT,
    '<BS_Request>\r\n' +
    '   <GetActions ProductId="' + account.productId + '"/>\r\n' +
    '   <RequestType>GetActions</RequestType>\r\n' +
    buildSessionXml(sid) +
    buildTerminalInfoXml() +
    '   <Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))
  if (res.BS_Response.GetActions && res.BS_Response.GetActions.Action) {
    const actions = normalizeItems(res.BS_Response.GetActions.Action)
    const resp = {
      transactionsAccId: null,
      conditionsAccId: null
    }
    for (let i = 0; i < actions.length; i++) {
      if (!resp.transactionsAccId && isStatementAction(actions[i])) {
        resp.transactionsAccId = actions[i].Id
      } else if (!resp.conditionsAccId && isConditionsAction(actions[i])) {
        resp.conditionsAccId = actions[i].Id
      }
    }
    return resp
  }
  return null
}

export async function fetchAccountConditions (sid, account) {
  console.log('>>> Загрузка условий обслуживания для ' + account.title)

  const response = await fetchApi(SOU_ADMIN_ENDPOINT,
    '<BS_Request>\r\n' +
    '<ExecuteAction Id="' + account.conditionsAccId + '"/>\r\n' +
    '<RequestType>ExecuteAction</RequestType>\r\n' +
    buildSessionXml(sid) +
    buildTerminalInfoXml() +
    '<Subsystem>ClientAuth</Subsystem>\r\n' +
    '</BS_Request>', {}, response => true, message => new InvalidPreferencesError('bad request'))
  const mailID = response.BS_Response.ExecuteAction.MailId

  const mail = await fetchMailAttachment(sid, mailID)
  const data = mail.BS_Response.MailAttachment.Attachment
  return parseConditionsMail(data)
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
  return String(date.getDate() + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + String(date.getFullYear()))
}

function padNumber (value) {
  return String(value).padStart(2, '0')
}

function formatHistoryDate (date, endOfDay = false) {
  const historyDate = new Date(date)
  if (endOfDay) {
    historyDate.setHours(23, 59, 59, 0)
  } else {
    historyDate.setHours(0, 0, 0, 0)
  }
  return `${historyDate.getFullYear()}-${padNumber(historyDate.getMonth() + 1)}-${padNumber(historyDate.getDate())}T${padNumber(historyDate.getHours())}:${padNumber(historyDate.getMinutes())}:${padNumber(historyDate.getSeconds())}+0300`
}

function parseHistoryConfigDate (value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function clampHistoryFromDate (fromDate, toDate, historyConfig) {
  const effectiveToDate = new Date(toDate)
  const clampedDates = [new Date(fromDate)]
  const minDate = parseHistoryConfigDate(historyConfig?.minDate)
  if (minDate) {
    clampedDates.push(minDate)
  }
  const extOperationsHistoryInDays = Number(historyConfig?.extOperationsHistoryInDays)
  if (Number.isFinite(extOperationsHistoryInDays) && extOperationsHistoryInDays > 0) {
    const extHistoryStartDate = new Date(effectiveToDate)
    extHistoryStartDate.setDate(extHistoryStartDate.getDate() - (extOperationsHistoryInDays - 1))
    clampedDates.push(extHistoryStartDate)
  }
  return new Date(Math.max(...clampedDates.map(date => date.getTime())))
}

async function fetchHistoryConfig () {
  return (await fetchApiJson(HISTORY_CONFIG_ENDPOINT, {
    method: 'GET'
  }, response => response.body && response.body.errorCode === 0 && response.body.config, message => new TemporaryError(message))).body.config
}

async function fetchCardLastTransactions (sid, account, fromDate, toDate, historyConfig) {
  if (!account.bankId) {
    return []
  }
  const effectiveToDate = toDate || new Date()
  const effectiveFromDate = clampHistoryFromDate(fromDate, effectiveToDate, historyConfig)
  if (effectiveFromDate.getTime() > effectiveToDate.getTime()) {
    return []
  }

  const response = await fetchApiJson(HISTORY_EXT_OPERATIONS_ENDPOINT, {
    method: 'POST',
    body: {
      filter: {
        startDate: formatHistoryDate(effectiveFromDate),
        endDate: formatHistoryDate(effectiveToDate, true),
        bankId: String(account.bankId)
      },
      session: {
        sessionId: sid
      },
      page: {
        count: Math.max(Number(historyConfig?.pageSize) || 20, 100)
      }
    }
  }, response => response.body && response.body.errorCode === 0 && response.body.result && Array.isArray(response.body.result.items), message => new TemporaryError(message))

  return response.body.result.items.map(transaction => ({
    ...transaction,
    bankId: String(account.bankId)
  }))
}

export async function fetchFullTransactions (sid, account, fromDate, toDate = new Date()) {
  console.log('>>> Загрузка списка транзакций...')
  if (!FULL_STATEMENT_REQUESTS_ENABLED) {
    console.log(`>>> Полная выписка для "${account.title}" требует device-bound аутентификацию приложения, пропускаем.`)
    return []
  }

  toDate = toDate || new Date()

  const dates = createDateIntervals(fromDate, toDate)
  const mailIDs = []

  for (const date of dates) {
    try {
      const response = await fetchApi(SOU_ADMIN_ENDPOINT,
        '<BS_Request>\r\n' +
        '   <ExecuteAction Id="' + account.transactionsAccId + '" Button="OK">\r\n' +
        '      <Parameter Id="DateFrom">' + transactionDate(date[0]) + '</Parameter>\r\n' +
        '      <Parameter Id="DateTill">' + transactionDate(date[1]) + '</Parameter>\r\n' +
        '   </ExecuteAction>\r\n' +
        '   <RequestType>ExecuteAction</RequestType>\r\n' +
        buildSessionXml(sid) +
        buildTerminalInfoXml() +
        '   <Subsystem>ClientAuth</Subsystem>\r\n' +
        '</BS_Request>\r\n', {}, response => true, message => new InvalidPreferencesError('bad request'))

      const mailId = response?.BS_Response?.ExecuteAction?.MailId
      if (mailId) {
        mailIDs.push(mailId)
      }
    } catch (error) {
      if (error.message && error.message.includes(EXTRA_AUTH_REQUIRED_ERROR)) {
        console.log(`>>> Полная выписка для "${account.title}" требует device-bound аутентификацию приложения, пропускаем.`)
        return []
      }
      if (error instanceof TemporaryError) {
        console.log(`>>> Не удалось запросить выписку для "${account.title}" за ${transactionDate(date[0])}-${transactionDate(date[1])}, пропускаем интервал.`)
        continue
      }
      throw error
    }
  }

  const mails = []
  for (const mailId of mailIDs) {
    try {
      mails.push(await fetchMailAttachment(sid, mailId))
    } catch (_error) {
      console.log(`>>> Не удалось загрузить вложение выписки для "${account.title}", пропускаем один интервал.`)
    }
  }

  return mails
}

export function parseTransactionsAndOverdraft (mails, account = null) {
  let overdraft = null
  const transactions = flatMap(mails, mail => {
    const mailObj = typeof mail === 'string' ? parseXml(mail) : mail
    const data = mailObj.BS_Response.MailAttachment.Attachment
    if (account && account.type === 'deposit') {
      return parseDepositTransactionsMail(data)
    }
    overdraft = parseFullTransactionsMailCardLimit(data) || overdraft
    return parseFullTransactionsMail(data)
  })
  console.log(`>>> Загружено ${transactions.length} операций.`)
  return {
    overdraft,
    transactions
  }
}

async function fetchPushHistoryTransactions (sid) {
  return (await fetchApiJson(PUSH_HISTORY_ENDPOINT, {
    method: 'POST',
    body: {
      eventTypes: [
        4,
        8
      ],
      limit: 40,
      offset: 0,
      sessionId: sid
    }
  }, response => response.body && response.body.errorCode === 0 && Array.isArray(response.body.historyRecords), message => new TemporaryError(message))).body.historyRecords
}

export async function fetchLastTransactions (sid, accounts = [], fromDate = new Date(), toDate = new Date()) {
  console.log('>>> Загрузка списка последних транзакций...')
  const cardAccounts = accounts.filter(account => account.type === 'card' && account.bankId)
  if (cardAccounts.length === 0) {
    const transactions = await fetchPushHistoryTransactions(sid)
    console.log(`>>> Загружено ${transactions.length} последних операций.`)
    return transactions
  }

  try {
    const historyConfig = await fetchHistoryConfig()
    const transactions = flatMap(await Promise.all(cardAccounts.map(async account => {
      try {
        return await fetchCardLastTransactions(sid, account, fromDate, toDate, historyConfig)
      } catch (error) {
        console.log(`>>> Не удалось загрузить последние операции по карте "${account.title}", пропускаем.`)
        return []
      }
    })), item => item)
    console.log(`>>> Загружено ${transactions.length} последних операций через HistoryApi.`)
    return transactions
  } catch (error) {
    console.log('>>> Не удалось получить карточную историю через HistoryApi, пробуем push-history.')
    const transactions = await fetchPushHistoryTransactions(sid)
    console.log(`>>> Загружено ${transactions.length} последних операций.`)
    return transactions
  }
}
