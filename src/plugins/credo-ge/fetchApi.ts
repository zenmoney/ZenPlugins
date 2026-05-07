import { TemporaryError, InvalidLoginOrPasswordError } from '../../errors'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { generateRandomString } from '../../common/utils'
import { getOptString } from '../../types/get'
import {
  AuthInitiateResponse,
  InitiateAddBindedDeviceResponse,
  IpifyResponse,
  BindDeviceConfirmResponse,
  OperationStatus,
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
  LoansResponse,
  TransactionDetail,
  TransactionDetailResponse
} from './models'
import { isArray } from 'lodash'

// const IEBaseUrl = 'https://mycredo.ge:8443'
const IEBaseUrl = 'https://mobileapp.mycredo.ge'
const initiatePath = '/api/Auth/Initiate'
const confirmPath = '/api/Auth/confirm'
const graphqlPath = '/graphql'
/* const userPubliInfoPath = '/api/Auth/UserPublicInfo' */

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(IEBaseUrl + url, options ?? {})
}

async function fetchGraphQL (session: Session, body: object, language: LanguageType = LanguageType.english): Promise<FetchResponse> {
  const fetchOptions: FetchOptions = {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.auth.accessToken, Language: language },
    body,
    sanitizeRequestLog: { headers: { Authorization: true } }
  }
  return await fetchApi(graphqlPath, fetchOptions)
}

export async function fetchAllAccounts (session: Session): Promise<CredoAccount[]> {
  const body = {
    query: '{accounts {hasActiveWallet  accountId  accountNumber  account  currency  categoryId  category  hasCard  status  type  cssAccountId  availableBalance  currencyPriority  availableBalanceEqu  isDefault  isHidden  rate  activationDate  allowedOperations accountItemId balance}}',
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
    query: '{ cards { cardId cardNumber cardCurrency cardNickName cardImageId cardImageAddress cardStatusId cardProduct cardAvailableAmount cardBlockedAmount cardExpireShortDate cardStatus cardExpireDate accountNumber isDigitalCard cardCurrencyId priority applicationId cardSafetyPackageStatus cardImageAddressV2 cardType }}',
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

export async function getTransactionDetail (session: Session, stmtEntryId: string): Promise<TransactionDetail> {
  const body = {
    operationName: 'transaction',
    query: 'query transaction($stmtEntryId: String) { customer { transactions(stmtEntryId: $stmtEntryId) { amount transactionId operationId transactionType operationType debit debitEquivalent credit creditEquivalent description operationPerson currency amountEquivalent accountNumber contragentAccount contragentFullName contragentCurrency contragentAmount isCardBlock operationDateTime canRepeat canReverse transactionRate details { cardNumber debitAmount creditBank treasuryCode debitAmountEquivalent creditAmount creditAmountEquivalent debitCurrency creditCurrency accountNumber debitFullName creditFullName debitAccount creditAccount description rate thirdPartyFullName thirdPartyPersonalNumber utilityProviderName utilityServiceName utilityComment treasuryCode p2pFee } p2POperationStatements { amount country currency dateCreated description operationId operationStatusTypeId operationTypeId personId receiverCardLastFourDigits senderCardLastFourDigits senderCardType senderCardTypeName serviceProvider ufcTransactionId } } cards { cardNumber cardNickName cardImageAddress } }}',
    variables: {
      stmtEntryId
    }
  }
  const response = await fetchGraphQL(session, body)
  const transactionDetailResponse = response.body as TransactionDetailResponse
  const transactions = transactionDetailResponse.data.customer.transactions

  return transactions[0]
}

// let sample_json = {
//   "request": {
//     "method": "POST",
//     "url": "https://mobileapp.mycredo.ge/graphql",
//     "httpVersion": "HTTP/2",
//     "headers": [
//       {
//         "name": "Host",
//         "value": "mobileapp.mycredo.ge"
//       },
//       {
//         "name": "User-Agent",
//         "value": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0"
//       },
//       {
//         "name": "Accept",
//         "value": "application/json, text/plain, */*"
//       },
//       {
//         "name": "Accept-Language",
//         "value": "en-US,en;q=0.9"
//       },
//       {
//         "name": "Accept-Encoding",
//         "value": "gzip, deflate, br, zstd"
//       },
//       {
//         "name": "Authorization",
//         "value": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2YTA0OGZmNWJiNTYzNmZkMGRhMWY3ODczMGRlZDZjIiwidHlwIjoiSldUIn0.eyJuYmYiOjE3NzQ0OTc4MTMsImV4cCI6MTc3NDQ5OTYxMywiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eXNzby5teWNyZWRvLmdlIiwiYXVkIjpbImh0dHBzOi8vaWRlbnRpdHlzc28ubXljcmVkby5nZS9yZXNvdXJjZXMiLCJjcmVkb19hcGkiLCJrZWVwel9hcGkiLCJyZXRhaWxfYWNjb3VudHNfYXBpIiwicmV0YWlsX2V4dGVybmFsX3RyYW5zZmVyc19hcGkiLCJyZXRhaWxfbG9hbnNfYXBpIiwicmV0YWlsX29mZmVyc19hcGkiLCJyZXRhaWxfcDJwX2FwaSIsInJldGFpbF9zdGF0ZW1lbnRzX2FwaSIsInJldGFpbF90cmFuc2ZlcnNfYXBpIl0sImNsaWVudF9pZCI6Im15Y3JlZG9fd2ViX2NsaWVudCIsInN1YiI6IjQ0OTg1NSIsImF1dGhfdGltZSI6MTc3NDQ5NzgxMywiaWRwIjoibG9jYWwiLCJVc2VyTmFtZSI6ImFsdWtvbXNraXkiLCJBY2Nlc3NUeXBlIjoiZnVsbCIsIkN1c3RvbWVySWQiOiIyNjcxODU4IiwiUGVyc29uYWxOdW1iZXIiOiI3MjY2NTQ0NTYiLCJQaG9uZSI6IjU5OTk5NTc4MiIsIkhhc1RlbXBQYXNzd29yZCI6IkZhbHNlIiwiQ2hhbm5lbCI6IldFQiIsIlRyYWNlSWQiOiJCOW9CRnB6dTNiNGVLWlJLbTJPdytTUGVQSGdOVVU5YjJFaHZkZnd0SmdZPSIsInNjb3BlIjpbImNyZWRvX2FwaSIsImtlZXB6X2FwaSIsInJldGFpbF9hY2NvdW50c19hcGkiLCJyZXRhaWxfZXh0ZXJuYWxfdHJhbnNmZXJzX2FwaSIsInJldGFpbF9sb2Fuc19hcGkiLCJyZXRhaWxfb2ZmZXJzX2FwaSIsInJldGFpbF9wMnBfYXBpIiwicmV0YWlsX3N0YXRlbWVudHNfYXBpIiwicmV0YWlsX3RyYW5zZmVyc19hcGkiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsicHdkIl19.G2Bcz92AV_K_BK9H-Rj7yJ2Wrn0CeOoF9v0uT3zXhOXhn3hQ5LSQdLBFmJfKi5SFW1K45d3GTS4iR74YC-2BCG-HH7Z5nel2LJgyWdhHTwM6MIt2XYKBvWDY_B-h_Wt7qgIj0ENpKjpXuAWGkRFuJkhghHcL_-kba6YbSrNf6LPnjMTK1nQzGySLNbP68CcJ3b-n3SFVAtRDpQLE4FrvljHUnCLjuHDlYGAEfPMEZY9b3yyRxzRPmHexh4by9LcxNZgSjsVP-Gug1Kj3oDiyD-iAmUMMIBYGizI8iaU6qmtbSxapqYohhWHP8WNmUNr-BsVXfSlVoDGhs1GPooZIJg"
//       },
//       {
//         "name": "Language",
//         "value": "English"
//       },
//       {
//         "name": "Content-Type",
//         "value": "application/json"
//       },
//       {
//         "name": "Content-Length",
//         "value": "585"
//       },
//       {
//         "name": "Origin",
//         "value": "https://mycredo.ge"
//       },
//       {
//         "name": "Sec-GPC",
//         "value": "1"
//       },
//       {
//         "name": "Connection",
//         "value": "keep-alive"
//       },
//       {
//         "name": "Sec-Fetch-Dest",
//         "value": "empty"
//       },
//       {
//         "name": "Sec-Fetch-Mode",
//         "value": "cors"
//       },
//       {
//         "name": "Sec-Fetch-Site",
//         "value": "same-site"
//       }
//     ],
//     "cookies": [],
//     "queryString": [],
//     "headersSize": 0,
//     "postData": {
//       "mimeType": "application/json",
//       "params": [],
//       "text": {
//         "operationName": "transactionPagingList",
//         "variables": {
//           "data": { "pageNumber": 1, "pageSize": 15 }
//         },
//         "query": "query transactionPagingList($data: TransactionFilterGType!) {
//           transactionPagingList(data: $data) {
//           pageCount
//           totalItemCount
//              itemList {
//             accountNumber
//             credit
//             currency
//             transactionType
//             transactionId
//             debit
//             description
//             isCardBlock
//             operationDateTime
//             stmtEntryId
//             canRepeat
//             canReverse
//             canTemplate
//             amountEquivalent
//             operationType
//             operationTypeId
//           }
//         }
//       }"
//       }
//   }
// },
// "response": {
//   "status": 200,
//     "statusText": "",
//       "httpVersion": "HTTP/2",
//         "headers": [
//           {
//             "name": "date",
//             "value": "Thu, 26 Mar 2026 04:03:37 GMT"
//           },
//           {
//             "name": "content-type",
//             "value": "application/json; charset=utf-8"
//           },
//           {
//             "name": "vary",
//             "value": "Origin"
//           },
//           {
//             "name": "server",
//             "value": "cloudflare"
//           },
//           {
//             "name": "conversation-id",
//             "value": "4963c5b4-9925-4eb5-bfe2-74797e7068d1"
//           },
//           {
//             "name": "access-control-allow-origin",
//             "value": "https://mycredo.ge"
//           },
//           {
//             "name": "x-powered-by",
//             "value": "ASP.NET"
//           },
//           {
//             "name": "set-cookie",
//             "value": "SERVERID=MYCREDOFRONT1; path=/"
//           },
//           {
//             "name": "cf-cache-status",
//             "value": "DYNAMIC"
//           },
//           {
//             "name": "content-encoding",
//             "value": "br"
//           },
//           {
//             "name": "cf-ray",
//             "value": "9e23443cabc2ee35-BKK"
//           },
//           {
//             "name": "X-Firefox-Spdy",
//             "value": "h2"
//           }
//         ],
//           "cookies": [
//             {
//               "name": "SERVERID",
//               "value": "MYCREDOFRONT1"
//             }
//           ],
//             "content": {
//     "mimeType": "application/json; charset=utf-8",
//       "size": 6740,
//         "text": "{\"data\":{\"transactionPagingList\":{\"pageCount\":7,\"totalItemCount\":100,\"itemList\":[{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT26077TQDRP\",\"debit\":0.38,\"description\":\"SMS service fee\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T20:03:00\",\"stmtEntryId\":\"212623152372232.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":0.38,\"operationType\":\"SMS service fee\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":null,\"transactionId\":\"FT260779HB6M\",\"debit\":0.14,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T19:23:00\",\"stmtEntryId\":\"212628218769838.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":0.38,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":0.38,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT26077C3C25\",\"debit\":null,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T19:23:00\",\"stmtEntryId\":\"212620221669838.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":0.38,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE62CD0360000037664448\",\"credit\":32.0,\"currency\":\"USD\",\"transactionType\":\"Transferbetweenownaccounts\",\"transactionId\":\"FT26077S31J1\",\"debit\":null,\"description\":\"  Personal Transfer\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T13:41:00\",\"stmtEntryId\":\"212625350649277.000002\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":87.11,\"operationType\":\"Transfer between own accounts\",\"operationTypeId\":346},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":\"Transferbetweenownaccounts\",\"transactionId\":\"FT26077S31J1\",\"debit\":32.0,\"description\":\"  Personal Transfer\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T13:41:00\",\"stmtEntryId\":\"212625350649277.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":87.11,\"operationType\":\"Transfer between own accounts\",\"operationTypeId\":346},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":\"AccountWithdrawal\",\"transactionId\":\"FT2607739XNS\",\"debit\":19.37,\"description\":\"Payment - YOUNG SON CAFE 606.00 THB 17.03.2026\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-18T12:37:00\",\"stmtEntryId\":\"212627421245465.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":52.73,\"operationType\":\"Card payment\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT260752JX2N\",\"debit\":10.0,\"description\":\"Cross Border Fee\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-15T20:04:00\",\"stmtEntryId\":\"212592954572291.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":10.0,\"operationType\":\"Cross Border Fee\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":10.0,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT26075V8QVW\",\"debit\":null,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-15T19:23:00\",\"stmtEntryId\":\"212596944469810.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":10.0,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":null,\"transactionId\":\"FT26075F6WKM\",\"debit\":3.68,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-15T19:23:00\",\"stmtEntryId\":\"212596233269810.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":10.04,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT260732RQBY\",\"debit\":1.0,\"description\":\"Current account fee\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-14T20:06:00\",\"stmtEntryId\":\"212580560672418.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.0,\"operationType\":\"Current account fee\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":null,\"transactionId\":\"FT26073X09WG\",\"debit\":0.37,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-14T19:22:00\",\"stmtEntryId\":\"212585868469736.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.01,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":1.0,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT260731L2KG\",\"debit\":null,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-14T19:22:00\",\"stmtEntryId\":\"212585628269736.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.0,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT26069TQMPC\",\"debit\":1.0,\"description\":\"Current account fee\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-10T20:12:00\",\"stmtEntryId\":\"212548562172723.010001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.0,\"operationType\":\"Current account fee\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":null,\"currency\":\"USD\",\"transactionType\":null,\"transactionId\":\"FT2606992JX4\",\"debit\":0.37,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-10T19:23:00\",\"stmtEntryId\":\"212543877169834.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.02,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null},{\"accountNumber\":\"GE12CD0360000027070426\",\"credit\":1.0,\"currency\":\"GEL\",\"transactionType\":null,\"transactionId\":\"FT26069CB2F4\",\"debit\":null,\"description\":\"Automatic non-credit debt collection\",\"isCardBlock\":false,\"operationDateTime\":\"2026-03-10T19:23:00\",\"stmtEntryId\":\"212541736869834.000001\",\"canRepeat\":false,\"canReverse\":false,\"canTemplate\":false,\"amountEquivalent\":1.0,\"operationType\":\"Automatic non-credit debt collection\",\"operationTypeId\":null}]}}}"
//   },
//   "redirectURL": "",
//     "headersSize": 402,
//       "bodySize": 1335
// },
// "cache": { },
// "timings": {
//   "blocked": 0,
//     "dns": 0,
//       "connect": 0,
//         "ssl": 0,
//           "send": 0,
//             "wait": 479,
//               "receive": 0
// },
// "time": 479,
//   "_securityState": "secure",
//     "serverIPAddress": "2606:4700:10::6814:27a4",
//       "connection": "443",
//         "pageref": "page_1"
// },

export async function fetchBlockedTransactions (session: Session, fromDate: Date): Promise<CredoTransaction[]> {
  const chunkSize = 30
  let body: object
  let pageNumber = 1
  const blockedTransactions: CredoTransaction[] = []

  console.log('>> fetching blocked transactions')
  while (true) {
    body = {
      operationName: 'transactionPagingList',
      query: 'query transactionPagingList($data: TransactionFilterGType!) {transactionPagingList(data: $data) { pageCount totalItemCount itemList { credit currency transactionType transactionId debit description isCardBlock operationDateTime stmtEntryId canRepeat canReverse amountEquivalent operationType operationTypeId transactionTypeId transactionTypeName }} }',
      variables: {
        data: {
          onlyCanBeReversedOrRepeated: false,
          pageNumber,
          pageSize: chunkSize
        }
      }
    }
    const response = await fetchGraphQL(session, body)

    const transactionsResponse = response.body as TransactionListResponse
    const chunkTransactions = transactionsResponse.data.transactionPagingList.itemList

    assert(isArray(chunkTransactions), 'cant get blocked transactions array', response)

    for (const t of chunkTransactions) {
      if (t.isCardBlock) {
        blockedTransactions.push(t)
      }
    }
    const latestTransaction = chunkTransactions[chunkTransactions.length - 1]
    const operationDateTime = getOptString(latestTransaction, 'operationDateTime')
    if (operationDateTime === undefined) {
      console.log('>>> transaction without operationDateTime: ', latestTransaction)
      break
    }
    const latestTransactionDate = new Date(operationDateTime)
    if (latestTransactionDate < fromDate) {
      break
    }
    pageNumber++
  }
  return blockedTransactions
}

export async function fetchProductTransactions (accountId: string, session: Session, fromDate: Date): Promise<CredoTransaction[]> {
  const chunkSize = 30
  let body: object
  let pageNumber = 1
  let transactions: CredoTransaction[] = []

  while (true) {
    body = {
      operationName: 'transactionPagingList',
      query: 'query transactionPagingList($data: TransactionFilterGType!) {transactionPagingList(data: $data) { pageCount totalItemCount itemList { credit currency transactionType transactionId debit description isCardBlock operationDateTime stmtEntryId canRepeat canReverse amountEquivalent operationType operationTypeId transactionTypeId transactionTypeName }} }',
      variables: {
        data: {
          accountIdList: [
            Number(accountId)
          ],
          dateFrom: fromDate,
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
  const payload: AuthInitiatePayload = {
    username: login,
    password,
    channel: 508,
    deviceId: null,
    refreshToken: null,
    loggedInWith: '4',
    deviceName: 'Firefox',
    deviceOs: 'Linux',
    deviceOsVersion: 'unknown',
    deviceScreenSize: '1536X864',
    userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
    deviceType: 'desktop',
    deviceModel: 'Unknown',
    deviceLanguage: 'ENGLISH',
    languageType: 'ENGLISH'
  }
  const deviceId = ZenMoney.getData('deviceId', null) as string
  if (deviceId !== null) {
    payload.WebDevicePublicId = deviceId
  }
  console.log('deviceId is ', deviceId)
  console.log('>>> Starting authInitiate')
  const response = await fetchJson(IEBaseUrl + initiatePath, {
    method: 'POST',
    body: payload,
    sanitizeRequestLog: { body: { username: true, password: true } }
  })
  if (response.status !== 200) {
    throw new InvalidLoginOrPasswordError('Invalid username or password!')
  }
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
  const result = response.body as AuthOperationSendChallengeResponse
  return result
}

export async function getMyIp (): Promise<string> {
  const response = await fetchJson('https://api.ipify.org/?format=json')
  const responseBody = response.body as IpifyResponse
  return responseBody.ip
}

export async function initiateAddBindedDevice (session: Session, languageType: LanguageType): Promise<InitiateAddBindedDeviceResponse> {
  let deviceId = ZenMoney.getData('deviceId', null) as string
  if (deviceId === null) {
    deviceId = generateRandomString(16)
    ZenMoney.setData('deviceId', deviceId)
    ZenMoney.saveData()
  }
  const userIP = await getMyIp()

  if (deviceId === null) {
    throw new TemporaryError('Device ID does not exist. Delete and add Credo Bank connection again!')
  }
  const clientName = 'Mozilla Firefox'
  const body = {
    query: 'mutation ($data: AddBindedDeviceInput!) { initiateAddBindedDevice(data: $data) { operationId status requires2FA requiresAuthentification }}',
    variables: { data: { deviceId, languageType: languageType.toUpperCase(), name: clientName, userIP } }
  }

  console.log('>>> Initiating device binding')
  const response = await fetchGraphQL(session, body)

  if (response.status !== 200) {
    throw new TemporaryError('Device binding failed!')
  }
  const result = response.body as InitiateAddBindedDeviceResponse
  return result
}

export async function confirmDeviceBinding (session: Session, operationId: string, otp: string | null): Promise<BindDeviceConfirmResponse> {
  const body = {
    query: 'mutation ($operationId: String, $twoFactorHandle: String) { operationConfirm( operationId: $operationId twoFactorHandle: $twoFactorHandle authenticatedWith: NONE ) { operationId operationData status }}',
    variables: {
      authenticatedWith: 'NONE',
      operationId,
      twoFactorHandle: otp
    }
  }
  const response = await fetchGraphQL(session, body)
  const result = response.body as BindDeviceConfirmResponse

  if (response.status !== 200 || result.data?.operationConfirm?.status !== OperationStatus.approved) {
    throw new TemporaryError('Device binding failed!')
  }
  return result
}

export async function authConfirm (otp: string | null, operationId: string): Promise<AuthConfirmResponse> {
  const payload = { OperationId: operationId, TraceId: null, TwoFactorHandle: otp }
  console.log('>>> Starting 2FA confirmation')
  const response = await fetchJson(IEBaseUrl + confirmPath, {
    method: 'POST',
    body: payload,
    sanitizeResponseLog: { body: { data: { operationData: true } } }
  })
  if (response.status !== 200) {
    throw new TemporaryError('2FA challenge failed!')
  }
  const result = response.body as AuthConfirmResponse
  return result
}
