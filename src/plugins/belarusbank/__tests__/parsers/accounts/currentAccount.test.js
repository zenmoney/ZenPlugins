import { parseCards } from '../../../api'

describe('parseCards', () => {
  it.each([
    [
      require('./currentAccount.html'),
      [
        {
          type: 'account',
          transactionsData:
            {
              action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/act/id=OAtduHw3FDQFB/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/441994829700/=/',
              encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0J8GF30QURARU5U2O65/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
              viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
              additional:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id4\'',
                  '\'accountNumber\'',
                  '\'511051014537\''],
              holdsData:
                ['\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm\'',
                  '\'viewns_Z7_0AG41KO0J8GF30QURARU5U2O65_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0J8GF30QURARU5U2O65_j_id5\'',
                  '\'accountNumber\'',
                  '\'511051014537\'']
            },
          accountName: 'Счёт №BY32 AKBB 3014 0000 5826 3521 0000',
          accountNum: 'BY32AKBB30140000582635210000',
          balance: '12 180.69',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          accountId: '511051014537'
        }
      ]
    ]
  ])('parses current account', (html, accounts) => {
    expect(parseCards(html)).toEqual(accounts)
  })
})
