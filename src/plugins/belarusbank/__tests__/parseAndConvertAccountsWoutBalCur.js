import { parseCards } from '../api'
import { convertAccount } from '../converters'

describe('parse cards and convert cards from raw html', () => {
  const htmlFile = './accountWithoutBalanceAndCurrency.html'
  it.each([
    [
      require(htmlFile),
      [
        {
          type: 'ccard',
          accountName: 'Счёт №BY70 AKBB 3014 0000 5948 2541 0000',
          accountNum: 'BY70AKBB30140000594825410000',
          accountId: '527200034363',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LATutZS0FSKGjqPdYOQFBir4TqQDKJD6i8FvFncX0TAEnutleEx2EEQFB=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\\\'',
              '\'accountNumber\\\'',
              '\'527200034363\\\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\\\'',
                '\'accountNumber\\\'',
                '\'527200034363\\\''
              ]
          },
          balance: '1.79',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'БелКарт',
              number: '9112********8985',
              id: '707070707065698729',
              isActive: true
            },
            {
              name: 'MasterCard',
              number: '5470********6105',
              id: '707070707065698758',
              isActive: false
            }
          ]
        },
        {
          type: 'account',
          accountName: 'Счёт №',
          accountNum: '',
          accountId: '527PPL000280',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LATutZS0FSKGjqPdYOQFBir4TqQDKJD6i8FvFncX0TAEnutleEx2EEQFB=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\\\'',
              '\'accountNumber\\\'',
              '\'527PPL000280\\\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:1:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\\\'',
                '\'accountNumber\\\'',
                '\'527PPL000280\\\''
              ]
          },
          balance: null,
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN'
        },
        {
          type: 'account',
          accountName: 'Счёт №BY36 AKBB 3014 0000 2876 6007 0000',
          accountNum: 'BY36AKBB30140000287660070000',
          accountId: '795PPL00310591',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LATutZS0FSKGjqPdYOQFBir4TqQDKJD6i8FvFncX0TAEnutleEx2EEQFB=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:2:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\\\'',
              '\'accountNumber\\\'',
              '\'795PPL00310591\\\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:2:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\\\'',
                '\'accountNumber\\\'',
                '\'795PPL00310591\\\''
              ]
          },
          balance: '0.75',
          currency: 'BYN',
          overdraftBalance: '0.00',
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
          id: 'BY70AKBB30140000594825410000',
          type: 'ccard',
          title: 'Счёт №BY70 AKBB 3014 0000 5948 2541 0000',
          balance: 1.79,
          instrument: 'BYN',
          syncID: [
            '9112********8985',
            'BY70AKBB30140000594825410000'
          ]
        },
        {
          id: '527PPL000280',
          type: 'checking',
          title: 'Текущий счет',
          balance: null,
          instrument: 'BYN',
          syncID: [
            '527PPL000280'
          ]
        },
        {
          id: 'BY36AKBB30140000287660070000',
          type: 'checking',
          title: 'Счёт №BY36 AKBB 3014 0000 2876 6007 0000',
          balance: 0.75,
          instrument: 'BYN',
          syncID: [
            'BY36AKBB30140000287660070000'
          ]
        }
      ]
    ]
  ])('parses & convert card account without balance & currency', (html, accounts) => {
    const convertAccounts = parseCards(html).map(acc => {
      const convertAcc = convertAccount(acc)
      delete convertAcc.raw
      return convertAcc
    })
    delete convertAccounts.raw
    expect(convertAccounts).toEqual(accounts)
  })
})
