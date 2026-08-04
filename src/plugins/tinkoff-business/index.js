import _ from 'lodash'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertToZenMoneyTransactions, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  ZenMoney.trustCertificates([
    // Expires: Sep 30 14:21:05 2026 GMT
    // Covers: id.tinkoff.ru and business.tinkoff.ru
    `-----BEGIN CERTIFICATE-----
MIIIHDCCBgSgAwIBAgIQQkkEkEBKQPmNaR38ssK1OTANBgkqhkiG9w0BAQsFADBv
MQswCQYDVQQGEwJSVTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwg
RGV2ZWxvcG1lbnQgYW5kIENvbW11bmljYXRpb25zMR8wHQYDVQQDDBZSdXNzaWFu
IFRydXN0ZWQgU3ViIENBMB4XDTI1MDkzMDE0MjEwNVoXDTI2MDkzMDE0MjEwNVow
gZMxFTATBgNVBAMMDCoudGlua29mZi5ydTELMAkGA1UEBhMCUlUxDzANBgNVBAcM
Bk1vc2NvdzEbMBkGA1UECAwSNzcg0LMu0JzQvtGB0LrQstCwMQ4wDAYDVQQKDAVU
QmFuazEYMBYGBSqFA2QBDA0xMDI3NzM5NjQyMjgxMRUwEwYFKoUDZAQMCjc3MTAx
NDA2NzkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCowQOGbTG2qhVs
/OfPXmFgfL9mVfT6Ibb5d1ihK1aiP+QcZmkXdK5QmGW1P3OXkB9DUoqgwdbQfXBq
1nhozKX0v3hv7x7Lp7FrjhSrpwL5JCbaP6a9r1Oc6zvBO0hZCSAcCTAlkl2GNoCq
0ICBRVba4wq7yEs7cZLSK5qPsyuXfLysbspdQkYEMc0AsKw4YBnYg5Xq/UGL+Hq6
eWAdQJ7kjOFSFBotlT/P+UgzxzR2Z4Aqt9JmKhqzmyySmCxVpx3kttsVpAumFINT
0bt79f6x8NbdEGWzcyTqc6b6CBXRa1RXm9Z3lArnbDUyDpb08RLOv+TVW4o5MbHb
G3zqKvptAgMBAAGjggONMIIDiTAdBgNVHQ4EFgQU3gPw8gifr2fUsSVllwihXDxP
uBYwHwYDVR0jBBgwFoAUdz3ZOa9Cvdxbynbq7v3OPmEpMF8wDAYDVR0TAQH/BAIw
ADAjBgNVHREEHDAaggwqLnRpbmtvZmYucnWCCnRpbmtvZmYucnUwDgYDVR0PAQH/
BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjCBiwYDVR0fBIGD
MIGAMDygOqA4hjZodHRwOi8vbnVjLWNkcC52b3NraG9kLnJ1L2NkcC9zdWJjYV9z
c2xfcnNhMjAyNF9vdi5jcmwwQKA+oDyGOmh0dHA6Ly9udWMtY2RwLmRpZ2l0YWwu
Z292LnJ1L2NkcC9zdWJjYV9zc2xfcnNhMjAyNF9vdi5jcmwwgb4GCCsGAQUFBwEB
BIGxMIGuMD8GCCsGAQUFBzAChjNodHRwOi8vbnVjLWNkcC52b3NraG9kLnJ1L2Nk
cC9zdWJjYV9zc2xfcnNhMjAyNC5jcnQwQwYIKwYBBQUHMAKGN2h0dHA6Ly9udWMt
Y2RwLmRpZ2l0YWwuZ292LnJ1L2NkcC9zdWJjYV9zc2xfcnNhMjAyNC5jcnQwJgYI
KwYBBQUHMAGGGmh0dHA6Ly9udWMtb2NzcC52b3NraG9kLnJ1MBMGA1UdIAQMMAow
CAYGZ4EMAQICMIIBfwYKKwYBBAHWeQIEAgSCAW8EggFrAWkAdgB42RK+QgrAAhy6
XaJUMpFT20jLBiv8QwEkHhCrxxaeZwAAAZma/7NXAAAEAwBHMEUCIQD9vLF0ja1j
+sjrLASPPki2EI0+ZdSE2kZh8Vq+hlozDwIgQtH/nOEizuK3e3swIqv1BPsbrKXr
HYnH84r0+z7fCuIAdwBWHsdE3xr3AuYmg63fxJXPdaMbDGzooMfqAQMwkLdIhQAA
AZma/7NhAAAEAwBIMEYCIQDfFbh37LN0Aig8Gjeqlya88HVR8yp+tt30NXxgkyn2
qgIhAPjCFbU6jtGZTxR5DrUYWj3jRAxh2+3JO2y/tPrlmo6BAHYAybgRvMAcYl3K
J/TWxEfLX34Ov3LLWZGoMy+Zv5oqPkoAAAGZmv+zUgAABAMARzBFAiEAkC76/Ss/
DliYwsUhzzx6lFiHvaVglYn8vPek5/lj4IgCIH1AV4GQldxeZ7WFugvkKoVjvCNB
yXxmn17fWCoAdDE5MA0GCSqGSIb3DQEBCwUAA4ICAQCslAzvnSFuhJo15kMGzOEE
PsKYV6yTILqEgJYmugZL5CR9jm58wLFSrpvtUn34pjgvjzawelakC032uLnyRM+T
R8/pyRV72042bqSMS5YwCv6yEVyTsTKnQ4KVNo3bS8eJjK85nrsLEn+rJGT1b9X8
3EQN/E0QxkaDBAPcS9O+KiBQ2mayGXl0X+RtesD7W4f0CwoH+UUXzySNqRybOBH0
6+sheguEqKBFODGB3IlDWBqWYIQmjV+2wR3M+Mm9495as3s3qprs2yXBaMVqiIrQ
3w1D4TRdwHJUjuvKoskhaEYuHprUo4w4+jioyGX3Hz0031SKi1WIDGc0QTFgTNdP
97BgRqLYut9tYuRX1DqamiDdDDbS39QdDyp58nUcXHgowUcYcxufBP02Xigr86Wi
dJ2Otl8xtQ1px9eN1cmlOPHDRQDZlbKJupByp2BAEs1SiGeIWno4pbrmB+fv78w6
yVF5x9cFpF0HLDHVdT3GS+XGd467fywXjvAQZYRoIN3oIKUnNEY9lQqHtRPj8Dtk
ZmMcG13ZT9vfLpq2y735Aa9i26tD2GQKflv//BqEp8+W5xnnehzGACKaU71DOcD/
YRUX4TlAUhPW1vo6ke28XwGRz/ie1yYL/s8w16K60EUsSA0wxWJRAfqH02/AsHcK
gm/b+zPfsJ1ZStNElkv4+w==
-----END CERTIFICATE-----`
  ])
  if (!toDate) {
    toDate = new Date()
  }
  preferences.inn = preferences.inn.toString().replace(/[^\d]/g, '')
  preferences.kpp = preferences.kpp?.toString().replace(/[^\d]/g, '') || '0'

  const accountsById = {}
  const accounts = []
  const transactionData = []

  let i = 0
  let auth = ZenMoney.getData('auth')
  let apiAccounts = null
  const isFirstRun = !auth
  do {
    auth = await login(auth, preferences, isInBackground)
    try {
      apiAccounts = await fetchAccounts(auth, preferences)
    } catch (e) {
      if (e instanceof AuthError) {
        if (!isFirstRun && i === 0) {
          auth.expirationDateMs = 0
        } else if (!isFirstRun && i === 1) {
          auth = undefined
        } else {
          throw new TemporaryError('Недостаточно прав для просмотра счетов и операций. Попробуйте подключить синхронизацию заново.')
        }
      } else {
        throw e
      }
    }
    i++
  } while (!apiAccounts)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  for (const apiAccount of apiAccounts) {
    const account = convertAccount(apiAccount)
    if (account) {
      accounts.push(account)
      accountsById[account.id] = account
    }
  }

  await Promise.all(accounts.map(async account => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    for (const apiTransaction of (await fetchTransactions(auth, preferences, account, fromDate, toDate))) {
      const data = convertTransaction(apiTransaction, account, accountsById)
      if (data) {
        transactionData.push(data)
      }
    }
  }))

  return {
    accounts,
    transactions: _.sortBy(convertToZenMoneyTransactions(transactionData), transaction => transaction.date)
  }
}
