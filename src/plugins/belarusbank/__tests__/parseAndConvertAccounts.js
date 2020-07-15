import { parseCards } from '../api'
import { convertAccount } from '../converters'

describe('parse cards and convert cards from raw html', () => {
  const htmlFile = './cardAccount.html'
  it.each([
    [
      require(htmlFile),
      [
        {
          type: 'ccard',
          accountName: 'Зарплатный',
          accountNum: 'BY80AKBB30140002507122010000',
          accountId: '200228037958',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LAgIDsELn9jiJDyUonqQFBB22FGbOn_QDK7KikMTu2cP5mqrQFBbttv1A=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\'',
              '\'accountNumber\'',
              '\'200228037958\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\'',
                '\'accountNumber\'',
                '\'200228037958\''
              ]
          },
          balance: '0.00',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'БелКарт',
              number: '9112********6623',
              id: '707070707067625529',
              isActive: true
            }
          ]
        },
        {
          type: 'account',
          accountName: '10000',
          accountNum: 'BY32AKBB24270000288782030000',
          accountId: '2000032936',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LAgIDsELn9jiJDyUonqQFBB22FGbOn_QDK7KikMTu2cP5mqrQFBbttv1A=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\'',
              '\'accountNumber\'',
              '\'2000032936\''
            ],
            holdsData: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\'',
              '\'accountNumber\'',
              '\'2000032936\''
            ]
          },
          balance: '0.00',
          currency: 'BYN',
          overdraftBalance: '10 000.00',
          overdraftCurrency: 'BYN'
        },
        {
          type: 'account',
          accountName: '8000',
          accountNum: '',
          accountId: '795157480193537',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LAgIDsELn9jiJDyUonqQFBB22FGbOn_QDK7KikMTu2cP5mqrQFBbttv1A=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:2:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\'',
              '\'accountNumber\'',
              '\'795157480193537\''
            ],
            holdsData: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:2:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\'',
              '\'accountNumber\'',
              '\'795157480193537\''
            ]
          },
          balance: '0.00',
          currency: 'BYN',
          overdraftBalance: '8 000.00',
          overdraftCurrency: 'BYN'
        }
      ]
    ]
  ])('parses card account', (html, apiAccounts) => {
    expect(parseCards(html)).toEqual(apiAccounts)
  })

  it.each([
    [
      require(htmlFile),
      [
        {
          id: 'BY80AKBB30140002507122010000',
          type: 'ccard',
          title: 'Зарплатный',
          balance: 0,
          instrument: 'BYN',
          syncID: [
            '9112********6623',
            'BY80AKBB30140002507122010000'
          ]
        },
        {
          id: 'BY32AKBB24270000288782030000',
          type: 'checking',
          title: '10000',
          balance: 0,
          instrument: 'BYN',
          syncID: [
            'BY32AKBB24270000288782030000'
          ]
        },
        {
          id: '795157480193537',
          type: 'checking',
          title: '8000',
          balance: 0,
          instrument: 'BYN',
          syncID: [
            '795157480193537'
          ]
        }
      ]
    ]
  ])('parses & convert card account', (html, accounts) => {
    const convertAccounts = parseCards(html).map(acc => {
      const convertAcc = convertAccount(acc)
      delete convertAcc.raw
      return convertAcc
    })
    delete convertAccounts.raw
    expect(convertAccounts).toEqual(accounts)
  })
})
