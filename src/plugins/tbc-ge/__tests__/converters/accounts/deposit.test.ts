import { convertAccounts } from '../../../converters'
import { FetchedAccounts } from '../../../models'

it.each([
  [
    {
      accounts: [
        {
          tag: 'deposit',
          product:
            {
              id: 14910190,
              coreAccountId: 11225773,
              primary: false,
              canBePrimary: false,
              hidden: false,
              friendlyName: 'My Deposit',
              iban: 'GE54TB7511736615001234',
              displayChildCard: false,
              productPartyContractId: 72266614,
              subType: 'A_32_40',
              subTypeText: 'Term',
              currency: 'USD',
              priority: 0,
              availableBalance: 125000,
              paymentOperationTypeContexts: [],
              accountMatrixCategorisations: ['DEPOSITS'],
              externalAccountId: '815760962'
            },
          depositProduct:
            {
              id: 5750726,
              subType: 60,
              subTypeText: 'Term Deposit',
              friendlyName: 'My Deposit',
              currentAmount: 125000,
              targetAmount: null,
              currency: 'USD',
              externalAccountId: 815760962,
              accountNo: 'GE54TB7511736615001234',
              targetAmountIsReached: null,
              currentAmountInGel: 370275,
              addAmountPossibility: false,
              closingInProgress: false
            },
          details:
            {
              depositDetails:
                {
                  id: 5750726,
                  date: 1655064000000,
                  startDate: 1652904000000,
                  endDate: 1716062400000,
                  plannedTotalInterestAmount: 3755.13,
                  guardName: null,
                  addAmountPossibility: false,
                  rollOver: false,
                  accountNo: 'GE54TB7511736615001234',
                  existingEffectiveInterestRate: 1.49,
                  coreAccountId: 0,
                  paymentOperationTypeContexts: []
                },
              interestCalculation:
                {
                  interestRate: 1.5,
                  plannedTotalInterestAmount: 3755.13,
                  accruedInterest: 123.28,
                  paidInterest: null,
                  interestPaymentFrequency: 0
                },
              interestCalculationUponCancellation:
                {
                  interestRate: 1.5,
                  annulmentInterestRate: 0.1,
                  annulmentInterest: 8.56,
                  currentInterest: 0,
                  amount: 125000,
                  totalAmount: 125008.56
                }
            }
        }
      ],
      debitCardsWithBlockations: [],
      creditCardsWithBlockations: []
    },
    [
      {
        account: {
          balance: 125000,
          capitalization: true,
          endDateOffset: 2,
          endDateOffsetInterval: 'year',
          id: '11225773',
          instrument: 'USD',
          payoffInterval: 'month',
          payoffStep: 1,
          percent: 1.49,
          startBalance: 125000,
          startDate: new Date('2022-05-19T00:00:00.000+04:00'),
          syncIds: [
            'GE54TB7511736615001234'
          ],
          title: 'My Deposit',
          type: 'deposit'
        },
        depositId: 5750726,
        tag: 'deposit'
      }
    ]
  ]
])('converts deposit', (apiAccounts: unknown, product: unknown) => {
  expect(convertAccounts(apiAccounts as FetchedAccounts)).toEqual(product)
})
