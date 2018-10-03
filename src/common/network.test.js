import { parseXml } from './network'

describe('parseXml', () => {
  it('parses xml plain object', () => {
    expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
        <loginCompleted>false</loginCompleted> 
                    <confirmRegistrationStage> 
                        <mGUID>596822784bbcef111e3e1d2e1e22cb5e</mGUID> 
                    </confirmRegistrationStage> 
                    <confirmInfo> 
                        <type>smsp</type> 
                        <smsp> 
                            <lifeTime>597</lifeTime> 
                            <attemptsRemain>3</attemptsRemain> 
                        </smsp> 
                    </confirmInfo> 
                    <registrationParameters> 
                        <minimumPINLength>5</minimumPINLength> 
                    </registrationParameters> 
</response>`)).toEqual({
      response: {
        status: {
          code: '0'
        },
        loginCompleted: 'false',
        confirmRegistrationStage: {
          mGUID: '596822784bbcef111e3e1d2e1e22cb5e'
        },
        confirmInfo: {
          type: 'smsp',
          smsp: {
            lifeTime: '597',
            attemptsRemain: '3'
          }
        },
        registrationParameters: {
          minimumPINLength: '5'
        }
      }
    })
  })

  it('parses xml object with array', () => {
    expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?>
<response>
    <status>
        <code>0</code>
    </status>
                <cards>
                    <status>
                                <code>0</code>
                    </status>
?
                        <card>
                            <id>51999999</id>
                            <name>MasterCard Mass</name>
                                    <smsName>2235</smsName>
                                <description>MasterCard Mass</description>
                                <number>5469 55** **** 2235</number>
                            <isMain>true</isMain>
                            <type>debit</type>
    <availableLimit>
                        <amount>1650.30</amount>
    <currency>
        <code>RUB</code>
        <name>\xf0\xf3\xe1.</name>
    </currency>
    </availableLimit>
                            <state>active</state>
                                <cardAccount>40817810855760689742</cardAccount>
                            <showarrestdetail>false</showarrestdetail>
                                    <expireDate>21/2023</expireDate>
                                <statusWay4>+-\xca\xc0\xd0\xd2\xce\xd7\xca\xc0 \xce\xd2\xca\xd0\xdb\xd2\xc0</statusWay4>
                        </card>
?
                        <card>
                            <id>69472288</id>
                            <name>Visa Gold</name>
                                    <smsName>5678</smsName>
                                <description>Visa Gold</description>
                                <number>4279 01** **** 5678</number>
                            <isMain>true</isMain>
                            <type>credit</type>
    <availableLimit>
                        <amount>104599.86</amount>
    <currency>
        <code>RUB</code>
        <name>\xf0\xf3\xe1.</name>
    </currency>
    </availableLimit>
                            <state>active</state>
                            <showarrestdetail>false</showarrestdetail>
                                    <expireDate>05/2019</expireDate>
                                <statusWay4>+-\xca\xc0\xd0\xd2\xce\xd7\xca\xc0 \xce\xd2\xca\xd0\xdb\xd2\xc0</statusWay4>
                        </card>
                </cards>
</response>`)).toEqual({
      response: {
        cards: {
          card: [
            {
              availableLimit: {
                amount: '1650.30',
                currency: {
                  code: 'RUB',
                  name: 'ðóá.'
                }
              },
              cardAccount: '40817810855760689742',
              description: 'MasterCard Mass',
              expireDate: '21/2023',
              id: '51999999',
              isMain: 'true',
              name: 'MasterCard Mass',
              number: '5469 55** **** 2235',
              showarrestdetail: 'false',
              smsName: '2235',
              state: 'active',
              statusWay4: '+-ÊÀÐÒÎ×ÊÀ ÎÒÊÐÛÒÀ',
              type: 'debit'
            },
            {
              availableLimit: {
                amount: '104599.86',
                currency: {
                  code: 'RUB',
                  name: 'ðóá.'
                }
              },
              description: 'Visa Gold',
              expireDate: '05/2019',
              id: '69472288',
              isMain: 'true',
              name: 'Visa Gold',
              number: '4279 01** **** 5678',
              showarrestdetail: 'false',
              smsName: '5678',
              state: 'active',
              statusWay4: '+-ÊÀÐÒÎ×ÊÀ ÎÒÊÐÛÒÀ',
              type: 'credit'
            }
          ],
          status: {
            code: '0'
          }
        },
        status: {
          code: '0'
        }
      }
    })
  })

  it('parses CDATA', () => {
    expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>1</code> 
            <errors> 
                <error> 
           <text> 
               <![CDATA[ 
                   Вы ввели неправильный идентификатор или пароль из SMS. Пожалуйста, попробуйте снова. 
               ]]> 
            </text> 
        </error> 
            </errors> 
    </status> 
        <loginCompleted>false</loginCompleted> 
                    <confirmInfo> 
                        <type>smsp</type> 
                        <smsp> 
                            <lifeTime>587</lifeTime> 
                            <attemptsRemain>2</attemptsRemain> 
                        </smsp> 
                    </confirmInfo> 
</response>`)).toEqual({
      response: {
        confirmInfo: {
          smsp: {
            attemptsRemain: '2',
            lifeTime: '587'
          },
          type: 'smsp'
        },
        loginCompleted: 'false',
        status: {
          code: '1',
          errors: {
            error: {
              text: 'Вы ввели неправильный идентификатор или пароль из SMS. Пожалуйста, попробуйте снова.'
            }
          }
        }
      }
    })
  })

  it('parses complex xml', () => {
    expect(parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
                        <operations>
                            <operation><date>04.01.2018T00:00:00</date> 
    <sum> 
                        <amount>+95000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </sum> 
<description><![CDATA[Дополнительный взнос]]></description></operation>
                            <operation><date>05.01.2018T00:00:00</date> 
    <sum> 
                        <amount>-50.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </sum> 
<description><![CDATA[Частичная выдача]]></description></operation>
                            <operation><date>17.01.2018T00:00:00</date> 
    <sum> 
                        <amount>-62000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </sum> 
<description><![CDATA[Частичная выдача]]></description></operation>
                        </operations>
                            <balances> 
    <openingBalance> 
                        <amount>4657.30</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </openingBalance> 
    <closingBalance> 
                        <amount>1440.30</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </closingBalance> 
                            </balances> 
</response>`)).toEqual({
      response: {
        status: {
          code: '0'
        },
        operations: {
          operation: [
            {
              date: '04.01.2018T00:00:00',
              sum: {
                amount: '+95000.00',
                currency: {
                  code: 'RUB',
                  name: 'руб.'
                }
              },
              description: 'Дополнительный взнос'
            },
            {
              date: '05.01.2018T00:00:00',
              sum: {
                amount: '-50.00',
                currency: {
                  code: 'RUB',
                  name: 'руб.'
                }
              },
              description: 'Частичная выдача'
            },
            {
              date: '17.01.2018T00:00:00',
              sum: {
                amount: '-62000.00',
                currency: {
                  code: 'RUB',
                  name: 'руб.'
                }
              },
              description: 'Частичная выдача'
            }
          ]
        },
        balances: {
          openingBalance: {
            amount: '4657.30',
            currency: {
              code: 'RUB',
              name: 'руб.'
            }
          },
          closingBalance: {
            amount: '1440.30',
            currency: {
              code: 'RUB',
              name: 'руб.'
            }
          }
        }
      }
    })
  })

  it('parses attributes', () => {
    expect(parseXml(`<?xml version="1.0" encoding="UTF-8"?><response version="1.0"><merchant><id>0</id><signature>0</signature></merchant><data><oper>cmt</oper><info>
            <statements status="excellent" credit="0" debet="0">
                <statement card="5167985500160759" appcode="558011" trandate="2018-03-14" trantime="10:25:00" amount="164.00 UAH" cardamount="-164.00 UAH" rest="350.09 UAH" terminal="" description="Оплата услуг через Приват24. Получатель: Воля, ТОВ(Volia). Код квитанции: 1168-3751-8969-5310"/>
                <statement card="5167985500160759" appcode="162010" trandate="2018-03-08" trantime="09:34:00" amount="126.00 UAH" cardamount="-126.00 UAH" rest="514.09 UAH" terminal="" description="Оплата услуг через Приват24. Получатель: Рівнегаз Збут, ТзОВ. Код квитанции: 1162-3446-5133-0132"/>
                <statement card="5168742331568802" appcode="" trandate="2018-03-01" trantime="00:00:00" amount="3.50 UAH" cardamount="3.50 UAH" rest="660.09 UAH" terminal="" description="Начисление процентов на остаток средств по договору"/>
                <statement card="5168742331568802" appcode="" trandate="2018-03-01" trantime="00:00:00" amount="0.68 UAH" cardamount="-0.68 UAH" rest="656.59 UAH" terminal="" description="Удержание налога с начисленных на остаток собственных средств на карте процентов"/>
            </statements></info></data></response>`)).toEqual({
      response: {
        version: '1.0',
        merchant: {
          id: '0',
          signature: '0'
        },
        data: {
          oper: 'cmt',
          info: {
            statements: {
              status: 'excellent',
              credit: '0',
              debet: '0',
              statement: [
                {
                  card: '5167985500160759',
                  appcode: '558011',
                  trandate: '2018-03-14',
                  trantime: '10:25:00',
                  amount: '164.00 UAH',
                  cardamount: '-164.00 UAH',
                  rest: '350.09 UAH',
                  terminal: '',
                  description: 'Оплата услуг через Приват24. Получатель: Воля, ТОВ(Volia). Код квитанции: 1168-3751-8969-5310'
                },
                {
                  card: '5167985500160759',
                  appcode: '162010',
                  trandate: '2018-03-08',
                  trantime: '09:34:00',
                  amount: '126.00 UAH',
                  cardamount: '-126.00 UAH',
                  rest: '514.09 UAH',
                  terminal: '',
                  description: 'Оплата услуг через Приват24. Получатель: Рівнегаз Збут, ТзОВ. Код квитанции: 1162-3446-5133-0132'
                },
                {
                  card: '5168742331568802',
                  appcode: '',
                  trandate: '2018-03-01',
                  trantime: '00:00:00',
                  amount: '3.50 UAH',
                  cardamount: '3.50 UAH',
                  rest: '660.09 UAH',
                  terminal: '',
                  description: 'Начисление процентов на остаток средств по договору'
                },
                {
                  card: '5168742331568802',
                  appcode: '',
                  trandate: '2018-03-01',
                  trantime: '00:00:00',
                  amount: '0.68 UAH',
                  cardamount: '-0.68 UAH',
                  rest: '656.59 UAH',
                  terminal: '',
                  description: 'Удержание налога с начисленных на остаток собственных средств на карте процентов'
                }
              ]
            }
          }
        }
      }
    })
  })

  it('fails parsing XML without root node', () => {
    expect(() => parseXml('plain text')).toThrow()
    expect(() => parseXml(`{"key":123}`)).toThrow()
  })
})
