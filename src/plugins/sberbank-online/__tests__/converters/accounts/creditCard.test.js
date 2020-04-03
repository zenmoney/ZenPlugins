import { parseXml } from '../../../../../common/xmlUtils'
import { convertCards } from '../../../converters'

describe('convertCards', () => {
  const nowDate = new Date('2018-06-02T12:00:00Z')

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
})
