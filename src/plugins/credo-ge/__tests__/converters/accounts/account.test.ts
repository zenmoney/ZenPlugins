import { convertAccounts } from '../../../converters'
import { Deposit } from '../../../models'

describe('convertAccounts', () => {
  it.each([
    // account without card
    [
      [
        {
          accountId: 27070426,
          accountNumber: 'GE12CD0360000027070426',
          account: 'ალეკსეი ლუკომსკი',
          currency: 'GEL',
          categoryId: 1001,
          category: 'მიმდინარე',
          hasCard: true,
          status: 'გახსნილი',
          type: 'CURRENT',
          availableBalance: 31.4,
          currencyPriority: 0,
          availableBalanceEqu: 31.4,
          isDefault: false,
          isHidden: true,
          cssAccountId: 1015155
        }
      ],
      [],
      [],
      [],
      [
        {
          id: '27070426',
          title: 'GE12CD0360000027070426GEL',
          type: 'ccard',
          instrument: 'GEL',
          syncIds: ['GE12CD0360000027070426GEL', '27070426'],
          balance: 31.4,
          available: 31.4,
          savings: false
        }
      ]
    ],
    // account with card
    [
      [
        {
          hasActiveWallet: false,
          accountId: 37554441,
          accountNumber: 'GE62CD0360000037554441',
          account: 'ალეკსეი ლუკომსკი',
          currency: 'GEL',
          categoryId: 1001,
          category: 'მიმდინარე',
          hasCard: true,
          status: 'გახსნილი',
          type: 'CURRENT',
          cssAccountId: 1492879,
          availableBalance: 0,
          currencyPriority: 0,
          availableBalanceEqu: 0,
          isDefault: false,
          isHidden: false,
          rate: 0,
          activationDate: '2023-10-10T17:48:03',
          allowedOperations: [
            'TRN_BETWEEN_DEBIT',
            'TRN_BETWEEN_CREDIT',
            'TRN_DEBIT',
            'TRN_CREDIT',
            'TRN_EXTERNAL_DEBIT',
            'UTILITY',
            'ORDER_CARD',
            'REMITTANCE',
            'TRN_LOAN_CREDIT',
            'DEPOSIT_CREATE',
            'DEPOSIT_TOPUP'
          ]
        }
      ],
      [
        {
          cardId: 9301666,
          cardNumber: '410180******1211',
          cardCurrency: 'GEL',
          cardNickName: 'Visa Digital Card',
          cardImageId: '44',
          cardImageAddress: '/Images/CardDesign/44.png',
          cardStatusId: 1,
          cardProduct: 'Debit Card',
          cardAvailableAmount: 0,
          cardBlockedAmount: 0,
          cardExpireShortDate: '10/26',
          cardStatus: 'აქტიური',
          cardExpireDate: '2026-10-01T00:00:00',
          accountNumber: 'GE62CD0360000037554441',
          isDigitalCard: true
        }
      ],
      [],
      [],
      [
        {
          id: '37554441',
          available: 0,
          balance: 0,
          instrument: 'GEL',
          savings: false,
          syncIds: [
            'GE62CD0360000037554441GEL',
            '37554441',
            '410180******1211'
          ],
          title: 'GE62CD0360000037554441GEL',
          type: 'ccard'
        }
      ]
    ],
    // deposit
    [
      [],
      [],
      [
        {
          targetingImageUrl: '/Images/DepositTargetLogos/1.png',
          targetingName: 'General',
          targetingId: 1,
          targetingCardUrl: '/Images/DepositTargetLogos/1_card.png',
          hasActiveWallet: false,
          availableToTopUp: true,
          balanceEqu: 2975.96,
          depositNickName: 'reserve',
          depositType: 'მოთხოვნამდე ანაბარი',
          depositBalance: 1120.89,
          depositCurrency: 'USD',
          accruedInterestAmount: 0,
          contractN: 'GE02CD1360030027791234',
          depositInterestRate: 0.5,
          relatedAccount: null,
          openningDate: '2022-04-19T16:39:10',
          closeDate: null,
          interestAmountIfCanceled: null,
          productId: 10,
          type: 'SAVING_DEPOSIT',
          prolongationType: 'NONE',
          isProlongable: false,
          t24AccountId: 28893452,
          cssAccountId: 2046760
        }
      ],
      [],
      [
        {
          id: '2046760',
          balance: 1120.89,
          capitalization: true,
          endDateOffset: 1,
          endDateOffsetInterval: 'month',
          instrument: 'USD',
          payoffInterval: 'month',
          payoffStep: 1,
          percent: 0.5,
          startBalance: 1120.89,
          startDate: new Date('2022-04-19T11:09:10.000Z'),
          syncIds: [
            '2046760',
            'GE02CD1360030027791234'
          ],
          title: 'GE02CD1360030027791234',
          type: 'deposit'
        }
      ]
    ],
    // empty data
    [[], [], [], [], []]
  ])('converts current account', (apiAccounts, cards, deposits, loans, accounts) => {
    expect(convertAccounts(apiAccounts, cards, deposits as Deposit[], loans)).toEqual(accounts)
  })
})
