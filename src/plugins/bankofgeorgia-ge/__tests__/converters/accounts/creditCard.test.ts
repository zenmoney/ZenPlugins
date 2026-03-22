import { convertAccounts } from '../../../converters'
import { FetchedAccount } from '../../../models'

describe('convertAccounts (Credit Card)', () => {
  it('converts credit card account', () => {
    const apiAccount = {
      tag: 'creditCard',
      product: {
        acctKey: 123456789,
        acctName: null,
        printAcctNo: 'GE00BG0000000000000000',
        availableAmount: 4500,
        amount: 4500,
        ccy: 'GEL',
        orderNo: 4,
        productGroup: 'ACCOUNT',
        productId: 3,
        productCode: 'CREDITCARDACCOUNT',
        productDictionaryKey: 'product.code.creditcard.account',
        productDictionaryValue: null,
        cardTypes: 'AMEXGCG',
        cardSubProduct: 'AMEXAMEXGCG',
        cardSubProductGroups: 'null',
        widgetList: null,
        cardId: null,
        isDefault: 'N',
        isHidden: 'N',
        attachmentId: null,
        billAmount: null,
        fullPaymentDue: null,
        attachmentUrl: null,
        nameDictionaryKey: 'text.cards.AMEXGcontactless',
        nameDictionaryValue: null,
        cardTypeList: ['AMEXGCG'],
        cardSubProductGroupList: ['null'],
        hasMR: false,
        hasCashback: false,
        hasInstallment: false,
        hasMrInsurance: false,
        mrInsurance: null,
        productFunctions: [
          'STATEMENT',
          'PAYMENT',
          'REIMBURSEMENT',
          'INSURANCE',
          'REQUISITE',
          'DD'
        ],
        backgroundColor: 'Gold',
        isCenturion: 'N'
      },
      details: {
        acctKey: 123456789,
        atmPercent: 26,
        posPercent: 18,
        overdraftLimit: 5000,
        fileId: null,
        fileUrl: null,
        effectiveRatePos: null,
        effectiveRateAtm: 25.5,
        effectiveRateGraceAtm: null,
        effectiveRateGracePos: 0.0
      },
      cards: [
        {
          nameDictionaryValue: 'Amex Gold contactless'
        }
      ]
    }

    const expected = [
      {
        account: {
          balance: -500,
          creditLimit: 5000,
          id: '123456789',
          instrument: 'GEL',
          syncIds: [
            'GE00BG0000000000000000'
          ],
          title: 'Amex Gold contactless',
          type: 'ccard'
        },
        acctKey: '123456789',
        tag: 'creditCard'
      }
    ]

    expect(convertAccounts([apiAccount] as unknown as FetchedAccount[])).toEqual(expected)
  })
})
