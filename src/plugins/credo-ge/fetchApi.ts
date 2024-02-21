import { TemporaryError } from '../../errors'
import { fetchJson, FetchOptions, FetchResponse} from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { Preferences, Product, Session, AuthInitiatePayload, LanguageType, AuthOperationSendChallengeResponse, AuthConfirmResponse, Account as CredoAccount, Transaction as CredoTransaction } from './models'
import { isArray } from 'lodash'

import { AuthInitiateResponse } from './models'

const IEBaseUrl = 'https://mycredo.ge:8443'
const initiatePath = '/api/Auth/Initiate'
const confirmPath = '/api/Auth/confirm'
const graphqlPath = '/graphql'
/* const userPubliInfoPath = '/api/Auth/UserPublicInfo' */

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(IEBaseUrl + url, options ?? {})
}

export async function fetchAllAccounts (session: Session): Promise<CredoAccount[]> {
  const fetchOptions: FetchOptions = {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.auth.accessToken },
    body: {
      query: '{accounts {hasActiveWallet  accountId  accountNumber  account  currency  categoryId  category  hasCard  status  type  cssAccountId  availableBalance  currencyPriority  availableBalanceEqu  isDefault  isHidden  rate  activationDate  allowedOperations}}',
      variables: {}
    },
    sanitizeRequestLog: { headers: { Authorization: true } }
  }
  const response = await fetchApi(graphqlPath, fetchOptions)

  const accounts = response.body?.data?.accounts
  assert(isArray(accounts), 'cant get accounts array', response)
  return accounts
}

export async function fetchProductTransactions (accountId: string, session: Session, fromDate: Date, toDate: Date): Promise<CredoTransaction[]> {
  /*
  {
    "operationName": "transactionPagingList",
    "query": "query transactionPagingList($data: TransactionFilterGType!) {transactionPagingList(data: $data) {  pageCount  totalItemCount  itemList {    credit    currency    transactionType    transactionId    debit    description    isCardBlock    operationDateTime    stmtEntryId    canRepeat    canReverse    amountEquivalent    operationType    operationTypeId  }}\n}\n",
    "variables": {
      "data": {
        "accountIdList": [
          27793452
        ],
        "dateFrom": "2024-02-17T06:03:27.000Z",
        "dateTo": "2024-02-17T06:03:27.000Z",
        "onlyCanBeReversedOrRepeated": false,
        "pageNumber": 1,
        "pageSize": 15
      }
    }
  }
   */
  const chunkSize = 30
  let fetchOptions: FetchOptions
  let pageNumber = 1
  let transactions = []

  while (true) {
    fetchOptions = {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + session.auth.accessToken },
      body: {
        operationName: 'transactionPagingList',
        query: 'query transactionPagingList($data: TransactionFilterGType!) {transactionPagingList(data: $data) { pageCount totalItemCount itemList { credit currency transactionType transactionId debit description isCardBlock operationDateTime stmtEntryId canRepeat canReverse amountEquivalent operationType operationTypeId }} }',
        variables: {
          data: {
            accountIdList: [
              Number(accountId)
            ],
            dateFrom: fromDate,
            dateTo: toDate,
            onlyCanBeReversedOrRepeated: false,
            pageNumber,
            pageSize: chunkSize
          }
        }
      },
      sanitizeRequestLog: { headers: { Authorization: true } }
    }
    const response = await fetchApi(graphqlPath, fetchOptions)

    const chunkTransactions = response.body?.data?.transactionPagingList?.itemList

    assert(isArray(chunkTransactions), 'cant get transactions array', response)
    transactions = transactions.concat(chunkTransactions)
    if (chunkTransactions.length < chunkSize) {
      break
    }
    pageNumber++
  }
  return transactions
}

export async function authInitiate ({ login, password }: Preferences): Promise<AuthInitiateResponse> {
  let deviceId = ZenMoney.getData('deviceId', null)
  console.log('deviceId is ', deviceId)
  if (deviceId == null) {
    deviceId = generateRandomString(16)
    ZenMoney.setData('deviceId', deviceId)
    ZenMoney.saveData()
  }
  let payload: AuthInitiatePayload = {
    username: login,
    password,
    channel: 508,
    deviceId,
    refreshToken: null,
    loggedInWith: 4,
    deviceName: 'Mozilla Firefox',
    languageType: LanguageType.english
  }
  console.log('deviceId is ', deviceId)
  console.log('>>> Starting authInitiate')
  const response = await fetchJson(IEBaseUrl + initiatePath, {
    method: 'POST',
    body: payload,
    sanitizeRequestLog: { body: { username: true, password: true } }
  })
  if (response.status !== 200) {
    throw new TemporaryError('AuthInitiate failed!')
  }
  console.log('AuthInitiate response', response)
  return response.body
}

export async function initiate2FA (operationId: string): Promise<AuthOperationSendChallengeResponse> {
  const payload = {
    query: 'mutation ($operationId: String!) { operationSendChallenge(operationId: $operationId)}',
    variables: { operationId }
  }
  console.log('>>> Initiating 2FA challenge')
  const response = await fetchJson(IEBaseUrl + graphqlPath, {
    method: 'POST',
    body: payload
  })
  if (response.status !== 200) {
    throw new TemporaryError('Initiating 2FA failed!')
  }
  console.log('2FA challenge response', response)
  return response.body
}

export async function authConfirm (otp: string | null, operationId: string): Promise<AuthConfirmResponse> {
  const payload = { OperationId: operationId, TraceId: null, TwoFactorHandle: otp }
  console.log('>>> Starting 2FA confirmation')
  const response = await fetchJson(IEBaseUrl + confirmPath, {
    method: 'POST',
    body: payload,
    sanitizeResponseLog: { body: { data: { operationData: { token: true } } } }
  })
  if (response.status !== 200) {
    throw new TemporaryError('2FA challenge failed!')
  }
  console.log('2FA confirmation response', response)
  return response.body
}

export async function getMyIp (): Promise<string> {
  const response = await fetchJson('https://api.ipify.org/?format=json')
  return response.body.ip
}
