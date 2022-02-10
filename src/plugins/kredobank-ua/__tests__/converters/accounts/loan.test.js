import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          id: '14103320',
          providerId: 'credit',
          legalNumber: 'CL-323273',
          subproductCode: 'individualK_Готівка VIP+ 100-500 тис.',
          mainAccountNumber: '29098270103013',
          mainAccountCurrency: 'UAH',
          balance: 19724274,
          startDate: '2021-07-29',
          endDate: '2026-07-28',
          productTitle: 'Готівка VIP+ 100-500 тис.',
          productSystemKey: 'individual_loan',
          iban: 'UA183253650000029098270103013',
          currentInterestRate: 29.99,
          showAndOperationRule:
            {
              mainScreenShowAllowed: true,
              redirectToParentObjectAllowed: true,
              debitAllowed: true,
              debitAllowedAtOperationsList:
                ['CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'EXCHANGE_CURRENCY',
                  'MAKE_CONTRACT'],
              creditAllowed: true,
              creditAllowedAtOperationsList:
                ['CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'EXCHANGE_CURRENCY',
                  'MAKE_CONTRACT']
            },
          penalty: 0,
          dealAmount: 20000000,
          ownerTaxId: '3139205891',
          bankName: 'АТ "КРЕДОБАНК"',
          tempBalance: 0,
          isDebitBlocked: 'false',
          replenishmentPurpose: 'Погашення кредиту згідно кредитного договору № CL-323273 від 29.07.2021',
          rateId: '',
          bankId: '325365',
          ownerName: 'Качало Богдан Ігорович',
          unUsedAmount: '275726',
          fine: '0',
          ibanForReplenishment: 'UA18 325365 00000 29098270103013',
          totalDept: 20217216,
          unauthorizedDept:
            {
              totalAmount: 0,
              interestAmount: 0,
              bodyAmount: 0,
              comissionAmount: 0,
              paymentDate: null
            },
          nextPaymentAmount:
            {
              totalAmount: 652600,
              interestAmount: 492942,
              bodyAmount: 159658,
              comissionAmount: 0,
              paymentDate: '2021-10-29T00:00:00.000+00:00'
            },
          isAddAmountForRepayment: 'true',
          isActiveProduct: 'true'
        }
      ],
      [
        {
          account: {
            balance: -197242.74,
            capitalization: true,
            endDateOffset: 5,
            endDateOffsetInterval: 'year',
            id: '14103320',
            instrument: 'UAH',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 29.99,
            startBalance: 200000,
            startDate: new Date('2021-07-29T00:00:00.000+03:00'),
            syncIds: [
              'UA183253650000029098270103013'
            ],
            title: 'Готівка VIP+ 100-500 тис.',
            type: 'loan'
          },
          products: [
            {
              contractType: 'credit',
              id: '14103320'
            }
          ]
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
