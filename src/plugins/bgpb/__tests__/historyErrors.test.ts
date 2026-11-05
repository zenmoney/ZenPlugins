import fetchMock from 'fetch-mock'
import { TemporaryError, ZPAPIError } from '../../../errors'

interface HistoryAccount {
  type?: string
  bankId?: string
  title?: string
  transactionsAccId?: string
}

const { fetchFullTransactions, fetchLastTransactions }: {
  fetchFullTransactions: (sid: string, account: HistoryAccount, fromDate: Date, toDate: Date) => Promise<unknown[]>
  fetchLastTransactions: (sid: string, accounts: HistoryAccount[], fromDate: Date, toDate: Date) => Promise<unknown[]>
} = jest.requireActual('../api')

const baseUrl = 'https://mobapp-frontend.bgpb.by/'
const configUrl = `${baseUrl}history/client/2/1/getConfig`
const operationsUrl = `${baseUrl}history/client/2/1/ext-operations`
const pushHistoryUrl = `${baseUrl}push-history/api/android_1.7.1/v2/getHistory`
const statementUrl = `${baseUrl}sou2/xml_online.admin`
const fromDate = new Date('2026-05-01T00:00:00+0300')
const toDate = new Date('2026-05-21T00:00:00+0300')
const twoIntervalToDate = new Date('2026-06-15T00:00:00+0300')
const card = { type: 'card', bankId: 'bank-id' }
const statementAccount = { title: 'Deposit', transactionsAccId: 'statement-action' }

// Unchanged existing success samples from api.test.js: request logging and fetchFullTransactions.
// They are replayed only to model successful calls before a transport failure, not bank interpretation.
const historyConfig = { errorCode: 0, config: { pageSize: 20 } }
const emptyHistory = { errorCode: 0, result: { items: [] } }
const statementResponse = '<BS_Response><ExecuteAction><MailId>mail-1</MailId></ExecuteAction></BS_Response>'
const attachmentResponse = '<BS_Response><MailAttachment><Attachment><Body>statement</Body></Attachment></MailAttachment></BS_Response>'
const expectedAttachment = { BS_Response: { MailAttachment: { Attachment: { Body: 'statement' } } } }

afterEach(() => {
  fetchMock.restore()
})

describe('history completeness [model]', () => {
  // A failed history source must propagate its original error without fallback or successful partial data.
  it('preserves a configuration transport failure without requesting push history', async () => {
    const failure = new Error('Model configuration transport failure')
    fetchMock.getOnce(configUrl, { throws: failure })
    fetchMock.post(pushHistoryUrl, { throws: new Error('Unexpected push history fallback') })

    const result = fetchLastTransactions('model-session', [card], fromDate, toDate)

    await expect(result).rejects.toBe(failure)
    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    expect(fetchMock.calls(pushHistoryUrl)).toEqual([])
  })

  it('preserves a card transport failure without returning empty history', async () => {
    const failure = new Error('Model card transport failure')
    fetchMock.getOnce(configUrl, historyConfig)
    fetchMock.postOnce(operationsUrl, { throws: failure })
    fetchMock.post(pushHistoryUrl, { throws: new Error('Unexpected push history fallback') })

    const result = fetchLastTransactions('model-session', [card], fromDate, toDate)

    await expect(result).rejects.toBe(failure)
    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    expect(fetchMock.calls(pushHistoryUrl)).toEqual([])
  })

  it('returns the complete empty result when card history succeeds', async () => {
    fetchMock.getOnce(configUrl, historyConfig)
    fetchMock.postOnce(operationsUrl, emptyHistory)

    await expect(fetchLastTransactions('model-session', [card], fromDate, toDate)).resolves.toEqual([])
    expect(fetchMock.calls(configUrl)).toHaveLength(1)
    expect(fetchMock.calls(operationsUrl)).toHaveLength(1)
  })

  it.each([
    ['ordinary', new Error('Model statement transport failure')],
    ['temporary', new TemporaryError('Модель временного отказа транспорта')]
  ] as const)('preserves a later statement interval failure (%s)', async (_kind, failure) => {
    let statementRequests = 0
    fetchMock.post(statementUrl, (_url, options) => {
      if (String(options.body).includes('<ExecuteAction ')) {
        statementRequests++
        return statementRequests === 1 ? statementResponse : { throws: failure }
      }
      return attachmentResponse
    })

    const result = fetchFullTransactions('model-session', statementAccount, fromDate, twoIntervalToDate)

    await expect(result).rejects.toBe(failure)
    expect(fetchMock.calls(statementUrl)).toHaveLength(2)
  })

  it.each([
    ['ordinary', new Error('Model attachment transport failure')],
    ['temporary', new TemporaryError('Модель временного отказа транспорта')]
  ] as const)('preserves a later attachment failure after one attachment succeeds (%s)', async (_kind, failure) => {
    let attachmentRequests = 0
    fetchMock.post(statementUrl, (_url, options) => {
      if (String(options.body).includes('<ExecuteAction ')) {
        return statementResponse
      }
      attachmentRequests++
      return attachmentRequests === 1 ? attachmentResponse : { throws: failure }
    })

    const result = fetchFullTransactions('model-session', statementAccount, fromDate, twoIntervalToDate)

    await expect(result).rejects.toBe(failure)
    expect(fetchMock.calls(statementUrl)).toHaveLength(4)
  })

  it('returns every attachment when the statement completes', async () => {
    fetchMock.post(statementUrl, (_url, options) => String(options.body).includes('<ExecuteAction ')
      ? statementResponse
      : attachmentResponse)

    await expect(fetchFullTransactions('model-session', statementAccount, fromDate, twoIntervalToDate)).resolves.toEqual([
      expectedAttachment,
      expectedAttachment
    ])
    expect(fetchMock.calls(statementUrl)).toHaveLength(4)
  })
})
