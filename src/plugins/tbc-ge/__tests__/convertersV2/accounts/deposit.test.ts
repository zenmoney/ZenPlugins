import { convertDepositV2 } from '../../../converters'
import { DepositDataV2 } from '../../../models'
import { AccountType } from '../../../../../types/zenmoney'

it.each([
  [
    {
      deposit: {
        id: 7978967,
        subType: 93,
        typeText: 'Deposit',
        subTypeText: 'My Goal',
        friendlyName: 'Family vacation',
        currentAmount: 10000,
        targetAmount: null,
        currency: 'USD',
        externalAccountId: 822946793,
        accountNo: 'GE69TB7092836615000033',
        targetAmountIsReached: null,
        currentAmountInGel: 26979,
        addAmountPossibility: true,
        closingInProgress: false,
        categoryType: 'MyGoal',
        teamUpIsInGroup: null,
        teamUpGroupImageUrl: null
      },
      details: {
        depositDetails: {
          id: 7978967,
          date: 1766088000000,
          startDate: 1766001600000,
          endDate: 1773777600000,
          plannedTotalInterestAmount: 54.88,
          guardName: null,
          addAmountPossibility: null,
          rollOver: false,
          accountNo: 'GE69TB7092836615000033',
          existingEffectiveInterestRate: null,
          coreAccountId: 0,
          canBeCanceled: false,
          currency: 'USD',
          agreementNo: '000100497-008300928',
          categoryType: 'MyGoal',
          goal: null,
          hasGoal: false,
          standingOrders: [],
          isStandingOrderable: true,
          isGoalAddable: null,
          paymentOperationTypeContexts: null
        },
        interestCalculation: {
          interestRate: 2.25,
          plannedTotalInterestAmount: 54.88,
          accruedInterest: 0.01,
          paidInterest: null,
          interestPaymentFrequency: 0
        },
        interestCalculationUponCancellation: {
          interestRate: 2.25,
          annulmentInterestRate: 0.1,
          annulmentInterest: 0,
          currentInterest: 0,
          amount: 10000,
          totalAmount: 10000,
          cashCoverAmount: 8000,
          lostInterest: 54.88
        }
      }
    },
    {
      account: {
        id: '822946793',
        type: AccountType.deposit,
        title: 'Family vacation',
        instrument: 'USD',
        syncIds: ['GE69TB7092836615000033'],
        balance: 10000,
        startDate: new Date('2025-12-18T00:00:00.000+04:00'),
        startBalance: 10000,
        capitalization: true,
        percent: null,
        endDateOffsetInterval: 'month',
        endDateOffset: 3,
        payoffInterval: 'month',
        payoffStep: 1
      }
    }
  ]
])('converts depositV2', (apiAccount: unknown, product) => {
  expect(convertDepositV2(apiAccount as DepositDataV2)).toEqual(product)
})
