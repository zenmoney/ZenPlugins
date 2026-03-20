import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          mainProductId: '12-702-277819',
          metadata: {
            messages: [
              {
                messageDescription: '" לתשומת לבך: לא נמצאו תנועות מתחת לקו בחשבון "',
                messageCode: 11040,
                severity: 'I'
              }, {
                messageDescription: '* לא נמצאו תנועות בטווח התאריכים שנבחר',
                messageCode: 330,
                severity: 'I'
              }
            ],
            links: {}
          },
          formattedValidityDate: '2020-08-05T00:00:00.000Z',
          outputArrayRecordSum2: 1,
          displayedRevaluationCurrencyCode: 1,
          rateFixingDescription: 'שער יציג',
          currancyBalanceData: null,
          currencyCode: {
            code: 19,
            values: [
              {
                currencyCode: 19,
                currencyShortedDescription: 'דולר',
                currencySwiftCode: 'USD',
                currencyLongDescription: 'דולר ארה"ב'
              }
            ]
          },
          balancesAndTransactionsCurrencyCombo: {
            currencyCode: {
              code: 1,
              values: [
                {
                  systemCode: 320,
                  bankNumber: 12,
                  currencyCode: 1,
                  currencyShortedDescription: 'ש"ח',
                  currencySwiftCode: 'ILS',
                  currencyLongDescription: 'שקל חדש',
                  compKey: '320;012;001;',
                  currencyUnitsQuantity: 1
                }, {
                  systemCode: 320,
                  bankNumber: 12,
                  currencyCode: 19,
                  currencyShortedDescription: 'דולר',
                  currencySwiftCode: 'USD',
                  currencyLongDescription: 'דולר ארה"ב',
                  compKey: '320;012;019;',
                  currencyUnitsQuantity: 1
                }, {
                  systemCode: 320,
                  bankNumber: 12,
                  currencyCode: 100,
                  currencyShortedDescription: 'אירו',
                  currencySwiftCode: 'EUR',
                  currencyLongDescription: 'אירו',
                  compKey: '320;012;100;',
                  currencyUnitsQuantity: 1
                }, {
                  systemCode: 320,
                  bankNumber: 12,
                  currencyCode: 27,
                  currencyShortedDescription: 'לישט',
                  currencySwiftCode: 'GBP',
                  currencyLongDescription: 'לירה שטרלינג',
                  compKey: '320;012;027;',
                  currencyUnitsQuantity: 1
                }, {
                  systemCode: 320,
                  bankNumber: 12,
                  currencyCode: 35,
                  currencyShortedDescription: 'פר"ש',
                  currencySwiftCode: 'CHF',
                  currencyLongDescription: 'פרנק שוויצרי',
                  compKey: '320;012;035;',
                  currencyUnitsQuantity: 1
                }
              ]
            }
          },
          detailedAccountTypeCode: {
            code: 142,
            values: [
              {
                detailedAccountTypeCode: 142,
                detailedAccountTypeShortedDescription: 'עו"ש פמ"ח'
              }
            ]
          },
          foreignCurrencyBalancesData: [
            {
              totalRevaluatedCurrentBalance: 0.03,
              currencyDescription: 'שקל חדש',
              revaluationCurrencyCode: 1
            }, {
              totalRevaluatedCurrentBalance: 0.01,
              currencyDescription: 'דולר ארה"ב',
              revaluationCurrencyCode: 19
            }, {
              totalRevaluatedCurrentBalance: 0.01,
              currencyDescription: 'אירו',
              revaluationCurrencyCode: 100
            }, {
              totalRevaluatedCurrentBalance: 0.01,
              currencyDescription: 'לירה שטרלינג',
              revaluationCurrencyCode: 27
            }, {
              totalRevaluatedCurrentBalance: 0.01,
              currencyDescription: 'פרנק שוויצרי',
              revaluationCurrencyCode: 35
            }
          ],
          balancesAndLimitsDataList: [
            {
              numItemsPerPage: 0,
              transactionResultCode: 204,
              detailedAccountTypeCode: 142,
              currencyCode: 19,
              withdrawalBalance: 0.01,
              currentBalance: 0.01,
              lastBalance: 0.01,
              lastEventDate: 20200305,
              formattedLastEventDate: '2020-03-05T00:00:00.000Z',
              outputArrayRecordSum3: 5,
              outputArrayRecordSum4: 1,
              revaluatedCurrentBalance: [
                {
                  revaluatedCurrentBalance: 0.03,
                  revaluationCurrencyCode: 1,
                  currencySwiftDescription: 'ILS',
                  currencyShortedDescription: 'ש"ח',
                  currencyLongDescription: 'שקל חדש'
                }, {
                  revaluatedCurrentBalance: 0.01,
                  revaluationCurrencyCode: 19,
                  currencySwiftDescription: 'USD',
                  currencyShortedDescription: 'דולר',
                  currencyLongDescription: 'דולר ארה"ב'
                }, {
                  revaluatedCurrentBalance: 0.01,
                  revaluationCurrencyCode: 100,
                  currencySwiftDescription: 'EUR',
                  currencyShortedDescription: 'אירו',
                  currencyLongDescription: 'אירו'
                }, {
                  revaluatedCurrentBalance: 0.01,
                  revaluationCurrencyCode: 27,
                  currencySwiftDescription: 'GBP',
                  currencyShortedDescription: 'לישט',
                  currencyLongDescription: 'לירה שטרלינג'
                }, {
                  revaluatedCurrentBalance: 0.01,
                  revaluationCurrencyCode: 35,
                  currencySwiftDescription: 'CHF',
                  currencyShortedDescription: 'פר"ש',
                  currencyLongDescription: 'פרנק שוויצרי'
                }
              ],
              rateExerciseDescription: null,
              currentBalanceExchangeRateWayDescription: null,
              currentBalanceExchangeRateWayCode: 0,
              rateRealizationCode: 0,
              lastBalanceExchangeRateWayCode: 0,
              bankNumber: 0,
              branchNumber: 0,
              accountNumber: 0,
              retrievalMinDate: 0,
              formattedRetrievalMinDate: null,
              retrievalMaxDate: 0,
              formattedRetrievalMaxDate: null,
              creditLimits: [
                {
                  limitsGroupCode: 3,
                  limitName: 'שיעור ריבית על יתרת חובה לא מאושרת',
                  currentAccountLimitFirstBracketAmount: 0.0,
                  currentAccountLimitExpiration: 0,
                  formattedCurrentAccountLimitExpiration: null,
                  firstBracketNominalInterestRate: 11.625,
                  firstBracketLiborSpreadRate: 11.5,
                  creditAllocationCommissionRate: 0.0
                }
              ],
              transactions: [],
              messages: null,
              currencySwiftDescription: 'USD',
              currencyShortedDescription: 'דולר',
              pendingBalance: 0.0,
              currentAccountLimitsAmount: 0.0,
              currencySwiftCode: 'USD',
              currencyLongDescription: 'דולר ארה"ב',
              detailedAccountTypeShortedDescription: 'עו"ש פמ"ח'
            }
          ],
          messages: [
            {
              messageDescription: 'לתשומת לבך: הריבית מבוססת על ליבור יומי הידוע ביום השערוך, בתוספת מרווח סיכון',
              messageCode: 2
            }
          ],
          pdfUrl: '%2FServerServices%2Fgeneral%2Fpdf%2Fstream%3Fcid%3D6c0cd7ae-6934-493b-927a-6205491d6bf1%26isHtml%3Dfalse',
          validityDate: 20200805,
          structType: 'foreignCurrencyAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '12-702-277819',
            type: 'foreignCurrencyAccount',
            currencyCode: 19,
            detailedAccountTypeCode: 142
          },
          account: {
            id: '12-702-277819142',
            type: 'checking',
            title: 'דולר ארה"ב',
            instrument: 'USD',
            syncID: [
              '12-702-277819142'
            ],
            balance: 0.01
          }
        }
      ]
    ],
    [
      [
        {
          mainProductId: '12-608-19293',
          metadata:
            {
              messages:
                [
                  {
                    messageDescription: '" לתשומת לבך: לא נמצאו תנועות מתחת לקו בחשבון "',
                    messageCode: 11040,
                    severity: 'I'
                  },
                  {
                    messageDescription: '* לא נמצאו תנועות בטווח התאריכים שנבחר',
                    messageCode: 330,
                    severity: 'I'
                  }
                ],
              links: {}
            },
          formattedValidityDate: '2020-10-06T00:00:00.000Z',
          outputArrayRecordSum2: 1,
          displayedRevaluationCurrencyCode: 1,
          rateFixingDescription: 'שער יציג',
          currancyBalanceData: null,
          currencyCode: null,
          balancesAndTransactionsCurrencyCombo:
            {
              currencyCode:
                {
                  code: 1,
                  values:
                    [
                      {
                        systemCode: 320,
                        bankNumber: 12,
                        currencyCode: 1,
                        currencyShortedDescription: 'ש"ח',
                        currencySwiftCode: 'ILS',
                        currencyLongDescription: 'שקל חדש',
                        compKey: '320;012;001;',
                        currencyUnitsQuantity: 1
                      },
                      {
                        systemCode: 320,
                        bankNumber: 12,
                        currencyCode: 19,
                        currencyShortedDescription: 'דולר',
                        currencySwiftCode: 'USD',
                        currencyLongDescription: 'דולר ארה"ב',
                        compKey: '320;012;019;',
                        currencyUnitsQuantity: 1
                      },
                      {
                        systemCode: 320,
                        bankNumber: 12,
                        currencyCode: 100,
                        currencyShortedDescription: 'אירו',
                        currencySwiftCode: 'EUR',
                        currencyLongDescription: 'אירו',
                        compKey: '320;012;100;',
                        currencyUnitsQuantity: 1
                      },
                      {
                        systemCode: 320,
                        bankNumber: 12,
                        currencyCode: 27,
                        currencyShortedDescription: 'לישט',
                        currencySwiftCode: 'GBP',
                        currencyLongDescription: 'לירה שטרלינג',
                        compKey: '320;012;027;',
                        currencyUnitsQuantity: 1
                      },
                      {
                        systemCode: 320,
                        bankNumber: 12,
                        currencyCode: 35,
                        currencyShortedDescription: 'פר"ש',
                        currencySwiftCode: 'CHF',
                        currencyLongDescription: 'פרנק שוויצרי',
                        compKey: '320;012;035;',
                        currencyUnitsQuantity: 1
                      }
                    ]
                }
            },
          detailedAccountTypeCode: null,
          foreignCurrencyBalancesData:
            [
              {
                totalRevaluatedCurrentBalance: 128.12,
                currencyDescription: 'שקל חדש',
                revaluationCurrencyCode: 1
              },
              {
                totalRevaluatedCurrentBalance: 37.56,
                currencyDescription: 'דולר ארה"ב',
                revaluationCurrencyCode: 19
              },
              {
                totalRevaluatedCurrentBalance: 31.91,
                currencyDescription: 'אירו',
                revaluationCurrencyCode: 100
              },
              {
                totalRevaluatedCurrentBalance: 28.96,
                currencyDescription: 'לירה שטרלינג',
                revaluationCurrencyCode: 27
              },
              {
                totalRevaluatedCurrentBalance: 34.37,
                currencyDescription: 'פרנק שוויצרי',
                revaluationCurrencyCode: 35
              }
            ],
          balancesAndLimitsDataList:
            [
              {
                numItemsPerPage: 0,
                transactionResultCode: 204,
                detailedAccountTypeCode: 142,
                currencyCode: 19,
                withdrawalBalance: 37.56,
                currentBalance: 37.56,
                lastBalance: 37.56,
                lastEventDate: 20160925,
                formattedLastEventDate: '2016-09-25T00:00:00.000Z',
                outputArrayRecordSum3: 5,
                outputArrayRecordSum4: 1,
                revaluatedCurrentBalance:
                  [
                    {
                      revaluatedCurrentBalance: 128.12,
                      revaluationCurrencyCode: 1,
                      currencySwiftDescription: 'ILS',
                      currencyShortedDescription: 'ש"ח',
                      currencyLongDescription: 'שקל חדש'
                    },
                    {
                      revaluatedCurrentBalance: 37.56,
                      revaluationCurrencyCode: 19,
                      currencySwiftDescription: 'USD',
                      currencyShortedDescription: 'דולר',
                      currencyLongDescription: 'דולר ארה"ב'
                    },
                    {
                      revaluatedCurrentBalance: 31.91,
                      revaluationCurrencyCode: 100,
                      currencySwiftDescription: 'EUR',
                      currencyShortedDescription: 'אירו',
                      currencyLongDescription: 'אירו'
                    },
                    {
                      revaluatedCurrentBalance: 28.96,
                      revaluationCurrencyCode: 27,
                      currencySwiftDescription: 'GBP',
                      currencyShortedDescription: 'לישט',
                      currencyLongDescription: 'לירה שטרלינג'
                    },
                    {
                      revaluatedCurrentBalance: 34.37,
                      revaluationCurrencyCode: 35,
                      currencySwiftDescription: 'CHF',
                      currencyShortedDescription: 'פר"ש',
                      currencyLongDescription: 'פרנק שוויצרי'
                    }
                  ],
                rateExerciseDescription: null,
                currentBalanceExchangeRateWayDescription: null,
                currentBalanceExchangeRateWayCode: 0,
                rateRealizationCode: 0,
                lastBalanceExchangeRateWayCode: 0,
                bankNumber: 0,
                branchNumber: 0,
                accountNumber: 0,
                retrievalMinDate: 0,
                formattedRetrievalMinDate: null,
                retrievalMaxDate: 0,
                formattedRetrievalMaxDate: null,
                creditLimits:
                  [
                    {
                      limitsGroupCode: 3,
                      limitName: 'שיעור ריבית על יתרת חובה לא מאושרת',
                      currentAccountLimitFirstBracketAmount: 0,
                      currentAccountLimitExpiration: 0,
                      formattedCurrentAccountLimitExpiration: null,
                      firstBracketNominalInterestRate: 11.625,
                      firstBracketLiborSpreadRate: 11.5,
                      creditAllocationCommissionRate: 0
                    }
                  ],
                transactions: [],
                messages: null,
                currencySwiftDescription: 'USD',
                currencyShortedDescription: 'דולר',
                pendingBalance: 0,
                currentAccountLimitsAmount: 0,
                currencySwiftCode: 'USD',
                currencyLongDescription: 'דולר ארה"ב',
                detailedAccountTypeShortedDescription: 'עו"ש פמ"ח'
              }
            ],
          messages:
            [
              {
                messageDescription: 'לתשומת לבך: הריבית מבוססת על ליבור יומי הידוע ביום השערוך, בתוספת מרווח סיכון',
                messageCode: 2
              }
            ],
          pdfUrl: '%2FServerServices%2Fgeneral%2Fpdf%2Fstream%3Fcid%3Df69e9964-6237-4d26-968d-fecf2fe0ed64%26isHtml%3Dfalse',
          validityDate: 20201006,
          structType: 'foreignCurrencyAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '12-608-19293',
            type: 'foreignCurrencyAccount',
            currencyCode: 19,
            detailedAccountTypeCode: 142
          },
          account: {
            id: '12-608-19293142',
            type: 'checking',
            title: 'דולר ארה"ב',
            instrument: 'USD',
            syncID: [
              '12-608-19293142'
            ],
            balance: 37.56
          }
        }
      ]
    ]
  ])('converts foreign currency account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
