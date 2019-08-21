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
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      let transaction = convertTransaction(tc.json, [account])
      expect(transaction).toEqual(tc.expectedTransaction)
    })
  })
})
