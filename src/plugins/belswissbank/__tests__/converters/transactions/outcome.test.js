import { convertApiTransactionsToReadableTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      [
        {
          account: {
            id: 'account',
            instrument: 'BYN'
          },
          apiTransactions: [
            {
              cardTransactionId: 101399297,
              docId: 4879509,
              openwayId: 66688928,
              transactionDate: 1648892640000,
              transactionType: 'Товары и услуги',
              transactionCategory: 'Request',
              transactionResult: 'Успешно',
              transactionAmount: 16.8,
              transactionCurrency: 'BYN',
              transactionDetails: 'INTERNET-BANKING BSB',
              city: 'MINSK',
              countryCode: 'BLR',
              accountRest: 364.77,
              accountCurrency: 'BYN',
              accountRestDate: 1648892640000,
              colour: 2,
              last4: '9867'
            }
          ]
        }
      ],
      [
        {
          paymentId: 12992625,
          paymentDate: 1648892675000,
          last4: '9867',
          amount: 16.8,
          currencyIso: 'BYN',
          target: '256839111',
          name: 'LIFE:) НА № ТЕЛЕФОНА',
          paymentTypeIcon: 1,
          diType: 9191,
          isReversible: true,
          status: 'COMPLETED',
          response:
            {
              errorCode: '<number>',
              errorText: '<string[0]>',
              abonent: '<value>',
              terminalId: '<string[11]>',
              kioskReceipt: '<string[14]>',
              payRest: '<number>',
              payRecord:
                {
                  code: '<number>',
                  nextCode: '<value>',
                  codeOut: '<value>',
                  nameOut: '<value>',
                  autor: '<number>',
                  sessionId: '<value>',
                  recordId: '<number>',
                  paymentId: '<number>',
                  diType: '<value>',
                  name: '<value>',
                  codeType: '<value>',
                  getPayListType: '<value>',
                  summa: '<number>',
                  edit: '<value>',
                  claimId: '<value>',
                  pcId: '<number>',
                  payAll: '<number>',
                  posTranNum: '<value>',
                  posTranNum2: '<string[10]>',
                  extraId: '<value>',
                  category: '<value>',
                  nameType: '<value>',
                  isFine: '<value>',
                  isCalculate: '<value>',
                  isCommission: '<value>',
                  commission: '<value>',
                  picture: '<value>',
                  month: '<value>',
                  date: '<number>',
                  min: '<value>',
                  max: '<value>',
                  nominal: '<value>',
                  view: '<value>',
                  currency: '<number>',
                  fine: '<number>',
                  payCommission: '<value>',
                  formula: '<value>',
                  label: '<value>',
                  groupRecord: '<value>',
                  attrRecords:
                    [
                      {
                        code: '<number>',
                        name: '<string[13]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<string[30]>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[3]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<value>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[8]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<value>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[12]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<string[9]>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[3]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<value>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[15]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<value>',
                        value: '<string[188]>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[23]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<bool>',
                        value: '<value>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      }
                    ],
                  payCode: '<value>',
                  payName: '<value>',
                  payCodeOut: '<value>',
                  receipt:
                    {
                      receiptHeader:
                        {
                          count: '<number>',
                          lines:
                            [
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[37]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[34]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[39]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[48]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[48]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[37]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[15]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[15]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[15]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[47]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[48]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[8]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[18]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[25]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[42]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              }
                            ]
                        },
                      receiptFooter:
                        {
                          count: '<number>',
                          lines:
                            [
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[43]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[17]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[29]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[23]>'
                              }
                            ]
                        }
                    }
                },
              paymentId: '<value>',
              target: '<value>',
              name: '<value>',
              isReversible: '<bool>',
              smsStatus: '<value>',
              currency: '<number>',
              summa: '<number>',
              code: '<number>'
            },
          comment: null,
          imageId: null,
          linkExpirationTime: null,
          isBePaid: false,
          isTorn: false,
          linkTorn: null,
          expiredTornDate: null,
          paymentIdTorn: null,
          rrn: null,
          authCode: null
        }
      ],
      [
        {
          comment: 'Товары и услуги',
          date: new Date('2022-04-02T09:44:00.000Z'),
          hold: null,
          merchant: {
            city: 'MINSK',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'LIFE:) НА № ТЕЛЕФОНА, 256839111'
          },
          movements: [
            {
              account: { id: 'account' },
              fee: 0,
              id: '101399297',
              invoice: null,
              sum: -16.8
            }
          ]
        }
      ]
    ],
    [
      [
        {
          account: {
            id: 'account',
            instrument: 'BYN'
          },
          apiTransactions: [
            {
              cardTransactionId: 100028552,
              docId: 3524681,
              openwayId: 65318183,
              transactionDate: 1646383980000,
              transactionType: 'Товары и услуги',
              transactionCategory: 'Request',
              transactionResult: 'Успешно',
              transactionAmount: 5,
              transactionCurrency: 'BYN',
              transactionDetails: 'PERSON TO PERSON I-B BSB',
              city: 'MINSK',
              countryCode: 'BLR',
              accountRest: 597.91,
              accountCurrency: 'BYN',
              accountRestDate: 1646383980000,
              colour: 2,
              last4: '1128'
            }
          ]
        }
      ],
      [
        {
          paymentId: 12773198,
          paymentDate: 1646383983000,
          last4: '1128',
          amount: 5,
          currencyIso: 'BYN',
          target: '460122xxxxxx1234, Владимиров В.В.',
          name: 'Перевод между картами',
          paymentTypeIcon: 8,
          diType: 9120,
          isReversible: false,
          status: 'COMPLETED',
          response:
            {
              errorCode: '<number>',
              errorText: '<string[0]>',
              abonent: '<value>',
              terminalId: '<string[8]>',
              kioskReceipt: '<string[14]>',
              payRest: '<number>',
              payRecord:
                {
                  code: '<number>',
                  nextCode: '<value>',
                  codeOut: '<value>',
                  nameOut: '<value>',
                  autor: '<number>',
                  sessionId: '<value>',
                  recordId: '<number>',
                  paymentId: '<number>',
                  diType: '<value>',
                  name: '<value>',
                  codeType: '<value>',
                  getPayListType: '<value>',
                  summa: '<number>',
                  edit: '<value>',
                  claimId: '<value>',
                  pcId: '<number>',
                  payAll: '<number>',
                  posTranNum: '<value>',
                  posTranNum2: '<string[1]>',
                  extraId: '<value>',
                  category: '<value>',
                  nameType: '<value>',
                  isFine: '<value>',
                  isCalculate: '<value>',
                  isCommission: '<value>',
                  commission: '<value>',
                  picture: '<value>',
                  month: '<value>',
                  date: '<number>',
                  min: '<value>',
                  max: '<value>',
                  nominal: '<value>',
                  view: '<value>',
                  currency: '<number>',
                  fine: '<number>',
                  payCommission: '<number>',
                  formula: '<value>',
                  label: '<value>',
                  groupRecord: '<value>',
                  attrRecords:
                    [
                      {
                        code: '<number>',
                        name: '<string[22]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<bool>',
                        value: '<string[4]>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      },
                      {
                        code: '<number>',
                        name: '<string[23]>',
                        codeOut: '<value>',
                        level: '<value>',
                        type: '<value>',
                        minLength: '<value>',
                        maxLength: '<value>',
                        min: '<value>',
                        max: '<value>',
                        mandatory: '<value>',
                        edit: '<value>',
                        print: '<bool>',
                        value: '<value>',
                        change: '<value>',
                        search: '<value>',
                        formula: '<value>',
                        view: '<value>',
                        hint: '<value>',
                        format: '<value>',
                        attrCode: '<value>',
                        attrValue: '<value>'
                      }
                    ],
                  payCode: '<value>',
                  payName: '<value>',
                  payCodeOut: '<value>',
                  receipt:
                    {
                      receiptHeader:
                        {
                          count: '<number>',
                          lines:
                            [
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[0]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              },
                              {
                                idx: '<number>',
                                doubleHeightSymbol: '<value>',
                                doubleWidthSymbol: '<value>',
                                inverseSymbol: '<value>',
                                value: '<string[50]>'
                              }
                            ]
                        },
                      receiptFooter: {
                        count: '<number>',
                        lines: '<value>'
                      }
                    }
                },
              paymentId: '<value>',
              target: '<value>',
              name: '<value>',
              isReversible: '<bool>',
              smsStatus: '<value>',
              currency: '<number>',
              code: '<number>',
              summa: '<number>'
            },
          comment: 'привет с Донецка',
          imageId: null,
          linkExpirationTime: null,
          isBePaid: false,
          isTorn: false,
          linkTorn: null,
          expiredTornDate: null,
          paymentIdTorn: null,
          rrn: null,
          authCode: null
        }
      ],
      [
        {
          comment: 'привет с Донецка',
          date: new Date('2022-03-04T08:53:00.000Z'),
          hold: null,
          merchant: {
            city: 'MINSK',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'Перевод между картами, 460122xxxxxx1234, Владимиров В.В.'
          },
          movements: [
            {
              account: { id: 'account' },
              fee: 0,
              id: '100028552',
              invoice: null,
              sum: -5
            }
          ]
        }
      ]
    ]
  ])('converts outcome transaction', (apiTransactionsByAccount, paymentsArchive, transaction) => {
    expect(convertApiTransactionsToReadableTransactions(apiTransactionsByAccount, paymentsArchive)).toEqual(transaction)
  })
})
