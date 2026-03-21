import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          accountAgreementOpeningDate: 0,
          accountClosingReasonCode: 0,
          accountDealDate: 0,
          accountNumber: 277819,
          accountUpdateDate: 0,
          bankNumber: 12,
          branchNumber: 702,
          branchTypeCode: 2,
          extendedBankNumber: 912,
          kodHarshaatPeilut: 1,
          metegDoarNet: 0,
          mymailEntitlementSwitch: 1,
          partyAccountInvolvementCode: 1,
          partyPreferredIndication: 0,
          productLabel: 'פלדמן סופי עדי',
          serviceAuthorizationDesc: 'פעולות ומידע',
          details: {
            currentAccountCreditFrame: 0.0,
            currentBalance: 51918.59,
            dailyInterestDepositTotalBalance: 0.0,
            foreignCurrencyDebtAmount: 0.0,
            formattedCurrentAccountCreditFrame: '₪ 0.00',
            formattedCurrentBalance: '₪ 51,918.59',
            formattedDailyInterestDepositTotalBalance: '₪ 0.00',
            formattedForeignCurrencyDebtAmount: '₪ 0.00',
            formattedIsraeliSecurityiesPortfolioTotalValue: '₪ 0.00',
            formattedValidityDate: '26/05/2020',
            israeliSecurityiesPortfolioTotalValue: 0.0,
            validityDate: 20200526
          },
          structType: 'checking'
        }
      ],
      [
        {
          mainProduct: {
            id: '12-702-277819',
            type: 'account'
          },
          account: {
            id: '12-702-277819',
            type: 'checking',
            title: '*7819 חשבון נוכחי',
            instrument: 'ILS',
            syncID: [
              '12-702-277819'
            ],
            balance: 51918.59,
            creditLimit: 0
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
