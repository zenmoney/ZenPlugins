import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AccountOrCard, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Api } from './api'
import { convertAccounts, convertCards, convertTransactions } from './converters'

import { Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({
  preferences,
  fromDate,
  toDate,
  isInBackground,
  isFirstRun
}) => {
  toDate = toDate ?? new Date()

  trustCertificates()
  const api = new Api(preferences)
  await api.login(isInBackground)

  const apiCards = await api.fetchCards()
  const apiAccounts = await api.fetchAccounts()

  const allTransactions: Transaction[] = []
  const allAccounts: AccountOrCard[] = []

  await Promise.all([...convertCards(apiCards), ...convertAccounts(apiAccounts)].map(async ({ product, account }) => {
    if (ZenMoney.isAccountSkipped(product.id.toString())) {
      return
    }

    allAccounts.push(account)

    const apiTransactions = await api.fetchTransactions(product.id, fromDate, toDate ?? new Date())
    const transactions = convertTransactions(apiTransactions)
    if (transactions.length > 0) {
      allTransactions.push(...transactions)
    }
  }))

  return {
    accounts: allAccounts,
    transactions: adjustTransactions({ transactions: allTransactions })
  }
}

function trustCertificates (): void {
  if (typeof ZenMoney.trustCertificates === 'function') {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIGvzCCBaegAwIBAgIMSigSthNqU8SkZrbgMA0GCSqGSIb3DQEBCwUAMFAxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMSYwJAYDVQQDEx1H
bG9iYWxTaWduIFJTQSBPViBTU0wgQ0EgMjAxODAeFw0yNTAzMjQxMjI3MDJaFw0y
NjA0MjUxMjI3MDFaMIGJMQswCQYDVQQGEwJCWTEOMAwGA1UECBMFTWluc2sxDjAM
BgNVBAcTBU1pbnNrMUIwQAYDVQQKEzlDbG9zZWQgam9pbnQtc3RvY2sgY29tcGFu
eSBCZWxhcnVzaWFuLVN3aXNzIEJhbmsgQlNCIEJhbmsxFjAUBgNVBAMTDW1vYmls
ZS5ic2IuYnkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCoTDPFuO08
QiGKnlgsvo94R8i+rUdoyfLylX41dpd9FvRq4V4SJVzINJoy8W8YXaRRN34WblVz
NHkSDWlZC6IZZ/ue4DWBVK28jY8fsp256ltzxZEBVs/abgipmrxDA14Ju8TOXFSx
bsD02qI2Tz4ffP7a0P0dXBDzTDA9M1IScVouvcVwV/KsT18ZbxvXg9SdWzGBzoFc
frN6k5plO0hbZXuPeo8yxyshyv/WEzRNpxW+kmRahH8d309+OybAC766Y2R2RwvD
hZrWO5M+Sc77lZNrn8VQKoGBLxLRfkhv5tPNi5lcn9o38UJc0Dad8nlhXxB0yNKp
zR24CvlCA9rTAgMBAAGjggNdMIIDWTAOBgNVHQ8BAf8EBAMCBaAwDAYDVR0TAQH/
BAIwADCBjgYIKwYBBQUHAQEEgYEwfzBEBggrBgEFBQcwAoY4aHR0cDovL3NlY3Vy
ZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvZ3Nyc2FvdnNzbGNhMjAxOC5jcnQwNwYI
KwYBBQUHMAGGK2h0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2dzcnNhb3Zzc2xj
YTIwMTgwVgYDVR0gBE8wTTBBBgkrBgEEAaAyARQwNDAyBggrBgEFBQcCARYmaHR0
cHM6Ly93d3cuZ2xvYmFsc2lnbi5jb20vcmVwb3NpdG9yeS8wCAYGZ4EMAQICMG4G
A1UdEQRnMGWCDW1vYmlsZS5ic2IuYnmCEW93YS5tb2JpbGUuYnNiLmJ5ghJtYWls
Lm1vYmlsZS5ic2IuYnmCGmF1dG9kaXNjb3Zlci5tb2JpbGUuYnNiLmJ5ghF3d3cu
bW9iaWxlLmJzYi5ieTAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwHwYD
VR0jBBgwFoAU+O9/8s14Z6jeb48kjYjxhwMCs+swHQYDVR0OBBYEFIzPCZ89ZIgd
2G8RH4G9rqbriDxkMIIBfwYKKwYBBAHWeQIEAgSCAW8EggFrAWkAdQBkEcRspBLs
p4kcogIuALyrTygH1B41J6vq/tUDyX3N8AAAAZXIHwaJAAAEAwBGMEQCICOx3egH
b7PaLSqlOKFq1F76Ts5fY5A+uSxDhJCcA3YTAiAyAH6+Bx8BGYPX+JNtl70HnK9w
WQreS50vofbU3FP7rwB3AA5XlLzzrqk+MxssmQez95Dfm8I9cTIl3SGpJaxhxU4h
AAABlcgfB8wAAAQDAEgwRgIhAJyeE0HqxDfDrNNrYXUz4ONo96+mgi/GHE8GdYu4
EuXiAiEAhaDvnhGMSqyeuw7Nz1K19L0/e1woOaFiaroWIAP2OaUAdwAlL5TCKynp
bp9BGnIHK2lcW1L/l6kNJUC7/NxR7E3uCwAAAZXIHwgWAAAEAwBIMEYCIQCQlQMK
jC0Z394XIn7ImfSl0l80mfJQ9pqwVFMCM1cSwgIhAO9eubtSP6yrVgv0tuSLm0j/
Dy1xSCxjAPGv7dZrO/vyMA0GCSqGSIb3DQEBCwUAA4IBAQBIK4Tq1YryRM9R3+hb
6dcxMSFi7p//31tV5RWI/ZFhuN0RhlX1bvcyVZsxAeL/AjlLNtyS2/4IA95/aEKQ
n7xwF6Td+MpuaK4VwWpTABAKA+L2JYSU013J8z9/lilGZ1SeKYpOf+SOJdS8wR9K
PRhVFxwU/YVPOe5y38CHwaWDy9sa+93bAW0JXrNMTbQEnoBeU9NwsvQSXeYg4K9F
bnSqfh4H5LZO/yXxh3eyl/qexx9z5uhyWkVAnEBVo4+xbifsX1D9bUSTls411qlm
r4U6mYHcb7vMpk4VOZCMCEoTFXlWEaKb9VrhvPeH0bGaebVPXBpd5QDTGwhxoFmL
xzaJ
-----END CERTIFICATE-----`
    ])
  }
}
