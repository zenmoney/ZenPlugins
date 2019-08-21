import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
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
      name: 'parse cash',
      json: {
        accountID: 'BY75AKBB30141000022233030000',
        comment: 'Пополнение счета (дополнительный взнос)',
        date: '01.06.2019',
        debitFlag: '+',
        inAccountCurrency: 'EUR',
        inAccountSum: '1 280.00',
        operationCurrency: 'EUR',
        operationSum: '1 280.00',
        place: '/',
        status: 'operResultOk',
        time: '00:00:00'
      },
      expectedTransaction: {
        date: new Date('2019-05-31T21:00:00.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'BY75AKBB30141000022233030000' },
            invoice: null,
            sum: 1280,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              type: 'cash',
              instrument: 'EUR',
              syncIds: null
            },
            invoice: null,
            sum: -1280,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение счета (дополнительный взнос)',
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
