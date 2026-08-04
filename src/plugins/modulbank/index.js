import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AuthError, fetchAccounts, fetchTransactions, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ fromDate }) {
  ZenMoney.trustCertificates([
    // Expires: Feb 6 18:02:01 2027 GMT
    // Covers: api.modulbank.ru
    `-----BEGIN CERTIFICATE-----
MIIG3zCCBMegAwIBAgIQMrRrkLgVfELDxjnt8LnaFDANBgkqhkiG9w0BAQsFADBi
MQswCQYDVQQGEwJHUjE3MDUGA1UECgwuSGVsbGVuaWMgQWNhZGVtaWMgYW5kIFJl
c2VhcmNoIEluc3RpdHV0aW9ucyBDQTEaMBgGA1UEAwwRSEFSSUNBIERWIFRMUyBS
U0EwHhcNMjYwNzIyMTgwMjAyWhcNMjcwMjA2MTgwMjAxWjAZMRcwFQYDVQQDDA4q
Lm1vZHVsYmFuay5ydTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJXI
kLQ3n03VWgUGPw2rrdU6A54EJKNtU4+nl1PXc+heNQsD/FW/NTegKd67IwcyR3o7
qbt+cnMZRdyfYAhfx4jQvvoXMMv+nt/9MFrOcK/U/wAKLDybDa+90Axe0hJNopRm
l/YcWHGK5jpqvFR+CLNX+nV8d3b9PYUJGr8iprrJg033jtYd7Lw5vW27Y60desYN
JYcvCkzTVPuMCYb+K3iurYtC+Jf3A05AuBn3fk+7/+UgAOc+ab8pKYeD4IawrWeM
oMEdcRMttY5G6AvyT+t+IfZmnH8BMJrOixArhlf+UMwcXFAEZ/NMXqd/Mj2sHigF
nkdUV71m98KgX2kNGGUCAwEAAaOCAtgwggLUMB8GA1UdIwQYMBaAFAqIq7yL8PVK
7GFEUEBEwYdm3t5RMEkGCCsGAQUFBwEBBD0wOzA5BggrBgEFBQcwAoYtaHR0cDov
L2NydC5oYXJpY2EuZ3IvSEFSSUNBLURWLVRMUy1TdWItUjEuY2VyMCcGA1UdEQQg
MB6CDioubW9kdWxiYW5rLnJ1ggxtb2R1bGJhbmsucnUwLQYDVR0gBCYwJDAIBgZn
gQwBAgEwCAYGBACPegEGMA4GDCsGAQQBgc8RAQEBATAdBgNVHSUEFjAUBggrBgEF
BQcDAgYIKwYBBQUHAwEwPgYDVR0fBDcwNTAzoDGgL4YtaHR0cDovL2NybC5oYXJp
Y2EuZ3IvSEFSSUNBLURWLVRMUy1TdWItUjEuY3JsMB0GA1UdDgQWBBQqGn1wayGB
0+SYSnpi3CcFXUjvGTAOBgNVHQ8BAf8EBAMCBaAwggF+BgorBgEEAdZ5AgQCBIIB
bgSCAWoBaAB2AGBMmq96f3dfAdQG/JINyJnrCxx9+MlSG/r6F3c7l4vJAAABn4sH
JakAAAQDAEcwRQIhAIoTwqvP/R1O8dVnbr2nDWuH2ut2VLbvJEFKqztung3wAiAL
AGvIPVZdLkbjaJq70pQMpYTFbjxPXU8UV30NW/Q7WwB3AEaiOWfGDbZGh8ZvPfmZ
lHaTpqYRIIRX1VXn49Ch2bZGAAABn4sHJcoAAAQDAEgwRgIhAP4g/4sz4H33Ojh9
UIsXFOeDbGu6M2DphD6bemt8r/8MAiEAw6lCcjfIMSubwbdm5ru3SBZ7lC4xFqt6
awhQ+Q1ZKFMAdQBEwr0M6RQOZKXJSgGTClqhuzWXDgDuERaJaCocRNe1ZgAAAZ+L
ByWiAAAEAwBGMEQCIGz/QUC9EwtA6pnaQAjhICZoULH3Q8a94vvPc8NzL3LGAiAt
Mj7FWcxNEWtz0tpDGVd8wiAGdX74LwnpMTggn1+SrjANBgkqhkiG9w0BAQsFAAOC
AgEAJl+uexovyRGa8JAxbJJxsBpKiqjcqTKWwjUHP6cIjtALNOeEqBs9b1X/lkTg
X85LekuTyHRGblyiXtxISvMM+mY2v284mjLm9nqqSkT4fFTojk8fZ6SaGdAIVc8+
qn5ZhVS5pxweqJ9bX4DpWNaXYboOs/TwV9shQDC2jUrL2XjXJyKML4Ag5xcYiuj2
X3l4PxiY2Ickny92m4qBHTZyb1Zn5LaagPf9R2lKSuQ883TbRBXOfcDyeAfGPGNG
W+hk2OVvfu++OPBQ4qnESE1FlGR6JbZacR4l097TOKdJsDYdFmTbSuAd0i/u7/cN
SpURPCKNzTyxrfsVWZwDyPiK5Uap374XljRwvGwyYOVnxacplKL2aoqAlokgcxfv
xJWgHL5M1uY7GBfw0rgMe10Gh/inTpc5PAboWAKmwtRmag3O/VnEM/lgOVEDNu74
CqGqnt8LXwsVHVDqPSWUTOwB+1WOPDAARzNUBv7bSyI9EcRmkZ6Fm+ZHY/KV5xGp
eNXChJogakaGvkH3EhPwMiWmjG3+oT33tjHbsoHu9/s5KI5spghV3QSIejzvXx7D
i4UCFscR52lgOUwOrbJDaoGkgczGqSwwV1qLwUTOJa9Fo4MuE/8qeP98srKDy/+7
D7WOUkrwZPQzVDjJW4U6qIaC6BuvPyqH5dlMf4F5obD2mYY=
-----END CERTIFICATE-----`
  ])

  let token = ZenMoney.getData('accessToken')
  let apiAccounts = null
  if (token) {
    try {
      apiAccounts = await fetchAccounts(token)
    } catch (e) {
      if (e instanceof AuthError) {
        token = null
      } else {
        throw e
      }
    }
  }
  if (!token) {
    token = await login()
    ZenMoney.setData('accessToken', token)
    ZenMoney.saveData()
  }

  const accounts = []
  const transactions = []
  await Promise.all((apiAccounts || await fetchAccounts(token)).map(async apiAccount => {
    const account = convertAccount(apiAccount)
    if (account) {
      accounts.push(account)
      if (!ZenMoney.isAccountSkipped(account.id)) {
        const apiTransactions = await fetchTransactions(token, account, fromDate)
        for (const apiTransaction of apiTransactions) {
          const transaction = convertTransaction(apiTransaction, account)
          if (transaction) {
            transactions.push(transaction)
          }
        }
      }
    }
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
