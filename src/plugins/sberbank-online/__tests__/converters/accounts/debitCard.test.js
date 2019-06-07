import { parseXml } from '../../../../../common/network'
import { convertCards } from '../../../converters'

describe('convertCards', () => {
  const nowDate = new Date('2018-06-02T12:00:00Z')

  it('converts debit main and additional cards', () => {
    const jsonArray = parseXml(`<response> 
    <status> 
        <code>0</code> 
    </status> 
    <cards> 
        <status> 
            <code>0</code> 
        </status> 
        <card> 
            <id>105751883</id> 
            <name>Maestro</name> 
            <smsName>8802</smsName> 
            <description>Maestro</description> 
            <number>6390 02** **** **88 02</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>97,61</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <cardAccount>40817810828150008490</cardAccount> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>11/2018</expireDate> 
            <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
        </card> 
        <card> 
            <id>105751885</id> 
            <name>Visa Classic</name> 
            <smsName>6939</smsName> 
            <description>Visa Classic</description> 
            <number>4276 28** **** 6939</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>2434,97</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <cardAccount>40817810528150034829</cardAccount> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>02/2020</expireDate> 
            <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
        </card> 
        <card> 
            <id>105751881</id> 
            <name>Electron</name> 
            <smsName>7622</smsName> 
            <description>Electron</description> 
            <number>4276 82** **** 7622</number> 
            <isMain>true</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>150,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>08/2018</expireDate> 
            <statusWay4>K-ДЕЙСТ.ПРИОСТАНОВЛЕНО</statusWay4> 
        </card> 
        <card> 
            <id>105751882</id> 
            <name>Electron</name> 
            <smsName>2761</smsName> 
            <description>Electron</description> 
            <number>4276 82** **** 2761</number> 
            <isMain>false</isMain> 
            <type>debit</type> 
            <availableLimit> 
                <amount>150,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </availableLimit> 
            <state>active</state> 
            <additionalCardType>Client2Other</additionalCardType> 
            <mainCardId>105751881</mainCardId> 
            <showarrestdetail>false</showarrestdetail> 
            <expireDate>08/2018</expireDate> 
            <statusWay4>K-ДЕЙСТ.ПРИОСТАНОВЛЕНО</statusWay4> 
        </card> 
    </cards> 
</response>`).response.cards.card.map(json => {
      return { account: json }
    })
    expect(convertCards(jsonArray, nowDate)).toEqual([
      {
        products: [
          {
            id: '105751883',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:105751883',
          type: 'ccard',
          title: 'Maestro',
          instrument: 'RUB',
          available: 97.61,
          syncID: [
            '639002********8802',
            '40817810828150008490'
          ]
        }
      },
      {
        products: [
          {
            id: '105751885',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:105751885',
          type: 'ccard',
          title: 'Visa Classic',
          instrument: 'RUB',
          available: 2434.97,
          syncID: [
            '427628******6939',
            '40817810528150034829'
          ]
        }
      },
      {
        products: [
          {
            id: '105751881',
            type: 'card',
            instrument: 'RUB'
          },
          {
            id: '105751882',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:105751881',
          type: 'ccard',
          title: 'Electron',
          instrument: 'RUB',
          available: 150,
          syncID: [
            '427682******2761',
            '427682******7622'
          ]
        }
      }
    ])
  })

  it('skips expired cards', () => {
    expect(convertCards([
      {
        account: {
          id: '593949641',
          name: 'Visa Classic',
          smsName: '3233',
          description: 'Visa Classic',
          number: '427655******3233',
          isMain: 'true',
          type: 'debit',
          availableLimit: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'active',
          cardAccount: '40817810423044618561',
          showarrestdetail: 'false',
          tokenExists: 'false',
          expireDate: '10/2017',
          statusWay4: '+-КАРТОЧКА ОТКРЫТА'
        },
        details: {
          holderName: 'МИХАИЛ ИГОРЕВИЧ Л.',
          availableCashLimit: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
          purchaseLimit: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
          officeName: 'Доп.офис №9055/0774',
          accountNumber: '40817810423044618561',
          expireDate: '10/2017',
          name: 'Visa Classic',
          cardAccount: '40817810455033618561',
          statusWay4: '+-КАРТОЧКА ОТКРЫТА'
        }
      }
    ], nowDate)).toEqual([])
  })

  it('converts not received cards', () => {
    expect(convertCards([
      {
        id: '601600514',
        name: 'MasterCard Mass',
        smsName: '2525',
        description: 'MasterCard Mass',
        number: '5469 55** **** 2525',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '3479.13', currency: { code: 'RUB', name: 'руб.' } },
        state: 'delivery',
        cardAccount: '40817810155862143125',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '04/2021',
        statusWay4: 'H-НЕ ВЫДАНА КЛИЕНТУ'
      },
      {
        id: '597382852',
        name: 'MIR',
        smsName: '2163',
        description: 'MIR',
        number: '2202 20** **** 2163',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '8653.00', currency: { code: 'RUB', name: 'руб.' } },
        state: 'active',
        cardAccount: '40817810855866742233',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '09/2023',
        statusWay4: '+-КАРТОЧКА ОТКРЫТА'
      },
      {
        id: '578021451',
        name: 'MasterCard Mass',
        smsName: '7830',
        description: 'MasterCard Mass',
        number: '5469 55** **** 7830',
        isMain: 'false',
        type: 'debit',
        availableLimit: { amount: '3479.13', currency: { code: 'RUB', name: 'руб.' } },
        state: 'blocked',
        additionalCardType: 'Client2Other',
        mainCardId: '601600514',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '04/2019',
        statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
      },
      {
        id: '577869914',
        name: 'Visa Classic',
        smsName: '4430',
        description: 'Visa Classic',
        number: '4276 01** **** 4430',
        isMain: 'true',
        type: 'credit',
        availableLimit: { amount: '542.01', currency: { code: 'RUB', name: 'руб.' } },
        state: 'blocked',
        cardAccount: '40817810240000077824',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '08/2021',
        statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
      },
      {
        id: '577869916',
        name: 'Visa Classic',
        smsName: '1181',
        description: 'Visa Classic',
        number: '4276 40** **** 1181',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '6601.93', currency: { code: 'RUB', name: 'руб.' } },
        state: 'active',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '08/2020',
        statusWay4: '+-КАРТОЧКА ОТКРЫТА'
      },
      {
        id: '577869917',
        name: 'MasterCard Mass',
        smsName: '9906',
        description: 'MasterCard Mass',
        number: '5469 55** **** 9906',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '3479.13', currency: { code: 'RUB', name: 'руб.' } },
        state: 'blocked',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '04/2019',
        statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
      },
      {
        id: '577869918',
        name: 'Visa Platinum',
        smsName: '3483',
        description: 'Visa Platinum',
        number: '4274 27** **** 3483',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '12638.56', currency: { code: 'RUB', name: 'руб.' } },
        state: 'active',
        cardAccount: '40817810755864853729',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '09/2020',
        statusWay4: '+-КАРТОЧКА ОТКРЫТА'
      },
      {
        id: '584542817',
        name: 'MasterCard Mass',
        smsName: '4511',
        description: 'MasterCard Mass',
        number: '5469 55** **** 4511',
        isMain: 'true',
        type: 'debit',
        availableLimit: { amount: '3479.13', currency: { code: 'RUB', name: 'руб.' } },
        state: 'blocked',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '04/2019',
        statusWay4: 'L-ПОТЕРЯНА'
      },
      {
        id: '584542818',
        name: 'MasterCard Mass',
        smsName: '9020',
        description: 'MasterCard Mass',
        number: '5469 55** **** 9020',
        isMain: 'false',
        type: 'debit',
        availableLimit: { amount: '3479.13', currency: { code: 'RUB', name: 'руб.' } },
        state: 'active',
        additionalCardType: 'Client2Other',
        mainCardId: '601600514',
        showarrestdetail: 'true',
        tokenExists: 'false',
        expireDate: '04/2019',
        statusWay4: '+-КАРТОЧКА ОТКРЫТА'
      }
    ].map(account => { return { account } }), nowDate)).toEqual([
      {
        products: [
          {
            id: '597382852',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:597382852',
          type: 'ccard',
          title: 'MIR',
          instrument: 'RUB',
          available: 8653,
          syncID: [
            '220220******2163',
            '40817810855866742233'
          ]
        }
      },
      {
        products: [
          {
            id: '577869916',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:577869916',
          type: 'ccard',
          title: 'Visa Classic',
          instrument: 'RUB',
          available: 6601.93,
          syncID: [
            '427640******1181'
          ]
        }
      },
      {
        products: [
          {
            id: '577869918',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:577869918',
          type: 'ccard',
          title: 'Visa Platinum',
          instrument: 'RUB',
          available: 12638.56,
          syncID: [
            '427427******3483',
            '40817810755864853729'
          ]
        }
      },
      {
        products: [
          {
            id: '584542818',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:584542818',
          type: 'ccard',
          title: 'MasterCard Mass',
          instrument: 'RUB',
          available: 3479.13,
          syncID: [
            '546955******9020',
            '40817810155862143125'
          ]
        }
      }
    ])
  })

  it('converts several main cards for one account', () => {
    expect(convertCards([
      {
        account: {
          id: '587949969',
          name: 'Кредитная',
          smsName: '8293',
          description: 'MasterCard Mass',
          number: '5313 29** **** 8293',
          isMain: 'true',
          type: 'credit',
          availableLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'active',
          cardAccount: '45817810540402102383',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '01/2019',
          statusWay4: '+-КАРТОЧКА ОТКРЫТА'
        },
        details: {
          detail: {
            creditType: {
              limit: { amount: '200000,00', currency: { code: 'RUB', name: 'руб.' } },
              ownSum: { amount: '-399,00', currency: { code: 'RUB', name: 'руб.' } },
              minPayment: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
              DebtInfoResult: {
                StatusCode: '0',
                DebtInfo: {
                  openDate: '06.04.2016T00:00:00',
                  ovdAmount: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  LastBillingDate: '05.01.2019T00:00:00',
                  MandPaymOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  MandatoryPaymentPAN: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
                  TotalOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Debt: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_Tomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_DayAfterTomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Blocked_Cache: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_ReportToday: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } }
                }
              }
            },
            holderName: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
            availableCashLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            purchaseLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            officeName: 'Доп.офис №8646/090',
            accountNumber: '45817810540402102383',
            expireDate: '01/2019',
            name: 'Кредитная',
            cardAccount: '45817810540402102383',
            statusWay4: '+-КАРТОЧКА ОТКРЫТА'
          }
        }
      },
      {
        account: {
          id: '602323574',
          name: 'Новая',
          smsName: '8005',
          description: 'Visa Classic',
          number: '4276 31** **** 8005',
          isMain: 'true',
          type: 'debit',
          availableLimit: { amount: '18329,11', currency: { code: 'RUB', name: 'руб.' } },
          state: 'blocked',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '02/2020',
          statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
        },
        details: null
      },
      {
        account: {
          id: '643274742',
          name: 'MasterCard Mass',
          smsName: '0997',
          description: 'MasterCard Mass',
          number: '5469 21** **** 0997',
          isMain: 'true',
          type: 'credit',
          availableLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'active',
          cardAccount: '45817810540402102383',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '12/2021',
          statusWay4: '+-КАРТОЧКА ОТКРЫТА'
        },
        details: {
          detail: {
            creditType: {
              limit: { amount: '200000,00', currency: { code: 'RUB', name: 'руб.' } },
              ownSum: { amount: '-399,00', currency: { code: 'RUB', name: 'руб.' } },
              minPayment: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
              DebtInfoResult: {
                StatusCode: '0',
                DebtInfo: {
                  openDate: '06.04.2016T00:00:00',
                  ovdAmount: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  LastBillingDate: '05.01.2019T00:00:00',
                  MandPaymOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  MandatoryPaymentPAN: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
                  TotalOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Debt: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_Tomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_DayAfterTomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Blocked_Cache: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_ReportToday: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } }
                }
              }
            },
            holderName: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
            availableCashLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            purchaseLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            officeName: 'Доп.офис №8646/090',
            accountNumber: '45817810540402102383',
            expireDate: '12/2021',
            name: 'MasterCard Mass',
            cardAccount: '45817810540402102383',
            statusWay4: '+-КАРТОЧКА ОТКРЫТА'
          }
        }
      },
      {
        account: {
          id: '624914437',
          name: 'Visa Classic',
          smsName: '1241',
          description: 'Visa Classic',
          number: '4276 09** **** 1241',
          isMain: 'true',
          type: 'debit',
          availableLimit: { amount: '18329,11', currency: { code: 'RUB', name: 'руб.' } },
          state: 'active',
          cardAccount: '40817810631001292724',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '02/2020',
          statusWay4: '+-КАРТОЧКА ОТКРЫТА'
        },
        details: null
      },
      {
        account: {
          id: '642513943',
          name: 'MasterCard Mass',
          smsName: '2039',
          description: 'MasterCard Mass',
          number: '5469 28** **** 2039',
          isMain: 'true',
          type: 'credit',
          availableLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'blocked',
          cardAccount: '45817810540402102383',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '12/2021',
          statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
        },
        details: {
          detail: {
            creditType: {
              limit: { amount: '200000,00', currency: { code: 'RUB', name: 'руб.' } },
              ownSum: { amount: '-399,00', currency: { code: 'RUB', name: 'руб.' } },
              minPayment: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
              DebtInfoResult: {
                StatusCode: '0',
                DebtInfo: {
                  openDate: '06.04.2016T00:00:00',
                  ovdAmount: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  LastBillingDate: '05.01.2019T00:00:00',
                  MandPaymOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  MandatoryPaymentPAN: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
                  TotalOnReport: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Debt: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_Tomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_DayAfterTomorrow: { amount: '399.00', currency: { code: 'RUR', name: 'руб.' } },
                  Blocked_Cache: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } },
                  Total_ReportToday: { amount: '0.00', currency: { code: 'RUR', name: 'руб.' } }
                }
              }
            },
            holderName: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
            availableCashLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            purchaseLimit: { amount: '199601,00', currency: { code: 'RUB', name: 'руб.' } },
            officeName: 'Доп.офис №8646/090',
            accountNumber: '45817810540402102383',
            expireDate: '12/2021',
            name: 'MasterCard Mass',
            cardAccount: '45817810540402102383',
            statusWay4: 'K-ДЕЙСТ.ПРИОСТАНОВЛЕНО'
          }
        }
      },
      {
        account: {
          id: '587269324',
          name: 'UEC',
          smsName: '2501',
          description: 'UEC',
          number: '6054 61** **** 2291',
          isMain: 'true',
          type: 'debit',
          availableLimit: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'blocked',
          showarrestdetail: 'true',
          tokenExists: 'false',
          expireDate: '03/2021',
          statusWay4: 'a-ПЕРВИЧНЫЙ ВЫПУСК УЭК'
        },
        details: null
      }
    ], nowDate)).toEqual([
      {
        products: [
          {
            id: '587949969',
            type: 'card',
            instrument: 'RUB'
          },
          {
            id: '643274742',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:587949969',
          type: 'ccard',
          title: 'Кредитная',
          instrument: 'RUB',
          balance: -399,
          creditLimit: 200000,
          syncID: [
            '531329******8293',
            '546921******0997',
            '45817810540402102383'
          ]
        }
      },
      {
        products: [
          {
            id: '624914437',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:624914437',
          type: 'ccard',
          title: 'Visa Classic',
          instrument: 'RUB',
          available: 18329.11,
          syncID: [
            '427609******1241',
            '40817810631001292724'
          ]
        }
      }
    ])
  })
})
