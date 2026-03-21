import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AuthError, fetchAccounts, fetchTransactions, generateDevice, login, updateToken } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  trustCertificates()
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }
  let auth = await login(preferences, device)
  if (auth.device.udid !== ZenMoney.getData('device').udid) {
    ZenMoney.setData('device', auth.device)
    ZenMoney.saveData()
  }
  let apiAccounts
  try {
    apiAccounts = await fetchAccounts(auth)
  } catch (error) {
    if (error instanceof AuthError) {
      auth = await updateToken(auth)
      apiAccounts = await fetchAccounts(auth)
    } else {
      throw error
    }
  }
  const accountsData = convertAccounts(apiAccounts)
  let apiTransactions
  try {
    apiTransactions = await fetchTransactions(auth, accountsData.products, fromDate, toDate)
  } catch (error) {
    if (error instanceof AuthError) {
      auth = await updateToken(auth)
      apiTransactions = await fetchTransactions(auth, accountsData.products, fromDate, toDate)
    } else {
      throw error
    }
  }

  const transactions = convertTransactions(apiTransactions, accountsData.accountsByContractNumber)
  const accounts = accountsData.accounts

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}

function trustCertificates () {
  if (typeof ZenMoney.trustCertificates === 'function') {
    ZenMoney.trustCertificates([
      `-----BEGIN CERTIFICATE-----
MIIFADCCA+igAwIBAgISBTFdRLHSC0iH/cHbIeBafZ1AMA0GCSqGSIb3DQEBCwUA
MDMxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQwwCgYDVQQD
EwNSMTIwHhcNMjUxMTA0MTA1ODE5WhcNMjYwMjAyMTA1ODE4WjAcMRowGAYDVQQD
DBEqLmJwcy1zYmVyYmFuay5ieTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAKfy5tfuEKCjtNEGFwcMhZQLlg7HYrG6bw7wRkGHTMgAarJA8Hy/WXcgyJaZ
OwcNjR7vm5DS2SAnDnBWIPM7l/JlgRb1Fsa6lR0iacTSC9fBaK9G2DCr6AakRuEb
Nv29Oq1gqcObrRiFjQVkpo2agp61EZ+p4F3tsm/ILIyTtS+vAYY1ucjRABFqOLrE
RGmAfKa6p7PSYX2R0RYFIFT79+EIaZTpyhZ97C19c47pZFhGpTHrGO0hbsvkQH+X
pXtmmeoUNzWBTBSLCIhBE9dxeyxzjaRldb+IvZ3plfZm5DTIC4BTjQhW3C5Ydt2Y
43l1NZvjq0o1+j0PV8au9b1/zxkCAwEAAaOCAiMwggIfMA4GA1UdDwEB/wQEAwIF
oDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAd
BgNVHQ4EFgQUIi/D6EM0RELiRv/O+FEn0caFHPMwHwYDVR0jBBgwFoAUALUp8i2O
bzHom0yteD763OkM0dIwMwYIKwYBBQUHAQEEJzAlMCMGCCsGAQUFBzAChhdodHRw
Oi8vcjEyLmkubGVuY3Iub3JnLzAcBgNVHREEFTATghEqLmJwcy1zYmVyYmFuay5i
eTATBgNVHSAEDDAKMAgGBmeBDAECATAuBgNVHR8EJzAlMCOgIaAfhh1odHRwOi8v
cjEyLmMubGVuY3Iub3JnLzY1LmNybDCCAQYGCisGAQQB1nkCBAIEgfcEgfQA8gB3
AA5XlLzzrqk+MxssmQez95Dfm8I9cTIl3SGpJaxhxU4hAAABmk66FkAAAAQDAEgw
RgIhAOWHs+Fqovp4YY5OaSI1k2RCilb98gIZbx/oguQTsDQKAiEAguq86mnX9P/o
P/NAVwK8xQ/vnAKMyAM5QpC4MCnLD40AdwBJnJtp3h187Pw23s2HZKa4W68Kh4AZ
0VVS++nrKd34wwAAAZpOuh4YAAAEAwBIMEYCIQDxUl7UoFecE2ejPlO8tyCQb5IP
LiTzB/gL7fUshe3JxQIhAOQeBP+sMO2uSq42SulmkhVZAwZkJeGqNJ/LW3MSQtxu
MA0GCSqGSIb3DQEBCwUAA4IBAQBQ3nTvHNHSUN2MgNSAxHKcRZqygEkJAG269H6T
WO1i4a0f0D8sF9BK0KeQKOGQaLka65sekbBjDk+HU3vNxXhHzFZ6FCzrbwtkkiMM
kNrX/HC/1TingKet7dYM+I9Ar2oAwmVkJvHg+dopY7T0Mse5SmXafrRMblrVUbq8
61GaGDseEPLxyKfTwKorj1GpkPhheBSRuj4TN+7v2S+8bOwsYk+PTUGKjCYTg7R6
E2AsciKjhzZ78t/BMLIzwECmoe1HSDUdFBYh9F88EOYtsRbpPWA/TmhNXZBYMxLD
zTJ2U1A+QJ7Gsa0I51rKd4iA294bcR9GeBHaqMrKpcH01ZB8
-----END CERTIFICATE-----`
    ])
  }
}
