import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  const tt = [
    {
      name: 'card',
      json: {
        type: 'ccard',
        accountName: 'Счёт №BY95 AKBB 3014 0001 2010 6521 0000',
        accountNum: 'BY95AKBB30140001201065210000',
        accountId: '511222000145',
        transactionsData: {
          action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/act/id=GtI08XHNzaA/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/437595164492/=/',
          encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
          viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
          additional: [
            '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm\'',
            '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JG4B30QMEAJVBB1444_j_id4\'',
            '\'accountNumber\'',
            '\'511222000145\''
          ],
          holdsData: [
            '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
            '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
            '\'accountNumber\'',
            '\'511222000145\''
          ]
        },
        balance: '1 235.68',
        currency: 'BYN',
        overdraftBalance: '0.0',
        overdraftCurrency: 'BYN',
        cards: [
          {
            name: 'MasterCard',
            number: '5470********1658',
            id: '707070707066137323',
            isActive: true
          },
          {
            name: 'VISA',
            number: '4848********9213',
            id: '707070707066714294',
            isActive: false
          },
          {
            name: 'Visa Electron',
            number: '4255********1344',
            id: '707070707066143496',
            isActive: false
          }
        ]
      },
      expectedAccount: {
        id: 'BY95AKBB30140001201065210000',
        type: 'ccard',
        title: 'Счёт №BY95 AKBB 3014 0001 2010 6521 0000',
        balance: 1235.68,
        instrument: 'BYN',
        syncID: [
          '5470********1658',
          'BY95AKBB30140001201065210000'
        ],
        raw: {
          type: 'ccard',
          accountName: 'Счёт №BY95 AKBB 3014 0001 2010 6521 0000',
          accountNum: 'BY95AKBB30140001201065210000',
          accountId: '511222000145',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/act/id=GtI08XHNzaA/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/437595164492/=/',
            encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JG4B30QMEAJVBB1444_j_id4\'',
              '\'accountNumber\'',
              '\'511222000145\''
            ],
            holdsData: [
              '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
              '\'accountNumber\'',
              '\'511222000145\''
            ]
          },
          balance: '1 235.68',
          currency: 'BYN',
          overdraftBalance: '0.0',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'MasterCard',
              number: '5470********1658',
              id: '707070707066137323',
              isActive: true
            },
            {
              name: 'VISA',
              number: '4848********9213',
              id: '707070707066714294',
              isActive: false
            },
            {
              name: 'Visa Electron',
              number: '4255********1344',
              id: '707070707066143496',
              isActive: false
            }
          ]
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
    },
    {
      name: 'deposit without percents',
      json: {
        balance: '938.30',
        currency: 'USD',
        details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 27.02.2022&ltbr/&gtСрок возврата вклада: 27.08.2022&ltbr/&gt',
        id: 'BY93AKBB34141005395990070000',
        name: '"Беларусбанк-Онл@йн" безотзывный (ИВ) 3, 6, 9, 13, 18, 24, 36 месяцев (капитализацией)',
        type: 'deposit'
      },
      expectedAccount: {
        balance: 938.3,
        capitalization: true,
        endDateOffset: 181,
        endDateOffsetInterval: 'day',
        id: 'BY93AKBB34141005395990070000',
        instrument: 'USD',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 0.01,
        startDate: new Date('2022-02-26T21:00:00.000Z'),
        syncID: ['BY93AKBB34141005395990070000'],
        title: '"Беларусбанк-Онл@йн" безотзывный (ИВ) 3, 6, 9, 13, 18, 24, 36 месяцев (капитализацией)',
        type: 'deposit'
      }
    },
    {
      name: 'deposit without a deposit refund period',
      json: {
        balance: '0.28',
        currency: 'USD',
        details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 21.09.2015&ltbr/&gtСрок возврата вклада: &ltbr/&gt',
        id: 'BY03AKBB34040000001201020128',
        name: 'Р/До востребования USD(01.08.96)',
        type: 'deposit'
      },
      expectedAccount: {
        balance: 0.28,
        capitalization: true,
        endDateOffset: 1,
        endDateOffsetInterval: 'month',
        id: 'BY03AKBB34040000001201020128',
        instrument: 'USD',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 0.01,
        startDate: new Date('2015-09-20T21:00:00.000Z'),
        syncID: ['BY03AKBB34040000001201020128'],
        title: 'Р/До востребования USD(01.08.96)',
        type: 'deposit'
      }
    }
  ]
  for (const tc of tt) {
    it(tc.name, () => {
      const account = convertAccount(tc.json)
      expect(account).toEqual(tc.expectedAccount)
    })
  }
})
