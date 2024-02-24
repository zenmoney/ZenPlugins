import { TemporaryError } from '../../errors'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import {
  AuthInitiateResponse,
  Preferences,
  Session,
  AuthInitiatePayload,
  LanguageType,
  AuthOperationSendChallengeResponse,
  AuthConfirmResponse,
  Account as CredoAccount,
  Card as CredoCard,
  Deposit as CredoDeposit,
  Loan as CredoLoan,
  Transaction as CredoTransaction,
  AccountsResponse,
  CardsResponse,
  TransactionListResponse,
  DepositsResponse,
  LoansResponse
} from './models'
import { isArray } from 'lodash'

const IEBaseUrl = 'https://mycredo.ge:8443'
const initiatePath = '/api/Auth/Initiate'
const confirmPath = '/api/Auth/confirm'
const graphqlPath = '/graphql'
/* const userPubliInfoPath = '/api/Auth/UserPublicInfo' */

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(IEBaseUrl + url, options ?? {})
}

async function fetchGraphQL (session: Session, body: object): Promise<FetchResponse> {
  const fetchOptions: FetchOptions = {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.auth.accessToken },
    body,
    sanitizeRequestLog: { headers: { Authorization: true } }
  }
  return await fetchApi(graphqlPath, fetchOptions)

}

export async function fetchAllAccounts (session: Session): Promise<CredoAccount[]> {
  const body = {
    query: '{accounts {hasActiveWallet  accountId  accountNumber  account  currency  categoryId  category  hasCard  status  type  cssAccountId  availableBalance  currencyPriority  availableBalanceEqu  isDefault  isHidden  rate  activationDate  allowedOperations}}',
    variables: {}
  }
  const response = await fetchGraphQL(session, body)
  const accountsResponse = response.body as AccountsResponse
  const accounts = accountsResponse.data.accounts
  assert(isArray(accounts), 'cant get accounts array', response)
  return accounts
}

export async function fetchCards (session: Session): Promise<CredoCard[]> {
  const body = {
    query: '{ cards { cardId cardNumber cardCurrency cardNickName cardImageId cardImageAddress cardStatusId cardProduct cardAvailableAmount cardBlockedAmount cardExpireShortDate cardStatus cardExpireDate accountNumber isDigitalCard }}',
    variables: {}
  }
  const response = await fetchGraphQL(session, body)
  const cardsResponse = response.body as CardsResponse
  const cards = cardsResponse.data.cards
  assert(isArray(cards), 'can not get cards array', response)
  return cards
}

export async function fetchDeposits (session: Session): Promise<CredoDeposit[]> {
    const body = {
      query: '{ customer { deposits { targetingImageUrl targetingName targetingId targetingCardUrl hasActiveWallet availableToTopUp balanceEqu depositNickName depositType depositBalance depositCurrency accruedInterestAmount contractN depositInterestRate relatedAccount openningDate closeDate interestAmountIfCanceled productId type prolongationType type isProlongable t24AccountId cssAccountId } } }',
      variables: {}
    }
  const response = await fetchGraphQL(session, body)
  const depositsResponse = response.body as DepositsResponse
  const deposits = depositsResponse.data.customer.deposits
  assert(isArray(deposits), 'can not get deposits array', response)
  return deposits
}

export async function fetchLoans (session: Session): Promise<CredoLoan[]> {
    const body = {
      query: '{ customer { loans { id loanBalance loanBalanceEqu currency productId product nickname nextPaymentDate nextPaymentAmount contractN relatedAccount } } }',
      variables: {}
    }
  const response = await fetchGraphQL(session, body)
  const loansResponse = response.body as LoansResponse
  const loans = loansResponse.data.customer.loans
  assert(isArray(loans), 'can not get loans array', response)
  return loans
}

export async function fetchProductTransactions (accountId: string, session: Session, fromDate: Date, toDate: Date): Promise<CredoTransaction[]> {
  const chunkSize = 30
  let body: object
  let pageNumber = 1
  let transactions: CredoTransaction[] = []

  while (true) {
    body = {
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
    }
    const response = await fetchGraphQL(session, body)

    const transactionsResponse = response.body as TransactionListResponse
    const chunkTransactions = transactionsResponse.data.transactionPagingList.itemList

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
  let deviceId = ZenMoney.getData('deviceId', null) as string
  console.log('deviceId is ', deviceId)
  if (deviceId == null) {
    deviceId = generateRandomString(16)
    ZenMoney.setData('deviceId', deviceId)
    ZenMoney.saveData()
  }
  const payload: AuthInitiatePayload = {
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
  const result = response.body as AuthInitiateResponse
  return result
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
  const result = response.body as AuthOperationSendChallengeResponse
  return result
}

export async function authConfirm (otp: string | null, operationId: string): Promise<AuthConfirmResponse> {
  const payload = { OperationId: operationId, TraceId: null, TwoFactorHandle: otp }
  console.log('>>> Starting 2FA confirmation')
  const response = await fetchJson(IEBaseUrl + confirmPath, {
    method: 'POST',
    body: payload,
    sanitizeResponseLog: { body: { data: { operationData: { token: true, refreshToken: true } } } }
  })
  if (response.status !== 200) {
    throw new TemporaryError('2FA challenge failed!')
  }
  console.log('2FA confirmation response', response)
  const result = response.body as AuthConfirmResponse
  return result
}
/*
 * export async function getMyIp (): Promise<string> {
 *   const response = await fetchJson('https://api.ipify.org/?format=json')
 *   return response.body.ip
 * } */
