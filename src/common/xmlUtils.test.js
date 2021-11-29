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
        name: 'Потребительский кредит Dol\'che Vita',
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
    ],
    [
      `<?xml version="1.0" encoding="windows-1251" ?>
<BS_Response>
    <ServerTime>20211129111015</ServerTime>
    <Session Expired="895"/>
    <GetActions>
        <Action Id="24956798-f56a62-ms-6007832-balance-1" Type="Balance" Name="Баланс" Options="3">
        </Action>

        <Action Id="24956799-62a09c-ms-6007832-b742-showaccountinfo-1" Type="B742:ShowAccountInfo2" Name="Реквизиты счета" Options="1">
        </Action>

        <Action Id="24956800-117708-ms-6007832-creditips-credit-2" Type="CreditIPS_Credit2" Name="Пополнить" FullName="2" Options="1">

            <Parameter Id="IdentId" Name="Пополнить с" DataType="1" MinLength="1" MaxLength="10">

                <Lookup>

                    <Item Name="428621******9842, USD" Icon="V_NFC_CL">3170201</Item>

                    <Item Name="518597******6556, USD" Icon="VRT_MC_GD">6220517</Item>
                </Lookup>
            </Parameter>
        </Action>

    </GetActions>
</BS_Response`,
      {
        BS_Response: {
          GetActions: {
            Action: [
              {
                Id: '24956798-f56a62-ms-6007832-balance-1',
                Name: 'Баланс',
                Options: '3',
                Type: 'Balance'
              },
              {
                Id: '24956799-62a09c-ms-6007832-b742-showaccountinfo-1',
                Name: 'Реквизиты счета',
                Options: '1',
                Type: 'B742:ShowAccountInfo2'
              },
              {
                FullName: '2',
                Id: '24956800-117708-ms-6007832-creditips-credit-2',
                Name: 'Пополнить',
                Options: '1',
                Parameter: {
                  DataType: '1',
                  Id: 'IdentId',
                  Lookup: {
                    Item: [
                      '3170201',
                      '6220517'
                    ]
                  },
                  MaxLength: '10',
                  MinLength: '1',
                  Name: 'Пополнить с'
                },
                Type: 'CreditIPS_Credit2'
              }
            ]
          },
          ServerTime: '20211129111015',
          Session: {
            Expired: '895'
          }
        }
      }
    ]
  ])('parses XML', (xml, text) => {
    expect(parseXml(xml)).toEqual(text)
  })
})
