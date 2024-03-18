import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const cardsByLastFourDigits = {
    1846: {
      lastFour: '1846',
      account:
        {
          id: 'account_1846',
          instrument: 'MDL'
        }
    },
    5465: {
      lastFour: '5465',
      account:
        {
          id: 'account_5465',
          instrument: 'MDL'
        }
    }
  }
  it.each([
    [
      [
        {
          id: '4B9B4A87-3972-4353-A4F0-9CD3690C78A6',
          amount: 3,
          date: 1649091784000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 83.58,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209417124387',
          approvalCode: '514284',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: 'D5089454-EB61-4C91-AF1D-F007E346487A',
          amount: 3,
          date: 1649089805000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 32.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209416096626',
          approvalCode: '486177',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: 'BAA031C4-4B60-44E3-B2A8-6CD362DB1A6E',
          amount: 3,
          date: 1649071617000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 35.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209411792588',
          approvalCode: '834562',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: '27E2D1FD-A30F-4D60-9BB8-674179417311',
          amount: 75.66,
          date: 1649066678000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: '"ULTRACOM ELECTRONIC"S>Chisinau (mun MD',
          type: 1,
          balanceAfter: 86.58,
          amountInCardCurrency: 75.66,
          exchangeRate: 1,
          origin: {},
          categoryId: '2',
          rrn: '209401133014',
          approvalCode: '261573',
          mdlAmountCents: {
            isPresent: true,
            value: 7566
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: '07803499-2118-4254-A323-FE07610FA12D',
          amount: 31,
          date: 1649049877000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'LIDIA CROITOR SRL>CHISINAU MD',
          type: 1,
          balanceAfter: 38.8,
          amountInCardCurrency: 31,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209405475112',
          approvalCode: '175829',
          mdlAmountCents: {
            isPresent: true,
            value: 3100
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: 'A2A8E1C5-71BC-49EA-8635-3CF9AF8D3BB7',
          amount: 31,
          date: 1649049877000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'LIDIA CROITOR SRL>CHISINAU MD',
          type: 1,
          balanceAfter: 38.8,
          amountInCardCurrency: 31,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209405475112',
          approvalCode: '175829',
          mdlAmountCents: {
            isPresent: true,
            value: 3100
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: '1548984F-5A18-4375-B169-397A88AC408B',
          amount: 3,
          date: 1648948940000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 69.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209301935517',
          approvalCode: '244718',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '8FCDF359-7214-4305-BA6C-04EFEBD82F6F',
          amount: 3,
          date: 1648918976000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 72.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209217842518',
          approvalCode: '655241',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '6656F768-4560-4B72-A530-1F8E8B7F5C33',
          amount: 32,
          date: 1648911574000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'NARINGI CAFE 31 AUGUST>CHISINAU MD',
          type: 1,
          balanceAfter: 75.8,
          amountInCardCurrency: 32,
          exchangeRate: 1,
          origin: {},
          categoryId: '3',
          rrn: '209214775624',
          approvalCode: '561759',
          mdlAmountCents: {
            isPresent: true,
            value: 3200
          },
          chargebackState: 1,
          status: 1
        },
        {
          id: 'FD9A5BAF-CEF9-4FFA-BA8B-00829F31B777',
          amount: 100,
          date: 1648909364000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'P2P>CHISINAU MD',
          type: 2,
          details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>1846</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>5465</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>0</isSpendP2P><baseAmount>100.00</baseAmount><commission>0.00</commission></details>',
          balanceAfter: 107.8,
          amountInCardCurrency: 100,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '209214754678',
          approvalCode: '516377',
          mdlAmountCents: {
            isPresent: true,
            value: 10000
          },
          chargebackState: 2,
          status: 2
        },
        {
          id: 'F788400D-DB0C-4E33-8A99-9912BC8F0E98',
          amount: 100,
          date: 1648909363000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'P2P>CHISINAU MD',
          type: 2,
          details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>1846</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>5465</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>1</isSpendP2P><baseAmount>100.00</baseAmount><commission>0.00</commission></details>',
          balanceAfter: 162.24,
          amountInCardCurrency: 100,
          exchangeRate: 1,
          origin: { deviceName: 'iPhone 12 Pro Max' },
          categoryId: '9',
          rrn: '209214754673',
          approvalCode: '176987',
          mdlAmountCents: {
            isPresent: true,
            value: 10000
          },
          chargebackState: 2,
          status: 1
        },
        {
          id: 'D6EEEC68-8EEB-4677-B21B-02A76F35D601',
          amount: 209.97,
          date: 1648896491000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'MAGAZIN NR 1 MOSCOVA>CHISINAU MD',
          type: 1,
          balanceAfter: 262.24,
          amountInCardCurrency: 209.97,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209210620438',
          approvalCode: '211512',
          mdlAmountCents: {
            isPresent: true,
            value: 20997
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '949031',
            amount: 1.05,
            rate: 0.5,
            type: 1,
            status: 1
          }
        },
        {
          id: '9CFFB514-5CEA-47CB-83B3-742BF0981BE3',
          amount: 400,
          date: 1648810606000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'P2P>CHISINAU MD',
          type: 2,
          details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>6150</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>1846</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>0</isSpendP2P><baseAmount>400.00</baseAmount><commission>0.00</commission></details>',
          balanceAfter: 472.21,
          amountInCardCurrency: 400,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '209110889305',
          approvalCode: '754452',
          mdlAmountCents: {
            isPresent: true,
            value: 40000
          },
          chargebackState: 2,
          status: 2
        },
        {
          id: '69729348-EEFB-4B6A-AB99-2D510E638B46',
          amount: 3,
          date: 1648809929000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 7.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209110877608',
          approvalCode: '739589',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'CFFEE119-748E-453D-A4CD-05EA763B58BB',
          amount: 27,
          date: 1648805006000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'LIDIA CROITOR SRL>CHISINAU MD',
          type: 1,
          balanceAfter: 10.8,
          amountInCardCurrency: 27,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209109791463',
          approvalCode: '162173',
          mdlAmountCents: {
            isPresent: true,
            value: 2700
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '28F8717F-7F13-49D1-970D-8F5F608A6998',
          amount: 3,
          date: 1648788748000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 37.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209104581905',
          approvalCode: '644445',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '5DB3EC53-A010-48B9-B3B5-40C5B85A84B5',
          amount: 3,
          date: 1648747345000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 40.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209017433165',
          approvalCode: '149266',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '875F56EA-438F-4E7C-81FC-327B522C7A1B',
          amount: 12,
          date: 1648723087000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'LIDIA CROITOR SRL>CHISINAU MD',
          type: 1,
          balanceAfter: 43.8,
          amountInCardCurrency: 12,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209010113426',
          approvalCode: '541792',
          mdlAmountCents: {
            isPresent: true,
            value: 1200
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '8C307987-FB8A-492D-B985-53EBFE4B2E76',
          amount: 27,
          date: 1648722247000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'LIDIA CROITOR SRL>CHISINAU MD',
          type: 1,
          balanceAfter: 55.8,
          amountInCardCurrency: 27,
          exchangeRate: 1,
          origin: {},
          categoryId: '11',
          rrn: '209010102040',
          approvalCode: '554145',
          mdlAmountCents: {
            isPresent: true,
            value: 2700
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '073CC937-5E06-49FF-AE56-6EEBB0526EE6',
          amount: 3,
          date: 1648694945000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 82.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209002863616',
          approvalCode: '866177',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'F36ACE16-6BF1-42BA-AF2F-557E70B8C4C6',
          amount: 3,
          date: 1648694945000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 85.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '209002863615',
          approvalCode: '829139',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'A66E415E-012F-46DA-8F99-2E7E5E5E430B',
          amount: 3,
          date: 1648657529000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 88.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208916726926',
          approvalCode: '128541',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'E75B030F-AB7F-4A28-8E6E-3278E077D9B8',
          amount: 243.9,
          date: 1648648154000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: '"ALCO MARKET" M.Costin>Chisinau (mun MD',
          type: 1,
          balanceAfter: 72.21,
          amountInCardCurrency: 243.9,
          exchangeRate: 1,
          origin: {},
          categoryId: '5',
          rrn: '208901457647',
          approvalCode: '127964',
          mdlAmountCents: {
            isPresent: true,
            value: 24390
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '934725',
            amount: 1.22,
            rate: 0.5,
            type: 1,
            status: 1
          }
        },
        {
          id: '16884533-9FB9-4754-9F0D-92E022067A7A',
          amount: 250,
          date: 1648646653000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'KARL SCHMIDT>CHISINAU MD',
          type: 1,
          balanceAfter: 316.11,
          amountInCardCurrency: 250,
          exchangeRate: 1,
          origin: {},
          categoryId: '3',
          rrn: '208913594752',
          approvalCode: '291574',
          mdlAmountCents: {
            isPresent: true,
            value: 25000
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '934593',
            amount: 1.25,
            rate: 0.5,
            type: 1,
            status: 1
          }
        },
        {
          id: '632B6D56-F152-4270-B9C4-07BE88D2FCBF',
          amount: 1,
          date: 1648616874000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'RTEC>CHISINAU MD',
          type: 1,
          balanceAfter: 91.8,
          amountInCardCurrency: 1,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208905250693',
          approvalCode: '536752',
          mdlAmountCents: {
            isPresent: true,
            value: 100
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'BDD96515-0185-413F-AD74-092047DC00AF',
          amount: 3,
          date: 1648574974000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 92.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208817140962',
          approvalCode: '588221',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '8AC0A227-B958-4618-A3E6-7C741156D98B',
          amount: 240,
          date: 1648541903000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'E-CIGARETTE.MD>CHISINAU MD',
          type: 1,
          balanceAfter: 566.11,
          amountInCardCurrency: 240,
          exchangeRate: 1,
          origin: {},
          categoryId: '18',
          rrn: '208804273702',
          approvalCode: '311442',
          mdlAmountCents: {
            isPresent: true,
            value: 24000
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '928862',
            amount: 1.2,
            rate: 0.5,
            type: 1,
            status: 1
          }
        },
        {
          id: '89F91F23-B5BC-4DAE-A27E-61B64BA29425',
          amount: 3,
          date: 1648498378000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 95.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208720620346',
          approvalCode: '489344',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'B3428C70-D9A9-4B51-89E1-2FF59F5F7B2E',
          amount: 3,
          date: 1648467794000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 98.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208711339664',
          approvalCode: '823715',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'C19D3D1C-0273-4129-BF8F-C2DF8EF5B283',
          amount: 3,
          date: 1648443531000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 101.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208704097452',
          approvalCode: '376692',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '7F90BD31-6D4B-4A75-99F6-3A5628BDB505',
          amount: 3,
          date: 1648407730000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 104.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208619039391',
          approvalCode: '187885',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: '8DABBA2C-7D69-4B47-A78A-4614D21B26C0',
          amount: 3,
          date: 1648407725000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'PUA LINIA 5>CHISINAU MD',
          type: 1,
          balanceAfter: 107.8,
          amountInCardCurrency: 3,
          exchangeRate: 1,
          origin: {},
          categoryId: '15',
          rrn: '208619039356',
          approvalCode: '368386',
          mdlAmountCents: {
            isPresent: true,
            value: 300
          },
          chargebackState: 1,
          status: 2
        },
        {
          id: 'B39B978A-4CE5-4293-8252-50C70F39878A',
          amount: 361.25,
          date: 1648390531000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'TORO GRIL LIVRARE 3>CHISINAU MD',
          type: 1,
          balanceAfter: 806.11,
          amountInCardCurrency: 361.25,
          exchangeRate: 1,
          origin: {},
          categoryId: '3',
          rrn: '208604769052',
          approvalCode: '878345',
          mdlAmountCents: {
            isPresent: true,
            value: 36125
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '922458',
            amount: 1.81,
            rate: 0.5,
            type: 1,
            status: 1
          }
        },
        {
          id: 'D3C91729-FEAE-42AB-897E-03732CBB2070',
          amount: 165,
          date: 1648370590000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'LAVAZZA_SCUARUL CATEDRALEI>CHISINAU MD',
          type: 1,
          balanceAfter: 1167.36,
          amountInCardCurrency: 165,
          exchangeRate: 1,
          origin: {},
          categoryId: '3',
          rrn: '208609771206',
          approvalCode: '914324',
          mdlAmountCents: {
            isPresent: true,
            value: 16500
          },
          chargebackState: 1,
          status: 2,
          cashback: {
            id: '920553',
            amount: 8.25,
            rate: 5,
            type: 2,
            status: 1
          }
        },
        {
          id: '91BF4E50-9776-4787-854C-65E74A265DDE',
          amount: 100,
          date: 1648367132000,
          cardLast4digits: '1846',
          ccy: 'MDL',
          description: 'P2P>CHISINAU MD',
          type: 2,
          details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>1846</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>5465</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>1</isSpendP2P><baseAmount>100.00</baseAmount><commission>0.00</commission></details>',
          balanceAfter: 1332.36,
          amountInCardCurrency: 100,
          exchangeRate: 1,
          origin: { deviceName: 'iPhone 12 Pro Max' },
          categoryId: '9',
          rrn: '208607711207',
          approvalCode: '951933',
          mdlAmountCents: {
            isPresent: true,
            value: 10000
          },
          chargebackState: 2,
          status: 2
        },
        {
          id: '86052E7A-7237-4A49-8A1F-17C6DBB7F8FC', // Внутренний Перевод на карту 5465 с карты 1846
          amount: 100,
          date: 1648367132000,
          cardLast4digits: '5465',
          ccy: 'MDL',
          description: 'P2P>CHISINAU MD',
          type: 2,
          details: '<details type="p2p" v="p2p-1.3"><sourceCardLast4Digits>1846</sourceCardLast4Digits><sourceCardHolder>NIKOLAY NIKOLAEV</sourceCardHolder><destinationCardLast4Digits>5465</destinationCardLast4Digits><destinationCardHolder>IVAN IVANOV</destinationCardHolder><senderNote/><isSpendP2P>0</isSpendP2P><baseAmount>100.00</baseAmount><commission>0.00</commission></details>',
          balanceAfter: 110.8,
          amountInCardCurrency: 100,
          exchangeRate: 1,
          origin: {},
          categoryId: '9',
          rrn: '208607711210',
          approvalCode: '928361',
          mdlAmountCents: {
            isPresent: true,
            value: 10000
          },
          chargebackState: 2,
          status: 2
        }
      ],
      [
        {
          comment: null,
          date: new Date('2022-04-04T17:03:04.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '4B9B4A87-3972-4353-A4F0-9CD3690C78A6',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-04T10:04:38.000Z'),
          hold: false,
          merchant: {
            city: 'Chisinau',
            country: 'MD',
            location: null,
            mcc: null,
            title: '"ULTRACOM ELECTRONIC"S'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '27E2D1FD-A30F-4D60-9BB8-674179417311',
              invoice: null,
              sum: -75.66
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-02T14:22:43.000Z'),
          hold: false,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: 'IVAN IVANOV'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: 'F788400D-DB0C-4E33-8A99-9912BC8F0E98',
              invoice: null,
              sum: -100
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: ['5465'],
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 100
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-02T10:48:11.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'MAGAZIN NR 1 MOSCOVA'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: 'D6EEEC68-8EEB-4677-B21B-02A76F35D601',
              invoice: null,
              sum: -209.97
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-01T10:56:46.000Z'),
          hold: false,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: 'NIKOLAY NIKOLAEV'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '9CFFB514-5CEA-47CB-83B3-742BF0981BE3',
              invoice: null,
              sum: 400
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: ['6150'],
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -400
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-30T13:49:14.000Z'),
          hold: false,
          merchant: {
            city: 'Chisinau',
            country: 'MD',
            location: null,
            mcc: null,
            title: '"ALCO MARKET" M.Costin'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: 'E75B030F-AB7F-4A28-8E6E-3278E077D9B8',
              invoice: null,
              sum: -243.9
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-30T13:24:13.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'KARL SCHMIDT'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '16884533-9FB9-4754-9F0D-92E022067A7A',
              invoice: null,
              sum: -250
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-29T08:18:23.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'E-CIGARETTE.MD'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '8AC0A227-B958-4618-A3E6-7C741156D98B',
              invoice: null,
              sum: -240
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T14:15:31.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'TORO GRIL LIVRARE 3'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: 'B39B978A-4CE5-4293-8252-50C70F39878A',
              invoice: null,
              sum: -361.25
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T08:43:10.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LAVAZZA_SCUARUL CATEDRALEI'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: 'D3C91729-FEAE-42AB-897E-03732CBB2070',
              invoice: null,
              sum: -165
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T07:45:32.000Z'),
          hold: false,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: 'IVAN IVANOV'
          },
          movements: [
            {
              account: { id: 'account_1846' },
              fee: 0,
              id: '91BF4E50-9776-4787-854C-65E74A265DDE',
              invoice: null,
              sum: -100
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: ['5465'],
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 100
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-04T16:30:05.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'D5089454-EB61-4C91-AF1D-F007E346487A',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-04T11:26:57.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'BAA031C4-4B60-44E3-B2A8-6CD362DB1A6E',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-04T05:24:37.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LIDIA CROITOR SRL'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '07803499-2118-4254-A323-FE07610FA12D',
              invoice: null,
              sum: -31
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-04T05:24:37.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LIDIA CROITOR SRL'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'A2A8E1C5-71BC-49EA-8635-3CF9AF8D3BB7',
              invoice: null,
              sum: -31
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-03T01:22:20.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '1548984F-5A18-4375-B169-397A88AC408B',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-02T17:02:56.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '8FCDF359-7214-4305-BA6C-04EFEBD82F6F',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-02T14:59:34.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'NARINGI CAFE 31 AUGUST'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '6656F768-4560-4B72-A530-1F8E8B7F5C33',
              invoice: null,
              sum: -32
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-02T14:22:44.000Z'),
          hold: false,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: 'NIKOLAY NIKOLAEV'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'FD9A5BAF-CEF9-4FFA-BA8B-00829F31B777',
              invoice: null,
              sum: 100
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: ['1846'],
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -100
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-01T10:45:29.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '69729348-EEFB-4B6A-AB99-2D510E638B46',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-01T09:23:26.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LIDIA CROITOR SRL'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'CFFEE119-748E-453D-A4CD-05EA763B58BB',
              invoice: null,
              sum: -27
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-04-01T04:52:28.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '28F8717F-7F13-49D1-970D-8F5F608A6998',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-31T17:22:25.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '5DB3EC53-A010-48B9-B3B5-40C5B85A84B5',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-31T10:38:07.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LIDIA CROITOR SRL'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '875F56EA-438F-4E7C-81FC-327B522C7A1B',
              invoice: null,
              sum: -12
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-31T10:24:07.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'LIDIA CROITOR SRL'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '8C307987-FB8A-492D-B985-53EBFE4B2E76',
              invoice: null,
              sum: -27
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-31T02:49:05.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '073CC937-5E06-49FF-AE56-6EEBB0526EE6',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-31T02:49:05.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'F36ACE16-6BF1-42BA-AF2F-557E70B8C4C6',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-30T16:25:29.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'A66E415E-012F-46DA-8F99-2E7E5E5E430B',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-30T05:07:54.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'RTEC'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '632B6D56-F152-4270-B9C4-07BE88D2FCBF',
              invoice: null,
              sum: -1
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-29T17:29:34.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'BDD96515-0185-413F-AD74-092047DC00AF',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-28T20:12:58.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '89F91F23-B5BC-4DAE-A27E-61B64BA29425',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-28T11:43:14.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'B3428C70-D9A9-4B51-89E1-2FF59F5F7B2E',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-28T04:58:51.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: 'C19D3D1C-0273-4129-BF8F-C2DF8EF5B283',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T19:02:10.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '7F90BD31-6D4B-4A75-99F6-3A5628BDB505',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T19:02:05.000Z'),
          hold: false,
          merchant: {
            city: 'CHISINAU',
            country: 'MD',
            location: null,
            mcc: null,
            title: 'PUA LINIA 5'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '8DABBA2C-7D69-4B47-A78A-4614D21B26C0',
              invoice: null,
              sum: -3
            }
          ]
        },
        {
          comment: null,
          date: new Date('2022-03-27T07:45:32.000Z'),
          hold: false,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: 'NIKOLAY NIKOLAEV'
          },
          movements: [
            {
              account: { id: 'account_5465' },
              fee: 0,
              id: '86052E7A-7237-4A49-8A1F-17C6DBB7F8FC',
              invoice: null,
              sum: 100
            },
            {
              account: {
                company: null,
                instrument: 'MDL',
                syncIds: ['1846'],
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -100
            }
          ]
        }
      ]
    ]
  ])('converts outcome', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions, cardsByLastFourDigits)).toEqual(transactions)
  })
})
