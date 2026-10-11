import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          metadata: {
            attributes: {
              renewalCounter: {
                hidden: 'true'
              },
              actualCurrencyRate: {
                hidden: 'true'
              },
              lastIndexRate: {
                hidden: 'true'
              },
              endExitDate: {
                hidden: 'true'
              },
              basicIndexValue: {
                hidden: 'true'
              },
              basicCurrencyRate: {
                hidden: 'true'
              },
              standingOrderAmount: {
                hidden: 'true'
              },
              renewalDescription: {
                hidden: 'true'
              },
              linkagePercent: {
                hidden: 'true'
              },
              ratePercentFactor: {
                hidden: 'true'
              },
              fixedInterestRate: {
                hidden: 'true'
              }
            },
            links: {}
          },
          shortProductName: 'פר"י',
          principalAmount: 30000.14,
          revaluedTotalAmount: 30000.17,
          paymentDate: 20200830,
          statedAnnualInterestRate: 0.0,
          hebrewPurposeDescription: 'לא רלוונטי',
          objectiveAmount: 0.0,
          objectiveDate: 0,
          agreementOpeningDate: 20200601,
          eventWithdrawalAmount: 0.0,
          startExitDate: 20200601,
          periodUntilNextEvent: 4,
          requestedRenewalNumber: 0,
          interestBaseDescription: 'פריים',
          interestTypeDescription: 'משתנה',
          spreadPercent: -1.59,
          variableInterestDescription: '0.010%    = 1.590   -פ',
          adjustedInterest: 0.01,
          interestCalculatingMethodDescription: 'רבית דרבית יומי',
          interestCreditingMethodDescription: 'לעו"ש',
          interestPaymentDescription: '1   סוף פיקדון',
          nominalInterest: 0.01,
          depositSerialId: 1530001,
          linkageBaseDescription: null,
          productFreeText: null,
          partyTextId: 0,
          actualIndexRate: 0.0,
          interestTypeCode: 2,
          productNumber: 250,
          productPurposeCode: 0,
          detailedAccountTypeCode: 26,
          formattedEndExitDate: null,
          formattedPaymentDate: '2020-08-30T00:00:00.000Z',
          formattedObjectiveDate: null,
          formattedAgreementOpeningDate: '2020-06-01T00:00:00.000Z',
          formattedStartExitDate: '2020-06-01T00:00:00.000Z',
          lienDescription: null,
          withdrawalEnablingIndication: 1,
          renewalEnablingIndication: 0,
          standingOrderEnablingIndication: 0,
          additionEnablingIndication: 1,
          timeUnitDescription: 'ימים',
          formattedRevaluedTotalAmount: '₪ 30,000.17',
          warningExistanceIndication: 0,
          renewalDateExplanation: null,
          structType: 'deposit'
        }
      ],
      [
        {
          mainProduct: null,
          account: {
            id: '1530001',
            type: 'deposit',
            title: 'פר"י',
            instrument: 'ILS',
            syncID: [
              '1530001'
            ],
            balance: 30000.17,
            startBalance: 30000.14,
            startDate: new Date('2020-06-01T00:00:00+02:00'),
            percent: 0.01,
            capitalization: false,
            endDateOffset: 90,
            endDateOffsetInterval: 'day',
            payoffStep: 1,
            payoffInterval: null
          }
        }
      ]
    ],
    [
      [
        {
          metadata: {
            attributes: {
              grossCreditAmount: {
                hidden: 'true'
              },
              linkagePackageDescription: {
                hidden: 'true'
              },
              linkagePackageCode: {
                hidden: 'true'
              },
              interestPaymentFrequency: {
                hidden: 'true'
              }
            },
            links: {}
          },
          accountNumber: 219992,
          shortSavingDepositName: 'Save&Go',
          savingPeriod: 24,
          nextExitDate: 20200806,
          formattedNextExitDate: '2020-08-06T00:00:00.000Z',
          paymentDate: 20210903,
          formattedPaymentDate: '2021-09-03T00:00:00.000Z',
          principalAmount: 3740.0,
          revaluedBalance: 3742.59,
          withdrawalAmount: 3742.59,
          objectiveAmount: 0.0,
          objectiveDate: 0,
          formattedObjectiveDate: null,
          depositingMethodDescription: 'הפקדה רציפה',
          actualDepositingTotalNumber: 36,
          interestPaymentMethodDescription: 'רגיל',
          agreementOpeningDate: 20190903,
          formattedAgreementOpeningDate: '2019-09-03T00:00:00.000Z',
          partyTextId: 0,
          lienDescription: null,
          eventNumber: 19246001,
          detailedAccountTypeCode: 54,
          hebrewPurposeDescription: 'לא רלוונטי',
          productFreeText: null,
          warningExistanceIndication: 0,
          messages: [],
          productPurposeCode: 0,
          linkageTypeCode: 1,
          productNumber: 11111,
          standingOrderNumber: 0,
          collateralNumber: 0,
          depositingMethodCode: 1,
          interestPaymentMethodCode: 1,
          collateralAmount: 0.0,
          purposeAmount: 0.0,
          productImageCode: 0,
          statedAnnualInterestRate: 0.16,
          adjustedInterest: 0.16,
          periodicInterest: 0.0,
          baseInterestRate: 0.0,
          interestTypeCode: 0.0,
          occasionalDepositingEnablingSwitch: 0,
          standingOrderEnablingIndication: 0,
          additionEnablingIndication: 0,
          modificationIndication: 0,
          cancellationIndication: 0,
          withdrawalEnablingIndication: 1,
          agreementSerialId: 1,
          linkageTypeDescription: 'לא צמוד',
          structType: 'deposit'
        }
      ],
      [
        {
          mainProduct: null,
          account: {
            id: '20190903',
            type: 'checking',
            savings: true,
            title: 'Save&Go',
            instrument: 'ILS',
            syncID: [
              '20190903'
            ],
            balance: 3742.59
          }
        }
      ]
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
    expect(convertAccounts([...apiAccounts, ...apiAccounts])).toEqual(accounts)
    const changeIgnoredField = account => accounts[0].account.type === 'checking'
      ? { ...account, accountNumber: account.accountNumber + 1, eventNumber: account.eventNumber + 1 }
      : { ...account, productNumber: account.productNumber + 1 }
    expect(() => convertAccounts([...apiAccounts, ...apiAccounts.map(changeIgnoredField)])).toThrow('conflicting account identity')
    const fallbackRecords = apiAccounts.map(account => ({ ...account, depositSerialId: undefined }))
    expect(() => convertAccounts([...fallbackRecords, ...fallbackRecords.map(changeIgnoredField)])).toThrow('conflicting account identity')
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, revaluedTotalAmount: -5, revaluedBalance: -5 })))).toThrow(expect.objectContaining({ context: { field: 'revaluedTotalAmount/revaluedBalance', structType: accounts[0].account.type === 'checking' ? 'saving' : 'deposit' } }))
    for (const detailedAccountTypeCode of [undefined, 999]) {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, detailedAccountTypeCode })))).toThrow(/deposit currency/)
    }
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, linkageTypeCode: 2 })))).toThrow(expect.objectContaining({ context: { structType: 'deposit', field: 'detailedAccountTypeCode/linkageTypeCode' } }))
    for (const title of [undefined, null, '', '   ', 1]) {
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, shortProductName: title, shortSavingDepositName: title }))))
        .toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, title: plan.account.type === 'checking' ? 'חיסכון' : 'פיקדון' } })))
    }
    expect(convertAccounts(apiAccounts.map(account => ({ ...account, shortProductName: '  ', shortSavingDepositName: ' Sample title ' }))))
      .toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, title: 'Sample title' } })))
    if (accounts[0].account.type === 'deposit') {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, formattedPaymentDate: account.formattedAgreementOpeningDate })))).toThrow(expect.objectContaining({ context: { structType: 'deposit', field: 'formattedAgreementOpeningDate/formattedPaymentDate' } }))
      for (const principal of [0, -1]) {
        expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, principalAmount: principal })))).toThrow(/principal/)
      }
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, interestPaymentDescription: null })))).toThrow(/interest conditions/)
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, interestCreditingMethodDescription: 'UNKNOWN' })))).toThrow(/interest conditions/)
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, adjustedInterest: null })))).toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, percent: null } })))
      for (const rate of [undefined, NaN]) {
        expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, adjustedInterest: rate })))).toThrow(/amount/)
      }
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, depositSerialId: undefined })))).toEqual(accounts.map((plan, i) => ({ ...plan, account: { ...plan.account, id: String(apiAccounts[i].agreementOpeningDate), syncID: [String(apiAccounts[i].agreementOpeningDate)] } })))
    } else {
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, structType: 'saving' })))).toEqual(accounts)
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, structType: 'saving', linkageTypeCode: 2 })))).toThrow(expect.objectContaining({ context: { structType: 'saving', field: 'detailedAccountTypeCode/linkageTypeCode' } }))
    }
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, depositSerialId: undefined, agreementOpeningDate: undefined })))).toThrow(/identity/)
  })
})
