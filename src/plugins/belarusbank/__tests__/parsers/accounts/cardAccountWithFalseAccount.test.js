import { parseCards } from '../../../api'

describe('parseCards', () => {
  it.each([
    [
      require('./cardAccountWithFalseAccount.html'),
      [
        {
          type: 'ccard',
          transactionsData:
            {
              action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/act/id=ANcJLr_F-1A/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/441639357677/=/',
              encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
              viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
              additional:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id4\'',
                  '\'accountNumber\'',
                  '\'500018000311\''],
              holdsData:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
                  '\'accountNumber\'',
                  '\'500018000311\'']
            },
          cards:
            [{
              name: 'VISA',
              number: '4255********3085',
              id: '707070707066173672',
              isActive: true
            }],
          accountName: 'Счёт №BY24 AKBB 3014 2000 0016 4601 0000',
          accountNum: 'BY24AKBB30142000001646010000',
          balance: '92.87',
          currency: 'EUR',
          overdraftBalance: '0.00',
          overdraftCurrency: 'EUR',
          accountId: '500018000311'
        },
        {
          type: 'ccard',
          transactionsData:
            {
              action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/act/id=ANcJLr_F-1A/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/441639357677/=/',
              encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
              viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
              additional:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id4\'',
                  '\'accountNumber\'',
                  '\'700159016869\''],
              holdsData:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
                  '\'accountNumber\'',
                  '\'700159016869\'']
            },
          cards:
            [{
              name: 'MasterCard',
              number: '5470********0091',
              id: '707070707066767747',
              isActive: true
            }],
          accountName: 'Счёт №BY61 AKBB 3014 0000 8193 6701 0000',
          accountNum: 'BY61AKBB30140000819367010000',
          balance: '19.71',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          accountId: '700159016869'
        }
      ]
    ]
  ])('parses card account with false account', (html, accounts) => {
    expect(parseCards(html)).toEqual(accounts)
  })
})
