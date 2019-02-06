import { parseXml } from '../../common/network'
import {
  convertAccount,
  convertCards,
  convertDeposit,
  convertLoan,
  convertTransaction,
  convertTarget,
  getId,
  convertMetalAccount,
  adjustTransactionsAndCheckBalance
} from './converters'

describe('convertLoan', () => {
  it('returns valid loan', () => {
    const json = parseXml(`<loan> 
        <id>11721741</id> 
        <name>Потребительский кредит</name> 
        <smsName>4789</smsName> 
        <amount> 
            <amount>1500000,00</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </amount> 
        <nextPayAmount> 
            <amount>50180,44</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </nextPayAmount> 
        <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
        <state>undefined</state> 
    </loan>`).loan
    const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
    <detail> 
        <description>Потребительский кредит</description> 
        <repaymentMethod>аннуитетный</repaymentMethod> 
        <termStart>02.12.2017T00:00:00</termStart> 
        <termDuration>3-0-0</termDuration> 
        <termEnd>02.12.2020T00:00:00</termEnd> 
        <borrowerFullName>Николай Николаевич Н.</borrowerFullName> 
        <agreementNumber>92890359</agreementNumber> 
        <accountNumber>45506810700020054789</accountNumber> 
        <personRole>заемщик/созаемщик</personRole> 
        <remainAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </remainAmount> 
        <nextPayAmount> 
            <amount>50180,44</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </nextPayAmount> 
        <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
        <balanceAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </balanceAmount> 
        <address>г.Москва, Ленинский проспект, 99</address> 
        <name>Потребительский кредит</name> 
    </detail> 
    <extDetail> 
        <kind> 
                                    АННУИТЕТНЫЙ 
        </kind> 
        <fullName>Потребительский кредит</fullName> 
        <rate>12.50</rate> 
        <type>Потребительский кредит</type> 
        <termEnd>02.12.2020T00:00:00</termEnd> 
        <origianlAmount> 
            <amount>1500000,00</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </origianlAmount> 
        <remainAmount> 
            <amount>1327156,27</amount> 
            <currency> 
                <code>RUB</code>  
                <name>руб.</name> 
            </currency> 
        </remainAmount> 
        <nextPayment> 
            <nextPayDate>04.06.2018T00:00:00</nextPayDate> 
            <nextPaymentAmount> 
                <amount>50180,44</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </nextPaymentAmount> 
            <infoText> 
                                        Ближайший платёж 04 июня, 50 180,44 руб.. Не хватает 49 492,41 руб. для оплаты. 
            </infoText> 
        </nextPayment> 
        <currentPayment> 
            <currentPayDate>04.06.2018T00:00:00</currentPayDate> 
            <nextPaymentAmount> 
                <amount>50180,44</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </nextPaymentAmount> 
            <mainDeptAmount> 
                <amount>36134,06</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </mainDeptAmount> 
            <interestsAmount> 
                <amount>14046,38</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </interestsAmount> 
            <repaymentAmount> 
                <amount>688,03</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </repaymentAmount> 
        </currentPayment> 
        <loanInfo> 
            <origianlAmount> 
                <amount>1500000,00</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </origianlAmount> 
            <remainAmount> 
                <amount>1327156,27</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </remainAmount> 
            <mainDeptAmount> 
                <amount>1323078,29</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </mainDeptAmount> 
            <interestPaymentAmount> 
                <amount>4077,98</amount> 
                <currency> 
                    <code>RUB</code>  
                    <name>руб.</name> 
                </currency> 
            </interestPaymentAmount> 
            <creditingRate>12.50</creditingRate> 
            <termStart>02.12.2017T00:00:00</termStart> 
            <termEnd>02.12.2020T00:00:00</termEnd> 
            <agreementNumber>92890359</agreementNumber> 
            <accountNumber>45506810700020054789</accountNumber> 
            <repaymentMethod>аннуитетный</repaymentMethod> 
            <agencyAddress>г.Москва, Ленинский проспект, 99</agencyAddress> 
            <borrower>Николай Николаевич Н.</borrower> 
        </loanInfo> 
    </extDetail> 
</response>`).response
    expect(convertLoan(json, details)).toEqual({
      products: [
        {
          id: '11721741',
          type: 'loan',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'loan:11721741',
        type: 'loan',
        title: 'Потребительский кредит',
        instrument: 'RUB',
        syncID: [
          '45506810700020054789'
        ],
        balance: -1327156.27,
        startBalance: 1500000,
        capitalization: true,
        percent: 12.50,
        startDate: new Date('2017-12-02T00:00:00+03:00'),
        endDateOffsetInterval: 'year',
        endDateOffset: 3,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })

  it('returns valid loan if some fields are missing', () => {
    expect(convertLoan({
      id: '11934064',
      name: 'Потребительский кредит',
      smsName: '9184',
      state: null
    }, {
      status: {
        code: '0'
      },
      detail: {
        description: 'Потребительский кредит',
        repaymentMethod: 'аннуитетный',
        termStart: '04.01.2018T00:00:00',
        termDuration: '4-9-0',
        termEnd: '04.10.2022T00:00:00',
        agreementNumber: '235',
        accountNumber: '45507810013000079184',
        personRole: 'заемщик/созаемщик',
        name: 'Потребительский кредит'
      },
      extDetail: {
        kind: 'АННУИТЕТНЫЙ',
        fullName: 'Потребительский кредит',
        type: null,
        termEnd: '04.10.2022T00:00:00',
        origianlAmount: { amount: '700000,00', currency: { code: 'RUB', name: 'руб.' } },
        nextPayment: { infoText: 'Ближайший платёж ,' },
        currentPayment: null,
        loanInfo: {
          origianlAmount: { amount: '700000,00', currency: { code: 'RUB', name: 'руб.' } },
          termStart: '04.01.2018T00:00:00',
          termEnd: '04.10.2022T00:00:00',
          agreementNumber: '235',
          accountNumber: '45507810013000079184',
          repaymentMethod: 'аннуитетный'
        }
      }
    })).toEqual({
      products: [
        {
          id: '11934064',
          type: 'loan',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'loan:11934064',
        type: 'loan',
        title: 'Потребительский кредит',
        instrument: 'RUB',
        syncID: [
          '45507810013000079184'
        ],
        balance: -700000,
        startBalance: 700000,
        capitalization: true,
        percent: 1,
        startDate: new Date('2018-01-04T00:00:00+03:00'),
        endDateOffsetInterval: 'month',
        endDateOffset: 57,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })

  it('returns valid loan if termDuration is missing', () => {
    expect(convertLoan({
      id: '11934064',
      name: 'Потребительский кредит',
      smsName: '9184',
      state: null
    }, {
      status: {
        code: '0'
      },
      detail: {
        description: 'Потребительский кредит',
        repaymentMethod: 'аннуитетный',
        termStart: '04.01.2018T00:00:00',
        termEnd: '04.10.2022T00:00:00',
        agreementNumber: '235',
        accountNumber: '45507810013000079184',
        personRole: 'заемщик/созаемщик',
        name: 'Потребительский кредит'
      },
      extDetail: {
        kind: 'АННУИТЕТНЫЙ',
        fullName: 'Потребительский кредит',
        type: null,
        termEnd: '04.10.2022T00:00:00',
        origianlAmount: { amount: '700000,00', currency: { code: 'RUB', name: 'руб.' } },
        nextPayment: { infoText: 'Ближайший платёж ,' },
        currentPayment: null,
        loanInfo: {
          origianlAmount: { amount: '700000,00', currency: { code: 'RUB', name: 'руб.' } },
          termStart: '04.01.2018T00:00:00',
          termEnd: '04.10.2022T00:00:00',
          agreementNumber: '235',
          accountNumber: '45507810013000079184',
          repaymentMethod: 'аннуитетный'
        }
      }
    })).toEqual({
      products: [
        {
          id: '11934064',
          type: 'loan',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'loan:11934064',
        type: 'loan',
        title: 'Потребительский кредит',
        instrument: 'RUB',
        syncID: [
          '45507810013000079184'
        ],
        balance: -700000,
        startBalance: 700000,
        capitalization: true,
        percent: 1,
        startDate: new Date('2018-01-04T00:00:00+03:00'),
        endDateOffsetInterval: 'month',
        endDateOffset: 57,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })
})

describe('convertDeposit', () => {
  it('returns valid deposit', () => {
    const json = parseXml(`<account> 
                            <id>12632802</id> 
                            <name>Вклад Счёт (647)</name> 
                                <rate>0.01</rate> 
            <closeDate>15.01.2023</closeDate> 
                                    <smsName>3647</smsName> 
                                <number>42307810275022433647</number> 
    <balance> 
                        <amount>4845.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </balance> 
    <availcash> 
                        <amount>4835.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availcash> 
                            <state>OPENED</state> 
                                <moneyBoxAvailable>true</moneyBoxAvailable> 
                            <arrested> 
                                    false 
                            </arrested> 
                            <showarrestdetail>false</showarrestdetail> 
                        </account> `).account
    const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
            <detail> 
                <description>Универсальный 5 лет</description> 
                    <period>0-0-1826</period> 
            <open>15.01.2013T00:00:00</open> 
            <close>15.01.2023T00:00:00</close> 
                    <interestRate>0.01</interestRate> 
    <maxSumWrite> 
                        <amount>4835.23</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </maxSumWrite> 
                        <passbook>true</passbook> 
                    <crossAgency>true</crossAgency> 
                    <prolongation>true</prolongation> 
    <irreducibleAmt> 
                        <amount>10.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </irreducibleAmt> 
                <name>Вклад Счёт (214)</name> 
                <canChangePercentDestination> 
                    true 
                </canChangePercentDestination> 
                    <moneyBoxAvailable> 
                        true 
                    </moneyBoxAvailable> 
            </detail> 
</response> `).response
    expect(convertDeposit(json, details)).toEqual({
      products: [
        {
          id: '12632802',
          type: 'account',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'account:12632802',
        type: 'deposit',
        title: 'Вклад Счёт (647)',
        instrument: 'RUB',
        syncID: [
          '42307810275022433647'
        ],
        balance: 4845.23,
        startBalance: 0,
        capitalization: true,
        percent: 0.01,
        startDate: new Date('2013-01-15T00:00:00+03:00'),
        endDateOffsetInterval: 'day',
        endDateOffset: 1826,
        payoffInterval: 'month',
        payoffStep: 1
      }
    })
  })
})

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

  it('converts credit card', () => {
    const account = parseXml(`<card> 
                            <id>69474436</id> 
                            <name>Visa Gold</name> 
                                    <smsName>7314</smsName> 
                                <description>Visa Gold</description> 
                                <number>4279 01** **** 7314</number> 
                            <isMain>true</isMain> 
                            <type>credit</type> 
    <availableLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availableLimit> 
                            <state>active</state> 
                                <cardAccount>40817810855501402320</cardAccount> 
                            <showarrestdetail>false</showarrestdetail> 
                                <tokenExists> 
                                    false 
                                </tokenExists> 
                                    <expireDate>08/2018</expireDate> 
                                <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
                        </card>`).card
    const details = parseXml(`<?xml version="1.0" encoding="windows-1251" ?> 
<response> 
    <status> 
        <code>0</code> 
    </status> 
            <detail> 
                    <creditType> 
    <limit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </limit> 
    <ownSum> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </ownSum> 
    <minPayment> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </minPayment> 
                            <DebtInfoResult> 
                                <StatusCode> 
                                    0 
                                </StatusCode> 
                                    <DebtInfo> 
            <openDate>05.08.2015T00:00:00</openDate> 
    <ovdAmount> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </ovdAmount> 
            <LastBillingDate>04.05.2018T00:00:00</LastBillingDate> 
    <MandPaymOnReport> 
                        <amount>1226.98</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </MandPaymOnReport> 
    <MandatoryPaymentPAN> 
                        <amount>0.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </MandatoryPaymentPAN> 
    <TotalOnReport> 
                        <amount>24539.58</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </TotalOnReport> 
    <Debt> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Debt> 
    <Total_Tomorrow> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_Tomorrow> 
    <Total_DayAfterTomorrow> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_DayAfterTomorrow> 
    <Blocked_Cache> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Blocked_Cache> 
    <Total_ReportToday> 
                        <amount>0.00</amount> 
                <currency> 
                    <code>RUR</code> 
                    <name>руб.</name> 
                </currency> 
    </Total_ReportToday> 
                                    </DebtInfo> 
                            </DebtInfoResult> 
                    </creditType> 
                <holderName>НИКОЛАЙ НИКОЛАЕВИЧ Н.</holderName> 
    <availableCashLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </availableCashLimit> 
    <purchaseLimit> 
                        <amount>125000.00</amount> 
    <currency> 
        <code>RUB</code>  
        <name>руб.</name> 
    </currency> 
    </purchaseLimit> 
                <officeName>Доп.офис №9055/0603</officeName> 
                    <accountNumber>40817810855501402320</accountNumber> 
                        <expireDate>08/2018</expireDate> 
                <name>Visa Gold</name> 
                    <cardAccount>40817810855501402320</cardAccount> 
                    <statusWay4>+-КАРТОЧКА ОТКРЫТА</statusWay4> 
            </detail> 
</response>`).response
    expect(convertCards([
      {
        account,
        details
      }
    ], nowDate)).toEqual([
      {
        products: [
          {
            id: '69474436',
            type: 'card',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'card:69474436',
          type: 'ccard',
          title: 'Visa Gold',
          instrument: 'RUB',
          creditLimit: 125000,
          balance: 0,
          syncID: [
            '427901******7314',
            '40817810855501402320'
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

describe('convertAccount', () => {
  it('returns valid account', () => {
    expect(convertAccount({
      id: '567930851',
      name: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      rate: '4.00',
      closeDate: '05.08.2018',
      smsName: '4892',
      number: '42305200715542994892',
      balance: { amount: '90467.72', currency: { code: 'RUB', name: 'руб.' } },
      availcash: { amount: '60467.72', currency: { code: 'RUB', name: 'руб.' } },
      state: 'OPENED',
      moneyBoxAvailable: 'true',
      arrested: 'false',
      showarrestdetail: 'false'
    }, {
      description: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      period: '0-0-181',
      open: '05.02.2018T00:00:00',
      close: '05.08.2018T00:00:00',
      interestRate: '4.00',
      maxSumWrite: { amount: '60467.72', currency: { code: 'RUB', name: 'руб.' } },
      passbook: 'false',
      crossAgency: 'true',
      prolongation: 'true',
      irreducibleAmt: { amount: '30000.00', currency: { code: 'RUB', name: 'руб.' } },
      name: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      canChangePercentDestination: 'true',
      moneyBoxAvailable: 'true',
      maxBalance: '1740000.00'
    })).toEqual({
      products: [
        {
          id: '567930851',
          type: 'account',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'account:567930851',
        type: 'checking',
        title: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
        instrument: 'RUB',
        balance: 90467.72,
        savings: true,
        syncID: [
          '42305200715542994892'
        ]
      }
    })
  })
})

describe('convertTarget', () => {
  it('returns valid target accounts', () => {
    expect(convertTarget({
      type: 'RESERVE',
      id: '500603794',
      name: 'Финансовый резерв',
      comment: 'Подушка',
      date: '16.04.2018',
      amount: { amount: '500000.00', currency: { code: 'RUB', name: 'руб.' } },
      status: 'accountEnabled',
      account: {
        id: '560357253',
        rate: '1.00',
        value: { amount: '700.29', currency: { code: 'RUB', name: 'руб.' } },
        availcash: { amount: '700,29', currency: { code: 'RUB', name: 'руб.' } },
        arrested: 'false',
        showarrestdetail: 'false'
      },
      statusDescription: 'Информация о вкладе недоступна. Возможны две причины: задержка получения данных или вклад Вами был закрыт.'
    }, {
      description: 'Сберегательный счет',
      open: '16.04.2017T00:00:00',
      close: '01.01.2099T00:00:00',
      interestRate: '1.00',
      maxSumWrite: { amount: '700,29', currency: { code: 'RUB', name: 'руб.' } },
      passbook: 'false',
      crossAgency: 'true',
      prolongation: 'false',
      irreducibleAmt: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
      name: 'Сберегательный счет',
      target: {
        name: 'Финансовый резерв',
        comment: 'Подушка',
        date: '16.04.2018',
        amount: { amount: '500000.00', currency: { code: 'RUB', name: 'руб.' } }
      },
      canChangePercentDestination: 'false',
      moneyBoxAvailable: 'true',
      moneyBoxes: { box: { id: '27543068356', sumType: 'FIXED_SUMMA', amount: '700,00' } }
    })).toEqual({
      products: [
        {
          id: '560357253',
          type: 'account',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'account:560357253',
        type: 'checking',
        title: 'Подушка',
        instrument: 'RUB',
        balance: 700.29,
        savings: true,
        syncID: [
          '500603794'
        ]
      }
    })
  })
})

describe('convertTransaction', () => {
  it('converts currency transaction', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '28.12.2018T14:01:43',
      description: 'Прочие списания',
      form: 'ExtCardOtherOut',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11091826112',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-5.00', currency: { code: 'EUR', name: '€' } },
      state: 'AUTHORIZATION',
      templatable: 'false',
      to: 'GO.SKYPE.COM/BILL',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '414.05' },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'true'
        },
        commission: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: null,
          name: 'commission',
          required: 'false',
          title: 'Комиссия',
          type: 'money',
          visible: 'false'
        },
        description: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'description',
          required: 'false',
          stringType: { value: 'GO.SKYPE.COM/BILL        LUXEMBOURG   LUX' },
          title: 'Описание',
          type: 'string',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'fromResource',
          required: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                currency: 'RUB',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                selected: 'true',
                value: 'card:51833625'
              }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        nfc: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'nfc',
          required: 'false',
          stringType: null,
          title: 'Бесконтактная операция NFC',
          type: 'string',
          visible: 'false'
        },
        operationDate: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'operationDate',
          required: 'false',
          stringType: { value: '28.12.2018 14:01:43' },
          title: 'Дата и время совершения операции',
          type: 'string',
          visible: 'true'
        },
        paymentDetails: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'paymentDetails',
          required: 'false',
          stringType: null,
          title: 'Информация о платеже',
          type: 'string',
          visible: 'false'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '5' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: true,
      date: new Date('2018-12-28T14:01:43+03:00'),
      movements: [
        {
          id: '11091826112',
          account: { id: 'account' },
          invoice: {
            sum: -5,
            instrument: 'EUR'
          },
          sum: -414.05,
          fee: 0
        }
      ],
      merchant: {
        title: 'GO.SKYPE.COM/BILL',
        city: 'LUXEMBOURG',
        country: 'LUX',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('converts cash replenishment', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '19.12.2018T10:49:12',
      description: 'Внесение наличных',
      form: 'ExtCardCashIn',
      id: '10774664622',
      imageId: {
        staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' }
      },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '41000.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'Банкомат Сбербанка',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T10:49:12+03:00'),
      movements: [
        {
          id: '10774664622',
          account: { id: 'account' },
          invoice: null,
          sum: 41000,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'cash',
            instrument: 'RUB',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: -41000,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer income transfer', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '28.12.2018T17:01:17',
      description: 'Входящий перевод',
      form: 'ExtCardTransferIn',
      from: '5291 67** **** 2272',
      id: '11091826845',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '700.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'Тинькофф Банк',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            currency: { code: 'RUB' },
            value: '700'
          },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'false'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            currency: { code: 'RUB' },
            value: '700'
          },
          name: 'buyAmount',
          required: 'false',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'true'
        },
        description: {
          changed: 'false',
          editable: 'false',
          name: 'description',
          required: 'false',
          stringType: { value: 'Тинькофф Банк' },
          title: 'Описание',
          type: 'string',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'true',
          stringType: { value: '**** 2272' },
          title: 'Счет списания',
          type: 'string',
          visible: 'true'
        },
        operationDate: {
          changed: 'false',
          editable: 'false',
          name: 'operationDate',
          required: 'false',
          stringType: { value: '28.12.2018 17:01:17' },
          title: 'Дата и время совершения операции',
          type: 'string',
          visible: 'true'
        },
        toResource: {
          changed: 'false',
          editable: 'false',
          name: 'toResource',
          required: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                currency: 'RUB',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                selected: 'true',
                value: 'card:51833625'
              }
            }
          },
          title: 'Счет зачисления',
          type: 'resource',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-28T17:01:17+03:00'),
      movements: [
        {
          id: '11091826845',
          account: { id: 'account' },
          invoice: null,
          sum: 700,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: { id: '4902' },
            syncIds: ['2272']
          },
          invoice: null,
          sum: -700,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer income transfer with unknown sender bank', () => {
    expect(convertTransaction({
      id: '12087175649',
      ufsId: null,
      state: 'FINANCIAL',
      date: '04.02.2019T11:45:39',
      from: '2202 20** **** 0932',
      to: 'Сбербанк Онлайн',
      description: 'Входящий перевод',
      operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardTransferIn',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } },
      details: {
        description: {
          name: 'description',
          title: 'Описание',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'Сбербанк Онлайн' },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Счет зачисления',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:98043945',
                selected: 'true',
                displayedValue: '5469 75** **** 2343 [MasterCard Mass]',
                currency: 'RUB'
              }
            }
          },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Счет списания',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: '**** 0932' },
          changed: 'false'
        },
        buyAmount: {
          name: 'buyAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '500', currency: { code: 'RUB' } },
          changed: 'false'
        },
        amount: {
          name: 'amount',
          title: 'Сумма в валюте счета',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '500', currency: { code: 'RUB' } },
          changed: 'false'
        },
        operationDate: {
          name: 'operationDate',
          title: 'Дата и время совершения операции',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: '04.02.2019 11:45:39' },
          changed: 'false'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-02-04T11:45:39+03:00'),
      movements: [
        {
          id: '12087175649',
          account: { id: 'account' },
          invoice: null,
          sum: 500,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: null,
            syncIds: ['0932']
          },
          invoice: null,
          sum: -500,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer outcome transfer with commission', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'true',
      date: '09.01.2019T15:23:10',
      description: 'Перевод на карту в другом банке',
      form: 'RurPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11363529083',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '-100.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'EXECUTED',
      templatable: 'true',
      to: '**** 2272',
      type: 'payment',
      ufsId: null,
      details: {
        admissionDate: {
          changed: 'false',
          dateType: { value: '09.01.2019' },
          editable: 'false',
          name: 'admissionDate',
          required: 'true',
          title: 'Плановая дата исполнения',
          type: 'date',
          visible: 'true'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            value: '100'
          },
          name: 'buyAmount',
          required: 'true',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'true'
        },
        commission: {
          amount: '30.00',
          currency: { code: 'RUB', name: 'руб.' }
        },
        documentDate: {
          changed: 'false',
          dateType: { value: '09.01.2019' },
          editable: 'false',
          name: 'documentDate',
          required: 'true',
          title: 'Дата документа',
          type: 'date',
          visible: 'true'
        },
        documentNumber: {
          changed: 'false',
          editable: 'false',
          integerType: { value: '898796' },
          name: 'documentNumber',
          required: 'true',
          title: 'Номер документа',
          type: 'integer',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                currency: 'RUB',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                selected: 'true',
                value: 'card:51833625'
              }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        isFundPayment: {
          booleanType: { value: 'false' },
          changed: 'false',
          editable: 'false',
          name: 'isFundPayment',
          required: 'false',
          title: 'Является ли перевод оплатой сбора средств',
          type: 'boolean',
          visible: 'false'
        },
        receiverAccount: {
          changed: 'false',
          editable: 'false',
          name: 'receiverAccount',
          required: 'true',
          stringType: { value: '**** 2272' },
          title: 'Номер счета/карты получателя',
          type: 'string',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-09T15:23:10+03:00'),
      movements: [
        {
          id: '11363529083',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: -30
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: null,
            syncIds: ['2272']
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outcome outer transfer to Sberbank client', () => {
    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '19.12.2018T17:27:04',
      description: 'Перевод клиенту Сбербанка',
      form: 'RurPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10778953787',
      imageId: { staticImage: {} },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5184 27** **** 1478',
      type: 'payment',
      ufsId: null,
      details: {
        admissionDate: {
          changed: 'false',
          dateType: { value: '19.12.2018' },
          editable: 'false',
          name: 'admissionDate',
          required: 'true',
          title: 'Плановая дата исполнения',
          type: 'date',
          visible: 'true'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: null,
          name: 'buyAmount',
          required: 'true',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'false'
        },
        commission: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
        documentDate: {
          changed: 'false',
          dateType: { value: '19.12.2018' },
          editable: 'false',
          name: 'documentDate',
          required: 'true',
          title: 'Дата документа',
          type: 'date',
          visible: 'true'
        },
        documentNumber: {
          changed: 'false',
          editable: 'false',
          integerType: { value: '90672' },
          name: 'documentNumber',
          required: 'true',
          title: 'Номер документа',
          type: 'integer',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:51833625',
                selected: 'true',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                currency: 'RUB'
              }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        isFundPayment: {
          booleanType: { value: 'false' },
          changed: 'false',
          editable: 'false',
          name: 'isFundPayment',
          required: 'false',
          title: 'Является ли перевод оплатой сбора средств',
          type: 'boolean',
          visible: 'false'
        },
        messageToReceiverStatus: {
          changed: 'false',
          editable: 'false',
          name: 'messageToReceiverStatus',
          required: 'false',
          stringType: { value: 'сообщение отправлено' },
          title: 'Статус SMS-сообщения',
          type: 'string',
          visible: 'true'
        },
        receiverAccount: {
          changed: 'false',
          editable: 'false',
          name: 'receiverAccount',
          required: 'true',
          stringType: { value: '5184 27** **** 1478' },
          title: 'Номер счета/карты получателя',
          type: 'string',
          visible: 'true'
        },
        receiverName: {
          changed: 'false',
          editable: 'false',
          name: 'receiverName',
          required: 'true',
          stringType: { value: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.' },
          title: 'ФИО получателя',
          type: 'string',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: { value: '40000.00' },
          name: 'sellAmount',
          required: 'true',
          title: 'Сумма в валюте списания',
          type: 'money',
          visible: 'true'
        },
        sellCurrency: {
          changed: 'false',
          editable: 'false',
          name: 'sellAmountCurrency',
          required: 'true',
          stringType: { value: 'RUB' },
          title: 'Валюта списания',
          type: 'string',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T17:27:04+03:00'),
      movements: [
        {
          id: '10778953787',
          account: { id: 'account' },
          invoice: null,
          sum: -40000,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: {
              id: '4624'
            },
            syncIds: ['1478']
          },
          invoice: null,
          sum: 40000,
          fee: 0
        }
      ],
      merchant: {
        title: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
        city: null,
        country: null,
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('converts outer outcome transfer to known bank but account syncId is absent', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '23.01.2019T15:05:34',
      description: 'Прочие списания',
      form: 'ExtCardOtherOut',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11771931545',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'AUTHORIZATION',
      templatable: 'false',
      to: 'Тинькофф Банк',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '100' },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'false'
        },
        commission: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: null,
          name: 'commission',
          required: 'false',
          title: 'Комиссия',
          type: 'money',
          visible: 'false'
        },
        description: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'description',
          required: 'false',
          stringType: { value: 'Тинькофф Банк' },
          title: 'Описание',
          type: 'string',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'fromResource',
          required: 'true',
          resourceType: {
            availableValues: {
              valueItem: { value: 'card:51833625', selected: 'true', displayedValue: '5298 26** **** 3389 [MasterCard Mass]', currency: 'RUB' }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        nfc: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'nfc',
          required: 'false',
          stringType: null,
          title: 'Бесконтактная операция NFC',
          type: 'string',
          visible: 'false'
        },
        operationDate: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'operationDate',
          required: 'false',
          stringType: { value: '23.01.2019 15:05:34' },
          title: 'Дата и время совершения операции',
          type: 'string',
          visible: 'true'
        },
        paymentDetails: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'paymentDetails',
          required: 'false',
          stringType: { value: 'TINKOFF BANK CARD2CARD   MOSCOW       RUS' },
          title: 'Информация о платеже',
          type: 'string',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '100' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: true,
      date: new Date('2019-01-23T15:05:34+03:00'),
      movements: [
        {
          id: '11771931545',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'ccard',
            instrument: 'RUB',
            company: { id: '4902' },
            syncIds: null
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer outcome transfer to known bank with certain syncId', () => {
    expect(convertTransaction({
      id: '12081077506',
      ufsId: null,
      state: 'EXECUTED',
      date: '04.02.2019T10:05:27',
      from: 'MasterCard Mass 5469 75** **** 2363',
      to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100001170180',
      description: 'Оплата услуг Интернет-магазинов',
      operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'servicePayment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExternalProviderPayment',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-02-04T10:05:27+03:00'),
      movements: [
        {
          id: '12081077506',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: { id: '15420' },
            syncIds: ['0180']
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts inner transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '51833625')] = account
    accountsById[getId('RUB', '428101******5370')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '19.12.2018T17:26:24',
      description: 'Перевод между своими счетами',
      form: 'InternalPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10778929144',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-3710.81', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'Visa Gold 4281 01** **** 5370',
      type: 'payment',
      ufsId: null,
      details: {
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: { value: 'card:51833625', selected: 'true', displayedValue: '5298 26** **** 3389 [MasterCard Mass]', currency: 'RUB' }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: { value: '3710.81' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        },
        toResource: {
          changed: 'false',
          editable: 'false',
          name: 'toResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: { value: 'card:69474436', selected: 'true', displayedValue: '4281 01** **** 5370 [Visa Gold]', currency: 'RUB' }
            }
          },
          title: 'Ресурс зачисления',
          type: 'resource',
          visible: 'true'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2018-12-19T17:26:24+03:00'),
      movements: [
        {
          id: '10778929144',
          account: { id: 'account' },
          invoice: null,
          sum: -3710.81,
          fee: 0
        },
        {
          id: '10778929144',
          account: { id: 'account2' },
          invoice: null,
          sum: 3710.81,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts commission', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '19.12.2018T00:00:00',
      description: 'Комиссии',
      form: 'TakingMeans',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10790859369',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'FINANCIAL',
      templatable: 'false',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T00:00:00+03:00'),
      movements: [
        {
          id: '10790859369',
          account: { id: 'account' },
          invoice: null,
          sum: -60,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссии'
    })
  })

  it('converts online payment', () => {
    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '24.12.2018T16:10:18',
      description: 'Оплата услуг',
      form: 'RurPayJurSB',
      from: 'Visa Gold 4281 01** **** 5370',
      id: '10936646113',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'true',
      isMobilePayment: 'false',
      operationAmount: { amount: '-192.67', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'Газпром межрегионгаз Санкт-Петербург                                                                        40702810055230176256',
      type: 'servicePayment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-24T16:10:18+03:00'),
      movements: [
        {
          id: '10936646113',
          account: { id: 'account' },
          invoice: null,
          sum: -192.67,
          fee: 0
        }
      ],
      merchant: {
        title: 'Газпром межрегионгаз Санкт-Петербург',
        city: null,
        country: null,
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('converts transfer without sell amount', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('RUB', '42303810855860470084')] = account
    accountsById[getId('RUB', '427644******3483')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      id: '10950380712',
      ufsId: null,
      state: 'EXECUTED',
      date: '05.01.2019T08:23:19',
      from: 'Управляй ОнЛ@йн 3м - 6м (руб.) 42303810855860470084',
      to: 'Visa Classic 4276 44** **** 3483',
      description: 'Перевод между своими счетами',
      operationAmount: { amount: '-15300.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'true',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'InternalPayment',
      imageId: { staticImage: { url: null } },
      details: {
        fromResource:
          {
            name: 'fromResource',
            title: 'Счет списания',
            type: 'resource',
            required: 'false',
            editable: 'false',
            visible: 'true',
            resourceType:
              {
                availableValues:
                  {
                    valueItem:
                      {
                        value: 'account:573768749',
                        selected: 'true',
                        displayedValue: '423 03 810 8 55860470084 [Управляй ОнЛ@йн 3м - 6м (руб.)]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        toResource:
          {
            name: 'toResource',
            title: 'Ресурс зачисления',
            type: 'resource',
            required: 'false',
            editable: 'false',
            visible: 'true',
            resourceType:
              {
                availableValues:
                  {
                    valueItem:
                      {
                        value: 'card:581110669',
                        selected: 'true',
                        displayedValue: '4276 44** **** 3483 [Visa Classic]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        buyAmount:
          {
            name: 'buyAmount',
            title: 'Сумма зачисления',
            type: 'money',
            required: 'false',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '15300.00' },
            changed: 'false'
          }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-05T08:23:19+03:00'),
      movements: [
        {
          id: '10950380712',
          account: { id: 'account' },
          invoice: null,
          sum: -15300.00,
          fee: 0
        },
        {
          id: '10950380712',
          account: { id: 'account2' },
          invoice: null,
          sum: 15300.00,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts cash withdrawal', () => {
    expect(convertTransaction({
      id: '11128289282',
      ufsId: null,
      state: 'FINANCIAL',
      date: '10.01.2019T20:18:16',
      from: 'Visa Classic 4276 52** **** 4451',
      to: 'Банкомат Сбербанка',
      description: 'Выдача наличных',
      operationAmount: { amount: '-200.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardCashOut',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-10T20:18:16+03:00'),
      movements: [
        {
          id: '11128289282',
          account: { id: 'account' },
          invoice: null,
          sum: -200,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'cash',
            instrument: 'RUB',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 200,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('skips transaction with empty or zero operationAmount', () => {
    expect(convertTransaction({
      id: '11413628056',
      ufsId: null,
      state: 'DRAFT',
      date: '11.01.2019T06:54:29',
      from: 'Visa Gold 4279 38** **** 0346',
      to: 'ООО "КОМПАНИЯ БКС"                                                                        40701810600007906728',
      description: 'Оплата услуг',
      isMobilePayment: 'false',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'true',
      type: 'jurPayment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'RurPayJurSB',
      imageId: { staticImage: { url: null } }
    })).toBeNull()

    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '31.12.2018T00:00:00',
      description: 'Капитализация по вкладу/счету',
      form: 'ExtDepositCapitalization',
      id: '6742338167',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '0.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'До востребования (руб)                    42301810755244611128',
      type: 'payment',
      ufsId: null
    })).toBeNull()
  })

  it('converts deposit capitalization', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '31.12.2018T00:00:00',
      description: 'Капитализация по вкладу/счету',
      form: 'ExtDepositCapitalization',
      id: '6742338167',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '10.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'До востребования (руб)                    42301810755244611128',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-31T00:00:00+03:00'),
      movements: [
        {
          id: '6742338167',
          account: { id: 'account' },
          invoice: null,
          sum: 10,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Капитализация по вкладу/счету'
    })
  })

  it('converts deposit opening', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const deposit = { id: 'deposit', instrument: 'USD' }
    const accountsById = {}
    accountsById[getId('RUB', '427662******7016')] = account
    accountsById[getId('USD', '42303840862000235746')] = deposit

    expect(convertTransaction({
      id: '11260699079',
      ufsId: null,
      state: 'EXECUTED',
      date: '14.01.2019T18:09:14',
      from: 'Visa Classic 4276 62** **** 7016',
      to: 'Пополняй ОнЛ@йн                                                                        42303840862000235746',
      description: 'Открытие вклада',
      operationAmount: { amount: '100.00', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'true',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'AccountOpeningClaim',
      imageId: { staticImage: { url: null } },
      details: {
        depositSubType: {
          name: 'depositSubType',
          title: 'Подвид вклада',
          type: 'integer',
          required: 'true',
          editable: 'false',
          visible: 'false',
          integerType: { value: '25' },
          changed: 'false'
        },
        documentNumber: {
          name: 'documentNumber',
          title: 'Номер документа',
          type: 'integer',
          required: 'true',
          editable: 'false',
          visible: 'true',
          integerType: { value: '75177' },
          changed: 'false'
        },
        documentDate: {
          name: 'documentDate',
          title: 'Дата документа',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.01.2019' },
          changed: 'false'
        },
        depositName: {
          name: 'depositName',
          title: 'Открыть вклад',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'Пополняй ОнЛ@йн' },
          changed: 'false'
        },
        openDate: {
          name: 'openDate',
          title: 'Дата открытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.01.2019' },
          changed: 'false'
        },
        closingDate: {
          name: 'closingDate',
          title: 'Дата закрытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.04.2019' },
          changed: 'false'
        },
        toResourceCurrency: {
          name: 'toResourceCurrency',
          title: 'Валюта',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'USD' },
          changed: 'false'
        },
        needInitialFee: {
          name: 'needInitialFee',
          title: 'Требуется начальный взнос',
          type: 'boolean',
          required: 'true',
          editable: 'false',
          visible: 'false',
          booleanType: { value: 'true' },
          changed: 'false'
        },
        withMinimumBalance: {
          name: 'withMinimumBalance',
          title: 'Есть ли у вклада неснижаемый остаток',
          type: 'boolean',
          required: 'true',
          editable: 'false',
          visible: 'false',
          booleanType: { value: 'false' },
          changed: 'false'
        },
        minDepositBalance: {
          name: 'minDepositBalance',
          title: 'Неснижаемый остаток',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '100.00' },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Счет списания',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType:
            {
              availableValues:
                {
                  valueItem:
                    {
                      value: 'card:604504131',
                      selected: 'true',
                      displayedValue: '4276 62** **** 7016 [Visa Classic]',
                      currency: 'RUB'
                    }
                }
            },
          changed: 'false'
        },
        buyAmount: {
          name: 'buyAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '100.00' },
          changed: 'false'
        },
        course: {
          name: 'course',
          title: 'Курс конверсии',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '68.2500' },
          changed: 'false'
        },
        sellAmount: {
          name: 'sellAmount',
          title: 'Сумма списания',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '6825.00' },
          changed: 'false'
        },
        exactAmount: {
          name: 'exactAmount',
          title: 'Признак, обозначающий какое из полей суммы заполнил пользователь',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'false',
          stringType: { value: 'destination-field-exact' },
          changed: 'false'
        },
        interestRate: {
          name: 'interestRate',
          title: 'Процентная ставка',
          type: 'number',
          required: 'true',
          editable: 'false',
          visible: 'true',
          numberType: { value: '0.4' },
          changed: 'false'
        },
        minAdditionalFee: {
          name: 'minAdditionalFee',
          title: 'Минимальный размер дополнительного взноса',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '100' },
          changed: 'false'
        },
        percentTransferSource: {
          name: 'percentTransferSourceRadio',
          title: 'Вариант перечисления процентов',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'card' },
          changed: 'false'
        },
        percentTransferCardSource: {
          name: 'percentTransferCardSource',
          title: 'Номер карты для перечисления процентов',
          type: 'resource',
          required: 'false',
          editable: 'false',
          visible: 'true',
          resourceType:
            {
              availableValues:
                {
                  valueItem:
                    {
                      value: 'card:604504131',
                      selected: 'true',
                      displayedValue: '4276 62** **** 7016'
                    }
                }
            },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-14T18:09:14+03:00'),
      movements: [
        {
          id: '11260699079',
          account: { id: 'account' },
          invoice: { sum: -100, instrument: 'USD' },
          sum: -6825,
          fee: 0
        },
        {
          id: '11260699079',
          account: { id: 'deposit' },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts deposit closing', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const deposit = { id: 'deposit', instrument: 'USD' }
    const accountsById = {}
    accountsById[getId('RUB', '427638******4123')] = account
    accountsById[getId('USD', '40817840438118500942')] = deposit

    expect(convertTransaction({
      id: '11528807128',
      ufsId: null,
      state: 'EXECUTED',
      date: '15.01.2019T10:23:30',
      from: 'Сберегательный счет 40817840438118500942',
      to: 'Аэрофлот бонус                                                        4276 38** **** 4123',
      description: 'Закрытие вклада',
      operationAmount: { amount: '-0.01', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'true',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'AccountClosingPayment',
      imageId: { staticImage: { url: null } },
      details: {
        documentNumber:
          {
            name: 'documentNumber',
            title: 'Номер документа',
            type: 'integer',
            required: 'true',
            editable: 'false',
            visible: 'true',
            integerType: { value: '856081' },
            changed: 'false'
          },
        documentDate: {
          name: 'documentDate',
          title: 'Дата документа',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '15.01.2019' },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Ресурс списания',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'account:44049077',
                selected: 'true',
                displayedValue: '408 17 840 4 38118500942 [Сберегательный счет]',
                currency: 'USD'
              }
            }
          },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Ресурс зачисления',
          type: 'resource',
          required: 'false',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:85779615',
                selected: 'true',
                displayedValue: '4276 38** **** 4123 [Аэрофлот бонус]',
                currency: 'RUB'
              }
            }
          },
          changed: 'false'
        },
        course: {
          name: 'course',
          title: 'Курс конверсии',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '66.0700' },
          changed: 'false'
        },
        closingDate: {
          name: 'closingDate',
          title: 'Дата закрытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '15.01.2019' },
          changed: 'false'
        },
        chargeOffAmount: {
          name: 'amount',
          title: 'Сумма списания',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '0.01' },
          changed: 'false'
        },
        destinationAmount: {
          name: 'destinationAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '0.66' },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-15T10:23:30+03:00'),
      movements: [
        {
          id: '11528807128',
          account: { id: 'deposit' },
          invoice: null,
          sum: -0.01,
          fee: 0
        },
        {
          id: '11528807128',
          account: { id: 'account' },
          invoice: { sum: 0.01, instrument: 'USD' },
          sum: 0.66,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts autopayment', () => {
    expect(convertTransaction({
      id: '11714346560',
      ufsId: null,
      state: 'FINANCIAL',
      date: '20.01.2019T07:03:36',
      from: 'Николай Кредитка 4854 63** **** 2200',
      to: 'Автоплатеж',
      description: 'Оплата товаров и услуг',
      operationAmount: { amount: '-15.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardPayment',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-20T07:03:36+03:00'),
      movements: [
        {
          id: '11714346560',
          account: { id: 'account' },
          invoice: null,
          sum: -15,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Автоплатеж'
    })
  })
})

describe('convertMetalAccount', () => {
  const ozToGramsRate = 31.1034768

  it('converts gold', () => {
    expect(convertMetalAccount({
      id: '500427744',
      name: 'Обезлич. мет. счета (золото)',
      number: '20309098838170333558',
      openDate: '06.01.2019T00:00:00',
      closeDate: '15.01.2019T00:00:00',
      balance: { amount: '50,00', currency: { code: 'AUR', name: 'г' } },
      availcash: { amount: '50,00', currency: { code: 'AUR', name: 'г' } },
      currency: 'ЗОЛОТО В ГРАММАХ (AUR)',
      agreementNumber: '20309A98838170333558',
      state: 'opened',
      arrested: 'false',
      showarrestdetail: 'true'
    })).toEqual({
      products: [
        {
          id: '500427744',
          type: 'ima',
          instrument: 'XAU'
        }
      ],
      zenAccount: {
        id: 'ima:500427744',
        type: 'checking',
        title: 'Обезлич. мет. счета (золото)',
        instrument: 'XAU',
        syncID: ['20309098838170333558'],
        balance: 50 / ozToGramsRate
      }
    })
  })

  it('converts silver', () => {
    expect(convertMetalAccount({
      id: '500427747',
      name: 'Обезлич. мет. счета (серебро)',
      number: '20309099038170403096',
      openDate: '06.01.2019T00:00:00',
      closeDate: '15.01.2019T00:00:00',
      balance: { amount: '3812,00', currency: { code: 'ARG', name: 'г' } },
      availcash: { amount: '3812,00', currency: { code: 'ARG', name: 'г' } },
      currency: 'СЕРЕБРО В ГРАММАХ (ARG)',
      agreementNumber: '20309A99038170403096',
      state: 'opened',
      arrested: 'false',
      showarrestdetail: 'true'
    })).toEqual({
      products: [
        {
          id: '500427747',
          type: 'ima',
          instrument: 'XAG'
        }
      ],
      zenAccount: {
        id: 'ima:500427747',
        type: 'checking',
        title: 'Обезлич. мет. счета (серебро)',
        instrument: 'XAG',
        syncID: ['20309099038170403096'],
        balance: 3812 / ozToGramsRate
      }
    })
  })
})

describe('adjustTransactionsAndCheckBalance', () => {
  it('adds missing convertable api transactions to payments', () => {
    expect(adjustTransactionsAndCheckBalance([
      {
        date: '19.01.2019T21:00:34',
        description: 'CH Debit RUS MOSCOW IDT:0513 1 RUS MOSCOW SBOL',
        sum: {
          amount: '-40000.00',
          currency: { code: 'RUB', name: 'руб.' }
        }
      },
      {
        date: '19.01.2019T20:15:31',
        description: 'Note Acceptance RUS SANKT-PETERBU Note Acceptance RUS SANKT-PETERBU ITT 702889',
        sum: {
          amount: '+50000.00',
          currency: { code: 'RUB', name: 'руб.' }
        }
      },
      {
        date: '19.01.2019T00:00:00',
        description: 'Mobile Fee 3200 Mobile Fee',
        sum: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } }
      },
      {
        date: '09.01.2019T15:24:43',
        description: 'CH Debit RUS MOSCOW IDT:0513 1 RUS MOSCOW SBOL',
        sum: {
          amount: '-100.00',
          currency: { code: 'RUB', name: 'руб.' }
        }
      }
    ], [
      {
        autopayable: 'true',
        copyable: 'true',
        date: '19.01.2019T20:59:58',
        description: 'Перевод клиенту Сбербанка',
        form: 'RurPayment',
        from: 'MasterCard Mass 5298 26** **** 3389',
        id: '11669890219',
        imageId: { staticImage: { url: null } },
        invoiceReminderSupported: 'false',
        invoiceSubscriptionSupported: 'false',
        isMobilePayment: 'false',
        operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
        state: 'EXECUTED',
        templatable: 'true',
        to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5469 55** **** 6339',
        type: 'payment',
        ufsId: null
      },
      {
        autopayable: 'false',
        copyable: 'false',
        date: '19.01.2019T20:15:31',
        description: 'Внесение наличных',
        form: 'ExtCardCashIn',
        id: '11669837967',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } },
        invoiceReminderSupported: 'false',
        invoiceSubscriptionSupported: 'false',
        isMobilePayment: 'false',
        operationAmount: { amount: '50000.00', currency: { code: 'RUB', name: 'руб.' } },
        state: 'FINANCIAL',
        templatable: 'false',
        to: 'Банкомат Сбербанка',
        type: 'payment',
        ufsId: null
      }
    ])).toEqual({
      isBalanceAmbiguous: false,
      transactions: [
        {
          autopayable: 'true',
          copyable: 'true',
          date: '19.01.2019T20:59:58',
          description: 'Перевод клиенту Сбербанка',
          form: 'RurPayment',
          from: 'MasterCard Mass 5298 26** **** 3389',
          id: '11669890219',
          imageId: { staticImage: { url: null } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'EXECUTED',
          templatable: 'true',
          to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5469 55** **** 6339',
          type: 'payment',
          ufsId: null
        },
        {
          autopayable: 'false',
          copyable: 'false',
          date: '19.01.2019T20:15:31',
          description: 'Внесение наличных',
          form: 'ExtCardCashIn',
          id: '11669837967',
          imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '50000.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'FINANCIAL',
          templatable: 'false',
          to: 'Банкомат Сбербанка',
          type: 'payment',
          ufsId: null
        },
        {
          autopayable: 'false',
          copyable: 'false',
          date: '19.01.2019T00:00:00',
          description: 'Комиссии',
          form: 'TakingMeans',
          from: 'MasterCard Mass',
          id: null,
          imageId: { staticImage: { url: null } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'AUTHORIZATION',
          templatable: 'false',
          type: 'payment',
          ufsId: null
        }
      ]
    })
  })

  it('detects ambiguous balance', () => {
    expect(adjustTransactionsAndCheckBalance([
      {
        date: '19.01.2019T20:15:31',
        description: 'Note Acceptance RUS SANKT-PETERBU Note Acceptance RUS SANKT-PETERBU ITT 702889',
        sum: {
          amount: '+50000.00',
          currency: { code: 'RUB', name: 'руб.' }
        }
      },
      {
        date: '19.01.2019T00:00:00',
        description: 'Mobile Fee 3200 Mobile Fee',
        sum: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } }
      },
      {
        date: '09.01.2019T15:24:43',
        description: 'CH Debit RUS MOSCOW IDT:0513 1 RUS MOSCOW SBOL',
        sum: {
          amount: '-100.00',
          currency: { code: 'RUB', name: 'руб.' }
        }
      }
    ], [
      {
        autopayable: 'true',
        copyable: 'true',
        date: '19.01.2019T20:59:58',
        description: 'Перевод клиенту Сбербанка',
        form: 'RurPayment',
        from: 'MasterCard Mass 5298 26** **** 3389',
        id: '11669890219',
        imageId: { staticImage: { url: null } },
        invoiceReminderSupported: 'false',
        invoiceSubscriptionSupported: 'false',
        isMobilePayment: 'false',
        operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
        state: 'EXECUTED',
        templatable: 'true',
        to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5469 55** **** 6339',
        type: 'payment',
        ufsId: null
      },
      {
        autopayable: 'false',
        copyable: 'false',
        date: '19.01.2019T20:15:31',
        description: 'Внесение наличных',
        form: 'ExtCardCashIn',
        id: '11669837967',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } },
        invoiceReminderSupported: 'false',
        invoiceSubscriptionSupported: 'false',
        isMobilePayment: 'false',
        operationAmount: { amount: '50000.00', currency: { code: 'RUB', name: 'руб.' } },
        state: 'FINANCIAL',
        templatable: 'false',
        to: 'Банкомат Сбербанка',
        type: 'payment',
        ufsId: null
      }
    ])).toEqual({
      isBalanceAmbiguous: true,
      transactions: [
        {
          autopayable: 'true',
          copyable: 'true',
          date: '19.01.2019T20:59:58',
          description: 'Перевод клиенту Сбербанка',
          form: 'RurPayment',
          from: 'MasterCard Mass 5298 26** **** 3389',
          id: '11669890219',
          imageId: { staticImage: { url: null } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'EXECUTED',
          templatable: 'true',
          to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5469 55** **** 6339',
          type: 'payment',
          ufsId: null
        },
        {
          autopayable: 'false',
          copyable: 'false',
          date: '19.01.2019T20:15:31',
          description: 'Внесение наличных',
          form: 'ExtCardCashIn',
          id: '11669837967',
          imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '50000.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'FINANCIAL',
          templatable: 'false',
          to: 'Банкомат Сбербанка',
          type: 'payment',
          ufsId: null
        },
        {
          autopayable: 'false',
          copyable: 'false',
          date: '19.01.2019T00:00:00',
          description: 'Комиссии',
          form: 'TakingMeans',
          from: 'MasterCard Mass',
          id: null,
          imageId: { staticImage: { url: null } },
          invoiceReminderSupported: 'false',
          invoiceSubscriptionSupported: 'false',
          isMobilePayment: 'false',
          operationAmount: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } },
          state: 'AUTHORIZATION',
          templatable: 'false',
          type: 'payment',
          ufsId: null
        }
      ]
    })
  })
})
