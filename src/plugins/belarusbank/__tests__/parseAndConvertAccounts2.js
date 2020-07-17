import { parseCards } from '../api'
import { convertAccount } from '../converters'

describe('parse cards and convert cards from raw html', () => {
  const htmlFile = './cardAccount2.html'
  it.each([
    [
      require(htmlFile),
      [
        {
          type: 'ccard',
          accountName: 'Счёт №',
          accountNum: '',
          accountId: '302KSB001136',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=LAHnuXMFIQFBmzb9I8KTgZTPvRdil9oVyD7L9xxXruZVGv3aR9auQFB=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/',
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_0AG41KO0JGA380ACLM3DL430Q1=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4=',
            additional: [
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
              '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id4\\\'',
              '\'accountNumber\\\'',
              '\'302KSB001136\\\''
            ],
            holdsData:
              [
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm\\\'',
                '\'viewns_Z7_0AG41KO0JGA380ACLM3DL430Q1_:ClientCardsDataForm:accountContainer:0:ns_Z7_0AG41KO0JGA380ACLM3DL430Q1_j_id5\\\'',
                '\'accountNumber\\\'',
                '\'302KSB001136\\\''
              ]
          },
          balance: '40.00',
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          cards: [
            {
              name: 'VISA',
              number: '4255********2150',
              id: '707070707067837743',
              isActive: true
            }
          ]
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
          id: '302KSB001136',
          type: 'ccard',
          title: 'VISA *2150',
          balance: 40,
          instrument: 'BYN',
          syncID: [
            '4255********2150'
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
