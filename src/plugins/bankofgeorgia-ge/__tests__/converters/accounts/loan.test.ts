import { convertAccounts } from '../../../converters'
import { FetchedAccount } from '../../../models'

describe('convertAccounts', () => {
  it.each([
    [
      {
        tag: 'loan',
        product: {
          loanKey: 14825746492,
          prodType: 'Mortgage loan',
          amount: 39000,
          loanName: null,
          ccy: 'USD',
          bcAmount: 107745.3,
          installmentFlag: 'N',
          loanType: 'LND',
          productId: 40,
          subProductCode: null,
          attachmentId: null,
          acctRef: 'A',
          productDictionaryKey: 'product.code.loan.Mortgage loan',
          productDictionaryValue: 'Mortgage Loan',
          attachmentUrl: null,
          productFunctions: [
            'STATEMENT',
            'SCHEDULE',
            'HISTORY'
          ],
          linkAcctKey: 11579245306
        },
        details: {
          loanKey: 14825746492,
          lndDetails:
            {
              loanKey: 14825746492,
              signedDate: 1666051200000,
              firstDdDate: 1666051200000,
              matureDate: 1981843200000,
              linkAcctKey: 11579245306,
              initialPrincipal: 39000,
              remainingInterest: 24495.53,
              offsetIntSaved: 0,
              interestRate: 7,
              clientKey: 212013779,
              insFlag: 'N',
              insAmount: 0,
              loanSubType: 'MR4',
              nextInterest: 254.3,
              nextPayment: 462.28,
              subTypeGroup: 'Mortgage loan',
              smsScheme: 'N',
              merchantSourceType: null,
              merchantId: null,
              isLoanReverseAllowed: 'N',
              linkAcctNo: 'GE05BG0000000537389450USD',
              fileId: '1117329854',
              restAmount: 39374.37,
              prePaymentCom: 366.89,
              repaymentFlag: 'P',
              isReversible: 'N',
              loanDebt: 39007.96,
              fileUrl: 'serviceId=LOANS_GET_AGREEMENT_PDF&loanKey=14825746492',
              isOnlineInstallment: 'N',
              reversalStatus: 'X',
              reversalStatusDictionaryKey: null,
              reversalStatusDictionaryValue: null
            },
          plnDetails: null,
          invoice: null,
          schedule:
            {
              primaryKey: '14825746492_2022-11-21T04:00_USD',
              loanKey: 14825746492,
              loanNo: '8731869',
              payDate: 1668988800000,
              ccy: 'USD',
              priAmt: 191.63,
              intAmt: 254.3,
              feeAmt: 16.35,
              feeType: 'INSURANCE',
              exAmt: 0,
              insAmt: 0,
              rliAmt: 0,
              forgiveInt: 0,
              forgiveFee: 0,
              forgiveOdi: 0,
              graceInt: 0,
              totalAmt: 462.28,
              nextPayAmt: 462.28,
              intAmtWithoutOffset: 254.3,
              feeTypeDictionaryKey: 'lnd_fee_types.insurance',
              feeTypeDictionaryValue: 'Insurance management commission fee'
            },
          lndRepayment:
            {
              primaryKey: '14825746492_2022-10-18_USD',
              loanKey: 14825746492,
              paymentDate: 1666036800000,
              ccy: 'USD',
              principal: 0,
              interest: 0,
              penalty: 0,
              fee: 78,
              scheduledFee: 0,
              feeType: 'FEE',
              insAmt: 0,
              rliAmt: 0,
              forgiveInt: null,
              forgiveFee: 0,
              forgiveOdi: 0,
              graceInt: 0,
              amountPaid: 78,
              feeTypeDictionaryKey: 'lnd_fee_types.fee',
              feeTypeDictionaryValue: 'Loan accomodation commission fee'
            },
          plnRepayment: null,
          repaymentAccounts:
            [
              {
                acctKey: 11579245306,
                acctNo: 'GE05BG0000000537389450USD',
                acctName: 'Income',
                ccy: 'USD',
                availableAmount: 1050.26,
                mainAcctKey: 11579245305,
                realAmount: 1049.88
              },
              {
                acctKey: 11580015131,
                acctNo: 'GE85BG0000000537648455USD',
                acctName: 'Profit',
                ccy: 'USD',
                availableAmount: 0,
                mainAcctKey: 11580015130,
                realAmount: 0
              },
              {
                acctKey: 11599172221,
                acctNo: 'GE87BG0000000538915045USD',
                acctName: 'GE87BG0000000538915045USD',
                ccy: 'USD',
                availableAmount: 0,
                mainAcctKey: 11599172221,
                realAmount: 0
              }
            ],
          mmsDetails: null,
          totalOffsetAmount: 0
        }
      },
      [
        {
          account: {
            id: '14825746492',
            instrument: 'USD',
            balance: -39374.37,
            startBalance: 39000,
            type: 'loan',
            title: 'Mortgage loan',
            startDate: new Date('2022-10-18T00:00:00.000Z'),
            capitalization: true,
            percent: 7,
            endDateOffsetInterval: 'day',
            endDateOffset: 3655,
            payoffInterval: 'month',
            payoffStep: 1,
            syncIds: [
              '14825746492'
            ]
          },
          acctKey: '14825746492',
          tag: 'loan'
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts([apiAccounts] as FetchedAccount[])).toEqual(accounts)
  })
})
