import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  let tt = [
    {
      name: 'card',
      json: {
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
      },
      expectedAccount: {
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
    },
    {
      name: 'card with wrong currency',
      json: {
        balance: '10.18',
        cardNum: '1111********2222',
        currency: 'USD на дату 08.10.2019',
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
      },
      expectedAccount: {
        id: 'BY75AKBB30141000022233030000',
        type: 'card',
        title: 'Карта 2222',
        balance: 10.18,
        instrument: 'USD',
        syncID: ['BY75AKBB30141000022233030000', '2222'],
        raw: {
          balance: '10.18',
          cardNum: '1111********2222',
          currency: 'USD на дату 08.10.2019',
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
    },
    {
      name: 'deposit',
      json: {
        balance: '1 280.00',
        currency: 'EUR',
        details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 01.06.2019&ltbr/&gtСрок возврата вклада: 01.05.2021&ltbr/&gtТип договора: безотзывный&ltbr/&gtПроцентная ставка:&ltbr&gtс 01.06.2019 - 2%&ltbr/&gtМинимальная сумма пополнения: 10.00 EUR&ltbr/&gt',
        id: 'BY34AKBB34140000203450060000',
        name: 'Интернет-депозит Тренд Безотзывный',
        type: 'deposit'
      },
      expectedAccount: {
        id: 'BY34AKBB34140000203450060000',
        type: 'deposit',
        title: 'Интернет-депозит Тренд Безотзывный',
        balance: 1280,
        instrument: 'EUR',
        syncID: ['BY34AKBB34140000203450060000'],
        capitalization: true,
        endDateOffset: 700,
        endDateOffsetInterval: 'day',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 2,
        startDate: new Date('2019-05-31T21:00:00.000Z')
      }
    },
    {
      name: 'deposit with floated percents',
      json: {
        balance: '1 280.00',
        currency: 'EUR',
        details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 01.06.2019&ltbr/&gtСрок возврата вклада: 01.05.2021&ltbr/&gtТип договора: безотзывный&ltbr/&gtПроцентная ставка:&ltbr&gtс 16.05.2019 - 7.5%&ltbr&gtс 14.08.2019 - 7.5%&ltbr&gtс 15.08.2019 - 6.75%&ltbr/&gtМаксимальная сумма списания: 2.15 BYN&ltbr/&gt',
        id: 'BY34AKBB34140000203450060000',
        name: 'Интернет-депозит Тренд Безотзывный',
        type: 'deposit'
      },
      expectedAccount: {
        id: 'BY34AKBB34140000203450060000',
        type: 'deposit',
        title: 'Интернет-депозит Тренд Безотзывный',
        balance: 1280,
        instrument: 'EUR',
        syncID: ['BY34AKBB34140000203450060000'],
        capitalization: true,
        endDateOffset: 700,
        endDateOffsetInterval: 'day',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 6.75,
        startDate: new Date('2019-05-31T21:00:00.000Z')
      }
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      let account = convertAccount(tc.json)
      expect(account).toEqual(tc.expectedAccount)
    })
  })
})
