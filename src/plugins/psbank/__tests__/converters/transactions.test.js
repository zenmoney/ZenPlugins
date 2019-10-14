import { convertTransaction } from '../../converters'

const accounts = {
  'ccard': {
    id: 'cardId',
    type: 'ccard',
    instrument: 'RUR'
  }
}

const transactions = {
  'ccard': [
    [
      {
        cardCommissionSum: 0,
        cardCurrency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        cardSum: 21974.1,
        ground: ' Зачисление (на основании реестра от работодателя) ',
        isProcessed: true,
        transactionCurrency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        transactionDate: '2019-05-15T12:48:13Z',
        transactionSum: 21974.1,
        valueDate: '2019-05-15T00:00:00Z'
      },
      {
        'comment': 'Зачисление (на основании реестра от работодателя) ',
        'date': new Date('2019-05-15T12:48:13Z'),
        'fee': 0,
        'hold': false,
        'id': null,
        'income': 21974.1,
        'incomeAccount': 'cardId',
        'invoice': null,
        'outcome': 0,
        'outcomeAccount': null,
        'payee': null
      }
    ],
    [
      {
        cardCommissionSum: 0,
        cardCurrency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        cardSum: -21974.1,
        ground: '220003..8163 Безналичное списание RUS MOSCOW PSB-RETAIL 00888890 216948',
        isProcessed: true,
        mcc: '5399',
        request: {
          commissionSum: 0,
          currency: {
            currencyId: 1,
            name: 'Российский рубль',
            nameIso: 'RUR'
          },
          finishTime: '2019-05-15T13:24:15.783Z',
          isRepeatAllowed: true,
          mode: 255,
          office: {
            officeId: 249
          },
          operation: {
            code: 2103,
            confirmButtonText: 'Подтвердить',
            imageSrc: '/res/i/o/539EABC6D52BCC76E94C08B31251459D.png',
            isTemplateSupported: true,
            localities: [],
            name: 'По номеру счета в другой банк',
            operationId: 6731
          },
          receiverName: 'Васильев Евгений Григорьевич',
          requestId: 935905654,
          requestTime: '2019-05-15T13:23:57.86Z',
          startTime: '2019-05-15T13:23:57.86Z',
          state: 10,
          stateName: 'Обработано',
          sum: 21974.1,
          template: {
            templateId: 4374714,
            code: 3,
            name: 'Тинькофф'
          }
        },
        transactionCurrency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        transactionDate: '2019-05-15T13:24:14Z',
        transactionSum: -21974.1,
        valueDate: '2019-05-15T00:00:00Z'
      },
      {
        'comment': 'Безналичное списание RUS MOSCOW PSB-RETAIL 00888890 216948',
        'date': new Date('2019-05-15T13:24:14Z'),
        'fee': 0,
        'hold': false,
        'id': null,
        'income': 0,
        'incomeAccount': 'cardId',
        'invoice': null,
        'outcome': 21974.1,
        'outcomeAccount': 'cardId',
        'payee': null
      }
    ]
  ]
}
describe('convertAccount', () => {
  Object.keys(transactions).forEach(type => {
    for (let i = 0; i < transactions[type].length; i++) {
      it(`should convert '${type}' #${i}`, () => {
        expect(
          convertTransaction(transactions[type][i][0], accounts[type])
        ).toEqual(
          transactions[type][i][1]
        )
      })
    }
  })
})

describe('convertOneTransaction', () => {
  const type = 'ccard'
  const i = 1
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[type][i][0], accounts[type])
    ).toEqual(
      transactions[type][i][1]
    )
  })
})
