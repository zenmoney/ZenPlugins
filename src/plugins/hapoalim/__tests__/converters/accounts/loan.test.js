import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          creditTypeDescription: 'לא צמוד ריבית משתנה',
          productNickName: null,
          originalLoanPrincipalAmount: 122000,
          debtAmount: 37383.16,
          nextPaymentAmount: 2377.07,
          nextPaymentDate: 20211031,
          formattedNextPaymentDate: '2021-10-31T00:00:00.000Z',
          unitedCreditTypeCode: 2710,
          creditSerialNumber: 1,
          partyCatenatedLoanId: null,
          productLabel: null,
          arrearTotalAmount: 0,
          detailedAccountTypeCode: 64,
          creditCurrencyCode: 1,
          executingPartyId: 0,
          loanEndDate: 20230228,
          originalPrincipalPaymentsNumber: 0,
          principalNextPaymentNumber: 0,
          interestRate: 11.4,
          enablingPayoffCode: 1,
          enablingPayoffDescription: 'טסט 454 ניתן לפרעון',
          prepaymentCommissionCalculationCode: 0,
          linkageTypeDescription: 'ללא הצמדה',
          currencyDescription: 'שקל חדש',
          interestTypeDescription: 'משתנה - לפי פריים',
          payoffCommissionExistenceCode: 1,
          payoffCommissionExistenceDescription: 'אין',
          graceQuantity: 99,
          formattedLoanEndDate: '2023-02-28T00:00:00.000Z',
          formattedOriginalLoanPrincipalAmount: '₪ 122,000.00',
          formattedDeptAmount: '₪ 37,383.16',
          formattedNextPaymentAmount: '₪ 2,377.07',
          details:
            {
              metadata:
                {
                  attributes:
                    {
                      arrearsLinkageAmount: { hidden: 'true' },
                      currentInterestPercent: { disabled: 'true' },
                      arrearsAmount: { hidden: 'true' },
                      arrearTotalAmount: { hidden: 'true' },
                      arrearsStartDate: { hidden: 'true' },
                      creditSerialNumber: { hidden: 'true' },
                      interestPaymentsNumberBalance: { disabled: 'true' },
                      arrearsInterestPercentage: { hidden: 'true' },
                      principalPaymentsNumberBalance: { disabled: 'true' },
                      arrearsInterestCorrectionAmount: { hidden: 'true' },
                      linkageTypeDescription: { hidden: 'true', disabled: 'true' },
                      interestPercentUpdatingDate: { disabled: 'true' },
                      loanBalanceAmount: { hidden: 'true' },
                      arrearsInterestPaymentBalance: { hidden: 'true' },
                      paymentWithoutArrears: { disabled: 'true' },
                      interestTypeDescription: { disabled: 'true' }
                    },
                  links: {}
                },
              unitedCreditTypeCode: 2710,
              arrearsExistanceSwitch: 0,
              arrearTotalAmount: 0,
              arrearsLinkageAmount: 0,
              arrearsAmount: 0,
              partyExplanationText: null,
              paymentWithoutArrears: 37383.16,
              arrearsStartDate: 0,
              formattedArrearsStartDate: null,
              arrearsInterestPaymentBalance: 0,
              arrearsInterestPercentage: 0,
              arrearsInterestCorrectionAmount: 0,
              debitInterestCorrectionAmount: 0,
              creditSerialNumber: 1,
              valueDate: 20170324,
              formattedValueDate: '2017-03-24T00:00:00.000Z',
              loanEndDate: 20230228,
              formattedLoanEndDate: '2023-02-28T00:00:00.000Z',
              interestTypeDescription: 'מ. מרווח פריים',
              originalInterestPercent: 11.4,
              currentInterestPercent: 11.4,
              formattedInterestPercentUpdatingDate: '2020-04-10T00:00:00.000Z',
              interestPercentUpdatingDate: 20200410,
              linkageTypeDescription: null,
              loanBalanceAmount: 37383.16,
              actualPrincipalBalance: 37047.6,
              amortizationSchedulePrincipalBalance: 37047.6,
              interestAmount: 335.56,
              principalPaymentsNumberBalance: 17,
              originalPrincipalPaymentsNumber: 71,
              interestPaymentsNumberBalance: 17,
              originalInterestPaymentsNumber: 71,
              interestNextPaymentNumber: 55,
              principalNextPaymentNumber: 55,
              messages: [{ messageCode: 0 }, { messageCode: 0 }]
            },
          structType: 'loan'
        }
      ],
      [
        {
          account: {
            balance: -37383.16,
            capitalization: true,
            endDateOffset: 2167,
            endDateOffsetInterval: 'day',
            id: '1-2710',
            instrument: 'ILS',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 11.4,
            startBalance: 122000,
            startDate: new Date('2017-03-24T00:00:00.000+02:00'),
            syncIds: [
              '1-2710'
            ],
            title: 'אַשׁרַאי',
            type: 'loan'
          },
          mainProduct: null
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
