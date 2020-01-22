import { convertAccount, convertTransaction } from './converters'

const accountData = {
  'cardNumber': '4469 **** **** 9999',
  'monthExp': 5,
  'yearExp': 2021,
  'cardStatus': 'Активирована',
  'clientId': 707777,
  'amount': 66666.66,
  'limit': 136000,
  'balance': 0
}
describe('convertAccount', () => {
  it('should convert credit card account', () => {
    const account = convertAccount(accountData)

    expect(account).toEqual({
      id: 'CLIENT_ID_707777',
      type: 'ccard',
      title: 'Совесть',
      instrument: 'RUB',
      balance: -69333.34,
      creditLimit: 136000,
      syncID: [
        '9999'
      ]
    })
  })
})

describe('convertTransaction', () => {
  it('should convert regular transaction', () => {
    const account = convertAccount(accountData)
    const transaction = convertTransaction({
      'txnId': 53123456,
      'txnDate': '2019-12-21T12:17:53+03:00',
      'txnStatus': 1,
      'txnType': 2,
      'txnErrorId': -1,
      'txnAmount': 369,
      'installmentsAmount': 0,
      'ownAmount': 369,
      'installmentsMonths': 0,
      'partnersName': 'Ozon',
      'tradePointName': 'ООО «Интернет Решения»',
      'txnAcctBal': 66666.66,
      'txnDebt': 64444.44
    }, [account])

    expect(transaction).toEqual({
      id: 53123456,
      hold: false,
      date: new Date('2019-12-21T12:17:53+03:00'),
      payee: 'Ozon',
      comment: '',
      income: 0,
      incomeAccount: 'CLIENT_ID_707777',
      outcome: 369,
      outcomeAccount: 'CLIENT_ID_707777'
    })
  })
})
