import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'KZT'
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_9720320181',
          type: 'MOVEMENT',
          executionDate: 1586800800000,
          status: 'DONE',
          transactionDate: 1586831263000,
          dateCreated: 1586831263000,
          amount: -3500,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -3500,
          totalAmountCurrency: 'KZT',
          purpose: 'Оплата услуги Давион (интернет и телефония)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1586831263000),
          movements: [
            {
              id: 'MOVEMENT_9720320181',
              account: { id: 'account' },
              invoice: null,
              sum: -3500,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'Давион (интернет и телефония)',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_1834495562',
          type: 'MOVEMENT',
          executionDate: 1588528800000,
          status: 'DONE',
          transactionDate: 1588398855000,
          dateCreated: 1588398855000,
          amount: -1000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -1000,
          totalAmountCurrency: 'KZT',
          purpose: 'Оплата услуг Tele2'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588398855000),
          movements: [
            {
              id: 'MOVEMENT_1834495562',
              account: { id: 'account' },
              invoice: null,
              sum: -1000,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'Tele2',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_8391566510',
          type: 'MOVEMENT',
          executionDate: 1588528800000,
          status: 'DONE',
          transactionDate: 1588493330000,
          dateCreated: 1588493330000,
          amount: -606,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -606,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail KAZ KOSTANAY BIOSFERA APTEKA'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588493330000),
          movements: [
            {
              id: 'MOVEMENT_8391566510',
              account: { id: 'account' },
              invoice: null,
              sum: -606,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'KAZ KOSTANAY BIOSFERA APTEKA',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_3252987092',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1588772500000,
          amount: -610,
          amountCurrency: 'KZT',
          accountSource: '526994******0417',
          totalAmount: -610,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail KAZ KOSTANAY SHOP MARMELAD'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1588772500000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_3252987092',
              account: { id: 'account' },
              invoice: null,
              sum: -610,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'KAZ KOSTANAY SHOP MARMELAD',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_1768717548',
          type: 'MOVEMENT',
          executionDate: 1574618400000,
          status: 'DONE',
          transactionDate: 1574486170000,
          dateCreated: 1574486170000,
          amount: -1.42,
          amountCurrency: 'OMR',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -1431.9,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail OMN MUSCAT KM TRADING'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1574486170000),
          movements: [
            {
              id: 'MOVEMENT_1768717548',
              account: { id: 'account' },
              invoice: {
                sum: -1.42,
                instrument: 'OMR'
              },
              sum: -1431.9,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'OMN MUSCAT KM TRADING',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_6428430705',
          type: 'MOVEMENT',
          executionDate: 1586887200000,
          status: 'DONE',
          transactionDate: 1586671440000,
          dateCreated: 1586671440000,
          amount: -3.31,
          amountCurrency: 'USD',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -1418.34,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail LUX 19, RUE DE BI ALIEXPRESS'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1586671440000),
          movements: [
            {
              id: 'MOVEMENT_6428430705',
              account: { id: 'account' },
              invoice: {
                sum: -3.31,
                instrument: 'USD'
              },
              sum: -1418.34,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'LUX 19, RUE DE BI ALIEXPRESS',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_8686828675',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1592354422000,
          amount: -99,
          amountCurrency: 'RUB',
          accountSource: '526994******9328',
          totalAmount: -573.8,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail RUS Lesodolgoruko kasarina'
        },
        {
          id: 'RESERVED_AMOUNT_9165283068',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1592354422000,
          amount: -99,
          amountCurrency: 'RUB',
          accountSource: '526994******9328',
          totalAmount: -573.8,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail RUS Lesodolgoruko kasarina'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1592354422000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_8686828675',
              account: { id: 'account' },
              invoice: {
                sum: -99,
                instrument: 'RUB'
              },
              sum: -573.8,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'RUS Lesodolgoruko kasarina',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_2195159846',
          type: 'MOVEMENT',
          executionDate: 1595872800000,
          status: 'DONE',
          transactionDate: 1595924635000,
          dateCreated: 1595924635000,
          amount: -5,
          amountCurrency: 'KZT',
          fee: 5,
          feeCurrency: 'KZT',
          accountSource: 'KZ329480004A02216160',
          totalAmount: 0,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail KAZ AKTOBE ATM Oper by SMARTBANK'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1595924635000),
          movements: [
            {
              id: 'MOVEMENT_2195159846',
              account: { id: 'account' },
              invoice: null,
              sum: -5,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Retail KAZ AKTOBE ATM Oper by SMARTBANK'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_3674846107',
          type: 'MOVEMENT',
          executionDate: 1594576800000,
          status: 'DONE',
          transactionDate: 1594537660000,
          dateCreated: 1594537660000,
          amount: 0,
          amountCurrency: 'KZT',
          fee: -50,
          feeCurrency: 'KZT',
          accountSource: 'KZ329480004A02216160',
          totalAmount: -50,
          totalAmountCurrency: 'KZT',
          purpose: 'Balance Inquiry KAZ AKTOBE ATM03013 KUSZHANOVA 7'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1594537660000),
          movements: [
            {
              id: 'MOVEMENT_3674846107',
              account: { id: 'account' },
              invoice: null,
              sum: -50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Balance Inquiry KAZ AKTOBE ATM03013 KUSZHANOVA 7'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_2382493166',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1598763942000,
          amount: -1300,
          amountCurrency: 'KZT',
          accountSource: '526994******0181',
          totalAmount: -1300,
          totalAmountCurrency: 'KZT',
          purpose: 'Retail KAZ  Almaty HOMECREDIT.KZ'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1598763942000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_2382493166',
              account: { id: 'account' },
              invoice: null,
              sum: -1300,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'KAZ  Almaty HOMECREDIT.KZ',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_7628631343',
          type: 'MOVEMENT',
          executionDate: 1609783200000,
          status: 'DONE',
          transactionDate: 1609678484000,
          dateCreated: 1609678484000,
          amount: 2154,
          amountCurrency: 'RUB',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ579480001A03233969',
          totalAmount: 0,
          totalAmountCurrency: 'KZT',
          purpose: 'RUS MILKOVO WB '
        }
      ],
      [
        {
          hold: false,
          date: new Date(1609678484000),
          movements: [
            {
              id: 'MOVEMENT_7628631343',
              account: { id: 'account' },
              invoice: {
                instrument: 'RUB',
                sum: 2154
              },
              sum: null,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'RUS MILKOVO WB'
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, account)).toEqual(transactions)
  })

  const accounts = [
    {
      id: '2924349-KZT',
      type: 'ccard',
      title: '*2688-KZT',
      instrument: 'KZT',
      syncID: [
        'KZ899480005A02924349',
        '530496******2688'
      ],
      balance: 22743.64
    },
    {
      id: '2924349-USD',
      type: 'ccard',
      title: '*2688-USD',
      instrument: 'USD',
      syncID: [
        'KZ899480005A02924349',
        '530496******2688'
      ],
      balance: 2462.27
    },
    {
      id: '2924349-EUR',
      type: 'ccard',
      title: '*2688-EUR',
      instrument: 'EUR',
      syncID: [
        'KZ899480005A02924349',
        '530496******2688'
      ],
      balance: 0
    }
  ]

  const accountsByNumber = {
    KZ899480005A02924349: [
      {
        id: '2924349-KZT',
        type: 'ccard',
        title: '*2688-KZT',
        instrument: 'KZT',
        syncID: [
          'KZ899480005A02924349',
          '530496******2688'
        ],
        balance: 22743.64
      },
      {
        id: '2924349-USD',
        type: 'ccard',
        title: '*2688-USD',
        instrument: 'USD',
        syncID: [
          'KZ899480005A02924349',
          '530496******2688'
        ],
        balance: 2462.27
      },
      {
        id: '2924349-EUR',
        type: 'ccard',
        title: '*2688-EUR',
        instrument: 'EUR',
        syncID: [
          'KZ899480005A02924349',
          '530496******2688'
        ],
        balance: 0
      }
    ]
  }

  it.each([
    [
      [
        {
          id: 'MOVEMENT_3969475928',
          type: 'MOVEMENT',
          executionDate: 1598896800000,
          status: 'DONE',
          transactionDate: 1598633393000,
          dateCreated: 1598633393000,
          amount: 0,
          amountCurrency: 'KZT',
          fee: -1000,
          feeCurrency: 'KZT',
          accountSource: 'KZ899480005A02924349',
          totalAmount: -1000,
          totalAmountCurrency: 'KZT',
          purpose: 'Card Fee Month '
        },
        {
          id: 'MOVEMENT_8185398644',
          type: 'MOVEMENT',
          executionDate: 1598292000000,
          status: 'DONE',
          transactionDate: 1598278001000,
          dateCreated: 1598278001000,
          amount: -40000,
          amountCurrency: 'RUB',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ899480005A02924349',
          totalAmount: -543.07,
          totalAmountCurrency: 'USD',
          purpose: 'Unique RUS MOSCOW TINKOFF QUASICASH'
        },
        {
          id: 'MOVEMENT_7356817461',
          type: 'MOVEMENT',
          executionDate: 1597773600000,
          status: 'DONE',
          transactionDate: 1597677647000,
          dateCreated: 1597677647000,
          amount: -169,
          amountCurrency: 'RUB',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ899480005A02924349',
          totalAmount: -2.33,
          totalAmountCurrency: 'USD',
          purpose: 'Retail RUS MOSCOW YM YANDEX.PLUS'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1598633393000),
          movements: [
            {
              id: 'MOVEMENT_3969475928',
              account: { id: '2924349-KZT' },
              invoice: null,
              sum: -1000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Card Fee Month'
        },
        {
          hold: false,
          date: new Date(1598278001000),
          movements: [
            {
              id: 'MOVEMENT_8185398644',
              account: { id: '2924349-USD' },
              invoice: {
                instrument: 'RUB',
                sum: -40000
              },
              sum: -543.07,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'RUS MOSCOW TINKOFF QUASICASH',
            location: null,
            mcc: null
          },
          comment: null
        },
        {
          hold: false,
          date: new Date(1597677647000),
          movements: [
            {
              id: 'MOVEMENT_7356817461',
              account: { id: '2924349-USD' },
              invoice: {
                instrument: 'RUB',
                sum: -169
              },
              sum: -2.33,
              fee: 0
            }
          ],
          merchant: {
            fullTitle: 'RUS MOSCOW YM YANDEX.PLUS',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_1403674742',
          type: 'MOVEMENT',
          executionDate: 1628445600000,
          personId: 0,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: '',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '',
          dateSigned: null,
          secoId: '',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1628305546000,
          dateCreated: 1628305546000,
          amount: 18300,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ199480006A03395525',
          totalAmount: 18300,
          totalAmountCurrency: 'KZT',
          purpose: 'Reversal. Retail KAZ NUR-SULTAN OFIS SANATRENT',
          mcc:
            {
              id: 7512,
              title: 'Прокат автомобилей',
              smartBonus: false,
              type:
                {
                  id: 1000051,
                  title: 'Аренда авто',
                  category: { id: 'AUTO', title: 'Авто', visible: true },
                  code: ''
                }
            },
          sourceBin: '006027',
          terminalId: '61076387',
          transCity: 'NUR-SULTAN',
          transCountry: 'KAZ',
          reasonDetails: ''
        }
      ],
      [
        {
          hold: false,
          date: new Date(1628305546000), // Sat Aug 07 2021 09:05:46 GMT+0600 (+06),
          movements:
            [
              {
                id: 'MOVEMENT_1403674742',
                account: { id: '2924349-KZT' },
                invoice: null,
                sum: 18300,
                fee: 0
              }
            ],
          merchant: {
            fullTitle: 'KAZ NUR-SULTAN OFIS SANATRENT',
            mcc: 7512,
            location: null
          },
          comment: null
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, accounts, accountsByNumber)).toEqual(transactions)
  })

  const kztAccount2 = {
    id: 'kztAccount2',
    instrument: 'KZT',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          id: 'ORDER_8789719809',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'MC Black',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '',
          dateSigned: 1627898008817,
          secoId: '',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1627898008817,
          dateCreated: 1627898008817,
          orderNumber: 51307729,
          orderType: 'PAYM',
          amount: 2000,
          amountCurrency: 'KZT',
          accountSource: 'KZ369480007A03352296',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 2000,
          totalAmountCurrency: 'KZT',
          recipientName: 'Beeline',
          paymentDetails:
            [
              {
                id: 27005277,
                value: '(777) 223-95-74',
                visible: true,
                serviceFieldId: 1061,
                title: 'Номер телефона',
                serviceFieldName: 'Phone'
              }
            ],
          purpose: 'Оплата услуг сотовой связи Beeline',
          repeatsEveryWeek: false,
          repeatsEveryMonth: false,
          dateStart: 0,
          dateScheduled: 1627898008817,
          dateTill: 0,
          serviceId: 2058,
          mcc:
            {
              id: 5999,
              title: 'Розничные магазины',
              smartBonus: false,
              type:
                {
                  id: 1000121,
                  title: 'Супермаркеты',
                  category: { id: 'SHOP', title: 'Маркет', visible: true },
                  code: ''
                }
            },
          sourceBin: '',
          terminalId: 'SMB00001',
          transCity: 'Local',
          transCountry: 'KAZ',
          reasonDetails: 'Оплата услуг сотовой связи Beeline'
        }
      ],
      [
        {
          hold: false,
          date: new Date('2021-08-02T15:53:28.817+0600'),
          movements:
            [
              {
                id: 'ORDER_8789719809',
                account: { id: 'kztAccount2' },
                invoice: null,
                sum: -2000,
                fee: 0
              }
            ],
          merchant: { fullTitle: 'Beeline', mcc: 5999, location: null },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'ORDER_1539671587',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'MC Black',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '',
          dateSigned: 1627214678387,
          secoId: '',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1627214678387,
          dateCreated: 1627214678370,
          orderNumber: 51022959,
          orderType: 'PAYM',
          amount: 16725.88,
          amountCurrency: 'KZT',
          accountSource: 'KZ369480007A03352296',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 16725.88,
          totalAmountCurrency: 'KZT',
          recipientName: 'Алсеко',
          paymentDetails:
            [
              {
                id: 26880966,
                value: '006964370',
                visible: true,
                serviceFieldId: 87,
                title: 'Номер лицевого счета',
                serviceFieldName: 'Account'
              },
              {
                id: 26880967,
                value: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><PaymentDocument xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><AdditionalParameters><AdditionalParameter><Id>1</Id><Name>Тұратындар саны | Количество проживающих</Name><Value>4.00</Value></AdditionalParameter><AdditionalParameter><Id>2</Id><Name>Жылытылатын аймақ | Отапливаемая площадь</Name><Value>68.40</Value></AdditionalParameter></AdditionalParameters><Invoices><Invoice><Amount>16725.88</Amount><Currency>KZT</Currency><ExpireDate>2021-07-31T00:00:00.000+06:00</ExpireDate><FormedDate>2021-07-05T20:42:00.000+06:00</FormedDate><Id>210710457638</Id><ParametersAttribute><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>3663.77</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>209.0</FixCount><FixSum>3663.77</FixSum><IsCounterService>true</IsCounterService><LastCount>8799.0</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>8799.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>28.32</MaxTariffValue><Measure>квт/ч</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>190.0</MiddleTariffThreshold><MiddleTariffValue>22.66</MiddleTariffValue><MinCalc>3663.77</MinCalc><MinTariffThreshold>115.0</MinTariffThreshold><MinTariffValue>17.53</MinTariffValue><PayCount>0.0</PayCount><PaySum>3663.77</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>8590.0</PrevCount><PrevCountDate>2021-05-30T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>8590.0</PrevCountSubscriber><QuantityCount>209.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>209.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>13</ServiceId><ServiceName>Электр қуаты | Электр. энергия</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>1096.97</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>4.58</FixCount><FixSum>1096.97</FixSum><IsCounterService>true</IsCounterService><LastCount>555.0</LastCount><LastCountDate>2021-06-26T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>239.67</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.01</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>4.58</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>-1353.73</ReCalcSum><ServiceId>14</ServiceId><ServiceName>Ыстық су, Есептеуіш | Гор. вода, Счётчик</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>711.36</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>711.36</FixSum><IsCounterService>true</IsCounterService><LastCount>691.01</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>691.01</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>48.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>711.36</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>676.19</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>676.19</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>12</ServiceId><ServiceName>Суық су,Есептеуіш | Хол.вода,Счетчик</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>381.76</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>381.76</FixSum><IsCounterService>true</IsCounterService><LastCount>691.01</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>691.01</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>25.76</MinTariffValue><PayCount>0.0</PayCount><PaySum>381.76</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>676.19</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>676.19</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>25</ServiceId><ServiceName>Суық су к-ясы,Есеп-іш | К-ция хол.воды,Сч-к</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>263.52</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>263.52</FixSum><IsCounterService>true</IsCounterService><LastCount>569.62</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>569.62</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>25.76</MinTariffValue><PayCount>0.0</PayCount><PaySum>263.52</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>559.39</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>559.39</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>6</ServiceId><ServiceName>Ыстық су к-ясы,Есеп-іш | Кан-ция гор.воды, Сч-к</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>2212.16</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>2212.16</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/чел</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>553.04</MinTariffValue><PayCount>0.0</PayCount><PaySum>2212.16</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>11</ServiceId><ServiceName>ҚТҚ шығару | Вывоз ТБО</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>6429.6</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>6429.6</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>94.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>6429.6</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>1</ServiceId><ServiceName>Пәтерді ұстау шығыны | Расходы на сод-ие жил.</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>1015.74</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>1015.74</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>14.85</MinTariffValue><PayCount>0.0</PayCount><PaySum>1015.74</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>10</ServiceId><ServiceName>Лифт | Лифт</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>300.0</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>300.0</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/квар</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>300.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>300.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>128</ServiceId><ServiceName>Домофон | Домофон</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>750.0</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>750.0</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/квар</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>750.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>750.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>190</ServiceId><ServiceName>Бейне бақылау | Видеонаблюдение</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>997.96</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>997.96</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>14.59</MinTariffValue><PayCount>0.0</PayCount><PaySum>997.96</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>203</ServiceId><ServiceName>Күрделі жөндеу жиын-ғы | Накопл.на кап.ремонт</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter></ParametersAttribute><PeriodDate>2021-07</PeriodDate><RegId>-1</RegId><Statuses>New</Statuses><Type>Alseco</Type></Invoice></Invoices><Payer><Address>г.Алматы, ул. Утеген Батыра, д.114, кв.45</Address><Id>6964370</Id><Name>БИЛАЛОВ КАЙРАТ БОЛАТОВИЧ</Name><Type>PAYNET</Type></Payer></PaymentDocument>',
                visible: false,
                serviceFieldId: 88,
                title: 'Номер договора',
                serviceFieldName: 'InvoicePayment'
              },
              {
                id: 26880968,
                value: '210710457638',
                visible: false,
                serviceFieldId: 93,
                title: 'Номер договора',
                serviceFieldName: 'InvoiceNumber'
              },
              {
                id: 26880969,
                value: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><PaymentDocument xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><AdditionalParameters><AdditionalParameter><Id>1</Id><Name>Тұратындар саны | Количество проживающих</Name><Value>4.00</Value></AdditionalParameter><AdditionalParameter><Id>2</Id><Name>Жылытылатын аймақ | Отапливаемая площадь</Name><Value>68.40</Value></AdditionalParameter></AdditionalParameters><Invoices><Invoice><Amount>16725.87</Amount><Currency>KZT</Currency><ExpireDate>2021-07-31T00:00:00.000+06:00</ExpireDate><FormedDate>2021-07-05T20:42:00.000+06:00</FormedDate><Id>210710457638</Id><ParametersAttribute><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>3663.77</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>209.0</FixCount><FixSum>3663.77</FixSum><IsCounterService>true</IsCounterService><LastCount>8799.0</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>28.32</MaxTariffValue><Measure>квт/ч</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>190.0</MiddleTariffThreshold><MiddleTariffValue>22.66</MiddleTariffValue><MinCalc>3663.77</MinCalc><MinTariffThreshold>115.0</MinTariffThreshold><MinTariffValue>17.53</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>8590.0</PrevCount><PrevCountDate>2021-05-30T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>209.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>209.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>13</ServiceId><ServiceName>Электр қуаты | Электр. энергия</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>1096.97</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>4.58</FixCount><FixSum>1096.97</FixSum><IsCounterService>true</IsCounterService><LastCount>555.0</LastCount><LastCountDate>2021-06-26T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>239.67</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>4.58</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>-1353.73</ReCalcSum><ServiceId>14</ServiceId><ServiceName>Ыстық су, Есептеуіш | Гор. вода, Счётчик</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>711.36</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>711.36</FixSum><IsCounterService>true</IsCounterService><LastCount>691.01</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>48.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>676.19</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>12</ServiceId><ServiceName>Суық су,Есептеуіш | Хол.вода,Счетчик</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>381.76</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>381.76</FixSum><IsCounterService>true</IsCounterService><LastCount>691.01</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>25.76</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>676.19</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>25</ServiceId><ServiceName>Суық су к-ясы,Есеп-іш | К-ция хол.воды,Сч-к</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>263.52</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>263.52</FixSum><IsCounterService>true</IsCounterService><LastCount>569.62</LastCount><LastCountDate>2021-06-30T00:00:00.000+06:00</LastCountDate><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м3</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>25.76</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>559.39</PrevCount><PrevCountDate>2021-05-31T00:00:00.000+06:00</PrevCountDate><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>6</ServiceId><ServiceName>Ыстық су к-ясы,Есеп-іш | Кан-ция гор.воды, Сч-к</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>2212.16</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>2212.16</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/чел</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>553.04</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>11</ServiceId><ServiceName>ҚТҚ шығару | Вывоз ТБО</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>6429.6</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>6429.6</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>94.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>1</ServiceId><ServiceName>Пәтерді ұстау шығыны | Расходы на сод-ие жил.</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>1015.74</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>1015.74</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>14.85</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>10</ServiceId><ServiceName>Лифт | Лифт</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>300.0</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>300.0</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/квар</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>300.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>128</ServiceId><ServiceName>Домофон | Домофон</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>750.0</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>750.0</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/квар</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>750.0</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>190</ServiceId><ServiceName>Бейне бақылау | Видеонаблюдение</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter><InvoiceParameter><AvgCount>0.0</AvgCount><AvgPaySum>0.0</AvgPaySum><Calc>997.96</Calc><Counters/><DebtInfo></DebtInfo><DebtSum>0.0</DebtSum><Fine>0.0</Fine><FineInfo></FineInfo><FixCount>0.0</FixCount><FixSum>997.96</FixSum><IsCounterService>false</IsCounterService><LastCount>0.0</LastCount><LastCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><LastCountDateSubscriber>2021-07-25T00:00:00.000+06:00</LastCountDateSubscriber><LastCountSubscriber>0.0</LastCountSubscriber><MaxCalc>0.0</MaxCalc><MaxTariffValue>0.0</MaxTariffValue><Measure>тг/м2</Measure><MiddleCalc>0.0</MiddleCalc><MiddleTariffThreshold>0.0</MiddleTariffThreshold><MiddleTariffValue>0.0</MiddleTariffValue><MinCalc>0.0</MinCalc><MinTariffThreshold>0.0</MinTariffThreshold><MinTariffValue>14.59</MinTariffValue><PayCount>0.0</PayCount><PaySum>0.0</PaySum><PaymentOption></PaymentOption><PoshInfo></PoshInfo><PrevCount>0.0</PrevCount><PrevCountDate xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountDateSubscriber xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/><PrevCountSubscriber>0.0</PrevCountSubscriber><QuantityCount>0.0</QuantityCount><QuantityCountMax>0.0</QuantityCountMax><QuantityCountMiddle>0.0</QuantityCountMiddle><QuantityCountMin>0.0</QuantityCountMin><QuantityLossesCount>0.0</QuantityLossesCount><ReCalcKvtCount>0.0</ReCalcKvtCount><ReCalcSum>0.0</ReCalcSum><ServiceId>203</ServiceId><ServiceName>Күрделі жөндеу жиын-ғы | Накопл.на кап.ремонт</ServiceName><TKoef>1.0</TKoef><Tariff><Lines/><Type></Type><Value>0.0</Value></Tariff><TextInfo></TextInfo></InvoiceParameter></ParametersAttribute><PeriodDate>2021-07</PeriodDate><RegId>-1</RegId><Statuses>New</Statuses><Type>Alseco</Type></Invoice></Invoices><Payer><Address>г.Алматы, ул. Утеген Батыра, д.114, кв.45</Address><Id>6964370</Id><Name>БИЛАЛОВ КАЙРАТ БОЛАТОВИЧ</Name><Type>PAYNET</Type></Payer></PaymentDocument>',
                visible: false,
                serviceFieldId: 261,
                title: 'Полученный инвойс',
                serviceFieldName: 'Invoice'
              }
            ],
          purpose: 'Оплата коммунальных услуг Алсеко',
          repeatsEveryWeek: false,
          repeatsEveryMonth: false,
          dateStart: 0,
          dateScheduled: 1627214678370,
          dateTill: 0,
          serviceId: 1093,
          mcc:
            {
              id: 5999,
              title: 'Розничные магазины',
              smartBonus: false,
              type:
                {
                  id: 1000121,
                  title: 'Супермаркеты',
                  category: { id: 'SHOP', title: 'Маркет', visible: true },
                  code: ''
                }
            },
          sourceBin: '',
          terminalId: 'RPS00097',
          transCity: 'Almaty',
          transCountry: 'KAZ',
          reasonDetails: 'Оплата коммунальных услуг Алсеко'
        }
      ],
      [
        {
          hold: false,
          date: new Date('2021-07-25T18:04:38.370+0600'),
          movements:
            [
              {
                id: 'ORDER_1539671587',
                account: { id: 'kztAccount2' },
                invoice: null,
                sum: -16725.88,
                fee: 0
              }
            ],
          merchant: {
            fullTitle: 'Алсеко',
            mcc: 5999,
            location: null
          },
          comment: null
        }

      ]
    ]
  ])('converts outcome PAYM', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, kztAccount2)).toEqual(transaction)
  })
})
