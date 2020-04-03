import { parseXml } from '../../../../../common/xmlUtils'
import { convertDeposit } from '../../../converters'

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
