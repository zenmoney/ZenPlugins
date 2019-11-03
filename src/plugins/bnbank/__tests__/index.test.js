import fetchMock from 'fetch-mock'
import { scrape } from '..'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { generateDeviceID } from '../api'

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    const deviceId = generateDeviceID()
    global.ZenMoney = {
      device_id: deviceId,
      ...makePluginDataApi({
        deviceId
      }).methods
    }
    mockLogin()
    mockFetchAccount()
    mockCardAccountStatement()
    mockCardLastTransactions()
    mockDepositAccountStatement()

    const result = await scrape(
      {
        preferences: { phone: '123456789', password: 'pass' },
        fromDate: new Date('2018-12-27T00:00:00.000+03:00'),
        toDate: new Date('2019-01-02T00:00:00.000+03:00')
      }
    )

    expect(result.accounts).toEqual([{
      'balance': 7.4,
      'cardHash': '8dkwk_a5l1A0nOffbenDdrrv14VyBN2YY1PeYsU8d2c5ZSpRKcZoj-dDd6aUt-TVBvIYmbwzA2l7Dv6aT1aFqL',
      'currencyCode': '933',
      'id': '2007500000000000',
      'instrument': 'BYN',
      'rkcCode': '004',
      'syncID': ['2007500000000000', '0000'],
      'title': 'Личные, BYN - Maxima Plus',
      'type': 'card'
    }, {
      'balance': 865.23,
      'capitalization': true,
      'currencyCode': '840',
      'endDateOffset': 182,
      'endDateOffsetInterval': 'day',
      'id': '1100000000000000',
      'instrument': 'USD',
      'payoffInterval': 'month',
      'payoffStep': 1,
      'percent': 2.25,
      'rkcCode': '765',
      'startDate': new Date('2018-12-13T21:00:00.000Z'),
      'syncID': ['1100000000000000'],
      'title': 'Депозит Верное решение',
      'type': 'deposit'
    }])

    expect(result.transactions).toEqual([
      {
        'comment': null,
        'date': new Date('2019-01-02T21:00:00.000Z'),
        'hold': false,
        'merchant': {
          'fullTitle': 'AWS EMEA',
          'location': null,
          'mcc': null
        },
        'movements': [{
          'account': {
            'id': '2007500000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -1.4
        }]
      },
      {
        'comment': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
        'date': new Date('2019-01-06T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '2007500000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -2.17
        }]
      },
      {
        'comment': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
        'date': new Date('2019-01-08T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '2007500000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -2.16
        }]
      },
      {
        'comment': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
        'date': new Date('2019-01-08T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '2007500000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': -437
        }]
      },
      {
        'comment': null,
        'date': new Date('2019-01-08T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '1100000000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 200
        }]
      },
      {
        'comment': null,
        'date': new Date('2019-01-08T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '1100000000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 206
        }]
      },
      {
        'comment': 'Зачисление дохода от предпринимательской деятельности',
        'date': new Date('2019-01-09T07:38:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '2007500000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 3000
        }]
      },
      {
        'comment': null,
        'date': new Date('2019-01-09T21:00:00.000Z'),
        'hold': false,
        'merchant': null,
        'movements': [{
          'account': {
            'id': '1100000000000000'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 0.02
        }]
      }
    ])
  })
})

function mockDepositAccountStatement () {
  fetchMock.once('https://mb.bnb.by/services/v2/products/getDepositAccountStatement', {
    status: 200,
    body: JSON.stringify({
      'errorInfo': {
        'error': '0',
        'errorText': 'Успешно'
      },
      'accountType': 'Верное решение',
      'concreteType': '0',
      'operations': [
        {
          'accountType': '0',
          'concreteType': '0',
          'accountNumber': '1100000000000000',
          'operationName': 'On-line пополнение договора (списание с БПК)',
          'transactionDate': 1547051340000,
          'operationDate': 1546981200000,
          'transactionAmount': 200.0,
          'transactionCurrency': '840',
          'operationAmount': 200.0,
          'operationCurrency': '840',
          'operationSign': '1',
          'actionGroup': 2,
          'clientName': 'Вася Пупкин',
          'operationClosingBalance': 655.6,
          'operationCode': 2
        },
        {
          'accountType': '0',
          'concreteType': '0',
          'accountNumber': '1100000000000000',
          'operationName': 'On-line пополнение договора (списание с БПК)',
          'transactionDate': 1547060220000,
          'operationDate': 1546981200000,
          'transactionAmount': 206.0,
          'transactionCurrency': '840',
          'operationAmount': 206.0,
          'operationCurrency': '840',
          'operationSign': '1',
          'actionGroup': 2,
          'clientName': 'Вася Пупкин',
          'operationClosingBalance': 861.6,
          'operationCode': 2
        },
        {
          'accountType': '0',
          'concreteType': '0',
          'accountNumber': '1100000000000000',
          'operationName': 'On-line пополнение договора (списание с БПК)',
          'transactionDate': 1547095560000,
          'operationDate': 1547067600000,
          'transactionAmount': 0.02,
          'transactionCurrency': '840',
          'operationAmount': 0.02,
          'operationCurrency': '840',
          'operationSign': '1',
          'actionGroup': 2,
          'clientName': 'Вася Пупкин',
          'operationClosingBalance': 861.62,
          'operationCode': 2
        }
      ],
      'accountNumber': '1100000000000000',
      'accountCurrency': 'USD'
    }),
    statusText: 'OK',
    headers: { 'session_token': '6af71bdf-69f8-4f62-8e59-4c26ce68add1' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockCardLastTransactions () {
  fetchMock.once('https://mb.bnb.by/services/v2/payment/simpleExcute', {
    status: 200,
    body: '{"errorInfo":{"error":"0","errorText":"Успешно"},"komplatResponse":[{"errorInfo":{"error":"0","errorText":"Успешно"},"response":"<?xml version=\\"1.0\\" encoding=\\"WINDOWS-1251\\"?>\\n<PS_ERIP>\\n  <GetExtractCardResponse>\\n    <TerminalID>ALSEDA</TerminalID>\\n    <ErrorCode>0</ErrorCode>\\n    <Protocol>BPC</Protocol>\\n    <BPC>\\n      <OperationList oper_count=\\"0\\"/>\\n    </BPC>\\n  </GetExtractCardResponse>\\n</PS_ERIP>\\n"}]}',
    statusText: 'OK',
    headers: { 'session_token': '6af71bdf-69f8-4f62-8e59-4c26ce68add1' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockCardAccountStatement () {
  fetchMock.once('https://mb.bnb.by/services/v2/products/getCardAccountFullStatement', {
    status: 200,
    body: JSON.stringify({
      'errorInfo': {
        'error': '0',
        'errorText': 'Успешно'
      },
      'accountType': '1',
      'concreteType': '1',
      'operations': [
        {
          'accountType': '1',
          'concreteType': '1',
          'accountNumber': '2007500000000000',
          'operationName': 'Зачисление дохода от предпринимательской деятельности',
          'transactionDate': 1547019480000,
          'operationDate': 1547019480000,
          'transactionAmount': 0.0,
          'transactionCurrency': '933',
          'operationAmount': 3000.0,
          'operationCurrency': '933',
          'operationSign': '1',
          'actionGroup': 2,
          'salaryOrganizationUNP': '100123456',
          'salaryOrganizationName': 'СБОРНЫЕ СЧЕТА С БПК ФИЗИЧЕСКИХ ЛИЦ (РЕЗИДЕНТЫ)',
          'operationCode': 2
        },
        {
          'accountType': '1',
          'concreteType': '1',
          'accountNumber': '2007500000000000',
          'operationName': 'Покупка товаров и услуг',
          'operationPlace': 'AWS EMEA',
          'merchantId': '323670000150000',
          'transactionAuthCode': '939000',
          'transactionDate': 1546940640000,
          'operationDate': 1546462800000,
          'rrn': '892',
          'transactionAmount': 0.64,
          'transactionCurrency': '840',
          'operationAmount': 1.4,
          'operationCurrency': '933',
          'operationSign': '-1',
          'actionGroup': 1802,
          'cardPAN': '4500000040120000',
          'operationCode': 3
        },
        {
          'accountType': '1',
          'concreteType': '1',
          'accountNumber': '2007500000000000',
          'operationName': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
          'operationPlace': 'BNB - OPLATA USLUG',
          'merchantId': '1600000',
          'transactionAuthCode': '161000',
          'transactionDate': 1546938780000,
          'operationDate': 1546808400000,
          'rrn': '4321000',
          'transactionAmount': 2.17,
          'transactionCurrency': '933',
          'operationAmount': 2.17,
          'operationCurrency': '933',
          'operationSign': '-1',
          'actionGroup': 1802,
          'cardPAN': '4500000040120000',
          'operationCode': 3
        },
        {
          'accountType': '1',
          'concreteType': '1',
          'accountNumber': '2007500000000000',
          'operationName': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
          'operationPlace': 'BNB - OPLATA USLUG',
          'merchantId': '1600000',
          'transactionAuthCode': '163000',
          'transactionDate': 1547109960000,
          'operationDate': 1546981200000,
          'rrn': '9267000',
          'transactionAmount': 2.16,
          'transactionCurrency': '933',
          'operationAmount': 2.16,
          'operationCurrency': '933',
          'operationSign': '-1',
          'actionGroup': 1802,
          'cardPAN': '4500000040120000',
          'operationCode': 3
        },
        {
          'accountType': '1',
          'concreteType': '1',
          'accountNumber': '2007500000000000',
          'operationName': 'Списание по операции ПЦ \'Оплата услуг в ИБ\' ',
          'operationPlace': 'OPLATA USLUG - KOMPLAT BNB',
          'merchantId': '1600000',
          'transactionAuthCode': '957000',
          'transactionDate': 1547110200000,
          'operationDate': 1546981200000,
          'rrn': '9249000',
          'transactionAmount': 200.0,
          'transactionCurrency': '840',
          'operationAmount': 437.0,
          'operationCurrency': '933',
          'operationSign': '-1',
          'actionGroup': 1802,
          'cardPAN': '4500000040120000',
          'operationCode': 3
        }
      ],
      'incomingBalance': 122.88,
      'closingBalance': 2230.04,
      'accountNumber': '2007500000000000',
      'accountName': '200754 - Личные, BYN - \'Maxima Plus\'',
      'accountCurrency': 'BYN'
    }),
    statusText: 'OK',
    headers: { 'session_token': '6af71bdf-69f8-4f62-8e59-4c26ce68add1' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockFetchAccount () {
  fetchMock.once('https://mb.bnb.by/services/v2/products/getUserAccountsOverview', {
    status: 200,
    body: JSON.stringify({
      'errorInfo': { 'error': '0', 'errorText': 'Успешно' },
      'overviewResponse':
        {
          'status': { 'totalStatus': 0 },
          'cardAccount': [
            {
              'internalAccountId': '2007500000000000',
              'currency': '933',
              'agreementDate': 1458853200000,
              'openDate': 1458853200000,
              'accountNumber': 'BY41BLNB00000000000000000933',
              'cardAccountNumber': '765754000000',
              'productCode': '200754',
              'productName': 'Личные, BYN - Maxima Plus',
              'availableAmount': 108.84,
              'contractId': '18684000',
              'interestRate': 2.5,
              'accountStatus': 'OPEN',
              'cards': [
                { 'cardNumberMasked': '4*** **** **** 0000',
                  'cardHash': '8dkwk_a5l1A0nOffbenDdrrv14VyBN2YY1PeYsU8d2c5ZSpRKcZoj-dDd6aUt-TVBvIYmbwzA2l7Dv6aT1aFqL',
                  'cardType': { 'value': 25, 'name': 'Visa Gold (EMV)', 'imageUri': 'https://alseda.by/media/public/bnb_g.png', 'paySysImageUri': 'https://alseda.by/media/public/credit_card_str_visa.png', 'textColor': 'ffffffff', 'paySystemName': 'Visa' },
                  'cardStatus': 'OPEN',
                  'expireDate': 1585602000000,
                  'owner': 'Vasia Pupkin',
                  'tariffName': '754 Visa Gold (EMV)',
                  'balance': 7.40,
                  'payment': '0',
                  'currency': '933',
                  'status': { 'code': '00' },
                  'numberDaysBeforeCardExpiry': 366,
                  'additionalCardType': 2,
                  'canChange3D': true,
                  'cardDepartmentAddress': 'г. Минск;пр. Дзержинского 104',
                  'retailCardId': 19200000
                }],
              'bankCode': '288',
              'rkcCode': '004',
              'rkcName': 'ЦБУ №4 г.Минск',
              'percentsLeft': '2.5',
              'accountType': '1',
              'ibanNum': 'BY92BLNB30142007549330000248',
              'url': 'https://alseda.by/media/public/orange_dream.jpg',
              'canSell': false,
              'canCloseSameCurrency': false,
              'canCloseOtherCurrency': false,
              'canClose': false,
              'canRefillSameCurrency': false,
              'canRefillOtherCurrency': false,
              'canRefill': false
            }],
          'depositAccount': [{
            'internalAccountId': '1100000000000000',
            'currency': '840',
            'openDate': 1544734800000,
            'endDate': 1560459600000,
            'accountNumber': 'BY89BLNB00000000009100000840',
            'productCode': '10062',
            'productName': 'Верное решение',
            'balanceAmount': 865.23,
            'contractId': '22092000',
            'interestRate': 2.25,
            'accountStatus': 'OPEN',
            'bankCode': '288',
            'rkcCode': '765',
            'rkcName': 'Белорусский народный банк',
            'accountType': '0',
            'ibanNum': 'BY37BLNB34141100628400000043',
            'url': 'https://alseda.by/media/public/deposit_vernoe_reshenie.png',
            'canSell': false,
            'canCloseSameCurrency': true,
            'canCloseOtherCurrency': false,
            'canClose': true,
            'canRefillSameCurrency': false,
            'canRefillOtherCurrency': true,
            'canRefill': true,
            'plannedEndDate': 1560459600000,
            'bare': false
          }] } }),
    statusText: 'OK',
    headers: { 'session_token': '6af71bdf-69f8-4f62-8e59-4c26ce68add1' },
    sendAsJson: false
  }, { method: 'POST' })
}

function mockLogin () {
  fetchMock.once('https://mb.bnb.by/services/v2/session/login', {
    status: 200,
    body: JSON.stringify({
      'errorInfo': { 'error': '0', 'errorText': 'Успешно' }, 'sessionToken': '6af71bdf-69f8-4f62-8e59-4c26ce68add1' }),
    statusText: 'OK',
    sendAsJson: false
  }, { method: 'POST' })
}
