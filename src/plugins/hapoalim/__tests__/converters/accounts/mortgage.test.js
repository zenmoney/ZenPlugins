import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          mortgageLoanSerialId: 5204349370941,
          interestTypeDescription: 'קבועה',
          linkageTypeDescription: 'צמוד למדד',
          startDate: 0,
          formattedStartDate: null,
          calculatedEndDate: 20490610,
          formattedCalculatedEndDate: '2049-06-10T00:00:00.000Z',
          revaluedBalance: 62210.05,
          collectionMethodCode: 'ג',
          paymentAmount: 274.98,
          prepaymentCommissionTotalAmount: 0,
          arrearsAmount: 0,
          assetInsuranceCompanyName: 'מגדל איחוד-אישי לחיים',
          assetInsuranceTypeDescription: 'הסבת בטוח נכס',
          assetInsuranceAmount: 0,
          assetInsurancePaymentAmount: 0,
          insuranceAssetArea: 97,
          lifeInsuranceCompanyName: 'מגדל איחוד-אישי לחיים',
          lifeInsuranceTypeDescription: null,
          debitAccountsQuantity: 0,
          productLabel: null,
          bankNumber: 12,
          branchNumber: 290,
          accountNumber: 61938,
          subLoansCounter: 2,
          executingDate: 20190517,
          debitDayInMonth: 10,
          masavDebitDay: 0,
          formattedExecutingDate: '2019-05-17T00:00:00.000Z',
          subLoanData:
            [
              {
                subLoansSerialId: 201,
                startDate: 20190600,
                formattedStartDate: '2019-06-01T00:00:00.000',
                endDate: 20490500,
                formattedEndDate: '2049-05-01T00:00:00.000Z',
                revaluedBalance: 43123.2,
                subLoansPrincipalAmount: 44350,
                basicIndexValue: 216505.3163,
                validityInterestRate: 3,
                nextExitDate: 0,
                formattedNextExitDate: null,
                principalBalanceAmount: 42145.28,
                principalLinkageAmount: 900.08,
                amountAndLinkageOfPrincipal: 43045.36,
                interestAmount: 76.21,
                interestLinkageAmount: 1.63,
                interestAndLinkageTotalAmount: 77.84,
                amountAndLinkageOfInterestDeferred: 0,
                sumOfPrincipalAndCurrentLinkageAndDeferredLinkageAmount: 901.71,
                principalAndInterestAndInterestDeferredTotalAmount: 42221.49,
                deferredInterestAmount: 0,
                deferredInterestLinkageAmount: 0,
                executingDate: 20190517,
                formattedExecutingDate: '2019-05-17T00:00:00.000Z',
                calculatedEndDate: 20490610,
                formattedCalculatedEndDate: '2049-06-10T00:00:00.000Z'
              },
              {
                subLoansSerialId: 202,
                startDate: 20190600,
                formattedStartDate: '2019-06-01T00:00:00.000',
                endDate: 20490500,
                formattedEndDate: '2049-05-01T00:00:00.000Z',
                revaluedBalance: 19086.85,
                subLoansPrincipalAmount: 19630,
                basicIndexValue: 216505.3163,
                validityInterestRate: 3,
                nextExitDate: 0,
                formattedNextExitDate: null,
                principalBalanceAmount: 18654.01,
                principalLinkageAmount: 398.39,
                amountAndLinkageOfPrincipal: 19052.4,
                interestAmount: 33.73,
                interestLinkageAmount: 0.72,
                interestAndLinkageTotalAmount: 34.45,
                amountAndLinkageOfInterestDeferred: 0,
                sumOfPrincipalAndCurrentLinkageAndDeferredLinkageAmount: 399.11,
                principalAndInterestAndInterestDeferredTotalAmount: 18687.74,
                deferredInterestAmount: 0,
                deferredInterestLinkageAmount: 0,
                executingDate: 20190517,
                formattedExecutingDate: '2019-05-17T00:00:00.000Z',
                calculatedEndDate: 20490610,
                formattedCalculatedEndDate: '2049-06-10T00:00:00.000Z'
              }
            ],
          messages:
            [
              {
                messageDescription: 'פרמיה חודשית נגבית רק אם הביטוח נעשה באמצעות הבנק',
                messageCode: 8
              }
            ],
          structType: 'mortgage'
        }
      ],
      [
        {
          account: {
            balance: -43123.2,
            capitalization: true,
            endDateOffset: 359,
            endDateOffsetInterval: 'month',
            id: '5204349370941-201',
            instrument: 'ILS',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 3,
            startBalance: 44350,
            startDate: new Date('2019-06-01T00:00:00.000+02:00'),
            syncIds: [
              '5204349370941-201'
            ],
            title: 'משכנתא',
            type: 'loan'
          },
          mainProduct: null
        },
        {
          account: {
            balance: -19086.85,
            capitalization: true,
            endDateOffset: 359,
            endDateOffsetInterval: 'month',
            id: '5204349370941-202',
            instrument: 'ILS',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 3,
            startBalance: 19630,
            startDate: new Date('2019-06-01T00:00:00.000+02:00'),
            syncIds: [
              '5204349370941-202'
            ],
            title: 'משכנתא',
            type: 'loan'
          },
          mainProduct: null
        }
      ]
    ],
    [
      [
        {
          mortgageLoanSerialId: 5208349370834,
          interestTypeDescription: 'קבועה',
          linkageTypeDescription: 'צמוד למדד',
          startDate: 0,
          formattedStartDate: null,
          calculatedEndDate: 20490610,
          formattedCalculatedEndDate: '2049-06-10T00:00:00.000Z',
          revaluedBalance: 71598.49,
          collectionMethodCode: 'ר',
          paymentAmount: 316.46,
          prepaymentCommissionTotalAmount: 0,
          arrearsAmount: 0,
          assetInsuranceCompanyName: null,
          assetInsuranceTypeDescription: 'הסבת בטוח נכס',
          assetInsuranceAmount: 0,
          assetInsurancePaymentAmount: 0,
          insuranceAssetArea: 97,
          lifeInsuranceCompanyName: 'מגדל איחוד-אישי לחיים',
          lifeInsuranceTypeDescription: null,
          debitAccountsQuantity: 0,
          productLabel: null,
          bankNumber: 12,
          branchNumber: 290,
          accountNumber: 61938,
          subLoansCounter: 1,
          executingDate: 20190517,
          debitDayInMonth: 10,
          masavDebitDay: 0,
          formattedExecutingDate: '2019-05-17T00:00:00.000Z',
          subLoanData:
            [
              {
                subLoansSerialId: 201,
                startDate: 20190600,
                formattedStartDate: '2019-06-01T00:00:00.000',
                endDate: 20490500,
                formattedEndDate: '2049-05-01T00:00:00.000Z',
                revaluedBalance: 71598.49,
                subLoansPrincipalAmount: 73635,
                basicIndexValue: 216505.3163,
                validityInterestRate: 3,
                nextExitDate: 0,
                formattedNextExitDate: null,
                principalBalanceAmount: 69974.83,
                principalLinkageAmount: 1494.43,
                amountAndLinkageOfPrincipal: 71469.26,
                interestAmount: 126.53,
                interestLinkageAmount: 2.7,
                interestAndLinkageTotalAmount: 129.23,
                amountAndLinkageOfInterestDeferred: 0,
                sumOfPrincipalAndCurrentLinkageAndDeferredLinkageAmount: 1497.13,
                principalAndInterestAndInterestDeferredTotalAmount: 70101.36,
                deferredInterestAmount: 0,
                deferredInterestLinkageAmount: 0,
                executingDate: 20190517,
                formattedExecutingDate: '2019-05-17T00:00:00.000Z',
                calculatedEndDate: 20490610,
                formattedCalculatedEndDate: '2049-06-10T00:00:00.000Z'
              }
            ],
          messages:
            [
              {
                messageDescription: 'פרמיה חודשית נגבית רק אם הביטוח נעשה באמצעות הבנק',
                messageCode: 8
              }
            ],
          structType: 'mortgage'
        }
      ],
      [
        {
          account: {
            balance: -71598.49,
            capitalization: true,
            endDateOffset: 359,
            endDateOffsetInterval: 'month',
            id: '5208349370834-201',
            instrument: 'ILS',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 3,
            startBalance: 73635,
            startDate: new Date('2019-06-01T00:00:00.000+02:00'),
            syncIds: [
              '5208349370834-201'
            ],
            title: 'משכנתא',
            type: 'loan'
          },
          mainProduct: null
        }
      ]
    ]
  ])('converts mortgage', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
    expect(convertAccounts([...apiAccounts, ...apiAccounts])).toEqual(accounts)
    for (const account of apiAccounts.filter(account => account.subLoanData.length > 1)) {
      const partial = { ...account, subLoansCounter: 1, subLoanData: account.subLoanData.slice(0, 1), revaluedBalance: account.subLoanData[0].revaluedBalance }
      expect(() => convertAccounts([account, partial])).toThrow('conflicting account identity')
    }
    // Within one mortgage, repeated part IDs must not collapse half the declared debt.
    expect(() => convertAccounts(apiAccounts.map(account => {
      const part = account.subLoanData[0]
      return { ...account, subLoansCounter: 2, subLoanData: [{ ...part }, { ...part }], revaluedBalance: 2 * part.revaluedBalance }
    }))).toThrow(expect.objectContaining({ context: { structType: 'mortgage', field: 'subLoanData.subLoansSerialId' } }))
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map((part, index) => ({ ...part, revaluedBalance: index === 0 ? 1000 : part.revaluedBalance })) }))))
      .toThrow(expect.objectContaining({ context: { structType: 'mortgage', field: 'revaluedBalance' } }))
    expect(convertAccounts(apiAccounts.map(account => ({ ...account, revaluedBalance: 0, subLoanData: account.subLoanData.map(part => ({ ...part, revaluedBalance: 0 })) }))))
      .toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, balance: 0 } })))
    // A missing parent total cannot establish a reconciliation invariant.
    for (const revaluedBalance of [undefined, null]) {
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, revaluedBalance })))).toEqual(accounts)
    }
    for (const revaluedBalance of ['x', NaN, Infinity, {}, -5]) {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, revaluedBalance })))).toThrow(expect.objectContaining({ context: { field: 'revaluedBalance', structType: 'mortgage' } }))
    }
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(part => ({ ...part, revaluedBalance: -5 })) })))).toThrow(expect.objectContaining({ context: { field: 'revaluedBalance', structType: 'mortgage' } }))
    for (const title of [undefined, null, '', '   ', 5]) {
      expect(convertAccounts(apiAccounts.map(account => ({ ...account, productLabel: title }))))
        .toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, title: 'משכנתא' } })))
    }
    expect(convertAccounts(apiAccounts.map(account => ({ ...account, productLabel: ' Sample mortgage ' }))))
      .toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, title: 'Sample mortgage' } })))
    for (const part of [null, [], 'invalid', 1]) {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(() => part) })))).toThrow('unexpected mortgage part')
    }
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, mortgageLoanSerialId: undefined })))).toThrow(/identity/)
    expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(part => ({ ...part, subLoansSerialId: undefined })) })))).toThrow(/identity/)
    expect(convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(part => ({ ...part, validityInterestRate: null })) })))).toEqual(accounts.map(plan => ({ ...plan, account: { ...plan.account, percent: null } })))
    for (const rate of [undefined, NaN]) {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(part => ({ ...part, validityInterestRate: rate })) })))).toThrow(/amount/)
    }
    for (const principal of [0, -1]) {
      expect(() => convertAccounts(apiAccounts.map(account => ({ ...account, subLoanData: account.subLoanData.map(part => ({ ...part, subLoansPrincipalAmount: principal })) })))).toThrow(/principal/)
    }
  })
})
