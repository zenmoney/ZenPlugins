import fetchMock from 'fetch-mock'
import { scrape } from '..'

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    mockIdentity()
    mockCheckPassword()
    mockUserRole()
    mockLoadUser()
    mockLoadOperationStatements()

    const result = await scrape(
      {
        preferences: { phone: '123456789', password: 'pass' },
        fromDate: new Date('2018-12-27T00:00:00.000+03:00'),
        toDate: new Date('2019-01-02T00:00:00.000+03:00')
      }
    )

    expect(result.accounts).toEqual([{
      'balance': 999.9,
      'creditLimit': 0,
      'id': '1111111',
      'instrument': 'BYN',
      'productType': 'PC',
      'syncID': ['BY36MTBK10110001000001111000', 'BY36MTBK10110001000001111000M', '1111'],
      'title': 'PayOkay',
      'type': 'card'
    }])

    expect(result.transactions).toEqual([{
      hold: false,
      date: new Date('2018-12-28T00:00:00+03:00'),
      movements: [{
        id: '1111111',
        account: { id: '1111111' },
        sum: -12.39,
        fee: 0,
        invoice: {
          sum: -5,
          instrument: 'EUR'
        }
      }],
      merchant: {
        fullTitle: 'PAYPAL',
        location: null,
        mcc: null
      },
      comment: null
    }, {
      hold: false,
      date: new Date('2018-12-29T01:07:39+03:00'),
      movements: [{
        id: '1111112',
        account: { id: '1111111' },
        sum: -29.68,
        fee: 0,
        invoice: null
      }],
      merchant: {
        fullTitle: 'Магазин',
        location: null,
        mcc: null
      },
      comment: null
    }])
  })
})

function mockLoadOperationStatements () {
  fetchMock.once('https://mybank.by/api/v1/product/loadOperationStatements', {
    status: 200,
    body: JSON.stringify({
      'ResponseType': 'ResponseOfListOfTransactionStatement',
      'error': null,
      'sessionId': null,
      'success': true,
      'validateErrors': null,
      'data': [
        {
          'accountCurr': 'BYN',
          'accountId': 'BY36MTBK10110001000001111000',
          'avlBalance': '791.3',
          'client': 'Иванов Иван Иванович',
          'dateFrom': '2018-12-27',
          'dateTo': '2019-03-25',
          'incomingBalance': '999.9',
          'numDateContract': '11111111 от 1111.11.11',
          'operations': [
            {
              'amount': '5.0',
              'balance': '111.1',
              'cardPan': '111111******1111',
              'curr': 'EUR',
              'debitFlag': '0',
              'description': 'Оплата товаров и услуг',
              'error': '',
              'operationDate': '2019-01-02',
              'orderStatus': '1',
              'place': 'PAYPAL',
              'status': 'T',
              'transAmount': '12.39',
              'transDate': '2018-12-28 00:00:00',
              'transactionId': '1111111'
            }, {
              'amount': '29.68',
              'balance': '531.57',
              'cardPan': '111111******1111',
              'curr': 'BYN',
              'debitFlag': '0',
              'description': 'Оплата товаров и услуг',
              'error': '',
              'operationDate': '2019-01-02',
              'orderStatus': '1',
              'place': 'Магазин',
              'status': 'T',
              'transAmount': '29.68',
              'transDate': '2018-12-29 01:07:39',
              'transactionId': '1111112'
            }
          ],
          'outgoingBalance': '999.9',
          'receivedAmount': '999.9',
          'time': '2019-03-25 17:30:49',
          'writtenOffAmount': '999.9'
        }
      ]
    }),
    statusText: 'OK',
    headers: { 'set-cookie': 'session-cookie' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockLoadUser () {
  fetchMock.once('https://mybank.by/api/v1/user/loadUser', {
    status: 200,
    body: JSON.stringify({
      'ResponseType': 'ResponseOfUserResponse',
      'error': null,
      'sessionId': '1111111111111',
      'success': true,
      'validateErrors': null,
      'data': {
        'addInfo': [],
        'products': [{
          'productType': 'PC',
          'accountId': '1111111',
          'id': 1,
          'productCode': '1111111|PC',
          'show': true,
          'variationId': '[MASTERCARD][MCW INSTANT BYR 3Y (PAYOKAY)]',
          'accruedInterest': null,
          'avlBalance': '999.9',
          'avlLimit': null,
          'cardAccounts': [{
            'accType': null,
            'accountId': 'BY36MTBK10110001000001111000',
            'accountIdenType': 'PC',
            'availableBalance': null,
            'contractCode': '1111111',
            'currencyCode': 'BYN',
            'productType': 'PC'
          }],
          'cardContract': [{
            'productType': 'MTBANK_CARD',
            'closeDate': '2020-01-31',
            'contractNum': '11111111',
            'openDate': '2018-01-31',
            'cardTerm': '11/11',
            'rateBal': '0.0001',
            'servicePaySum': null,
            'servicePayTerm': null,
            'smsNotification': '1',
            'tariffPlan': 'PayOkay'
          }],
          'cards': [{
            'blockReason': null,
            'cardCurr': 'BYN',
            'commisDate': '2011-01-31',
            'commisSum': '1.1',
            'description': 'MASTERCARD',
            'embossedName': 'ANDREI IOKSHA',
            'isOfAccntHolder': '1',
            'limits': [{
              'casheWithdrawalLimit24': 100,
              'casheWithdrawalLimit24Broad': 10,
              'casheWithdrawalLimitWeek': 100,
              'casheWithdrawalLimitWeekBroad': 10,
              'casheWithdrawalSumLimit24': '1100',
              'casheWithdrawalSumLimit24Broad': '100',
              'casheWithdrawalSumLimitWeek': '1500',
              'casheWithdrawalSumLimitWeekBroad': '1100',
              'cashelessWithdrawalLimit24': 110,
              'cashelessWithdrawalLimit24Broad': 11,
              'cashelessWithdrawalLimitWeek': 100,
              'cashelessWithdrawalLimitWeekBroad': 10,
              'cashelessWithdrawalSumLimit24': '1100',
              'cashelessWithdrawalSumLimit24Broad': '1100',
              'cashelessWithdrawalSumLimitWeek': '1100',
              'cashelessWithdrawalSumLimitWeekBroad': '1100'
            }],
            'mainCard': '1',
            'over': '0',
            'pan': '111111_1111',
            'smsNotification': '1',
            'status': 'A',
            'term': '11/11',
            'type': 'MASTERCARD',
            'vpan': '1111111111111111',
            'rbs': '1111111',
            'pinPhoneNumber': '111111111111'
          }],
          'debtPayment': null,
          'debtPaymentSumCom': null,
          'description': 'PayOkay',
          'gracePeriodAvalDays': null,
          'gracePeriodEnd': null,
          'gracePeriodLength': null,
          'gracePeriodOutRateCashless': null,
          'gracePeriodRateCashless': null,
          'gracePeriodStart': null,
          'isActive': true,
          'isOverdraft': false,
          'loanContractDate': null,
          'loanContractNumber': null,
          'loanNextPaymentAmmount': null,
          'loanNextPaymentDate': null,
          'minPaymentFee': null,
          'minPaymentMainDept': null,
          'minPaymentOverFee': null,
          'minPaymentOverMainDept': null,
          'minPaymentOverPer': null,
          'minPaymentPenalty': null,
          'minPaymentPer': null,
          'minPaymentStandardOper': null,
          'minPaymentStandardOperPer': null,
          'minPaymentStateDue': null,
          'minPaymentUBS': null,
          'over': null,
          'overStandardOperationRate': null,
          'overdueDebts': null,
          'ownFunds': null,
          'points': '',
          'pointsDate': null,
          'productIdenType': null,
          'rate': '0.0001',
          'rateAvalInstalment': null,
          'rateAvalInstalmentHistory': [],
          'rateCache': null,
          'rateCacheHistory': [],
          'rateCacheless': null,
          'rateCachelessHistory': [],
          'rateChangingHistory': [],
          'rateExpirPayment': null,
          'rateExpirPaymentHistory': [],
          'standardOperationRate': null
        }],
        'userEripId': null,
        'userInfo': {
          'crmId': '1111111111',
          'email': '',
          'firstName': 'Иван',
          'isCustomLogin': false,
          'lastName': 'Иванов',
          'login': '1111111111111111111111111111111111',
          'phone': '111111111111',
          'isResident': true
        }
      }
    }),
    statusText: 'OK',
    headers: { 'set-cookie': 'session-cookie' },
    sendAsJson: false
  }, { method: 'GET' })
}

function mockCheckPassword () {
  fetchMock.once('https://mybank.by/api/v1/login/checkPassword', {
    status: 200,
    body: JSON.stringify({
      'ResponseType': 'ResponseOfCheckPasswordResponse',
      'error': null,
      'sessionId': null,
      'success': true,
      'validateErrors': null,
      'data': {
        'fingerToken': null,
        'nextOperation': null,
        'userInfo': {
          'email': 'TEST@GMAIL.COM',
          'firstName': 'Вася',
          'middleName': 'Петрович',
          'isCustomLogin': false,
          'lastName': 'Осюк',
          'login': 'login',
          'phone': '',
          'isResident': true,
          'dboContracts': [ {
            'contractNum': 'IB_I/123456',
            'status': 'REGISTERED',
            'role': 'F',
            'isAdmin': null,
            'name': 'Осюк В.П.',
            'longname': 'Осюк Вася Петрович',
            'smsConfirmation': false
          } ]
        }
      }
    }),
    statusText: 'OK',
    headers: { 'set-cookie': 'session-cookie' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockIdentity () {
  fetchMock.once('https://mybank.by/api/v1/login/userIdentityByPhone', {
    status: 200,
    body: JSON.stringify({
      'ResponseType': 'ResponseOfUserIdentityByPhoneData',
      'error': null,
      'sessionId': null,
      'success': true,
      'validateErrors': null,
      'data': {
        'smsCode': null,
        'userLinkedAbs': true
      }
    }),
    statusText: 'OK',
    headers: { 'set-cookie': 'session-cookie' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockUserRole () {
  fetchMock.once('https://mybank.by/api/v1/user/userRole', {
    status: 200,
    body: JSON.stringify({
      'ResponseType': 'ResponseOfstring',
      'error': null,
      'sessionId': null,
      'success': true,
      'validateErrors': null,
      'data': null
    }),
    statusText: 'OK',
    headers: { 'set-cookie': 'session-cookie' },
    sendAsJson: false
  }, { method: 'POST' })
}
