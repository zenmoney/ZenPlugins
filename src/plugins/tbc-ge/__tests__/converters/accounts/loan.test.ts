import { convertAccounts } from '../../../legacy/converters'
import { FetchedAccounts } from '../../../legacy/models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'loan',
          product:
            {
              id: '11931821',
              totalLoanAmount: 10150,
              currencyText: 'GEL',
              currencyCode: 'GEL',
              interestRate: 16,
              statusText: 'Current',
              statusCode: 'LN_60',
              typeText: 'Fast consumer loan',
              typeValidForPPIInsuranceApplication: true,
              typeCode: '76',
              endDate: 1772395200000,
              friendlyName: null,
              outstandingPrincipalAmount: 9553.35,
              outstandingPrincipalAmountInGel: 9553.35,
              unusedAmount: null,
              hasDebt: false,
              customerRole: 'BORROWER',
              approvementDate: 1648670400000,
              numberOfUnpaidInstallments: 45,
              lastPaymentDate: 1772395200000,
              paymentDay: 2,
              activateRepayment: null,
              activateTrancheDisb: false,
              showPaymentDayExplanationMark: false,
              contractNumber: '2708834-11931821',
              nextPaymentDate: 1656878400000
            }
        }
      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: -9553.35,
          capitalization: true,
          endDateOffset: 1432,
          endDateOffsetInterval: 'day',
          id: '11931821',
          instrument: 'GEL',
          payoffInterval: 'month',
          payoffStep: 1,
          percent: 16,
          startBalance: 10150,
          startDate: new Date('2022-03-31T00:00:00.000+04:00'),
          syncIds: [
            '2708834-11931821'
          ],
          title: 'Fast consumer loan',
          type: 'loan'
        },
        tag: 'loan'
      }
    ]
  ]
])('converts loan', (apiAccounts: unknown, product: unknown) => {
  expect(convertAccounts(apiAccounts as FetchedAccounts)).toEqual(product)
})
