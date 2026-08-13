import { parseCards } from '../../../api'

describe('parseCards', () => {
  it.each([
    [
      require('./cardAccount_3.html'),
      [
        {
          accountId: '700210001509',
          accountName: 'Счёт №BY28 AKBB 3014 0000 8673 0701 0000',
          accountNum: 'BY28AKBB30140000867307010000',
          balance: '1 970.12',
          cards: [
            {
              id: '707070707079423803',
              isActive: true,
              name: 'БелКарт',
              number: '9112********1044'
            },
            {
              id: '707070707077934917',
              isActive: false,
              name: 'БелКарт',
              number: '9112********1077'
            }
          ],
          currency: 'BYN',
          overdraftBalance: '0.00',
          overdraftCurrency: 'BYN',
          transactionsData: {
            action: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_G1H611G0JO7H206R4OME730033=CZ6_0AG41KO0JOFV20AC1O152V3894=LARUfkkwMcmCZgt0IrEcseDOTfy7ztFEKcBKzh0QFBfPME33OLMQFBg=Ejavax.servlet.include.path_info!QCPpagesQCPclientCardsQCPclientCardList.xhtml==/#Z7_G1H611G0JO7H206R4OME730033',
            additional: [
              '\'viewns_Z7_G1H611G0JO7H206R4OME730033_:ClientCardsDataForm\'',
              '\'viewns_Z7_G1H611G0JO7H206R4OME730033_:ClientCardsDataForm:accountContainer:0:ns_Z7_G1H611G0JO7H206R4OME730033_j_id4\'',
              '\'accountNumber\'',
              '\'700210001509\''
            ],
            encodedURL: '/wps/myportal/ibank/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDRzdTQy9_Q28_N3CjAwcnQ39DU2NwowtLE30w_EpMDAw1o_Co9_QFKrf2d3Rw8Tcx8DAwMTCyMDTxcnDxdzS18DA0wyvfoT9OICjAZH6cTuQIv1ABVH4nReuHwVWgi8ECJkRRSiQC3JDgSDCINPTUREAHifUiA!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/p0/IZ7_G1H611G0JO7H206R4OME730033=CZ6_0AG41KO0JOFV20AC1O152V3894=NJpagesQCPclientCardsQCPclientCardList.xhtml=/',
            holdsData: [],
            viewState: '/s/ILIJQP0MUnb/gGBXSPx/qeFn1F2hE8dXypyYEprKzSJcic2OonnnipyXjN761vdo+ccluj+v4hQG+SraIbnxVAf1nwT1VinR4ODQM7BUNv8UYPWnpkjNrL7/jAOM8IaOMiizIzWVAlfs5ExjSUbMHVV4='
          },
          type: 'ccard'
        }
      ]
    ]
  ])('parses card account', (html, accounts) => {
    expect(parseCards(html)).toEqual(accounts)
  })
})
