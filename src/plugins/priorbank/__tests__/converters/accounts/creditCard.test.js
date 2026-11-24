import { chooseDistinctCards, convertAccounts, convertTransactions } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          status: {
            respClass: '',
            respCode: 0,
            respText: '',
            module: 11,
            messageForClient: ''
          },
          clientObject: {
            id: 68683521,
            prodType: 2,
            subSystemInstanceId: 4,
            contract_id: '',
            externalId: '32008501',
            identifier: '4774',
            card_type: '4',
            cardTypeName: 'MASTERCARD',
            type: 5,
            typeName: 'Кредитная карта',
            openDate: '2019-09-06T06:49:15+03:00',
            openDateSpecified: true,
            closeDateSpecified: false,
            expDate: '2023-08-31T00:00:00+03:00',
            expDateSpecified: true,
            lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
            currCode: 933,
            currIso: 'BYN',
            accessStatus: 2,
            cardStatus: 1,
            cardStatusName: 'Активна',
            cardAccStatus: 51,
            isOpen: 1,
            isLocked: 0,
            corNonCor: 2,
            corNonCorName: 'Некорпоративная',
            pkgName: 'NO_PACK',
            cardMaskedNumber: '************4774',
            cardContractNumber: '7276',
            cardRBSNumber: '<string[30]>',
            dopNonDop: 2,
            cardBin: 0,
            cardColor: '#d8c8b0 ',
            isCardMain: 0,
            contractNum: '<string[19]>',
            contractTypeInt: 0,
            contractTypeName: '',
            defaultSynonym: 'KK4774',
            customSynonym: '',
            contractOpenDateSpecified: false,
            contractCloseDate: '0001-01-01T00:00:00',
            cContractCloseDateSpecified: false,
            dealTerm: 0,
            rate: 0,
            elContractCloseDateSpecified: false,
            minAmount: 0,
            contractRest: 0,
            description: '',
            isStCashCard: 1,
            stCashCardContractId: '749171-4011-162950',
            isElDeposit: false,
            secure3D: 2,
            secure3DText: 'Есть',
            smsNotify: 6,
            smsNotifyText: 'Только бесплатные SMS',
            savings: 0,
            orderValue: 0,
            iban: '<string[0]>',
            bic: '',
            contractNumberReplenishment: '',
            contractNumberRedemption: '1714011162950',
            haveDopCards: false,
            pinAttempts: {
              maxPINAttempts: 3,
              currentPINAttempts: 0
            },
            isVirtual: 0,
            isEpin: 0
          },
          balance: {
            balance: 0,
            blocked: 0,
            available: 2470,
            ownBlance: 0,
            ovl: 0,
            totalBalance: 0,
            crLimit: 0,
            addLimit: 0,
            finLimit: 0,
            creditBalance: {
              sum: 0,
              sumTotal: 0
            }
          },
          equivalents: [
            {
              amount: 1021.92,
              currencyCode: 840,
              currency: 'USD'
            },
            {
              amount: 937.38,
              currencyCode: 978,
              currency: 'EUR'
            },
            {
              amount: 71594,
              currencyCode: 643,
              currency: 'RUB'
            }
          ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [
        {
          id: 68683521,
          identifier: '4774',
          contract:
            {
              prodNum: 0,
              prodType: 'C',
              cardType: 'MASTERCARD',
              contractCurrIso: 'BYN',
              contractNumber: '7276',
              creditLimit: 2500,
              totalBlocked: 0,
              amountAvailable: 2470,
              addrLineA: '<string[16]>',
              addrLineB: '<string[114]>',
              addrLineC: '<string[40]>',
              message: {
                messageDateSpecified: false,
                messageString: ''
              },
              account:
                {
                  transCardList: [],
                  endBalance: -30,
                  beginBalance: -115,
                  plusContracr: 115,
                  minusContracr: 30,
                  feeContracr: 0
                },
              abortedContractList: []
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: {
            due: 0,
            ovdField: 0,
            interest: 0,
            monthlyFee: 0,
            total: 0
          }
        }
      ],
      [
        {
          products: [
            {
              id: '68683521',
              type: 'card'
            }
          ],
          account:
            {
              id: '68683521',
              type: 'ccard',
              title: 'KK4774',
              instrument: 'BYN',
              syncID: ['4774'],
              balance: -30,
              creditLimit: 2500
            }
        }
      ]
    ],
    [
      [
        {
          status:
            {
              respClass: '',
              respCode: 0,
              respText: '',
              module: 11,
              messageForClient: ''
            },
          clientObject:
            {
              id: 69265245,
              prodType: 2,
              subSystemInstanceId: 4,
              contract_id: '',
              externalId: '35077564',
              identifier: '6437',
              card_type: '2',
              cardTypeName: 'VISA CLASSIC',
              type: 6,
              typeName: 'Дебетовая карта',
              openDate: '2020-08-19T11:33:40+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2024-08-31T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
              currCode: 978,
              currIso: 'EUR',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 51,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'NO_PACK',
              cardMaskedNumber: '************6437',
              cardContractNumber: '6437',
              cardRBSNumber: '<string[30]>',
              dopNonDop: 2,
              cardBin: 0,
              cardColor: '#70A0B8',
              isCardMain: 0,
              contractNum: '<string[19]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'DK6437',
              customSynonym: '',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 2,
              secure3DText: 'Есть',
              smsNotify: 6,
              smsNotifyText: 'Только бесплатные SMS',
              savings: 0,
              orderValue: 0,
              iban: '<string[28]>',
              bic: 'PJCBBY2X',
              contractNumberReplenishment: '6000091008276',
              contractNumberRedemption: '',
              haveDopCards: false,
              pinAttempts: {
                maxPINAttempts: 3,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: -1
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 0,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 0,
                currencyCode: 933,
                currency: 'BYN'
              },
              {
                amount: 0,
                currencyCode: 840,
                currency: 'USD'
              },
              {
                amount: 0,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [
        {
          id: 69265245,
          identifier: '6437',
          contract:
            {
              prodNum: 0,
              prodType: 'D',
              cardType: 'VISA CLASSIC',
              contractCurrIso: 'EUR',
              contractNumber: '6437',
              creditLimit: 0,
              totalBlocked: 0,
              amountAvailable: 0,
              addrLineA: '<string[12]>',
              addrLineB: '<string[0]>',
              addrLineC: '<string[69]>',
              message: {
                messageDateSpecified: false,
                messageString: ''
              },
              account:
                {
                  transCardList: [],
                  endBalance: 0,
                  beginBalance: 0,
                  plusContracr: 0,
                  minusContracr: 0,
                  feeContracr: 0
                },
              abortedContractList: []
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: {
            due: 0,
            ovdField: 0,
            interest: 0,
            monthlyFee: 0,
            total: 0
          }
        }
      ],
      [
        {
          products: [
            {
              id: '69265245',
              type: 'card'
            }
          ],
          account:
            {
              id: '69265245',
              title: 'DK6437',
              type: 'ccard',
              syncID: ['6437'],
              instrument: 'EUR',
              balance: 0
            }
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, apiAccountDetails, accounts) => {
    expect(convertAccounts(apiAccounts, apiAccountDetails)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          status: {
            respClass: '',
            respCode: 0,
            respText: '',
            module: 11,
            messageForClient: ''
          },
          clientObject:
            {
              id: 68454321,
              prodType: 2,
              subSystemInstanceId: 4,
              contract_id: '',
              externalId: '30831111',
              identifier: '2447',
              card_type: '2',
              cardTypeName: 'VISA CLASSIC',
              type: 6,
              typeName: 'Дебетовая карта',
              openDate: '2019-04-11T10:15:00+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2023-03-31T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
              currCode: 933,
              currIso: 'BYN',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 51,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'NO_PACK',
              cardMaskedNumber: '************2447',
              cardContractNumber: '2957',
              cardRBSNumber: '<string[30]>',
              dopNonDop: 2,
              cardBin: 0,
              cardColor: '#3682DD',
              isCardMain: 0,
              contractNum: '<string[19]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'DK2447',
              customSynonym: 'Danik',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 2,
              secure3DText: 'Есть',
              smsNotify: 6,
              smsNotifyText: 'Только бесплатные SMS',
              savings: 0,
              orderValue: 2,
              iban: 'BY45PJCB30140000000000000001',
              bic: 'PJCBBY2X',
              contractNumberReplenishment: '1110081070518',
              contractNumberRedemption: '',
              haveDopCards: true,
              pinAttempts: {
                maxPINAttempts: 3,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: 1
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 1133.19,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 433.5,
                currencyCode: 840,
                currency: 'USD'
              },
              {
                amount: 365.78,
                currencyCode: 978,
                currency: 'EUR'
              },
              {
                amount: 32284,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        },
        {
          status:
            {
              respClass: '',
              respCode: 0,
              respText: '',
              module: 11,
              messageForClient: ''
            },
          clientObject:
            {
              id: 69301234,
              prodType: 2,
              subSystemInstanceId: 4,
              contract_id: '',
              externalId: '35231234',
              identifier: '9211',
              card_type: '4',
              cardTypeName: 'MASTERCARD',
              type: 6,
              typeName: 'Дебетовая карта',
              openDate: '2020-09-08T10:25:48+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2024-09-30T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
              currCode: 933,
              currIso: 'BYN',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 51,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'SAL_PACK',
              cardMaskedNumber: '************9211',
              cardContractNumber: '2957',
              cardRBSNumber: '<string[30]>',
              dopNonDop: 2,
              cardBin: 0,
              cardColor: '#3783DD',
              isCardMain: 1,
              contractNum: '<string[19]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'DK9211',
              customSynonym: 'Budget new',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 2,
              secure3DText: 'Есть',
              smsNotify: 6,
              smsNotifyText: 'Только бесплатные SMS',
              savings: 0,
              orderValue: 9,
              iban: 'BY45PJCB30140000000000000001',
              bic: 'PJCBBY2X',
              contractNumberReplenishment: '1110081070518',
              contractNumberRedemption: '',
              haveDopCards: true,
              pinAttempts: {
                maxPINAttempts: 3,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: 1
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 1133.19,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 433.5,
                currencyCode: 840,
                currency: 'USD'
              },
              {
                amount: 365.78,
                currencyCode: 978,
                currency: 'EUR'
              },
              {
                amount: 32284,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [
        {
          id: 68454321,
          identifier: '2447',
          contract:
            {
              prodNum: 0,
              prodType: 'D',
              cardType: 'VISA CLASSIC',
              contractCurrIso: 'BYN',
              contractNumber: '2957',
              creditLimit: 0,
              totalBlocked: 0,
              amountAvailable: 1133.19,
              addrLineA: '<string[14]>',
              addrLineB: '<string[0]>',
              addrLineC: '<string[66]>',
              message: {
                messageDateSpecified: false,
                messageString: ''
              },
              account:
                {
                  transCardList:
                    [
                      {
                        transCardNum: '2957',
                        transactionList: [],
                        plusCard: 2731.05,
                        minusCard: 145,
                        feeCard: 0,
                        turnOverCard: 2586.05
                      },
                      {
                        transCardNum: '0218',
                        transactionList: [],
                        plusCard: 0,
                        minusCard: 1447.5,
                        feeCard: 0,
                        turnOverCard: -1447.5
                      },
                      {
                        transCardNum: '2447',
                        transactionList: [],
                        plusCard: 0,
                        minusCard: 2.44,
                        feeCard: 0,
                        turnOverCard: -2.44
                      },
                      {
                        transCardNum: '9211',
                        transactionList: [],
                        plusCard: 0,
                        minusCard: 207,
                        feeCard: 0,
                        turnOverCard: -207
                      }
                    ],
                  endBalance: 1133.19,
                  beginBalance: 204.08,
                  plusContracr: 2731.05,
                  minusContracr: 1801.94,
                  feeContracr: 0
                },
              abortedContractList: []
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: {
            due: 0,
            ovdField: 0,
            interest: 0,
            monthlyFee: 0,
            total: 0
          }
        }
      ],
      [
        {
          products: [
            {
              id: '68454321',
              type: 'card'
            },
            {
              id: '69301234',
              type: 'card'
            }
          ],
          account:
            {
              id: '68454321',
              type: 'ccard',
              title: 'Danik',
              instrument: 'BYN',
              syncID: ['2447', '9211', 'BY45PJCB30140000000000000001'],
              balance: 1133.19
            }
        }
      ]
    ]
  ])('groups cards listed on the same account statement under a shared public-safe IBAN', (apiAccounts, apiAccountDetails, accounts) => {
    expect(convertAccounts([...apiAccounts].reverse(), apiAccountDetails)).toEqual(accounts)
    expect(convertAccounts(apiAccounts, apiAccountDetails)).toEqual(accounts)
    expect(chooseDistinctCards([...apiAccounts].reverse(), apiAccountDetails)).toEqual([apiAccounts[0]])
  })

  it.each([
    [
      [
        {
          status:
            {
              respClass: '',
              respCode: 0,
              respText: '',
              module: 11,
              messageForClient: ''
            },
          clientObject:
            {
              id: 68001111,
              prodType: 2,
              subSystemInstanceId: 4,
              contract_id: '',
              externalId: '25901111',
              identifier: '0885',
              card_type: '8',
              cardTypeName: 'VISA PLATINUM',
              type: 6,
              typeName: 'Дебетовая карта',
              openDate: '2018-04-12T15:43:56+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2022-04-30T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
              currCode: 933,
              currIso: 'BYN',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 51,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'PREM_DIR_PACK',
              cardMaskedNumber: '************0885',
              cardContractNumber: '1153',
              cardRBSNumber: '<string[30]>',
              dopNonDop: 2,
              cardBin: 0,
              cardColor: '#219B3D',
              isCardMain: 1,
              contractNum: '<string[19]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'DK0885',
              customSynonym: 'Зарплатная SFS',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 2,
              secure3DText: 'Есть',
              smsNotify: 8,
              smsNotifyText: 'СМС.PRO',
              savings: 0,
              orderValue: 0,
              iban: '<string[28]>',
              bic: 'PJCBBY2X',
              contractNumberReplenishment: '1130081007980',
              contractNumberRedemption: '',
              haveDopCards: true,
              pinAttempts: {
                maxPINAttempts: 3,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: 1
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 1175.95,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 453.5,
                currencyCode: 840,
                currency: 'USD'
              },
              {
                amount: 381.67,
                currencyCode: 978,
                currency: 'EUR'
              },
              {
                amount: 34586,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        },
        {
          status:
            {
              respClass: '',
              respCode: 0,
              respText: '',
              module: 11,
              messageForClient: ''
            },
          clientObject:
            {
              id: 68962222,
              prodType: 2,
              subSystemInstanceId: 4,
              contract_id: '',
              externalId: '33562222',
              identifier: '1440',
              card_type: '3',
              cardTypeName: 'VISA GOLD',
              type: 6,
              typeName: 'Дебетовая карта',
              openDate: '2020-02-13T11:08:38+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2024-02-29T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
              currCode: 840,
              currIso: 'USD',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 51,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'PREM_DIR_PACK',
              cardMaskedNumber: '************1440',
              cardContractNumber: '1164',
              cardRBSNumber: '<string[30]>',
              dopNonDop: 2,
              cardBin: 0,
              cardColor: '#EFD066',
              isCardMain: 0,
              contractNum: '<string[19]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'DK1440',
              customSynonym: 'Сбережения USD',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 2,
              secure3DText: 'Есть',
              smsNotify: 6,
              smsNotifyText: 'Только бесплатные SMS',
              savings: 0,
              orderValue: 0,
              iban: '<string[28]>',
              bic: 'PJCBBY2X',
              contractNumberReplenishment: '1030091013544',
              contractNumberRedemption: '',
              haveDopCards: false,
              pinAttempts: {
                maxPINAttempts: 3,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: 1
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 4.83,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 12.36,
                currencyCode: 933,
                currency: 'BYN'
              },
              {
                amount: 4.02,
                currencyCode: 978,
                currency: 'EUR'
              },
              {
                amount: 367.08,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [
        {
          id: 68001111,
          identifier: '0885',
          contract:
            {
              prodNum: 0,
              prodType: 'D',
              cardType: 'VISA PLATINUM',
              contractCurrIso: 'BYN',
              contractNumber: '1153',
              creditLimit: 0,
              totalBlocked: 172.75,
              amountAvailable: 1175.95,
              addrLineA: '<string[19]>',
              addrLineB: '<string[0]>',
              addrLineC: '<string[70]>',
              message: {
                messageDateSpecified: false,
                messageString: ''
              },
              account:
                {
                  transCardList: [],
                  endBalance: 1348.7,
                  beginBalance: 8554.22,
                  plusContracr: 53.92,
                  minusContracr: 7259.44,
                  feeContracr: 0
                },
              abortedContractList:
                [
                  {
                    abortedCard: '0885',
                    abortedTransactionList: []
                  },
                  {
                    abortedCard: '4392',
                    abortedTransactionList: []
                  }
                ]
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: {
            due: 0,
            ovdField: 0,
            interest: 0,
            monthlyFee: 0,
            total: 0
          }
        },
        {
          id: 68962222,
          identifier: '1440',
          contract:
            {
              prodNum: 0,
              prodType: 'D',
              cardType: 'VISA GOLD',
              contractCurrIso: 'USD',
              contractNumber: '1164',
              creditLimit: 0,
              totalBlocked: 0,
              amountAvailable: 4.83,
              addrLineA: '<string[19]>',
              addrLineB: '<string[0]>',
              addrLineC: '<string[70]>',
              message: {
                messageDateSpecified: false,
                messageString: ''
              },
              account:
                {
                  transCardList: [],
                  endBalance: 0,
                  beginBalance: 0,
                  plusContracr: 0,
                  minusContracr: 0,
                  feeContracr: 0
                },
              abortedContractList: []
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: {
            due: 0,
            ovdField: 0,
            interest: 0,
            monthlyFee: 0,
            total: 0
          }
        }
      ],
      [
        {
          products: [
            {
              id: '68001111',
              type: 'card'
            }
          ],
          account:
            {
              id: '68001111',
              type: 'ccard',
              title: 'Зарплатная SFS',
              instrument: 'BYN',
              syncID: ['0885'],
              balance: 1175.95
            }
        },
        {
          products: [
            {
              id: '68962222',
              type: 'card'
            }
          ],
          account:
            {
              id: '68962222',
              type: 'ccard',
              title: 'Сбережения USD',
              instrument: 'USD',
              syncID: ['1440'],
              balance: 4.83
            }
        }
      ]
    ]
  ])('converts 2 different credit cards', (apiAccounts, apiAccountDetails, accounts) => {
    expect(convertAccounts(apiAccounts, apiAccountDetails)).toEqual(accounts)
  })

  it.each([
    [
      [
        {
          status:
            {
              respClass: 'error',
              respCode: -9999,
              respText: 'This function is not allowed for fund card',
              module: 11,
              messageForClient: ''
            },
          clientObject:
            {
              id: 69942240,
              prodType: 2,
              subSystemInstanceId: 123,
              contract_id: '',
              externalId: '',
              identifier: '0135',
              card_type: '4',
              cardTypeName: 'MASTERCARD',
              type: 8,
              typeName: 'Карта другого банка',
              openDate: '2022-05-12T14:40:03+03:00',
              openDateSpecified: true,
              closeDateSpecified: false,
              expDate: '2023-02-28T00:00:00+03:00',
              expDateSpecified: true,
              lastComment: 'Доступны все операции',
              currCode: 933,
              currIso: 'BYN',
              accessStatus: 2,
              cardStatus: 1,
              cardStatusName: 'Активна',
              cardAccStatus: 0,
              isOpen: 1,
              isLocked: 0,
              corNonCor: 2,
              corNonCorName: 'Некорпоративная',
              pkgName: 'NO_PACK',
              cardMaskedNumber: '520813******0135',
              cardContractNumber: '',
              cardRBSNumber: '<string[0]>',
              dopNonDop: 2,
              cardBin: 520813,
              cardColor: '#F15B2E',
              isCardMain: 0,
              contractNum: '<string[0]>',
              contractTypeInt: 0,
              contractTypeName: '',
              defaultSynonym: 'FK0135',
              customSynonym: 'Alfa (BYN)',
              contractOpenDateSpecified: false,
              contractCloseDate: '0001-01-01T00:00:00',
              cContractCloseDateSpecified: false,
              dealTerm: 0,
              rate: 0,
              elContractCloseDateSpecified: false,
              minAmount: 0,
              contractRest: 0,
              description: '',
              isStCashCard: 0,
              stCashCardContractId: '',
              isElDeposit: false,
              secure3D: 0,
              secure3DText: '',
              smsNotify: 0,
              smsNotifyText: '',
              savings: 0,
              orderValue: 0,
              iban: '<string[0]>',
              bic: '',
              contractNumberReplenishment: '',
              contractNumberRedemption: '',
              haveDopCards: false,
              pinAttempts: {
                maxPINAttempts: 0,
                currentPINAttempts: 0
              },
              isVirtual: 0,
              isEpin: 0,
              currentPercent: 0,
              paymentDate: '',
              repaymentProgress: 0,
              cardExpirationDateExtended: 0
            },
          balance:
            {
              balance: 0,
              blocked: 0,
              available: 0,
              ownBlance: 0,
              ovl: 0,
              totalBalance: 0,
              crLimit: 0,
              addLimit: 0,
              finLimit: 0,
              creditBalance: {
                sum: 0,
                sumTotal: 0
              }
            },
          equivalents:
            [
              {
                amount: 0,
                currencyCode: 840,
                currency: 'USD'
              },
              {
                amount: 0,
                currencyCode: 978,
                currency: 'EUR'
              },
              {
                amount: 0,
                currencyCode: 643,
                currency: 'RUB'
              }
            ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [],
      []
    ]
  ])('converts Card of another bank', (apiAccounts, apiAccountDetails, accounts) => {
    expect(convertAccounts(apiAccounts, apiAccountDetails)).toEqual(accounts)
  })
})

// mail_inbound 227006, build 163. Related Cards and CardDesc records. Public identifiers are substituted.
it('keeps the debit and credit balances and their history sources separate under one customer contract', () => {
  const cards = [
    {
      status: {
        respClass: '',
        respCode: 0,
        respText: '',
        module: 11,
        messageForClient: ''
      },
      clientObject: {
        id: 50101001,
        prodType: 2,
        subSystemInstanceId: 4,
        contract_id: '',
        externalId: '800000001',
        identifier: '7811',
        card_type: '4',
        cardTypeName: 'MASTERCARD',
        type: 6,
        typeName: 'Дебетовая карта',
        openDate: '2026-04-17T13:12:56+03:00',
        openDateSpecified: true,
        closeDateSpecified: false,
        expDate: '2030-04-30T00:00:00+03:00',
        expDateSpecified: true,
        lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
        currCode: 933,
        currIso: 'BYN',
        accessStatus: 2,
        cardStatus: 1,
        cardStatusName: 'Активна',
        cardAccStatus: 51,
        isOpen: 1,
        isLocked: 0,
        corNonCor: 2,
        corNonCorName: 'Некорпоративная',
        pkgName: 'NO_PACK',
        cardMaskedNumber: '************7811',
        cardContractNumber: '6400',
        cardRBSNumber: '<string[30]>',
        dopNonDop: 2,
        cardBin: 0,
        cardColor: '#9C8768',
        isCardMain: 0,
        contractNum: '<string[19]>',
        contractTypeInt: 0,
        contractTypeName: '',
        defaultSynonym: 'DK7811',
        customSynonym: 'Карта 7811',
        contractOpenDateSpecified: false,
        contractCloseDate: '0001-01-01T00:00:00',
        contractCloseDateSpecified: true,
        cContractCloseDateSpecified: false,
        dealTerm: 0,
        rate: 0,
        elContractCloseDateSpecified: false,
        minAmount: 0,
        contractRest: 0,
        description: '',
        isStCashCard: 0,
        stCashCardContractId: '',
        isElDeposit: false,
        secure3D: 2,
        secure3DText: 'Есть',
        smsNotify: 6,
        smsNotifyText: 'Только бесплатные SMS',
        savings: 0,
        orderValue: 0,
        iban: '<string[28]>',
        bic: 'PJCBBY2X',
        contractNumberReplenishment: '9000000000001',
        contractNumberRedemption: '',
        haveDopCards: false,
        pinAttempts: {
          maxPINAttempts: 3,
          currentPINAttempts: 0
        },
        isVirtual: 0,
        isEpin: 1,
        currentPercent: 0,
        paymentDate: '',
        repaymentProgress: 0,
        cardExpirationDateExtended: 0
      },
      balance: {
        balance: 0,
        blocked: 0,
        available: 0,
        ownBlance: 0,
        ovl: 0,
        totalBalance: 0,
        crLimit: 0,
        addLimit: 0,
        finLimit: 0,
        creditBalance: {
          sum: 0,
          sumTotal: 0
        }
      },
      equivalents: [
        {
          amount: 0,
          currencyCode: 840,
          currency: 'USD'
        },
        {
          amount: 0,
          currencyCode: 978,
          currency: 'EUR'
        },
        {
          amount: 0,
          currencyCode: 643,
          currency: 'RUB'
        }
      ],
      reissueFormId: '',
      expiringStatus: 0
    },
    {
      status: {
        respClass: '',
        respCode: 0,
        respText: '',
        module: 11,
        messageForClient: ''
      },
      clientObject: {
        id: 50101002,
        prodType: 2,
        subSystemInstanceId: 4,
        contract_id: '',
        externalId: '800000002',
        identifier: '7812',
        card_type: '3',
        cardTypeName: 'VISA GOLD',
        type: 5,
        typeName: 'Кредитная карта',
        openDate: '2026-10-12T17:53:00+03:00',
        openDateSpecified: true,
        closeDateSpecified: false,
        expDate: '2031-09-30T00:00:00+03:00',
        expDateSpecified: true,
        lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
        currCode: 933,
        currIso: 'BYN',
        accessStatus: 2,
        cardStatus: 1,
        cardStatusName: 'Активна',
        cardAccStatus: 51,
        isOpen: 1,
        isLocked: 0,
        corNonCor: 2,
        corNonCorName: 'Некорпоративная',
        pkgName: 'NO_PACK',
        cardMaskedNumber: '************7812',
        cardContractNumber: '6400',
        cardRBSNumber: '<string[30]>',
        dopNonDop: 2,
        cardBin: 0,
        cardColor: '#d8c8b0',
        isCardMain: 0,
        contractNum: '<string[19]>',
        contractTypeInt: 0,
        contractTypeName: '',
        defaultSynonym: 'KK7812',
        customSynonym: '',
        contractOpenDateSpecified: false,
        contractCloseDate: '0001-01-01T00:00:00',
        contractCloseDateSpecified: true,
        cContractCloseDateSpecified: false,
        dealTerm: 0,
        rate: 0,
        elContractCloseDateSpecified: false,
        minAmount: 0,
        contractRest: 0,
        description: '',
        isStCashCard: 1,
        stCashCardContractId: '711111-2222-333333',
        isElDeposit: false,
        secure3D: 2,
        secure3DText: 'Есть',
        smsNotify: 7,
        smsNotifyText: 'СМС+',
        savings: 0,
        orderValue: 0,
        iban: '<string[0]>',
        bic: '',
        contractNumberReplenishment: '',
        contractNumberRedemption: '1112222333333',
        haveDopCards: false,
        pinAttempts: {
          maxPINAttempts: 3,
          currentPINAttempts: 0
        },
        isVirtual: 0,
        isEpin: 1,
        currentPercent: 0,
        paymentDate: '',
        repaymentProgress: 0,
        cardExpirationDateExtended: 0
      },
      balance: {
        balance: 0,
        blocked: 0,
        available: 4548.94,
        ownBlance: 0,
        ovl: 0,
        totalBalance: 0,
        crLimit: 0,
        addLimit: 0,
        finLimit: 0,
        creditBalance: {
          sum: 0,
          sumTotal: 0
        }
      },
      equivalents: [
        {
          amount: 1513.28,
          currencyCode: 840,
          currency: 'USD'
        },
        {
          amount: 1377.21,
          currencyCode: 978,
          currency: 'EUR'
        },
        {
          amount: 124287.97,
          currencyCode: 643,
          currency: 'RUB'
        }
      ],
      reissueFormId: '',
      expiringStatus: 0
    }
  ]
  const details = [
    {
      id: 50101001,
      identifier: '7811',
      contract: {
        prodNum: 0,
        prodType: 'D',
        cardType: 'MASTERCARD',
        contractCurrIso: 'BYN',
        contractNumber: '6400',
        creditLimit: 0,
        totalBlocked: 0,
        amountAvailable: 0,
        addrLineA: '<string[15]>',
        addrLineB: '<string[45]>',
        addrLineC: '<string[132]>',
        message: {
          messageDateSpecified: false,
          messageString: ''
        },
        account: {
          transCardList: [],
          endBalance: 0,
          beginBalance: 0,
          plusContracr: 0,
          minusContracr: 0,
          feeContracr: 0
        },
        abortedContractList: []
      },
      monthDebit: {
        interest: 0,
        ovd: 0,
        due: 0,
        monthlyFee: 0,
        dueDateSpecified: false,
        total: 0
      },
      currentDebit: {
        due: 0,
        ovdField: 0,
        interest: 0,
        monthlyFee: 0,
        total: 0
      }
    },
    {
      id: 50101002,
      identifier: '7812',
      contract: {
        prodNum: 0,
        prodType: 'C',
        cardType: 'VISA GOLD',
        contractCurrIso: 'BYN',
        contractNumber: '6400',
        creditLimit: 10209.94,
        totalBlocked: 5661,
        amountAvailable: 4548.94,
        addrLineA: '<string[15]>',
        addrLineB: '<string[45]>',
        addrLineC: '<string[40]>',
        message: {
          messageDateSpecified: false,
          messageString: ''
        },
        account: {
          transCardList: [],
          endBalance: 0,
          beginBalance: 0,
          plusContracr: 0,
          minusContracr: 0,
          feeContracr: 0
        },
        abortedContractList: [
          {
            abortedCard: '7812',
            abortedTransactionList: [
              {
                amount: 5661,
                transAmount: 5661,
                transCurrIso: 'BYN',
                transDetails: 'Retail BLR MINSK OFIS PRODAJ',
                transDate: '2026-11-20T00:00:00+03:00',
                transDateSpecified: true,
                transTime: '12:44:07',
                hce: false
              }
            ]
          }
        ]
      },
      monthDebit: {
        interest: 0,
        ovd: 0,
        due: 0,
        monthlyFee: 0,
        dueDateSpecified: false,
        total: 0
      },
      currentDebit: {
        due: 0,
        ovdField: 0,
        interest: 0,
        monthlyFee: 0,
        total: 0
      }
    }
  ]
  const expected = [
    {
      products: [
        {
          id: '50101001',
          type: 'card'
        }
      ],
      account: {
        id: '50101001',
        title: 'Карта 7811',
        type: 'ccard',
        syncID: ['7811'],
        instrument: 'BYN',
        balance: 0
      }
    },
    {
      products: [
        {
          id: '50101002',
          type: 'card'
        }
      ],
      account: {
        id: '50101002',
        title: 'KK7812',
        type: 'ccard',
        syncID: ['7812'],
        instrument: 'BYN',
        balance: -5661,
        creditLimit: 10209.94
      }
    }
  ]
  const accounts = convertAccounts(cards, details)
  expect(accounts).toEqual(expected)
  expect(convertAccounts([...cards].reverse(), details)).toEqual([...expected].reverse())
  const historyCards = chooseDistinctCards(cards, details)
  expect(historyCards).toEqual(cards)
  expect(convertTransactions({ apiAccountsWithoutDuplicates: historyCards, apiAccountDetails: details, accounts })).toEqual([
    {
      movements: [{ id: null, account: { id: '50101002' }, invoice: null, sum: -5661, fee: 0 }],
      date: new Date('2026-11-20T12:44:07+03:00'),
      hold: true,
      merchant: { title: 'OFIS PRODAJ', city: 'MINSK', country: 'BLR', mcc: null, location: null },
      comment: null
    }
  ])
})
