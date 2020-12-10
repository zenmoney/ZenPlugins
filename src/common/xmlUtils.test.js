import { parseXml } from './xmlUtils'

describe('parseXml', () => {
  it.each([
    [
      `<id>11721741</id>
        <name>Потребительский кредит Dol&#039;che Vita</name>
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
        <state>undefined</state>`,
      {
        id: '11721741',
        name: "Потребительский кредит Dol'che Vita",
        smsName: '4789',
        amount: {
          amount: '1500000,00',
          currency: {
            code: 'RUB',
            name: 'руб.'
          }
        },
        nextPayAmount: {
          amount: '50180,44',
          currency: {
            code: 'RUB',
            name: 'руб.'
          }
        },
        nextPayDate: '04.06.2018T00:00:00',
        state: 'undefined'
      }
    ]
  ])('parses XML', (xml, text) => {
    expect(parseXml(xml)).toEqual(text)
  })
})
