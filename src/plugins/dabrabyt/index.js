import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'
import { convertTransaction, convertAccounts } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  trustCertificates()
  toDate = toDate || new Date()
  const token = await login(preferences.login, preferences.password)
  const transactions = []
  const accounts = []
  const accountsData = convertAccounts(await fetchAccounts(token))
    .filter(account => account !== null)
    .filter(account => account.account !== null)
  await Promise.all(accountsData.map(async ({ product, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(token, product, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}

function trustCertificates () {
  if (typeof ZenMoney.trustCertificates === 'function') {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIHZjCCBk6gAwIBAgIMLgi1E8BWKPpAxGg/MA0GCSqGSIb3DQEBCwUAMFUxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSswKQYDVQQDEyJH
bG9iYWxTaWduIEdDQyBSNiBBbHBoYVNTTCBDQSAyMDIzMB4XDTI1MDMxOTA3MzIx
M1oXDTI2MDQyMDA3MzIxMlowHDEaMBgGA1UEAwwRKi5iYW5rZGFicmFieXQuYnkw
ggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQC49PJU/GKxTxPcip3ydfMw
5WZZ3uSDBW3/yXdZI+iogH6YbVnM7B/FZcXrUOCf+rRAEQi8mCBM+Ob9mkRTae6Q
Qz1YT72WLCmZCC4SzMO4voscmKUiMztsgEt7pU4FbMytdyxrHH+pl6i+mz/Pj8Jq
oDRss96FPo0ct2o+z4ViGyE+uAnyfhcVVXLB0a31oGddH5nMzPB8Ek2mmGVesEza
RbtiFPmWpxe/v4njUE63piXIhARK8i+xvUStPHQlBxN29GIfaS8PjdOqhyEC+eCh
dHn0Z19UwOotY14DG+KPt+lD2ZHQ2oTXPaj2ch4XCRI8tVW8IWBX7RohqmBjnaXO
ZZfiiWk7lAKUKh7w26N5MMzjQGx7mqMhsUFD1ETEYYeSBVJkKsNnHTk2uPGIGPkG
cHXus2u83P4r/i9fk4eu/Uh1LqarqtjCa/COgiCreEM8j6jOpo13hjAQfFrDSgm1
1xb+DVT746TUop1fPRKLktCB8mIGLYYAYx2fCmEFl6lxEBAjz5V0CAWgQuwIMULK
e5UtIrwmUTjG3z7cVTv7UQ61nsCgQBbEgscKYsQM8fSVj0swvk996lgHeS9r00Bj
CrbID2JRuMQY4xd9ZCSFEukbb+UI2miE5uaJpqnMmgF5P1lPhAC7YbIhIBG6BNLI
ij0gnsza04iEtxOHi1wvEQIDAQABo4IDbTCCA2kwDgYDVR0PAQH/BAQDAgWgMAwG
A1UdEwEB/wQCMAAwgZkGCCsGAQUFBwEBBIGMMIGJMEkGCCsGAQUFBzAChj1odHRw
Oi8vc2VjdXJlLmdsb2JhbHNpZ24uY29tL2NhY2VydC9nc2djY3I2YWxwaGFzc2xj
YTIwMjMuY3J0MDwGCCsGAQUFBzABhjBodHRwOi8vb2NzcC5nbG9iYWxzaWduLmNv
bS9nc2djY3I2YWxwaGFzc2xjYTIwMjMwVwYDVR0gBFAwTjAIBgZngQwBAgEwQgYK
KwYBBAGgMgoBAzA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWdu
LmNvbS9yZXBvc2l0b3J5LzBEBgNVHR8EPTA7MDmgN6A1hjNodHRwOi8vY3JsLmds
b2JhbHNpZ24uY29tL2dzZ2NjcjZhbHBoYXNzbGNhMjAyMy5jcmwwLQYDVR0RBCYw
JIIRKi5iYW5rZGFicmFieXQuYnmCD2JhbmtkYWJyYWJ5dC5ieTAdBgNVHSUEFjAU
BggrBgEFBQcDAQYIKwYBBQUHAwIwHwYDVR0jBBgwFoAUvQW384qTPHPLefoPhRKh
d5YYkXQwHQYDVR0OBBYEFOCerDfBlpKCQNbSqVQb1YtNpQE2MIIBfgYKKwYBBAHW
eQIEAgSCAW4EggFqAWgAdgBkEcRspBLsp4kcogIuALyrTygH1B41J6vq/tUDyX3N
8AAAAZWtUUGgAAAEAwBHMEUCIQDgM87g37Wt/nWXwUY9ptkQ+9LxyPUBDpoxtPqf
RQw78AIgScCwMGOFp3FInPFrsSNisL5hQrRmY5C+MuYpw8R9/usAdgAOV5S8866p
PjMbLJkHs/eQ35vCPXEyJd0hqSWsYcVOIQAAAZWtUUGKAAAEAwBHMEUCIQCYynNA
MxLIHLMVZeYFummtSa2YGec/1cXK7e4pg/FgVwIgGcbDBDIfVsGGq0f2jMXfBQL3
wvT8T0ueS50WWnBOQ78AdgBJnJtp3h187Pw23s2HZKa4W68Kh4AZ0VVS++nrKd34
wwAAAZWtUUG3AAAEAwBHMEUCIC18X18hhz9npDbcOsln2WU8qrWUlHa9CM5+3Y47
DVp3AiEA5zQwN/SwItBUw1lhkBKvSD8q0Abq09+ePGjj9FEVoKQwDQYJKoZIhvcN
AQELBQADggEBACoVI98Ko9aqbPSqPlmj9IKr66a3EhUQP99NwUwAi8Lz1sOcz/oo
/wZtgJx/EEitWODr/N+frA5xRRBysMjNemz3I+LtHCsewgvBfm7E+sWDyZBfrnKx
5YPhCMhvF6nrnV/tE65ECKFcy1Oj8Phl4JPLz8FD7vGj+rSIFElxeyyOZxapHD5Y
yBNikUsOCfk+wmT/nSVseRkbwcmxkY0c7jmDfErLcGUFnuky7XNuvc7UAcuADtYp
GE1xoUVILGmdAn3+0y3x/4jhaZU4F445L2ZdD6fG5EHh9g1QWrtk6nIsK5whzgF3
14O9Rkd2qjqDdhAolF+20Dtu/cqEy5h3eRg=
-----END CERTIFICATE-----`
    ])
  }
}
