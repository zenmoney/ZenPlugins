import { convertAccounts } from '../../../legacy/converters'
import { FetchedAccounts } from '../../../legacy/models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'account',
          product: {
            id: 9777161,
            coreAccountId: 7186393,
            primary: false,
            canBePrimary: false,
            hidden: false,
            friendlyName: 'პრაიმ ბარათი',
            iban: 'GE02TB7332545064100049',
            displayChildCard: false,
            productPartyContractId: 38179308,
            subType: 'A_200_27',
            subTypeText: 'Ertguli Classic',
            currency: 'GEL',
            priority: 1,
            availableBalance: 10,
            paymentOperationTypeContexts: [
              { code: null, operationType: '4.31.01.06-01', context: null },
              { code: null, operationType: '4.31.01.11-01', context: null },
              { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
              { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
              { code: null, operationType: '4.31.01.17-01', context: null },
              { code: null, operationType: '4.31.03.02-01', context: null },
              { code: null, operationType: '4.31.03.06-01', context: null },
              { code: null, operationType: '4.31.03.11-01', context: null }
            ],
            accountMatrixCategorisations: ['CREDIT_CARDS'],
            externalAccountId: '811369843'
          }
        }
      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: [
        {
          iban: 'GE02TB7332545064100049',
          displayChildCard: false,
          cards: [
            {
              tibcoCard: {
                id: '1004338602',
                cardType: 'VISA ERTGULI CLASSIC',
                cardholderName: 'GIGA CHKHAIDZE',
                cardholderId: '1693325',
                userIsCardHolder: false,
                cardNumber: '3086',
                expirationDate: 1761854400000,
                cardStatusCode: 'C_0',
                cardStatusText: 'Active',
                cardPicture: '210',
                blockedAmount: 10,
                availableAmount: 2000,
                availableAmountInGel: 2000,
                availableBalanceForCash: 2000,
                availableBalanceForCashInGel: 2000,
                priorityCurrency: 'GEL',
                renewApplication: false,
                productId: '61',
                renewalAllowed: true,
                pinResetAllowed: true,
                paySticker: false,
                accountName: 'პრაიმ ბარათი',
                vertical: false,
                harmPaymentRestrictionPossibility: true,
                harmPaymentRestriction: false
              },
              blockedMovements: []
            }
          ]
        }
      ],
      creditCards: [
        {
          id: 9777161,
          coreAccountId: 7186393,
          primary: false,
          canBePrimary: false,
          hidden: false,
          friendlyName: 'პრაიმ ბარათი',
          iban: 'GE02TB7332545064100049',
          displayChildCard: false,
          ibanAccountIds: [9777161],
          subType: 'A_200_27',
          subTypeText: 'Ertguli Classic',
          currency: 'GEL',
          creditLimit: -2000,
          creditLimitCheckDate: 2840817600000,
          availableBalances: [{ amount: 10, currency: 'GEL' }],
          invoiceDataUnavailable: false,
          invoiceDataUnavailableReason: null,
          validForPPIInsuranceApplication: false,
          invoiceCreditType: '2006',
          invoiceCreditTypeText: 'Prime Card',
          invoiceCreditTypeGroup: 'PRIME_CARD',
          invoiceCreditLimit: 2000,
          invoiceCreditLimitExpireDate: 2840817600000,
          invoiceBillingDate: 1683489600000,
          invoicePrincipalDue: 0,
          invoiceInterestDue: 0,
          invoicePenalty: 0,
          invoiceTotalPayment: 0,
          invoiceMinimumObligatoryPaymentDue: 0,
          invoicePrincipalDueFullDebt: null,
          invoiceInterestDueFullDebt: null,
          invoicePenaltyFullDebt: null,
          invoiceTotalPaymentFullDebt: null,
          invoiceDueDate: 1685649600000,
          invoiceZeroInterestRateAmount: 0,
          invoicePaymentToUseZeroInterestRate: 0,
          invoiceCreditLimitCurrency: 'GEL',
          invoiceInterestRate: 18,
          invoiceHasDebtOverdue: false,
          invoiceCashLimit: 2000,
          invoiceFeesDue: 0,
          invoiceFeesDueForFullDebtRepayment: null,
          invoiceInterestForCash: 36,
          invoiceNextBillingDate: 1686168000000,
          invoiceBillingScheduleEndOfMonth: false,
          invoiceBillingScheduleBillingDay: 8,
          invoiceBillingScheduleIntervalType: 'month',
          invoiceBillingScheduleIntervalValue: 1,
          invoicePaymentDueToUseZeroPercentRateOnlyForInstallment: 0,
          invoiceUsedCreditAmountOnCurrentDate: 0,
          invoiceUsedInstallmentAmountOnCurrentDate: 0,
          invoiceUsedCreditAmountOnBillingDate: 0,
          invoiceUsedInstallmentAmountOnBillingDate: 0,
          paymentOperationTypeContexts: [
            { code: null, operationType: '4.31.01.06-01', context: null },
            { code: null, operationType: '4.31.01.11-01', context: null },
            { code: null, operationType: '4.31.01.16-01', context: 'CREDIT' },
            { code: null, operationType: '4.31.01.16-01', context: 'DEBIT' },
            { code: null, operationType: '4.31.01.17-01', context: null },
            { code: null, operationType: '4.31.03.02-01', context: null },
            { code: null, operationType: '4.31.03.06-01', context: null },
            { code: null, operationType: '4.31.03.11-01', context: null }
          ],
          priorityCurrency: 'GEL',
          availableBalanceInPriorityCurrency: 10,
          availableBalanceInGel: 10,
          currencyCode: 'GEL'
        }
      ]
    },
    [
      {
        account: {
          available: 10,
          creditLimit: -2000,
          gracePeriodEndDate: new Date('2023-06-08T00:00:00+04:00'),
          id: '7186393',
          instrument: 'GEL',
          syncIds: [
            'GE02TB7332545064100049',
            '3086'
          ],
          title: 'პრაიმ ბარათი',
          totalAmountDue: 0,
          type: 'ccard'
        },
        coreAccountId: 7186393,
        holdTransactions: [],
        tag: 'card'
      }
    ]
  ]
])('converts credit card', (apiAccounts: unknown, product: unknown) => {
  const result = convertAccounts(apiAccounts as FetchedAccounts)
  expect(result).toEqual(product)
})
