import { parseCards } from '../../../api'

describe('parseCards', () => {
  it.each([
    [
      require('./cardAccount_2.html'),
      [
        {
          type: 'ccard',
          accountName: 'Счёт №BY35 AKBB 3014 0000 1234 1234 0000',
          accountNum: 'BY35AKBB30140000123412340000',
          accountId: '214059057207',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/act/id=drP3K_net0QFB/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/446941469050/=/',
            encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id4\'',
              '\'accountNumber\'',
              '\'214059057207\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
                '\'accountNumber\'',
                '\'214059057207\''
              ]
          },
          balance: '125.31',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'БелКарт',
              number: '9112********5469',
              id: '707070707063971234',
              isActive: true
            }
          ]
        }
      ]
    ]
  ])('parses card account', (html, accounts) => {
    expect(parseCards(html)).toEqual(accounts)
  })
})
