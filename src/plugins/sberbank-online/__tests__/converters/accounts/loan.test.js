import { parseXml } from '../../../../../common/xmlUtils'
import { convertLoan } from '../../../converters'

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
