import { convertAccounts } from '../../../converters'
import { FetchedAccount } from '../../../models'

describe('convertAccounts', () => {
  it.each([
    [
      {
        tag: 'deposit',
        product: {
          agreeKey: 13224906005,
          clientKey: 20997000,
          prodType: 'ENLARG',
          name: null,
          ccy: 'USD',
          depositType: 'TERM',
          nextWithdrawalDate: 1683144000000,
          accrualBalance: null,
          accountKey: 11573057492,
          techAcctKey: 11573057491,
          mainAccountKey: 11573057492,
          acctNo: 'GE14BG0000000534099727',
          currentBalance: 100,
          bcBalance: 286.57,
          availableAmount: 100,
          productId: 24,
          productGroup: 'DEPOSIT',
          isHidden: 'N',
          isDefault: 'N',
          attachmentId: null,
          fileId: 671662152,
          isBreakable: 'Y',
          applicationId: null,
          class2: 'ENLARGE',
          minAccrualBalance: null,
          subType: null,
          dictionaryKey: 'product.code.deposit.enlarg',
          dictionaryValue: null,
          productFunctions: [
            'STATEMENT',
            'CAS',
            'STO',
            'IN_TRANSFER',
            'SAVING_GOALS'
          ],
          attachmentUrl: null,
          depositPdfUrl: 'serviceId=DEPOSITS_GET_AGREEMENT_PDF&agreeKey=13224906005',
          savingGoals: [],
          pfmAcctId: 712630601,
          pfmAcctBalance: 99.99
        },
        details: {
          agreeKey: 13224906005,
          prodType: 'ENLARG',
          maturityDate: 1683144000000,
          startDate: 1651608000000,
          intAccrued: 0.05,
          clientKey: 20997000,
          status: 'A',
          ccy: 'USD',
          name: null,
          closeDate: null,
          depositType: 'TERM',
          agrPurpose: 'Other',
          agrPurposeId: 81,
          agreeNo: 'GE14BG0000000534099727',
          interestRate: 0.75,
          currentBalance: 100,
          accountKey: 11573057492,
          totalBalance: 100.05,
          casAmount: 0,
          showCasAmount: 'N',
          fileId: 671662152,
          productGroup: 'DEPOSIT',
          depositProdType: 'ENLARG',
          class2: 'ENLARGE',
          periodType: '99Y',
          dictionaryKey: 'product.code.deposit.enlarg',
          dictionaryValue: null,
          periodTypeNameDctKey: 'cds.period.types.99Y',
          periodTypeNameDctValue: null,
          purposeDictionaryKey: 'text.cds.agree.purpose.other',
          purposeDictionaryValue: null,
          savingGoals: [],
          pfmAcctId: 712630601,
          pfmAcctBalance: 99.99,
          productFunctions: [
            'STATEMENT',
            'CAS',
            'STO',
            'IN_TRANSFER',
            'SAVING_GOALS'
          ]
        }
      },
      [
        {
          account: {
            balance: 100.05,
            capitalization: true,
            endDateOffset: 1,
            endDateOffsetInterval: 'year',
            id: '11573057492',
            instrument: 'USD',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 0.75,
            startBalance: 100,
            startDate: new Date('2022-05-04T00:00:00.000+04:00'),
            syncIds: [
              'GE14BG0000000534099727'
            ],
            title: 'ENLARG',
            type: 'deposit'
          },
          acctKey: '11573057492',
          tag: 'deposit'
        }
      ]
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts([apiAccounts] as FetchedAccount[])).toEqual(accounts)
  })
})
