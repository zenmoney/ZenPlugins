import { convertAccount, convertToZenMoneyTransactions, convertTransaction, parseMerchant } from './converters'

describe('convertAccount', () => {
  it('converts account', () => {
    expect(convertAccount({
      'accountNumber': '40702810610000000179',
      'status': 'NORM',
      'name': 'Мой счет',
      'currency': '643',
      'balance': {
        'otb': 54202.31,
        'authorized': 9952.48,
        'pendingPayments': 0,
        'pendingRequisitions': 0
      }
    })).toEqual({
      id: '40702810610000000179',
      type: 'checking',
      title: 'Мой счет',
      instrument: 'RUB',
      balance: 64154.79,
      syncID: ['40702810610000000179']
    })
  })
})

describe('convertTransaction', () => {
  it('converts income transaction', () => {
    const account = { id: '40101810900000000974', instrument: 'RUB' }
    const accountsById = {}
    accountsById[account.id] = account

    expect(convertTransaction({
      'id': '',
      'date': '2018-07-30',
      'amount': 35257.11,
      'drawDate': '2018-07-30',
      'payerName': '',
      'payerInn': '770000000082',
      'payerAccount': '43310000000724',
      'payerCorrAccount': '30101810900000000974',
      'payerBic': '044525974',
      'payerBank': 'АО «Тинькофф Банк»',
      'chargeDate': '2018-07-30',
      'recipient': 'Демо-компания',
      'recipientInn': '1239537766',
      'recipientAccount': '40101810900000000974',
      'recipientCorrAccount': '30101810145250000974',
      'recipientBic': '044525974',
      'recipientBank': 'АО "ТИНЬКОФФ БАНК"',
      'operationType': '02',
      'uin': '',
      'paymentPurpose': '',
      'creatorStatus': '',
      'payerKpp': '0',
      'recipientKpp': '898701277'
    }, account, accountsById)).toEqual({
      groupId: null,
      transaction: {
        hold: false,
        date: new Date('2018-07-30'),
        movements: [
          {
            id: null,
            account: { id: '40101810900000000974' },
            invoice: null,
            sum: 35257.11,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    })
  })

  it('converts two parts of transfer', () => {
    const account1 = { id: '40802978800000002310', instrument: 'EUR' }
    const account2 = { id: '40802810100000528724', instrument: 'RUB' }
    const accountsById = {}
    accountsById[account1.id] = account1
    accountsById[account2.id] = account2

    const groupId = '56-40802978800000002310-40802810100000528724-2018-12-25'

    expect(convertTransaction({
      id: '56',
      date: '2018-12-25',
      amount: 446.08,
      drawDate: '2018-12-25',
      payerName: 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      payerInn: '500201663594',
      payerAccount: '40802978800000002310',
      payerCorrAccount: '30101810145250000974',
      payerBic: '044525974',
      payerBank: 'АО "ТИНЬКОФФ БАНК"',
      chargeDate: '2018-12-25',
      recipient: 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      recipientInn: '500201663594',
      recipientAccount: '40802810100000528724',
      recipientCorrAccount: '30101810145250000974',
      recipientBic: '044525974',
      recipientBank: 'АО "ТИНЬКОФФ БАНК"',
      operationType: '09',
      uin: '',
      paymentPurpose: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018',
      creatorStatus: '',
      executionOrder: '5'
    }, account1, accountsById)).toEqual({
      groupId,
      transaction: {
        hold: false,
        date: new Date('2018-12-25'),
        movements: [
          {
            id: null,
            account: { id: '40802978800000002310' },
            invoice: null,
            sum: -446.08,
            fee: 0
          }
        ],
        merchant: {
          title: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          city: null,
          country: null,
          mcc: null,
          location: null
        },
        comment: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018'
      }
    })

    expect(convertTransaction({
      id: '56',
      date: '2018-12-25',
      amount: 34638.11,
      drawDate: '2018-12-25',
      payerName: 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      payerInn: '500201663594',
      payerAccount: '40802978800000002310',
      payerCorrAccount: '30101810145250000974',
      payerBic: '044525974',
      payerBank: 'АО "ТИНЬКОФФ БАНК"',
      chargeDate: '2018-12-25',
      recipient: 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      recipientInn: '500201663594',
      recipientAccount: '40802810100000528724',
      recipientCorrAccount: '30101810145250000974',
      recipientBic: '044525974',
      recipientBank: 'АО "ТИНЬКОФФ БАНК"',
      operationType: '09',
      uin: '',
      paymentPurpose: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018',
      creatorStatus: '',
      executionOrder: '5'
    }, account2, accountsById)).toEqual({
      groupId,
      transaction: {
        hold: false,
        date: new Date('2018-12-25'),
        movements: [
          {
            id: null,
            account: { id: '40802810100000528724' },
            invoice: null,
            sum: 34638.11,
            fee: 0
          }
        ],
        merchant: {
          title: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          city: null,
          country: null,
          mcc: null,
          location: null
        },
        comment: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018'
      }
    })
  })

  it('converts cash withdrawal', () => {
    const account = { id: '40802810000000308813', instrument: 'RUB' }
    const accountsById = {}
    accountsById[account.id] = account

    expect(convertTransaction({
      id: '2354570',
      date: '2018-09-02',
      amount: 1000,
      drawDate: '2018-09-03',
      payerName: 'Индивидуальный предприниматель НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      payerInn: '540447492513',
      payerAccount: '40802810000000308813',
      payerCorrAccount: '30101810145250000974',
      payerBic: '044525974',
      payerBank: 'АО "ТИНЬКОФФ БАНК"',
      chargeDate: '2018-09-03',
      recipient: 'АО "ТИНЬКОФФ БАНК"',
      recipientInn: '7710140679',
      recipientAccount: '30232810400000000380',
      recipientCorrAccount: '30101810145250000974',
      recipientBic: '044525974',
      recipientBank: 'АО "ТИНЬКОФФ БАНК"',
      operationType: '17',
      uin: '',
      paymentPurpose: 'Отражение операции снятия наличных в АТМ по карте номер 5534...1314 ATM 440919 NOVOSIBIRSK RUS. Договор 7008587896',
      creatorStatus: '',
      recipientKpp: '773401001',
      executionOrder: '5'
    }, account, accountsById)).toEqual({
      groupId: null,
      transaction: {
        hold: false,
        date: new Date('2018-09-02'),
        movements: [
          {
            id: null,
            account: { id: '40802810000000308813' },
            invoice: null,
            sum: -1000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 1000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    })
  })

  it('converts card outcome', () => {
    const account = { id: '40802810000000308813', instrument: 'RUB' }
    const accountsById = {}
    accountsById[account.id] = account

    expect(convertTransaction({
      id: '2354571',
      date: '2018-09-02',
      amount: 1054.81,
      drawDate: '2018-09-03',
      payerName: 'Индивидуальный предприниматель НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
      payerInn: '540447492513',
      payerAccount: '40802810000000308813',
      payerCorrAccount: '30101810145250000974',
      payerBic: '044525974',
      payerBank: 'АО "ТИНЬКОФФ БАНК"',
      chargeDate: '2018-09-03',
      recipient: 'АО "ТИНЬКОФФ БАНК"',
      recipientInn: '7710140679',
      recipientAccount: '30232810400000000380',
      recipientCorrAccount: '30101810145250000974',
      recipientBic: '044525974',
      recipientBank: 'АО "ТИНЬКОФФ БАНК"',
      operationType: '17',
      uin: '',
      paymentPurpose: 'Отражение операции оплаты по карте номер 5534...1314 AZS GRAND NOVOSIBIRSK RUS. Договор 7008587896',
      creatorStatus: '',
      recipientKpp: '773401001',
      executionOrder: '5'
    }, account, accountsById)).toEqual({
      groupId: null,
      transaction: {
        hold: false,
        date: new Date('2018-09-02'),
        movements: [
          {
            id: null,
            account: { id: '40802810000000308813' },
            invoice: null,
            sum: -1054.81,
            fee: 0
          }
        ],
        merchant: {
          title: 'AZS GRAND',
          city: 'NOVOSIBIRSK',
          country: 'RUS',
          mcc: null,
          location: null
        },
        comment: null
      }
    })
  })
})

describe('parseMerchant', () => {
  expect(parseMerchant('AZS GRAND NOVOSIBIRSK RUS')).toEqual({ title: 'AZS GRAND', city: 'NOVOSIBIRSK', country: 'RUS' })
  expect(parseMerchant('CKASSA RU MSK G RUS')).toEqual({ title: 'CKASSA RU', city: 'MSK', country: 'RUS' })
  expect(parseMerchant('ООО "ЯНДЕКС.ТАКСИ"')).toEqual({ title: 'ООО "ЯНДЕКС.ТАКСИ"', city: null, country: null })
})

describe('convertToZenMoneyTransactions', () => {
  it('merges two parts of transfer but preservers single transactions', () => {
    expect(convertToZenMoneyTransactions([
      {
        groupId: '56-40802978800000002310-40802810100000528724-2018-12-25',
        transaction: {
          hold: false,
          date: new Date('2018-12-25'),
          movements: [
            {
              id: null,
              account: { id: '40802978800000002310' },
              invoice: null,
              sum: -446.08,
              fee: 0
            }
          ],
          merchant: {
            title: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            city: null,
            country: null,
            mcc: null,
            location: null
          },
          comment: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018'
        }
      },
      {
        groupId: '56-40802978800000002310-40802810100000528724-2018-12-25',
        transaction: {
          hold: false,
          date: new Date('2018-12-25'),
          movements: [
            {
              id: null,
              account: { id: '40802810100000528724' },
              invoice: null,
              sum: 34638.11,
              fee: 0
            }
          ],
          merchant: {
            title: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            city: null,
            country: null,
            mcc: null,
            location: null
          },
          comment: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018'
        }
      },
      {
        groupId: null,
        transaction: {
          hold: false,
          date: new Date('2018-09-02'),
          movements: [
            {
              id: null,
              account: { id: '40802810000000308813' },
              invoice: null,
              sum: -1054.81,
              fee: 0
            }
          ],
          merchant: {
            title: 'AZS GRAND',
            city: 'NOVOSIBIRSK',
            country: 'RUS',
            mcc: null,
            location: null
          },
          comment: null
        }
      }
    ])).toEqual([
      {
        hold: false,
        date: new Date('2018-12-25'),
        movements: [
          {
            id: null,
            account: { id: '40802978800000002310' },
            invoice: null,
            sum: -446.08,
            fee: 0
          },
          {
            id: null,
            account: { id: '40802810100000528724' },
            invoice: null,
            sum: 34638.11,
            fee: 0
          }
        ],
        merchant: null,
        comment: '{VO01010} Продажа валюты 446.08 евро по курсу 77.65 руб. / евро по поручению №56 от 25.12.2018'
      },
      {
        hold: false,
        date: new Date('2018-09-02'),
        movements: [
          {
            id: null,
            account: { id: '40802810000000308813' },
            invoice: null,
            sum: -1054.81,
            fee: 0
          }
        ],
        merchant: {
          title: 'AZS GRAND',
          city: 'NOVOSIBIRSK',
          country: 'RUS',
          mcc: null,
          location: null
        },
        comment: null
      }
    ])
  })
})
