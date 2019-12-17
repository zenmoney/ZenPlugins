import { parseCards } from '../../../api'

describe('parseCards', () => {
  it.each([
    [
      require('./cardAccount.html'),
      [
        {
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
              '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JG4B30QMEAJVBB1444_j_id1\'',
              '\'accountNumber\'',
              '\'511222000145\''
            ]
          },
          balance: '5.68',
          currency: 'BYN',
          overdraftBalance: '0.00',
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
        {
          type: 'ccard',
          accountName: 'Счёт №BY16 AKBB 3014 0002 7322 9521 0000',
          accountNum: 'BY16AKBB30140002732295210000',
          accountId: '511004002990',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/act/id=GtI08XHNzaA/p=javax.servlet.include.path_info=QCPpagesQCPclientCardsQCPclientCardList.xhtml/437595164492/=/',
            encodedURL: '/wps/myportal/ibank/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOINHN1NDL39Dbz83cKMDBydDf0NTY3CjC0sTYAKIkEKcABHA3z6DQyMofqd3R09TMx9gDpMLIwMPF2cPFzMLX0NDDzNiLQftwX49Bua4tcPUkDA_nD9KLASfD6AmIEniAg5siA3NDQ0wiDT01FREQAFEhcx/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_0AG41KO0JG4B30QMEAJVBB1444/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JG4B30QMEAJVBB1444_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0JG4B30QMEAJVBB1444_j_id1\'',
              '\'accountNumber\'',
              '\'511004002990\''
            ]
          },
          balance: '1 101.30',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'MasterCard',
              number: '5470********1060',
              id: '707070707066137324',
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
