import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  let account = {
    id: 'BY75AKBB30141000022233030000',
    type: 'card',
    title: 'Карта 2222',
    balance: 10.18,
    instrument: 'EUR',
    syncID: ['BY75AKBB30141000022233030000', '2222'],
    raw: {
      balance: '10.18',
      cardNum: '1111********2222',
      currency: 'EUR',
      id: 'BY75 AKBB 3014 1000 0222 3303 0000',
      transactionsData: {
        action: 'long/long/link',
        additional: [
          '\'viewns_Z7_HASH001_:ClientCardsDataForm\'',
          '\'viewns_Z7_HASH001_:ClientCardsDataForm:accountContainer:0:ns_Z7_HASH001_j_id4\'',
          '\'accountNumber\'',
          '\'500011001111\''
        ],
        encodedURL: '/wps/myportal/ibank/!ut/p/a1/LONGLONGHASH/dl5/d5/HASH56/pw/Z7_HASH001/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
        viewState: '/s/BLA/BLA/BLA+bla+bLa+Blabla/ha12sh='
      },
      type: 'card'
    }
  }

  let tt = [
    {
      name: 'service payments',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Покупка/оплата/перевод',
        date: '01.06.2019',
        debitFlag: '-',
        inAccountCurrency: 'EUR',
        inAccountSum: '1 280.00',
        operationCurrency: 'EUR',
        operationSum: '1 280.00',
        place: 'OPLATA USLUG/4900',
        status: 'operResultOk',
        time: '11:38:16'
      },
      expectedTransaction: {
        date: new Date('2019-06-01T08:38:16.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: null,
            sum: -1280,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'OPLATA USLUG',
          location: null,
          mcc: 4900
        },
        comment: 'Покупка/оплата/перевод',
        hold: false
      }
    },
    {
      name: 'sms banking',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Покупка/оплата/перевод',
        date: '01.06.2019',
        debitFlag: '-',
        inAccountCurrency: 'EUR',
        inAccountSum: '35.00',
        operationCurrency: 'EUR',
        operationSum: '35.00',
        place: 'SMS BANKING / MTS/4814',
        status: 'operResultOk',
        time: '11:38:16'
      },
      expectedTransaction: {
        date: new Date('2019-06-01T08:38:16.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: null,
            sum: -35,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'SMS BANKING/MTS',
          location: null,
          mcc: 4814
        },
        comment: 'Покупка/оплата/перевод',
        hold: false
      }
    },
    {
      name: 'check balans in ATM',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Плата за просмотр баланса (доступн. остатка)',
        date: '01.06.2019',
        debitFlag: '-',
        inAccountCurrency: 'EUR',
        inAccountSum: '0.20',
        operationCurrency: 'EUR',
        operationSum: '0.00',
        place: 'ZH/D VOKZAL BPSB ATM/6011',
        status: 'operResultOk',
        time: '11:38:16'
      },
      expectedTransaction: {
        date: new Date('2019-06-01T08:38:16.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: null,
            sum: -0.2,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'ZH/D VOKZAL BPSB ATM',
          location: null,
          mcc: 6011
        },
        comment: 'Плата за просмотр баланса (доступн. остатка)',
        hold: false
      }
    },
    {
      name: 'pension provision income',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Платежи в счет (пенсия)',
        date: '01.06.2019',
        debitFlag: '+',
        inAccountCurrency: 'EUR',
        inAccountSum: '173.18',
        operationCurrency: 'EUR',
        operationSum: '173.18',
        place: 'Пенсия ФСЗН',
        status: 'operResultOk',
        time: '11:38:16'
      },
      expectedTransaction: {
        date: new Date('2019-06-01T08:38:16.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: null,
            sum: 173.18,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Пенсия ФСЗН',
          location: null,
          mcc: null
        },
        comment: 'Платежи в счет (пенсия)',
        hold: false
      }
    },
    {
      name: 'income in different currency',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Возврат покупки/оплаты/зачисление перевода',
        date: '01.06.2019',
        debitFlag: '+',
        inAccountCurrency: 'EUR',
        inAccountSum: '5.64',
        operationCurrency: 'RUB',
        operationSum: '400',
        place: 'Vasia Pupkin/6012',
        status: 'operResultOk',
        time: '11:38:16'
      },
      expectedTransaction: {
        date: new Date('2019-06-01T08:38:16.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: { sum: 400, instrument: 'RUB' },
            sum: 5.64,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Vasia Pupkin',
          location: null,
          mcc: 6012
        },
        comment: 'Возврат покупки/оплаты/зачисление перевода',
        hold: false
      }
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      let transaction = convertTransaction(tc.json, [account])
      expect(transaction).toEqual(tc.expectedTransaction)
    })
  })
})
