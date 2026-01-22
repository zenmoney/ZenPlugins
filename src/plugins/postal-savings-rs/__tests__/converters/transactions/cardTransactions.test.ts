import { convertCardTransactions } from '../../../converters'

const input = `
 <tr>
    <td align="left">05.04.2024</td>
    <td align="right">-3.282,63</td>
    <td align="left">RSD</td>
    <td align="left">09.04.2024</td>
    <td align="left">Wolt doo                      </td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">06.04.2024</td>
    <td align="right">-370,00</td>
    <td align="left">RSD</td>
    <td align="left">09.04.2024</td>
    <td align="left">LP NOVI CAJ VLADIMIR     NOVI </td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">07.04.2024</td>
    <td align="right">500,00</td>
    <td align="left">EUR</td>
    <td align="left">10.04.2024</td>
    <td align="left">REFUND U INOSTRANSTVU         </td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">08.04.2024</td>
    <td align="right">-210,00</td>
    <td align="left">RSD</td>
    <td align="left">10.04.2024</td>
    <td align="left">TISHLER TOBACCO AND COFFENOVI </td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">12.04.2024</td>
    <td align="right">20,00</td>
    <td align="left">USD</td>
    <td align="left">          </td>
    <td align="left">CHATGPT SUBSCRIPTION     +1415</td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">13.04.2024</td>
    <td align="right">10.000,00</td>
    <td align="left">RSD</td>
    <td align="left">          </td>
    <td align="left">ATMBPS KAFE RANDEVU      NOVI </td>
    <td align="right">4870........1234</td>
</tr>
<tr>
    <td align="left">13.04.2024</td>
    <td align="right">250,00</td>
    <td align="left">EUR</td>
    <td align="left">          </td>
    <td align="left">REFUND U INOSTRANSTVU         </td>
    <td align="right">4870........1234</td>
</tr>
`

describe('convertCardTransactions', () => {
  it('converts card transactions', () => {
    expect(convertCardTransactions(input)).toEqual([
      {
        date: new Date('2024-04-13T00:00:00.000'),
        authorizationDate: null,
        amount: {
          sum: 250.00,
          instrument: 'EUR'
        },
        merchant: 'REFUND U INOSTRANSTVU'
      },
      {
        date: new Date('2024-04-13T00:00:00.000'),
        authorizationDate: null,
        amount: {
          sum: -10_000.00,
          instrument: 'RSD'
        },
        merchant: 'ATMBPS KAFE RANDEVU'
      },
      {
        date: new Date('2024-04-12T00:00:00.000'),
        authorizationDate: null,
        amount: {
          sum: -20.00,
          instrument: 'USD'
        },
        merchant: 'CHATGPT SUBSCRIPTION'
      },
      {
        date: new Date('2024-04-08T00:00:00.000'),
        authorizationDate: new Date('2024-04-10T00:00:00.000'),
        amount: {
          sum: -210.00,
          instrument: 'RSD'
        },
        merchant: 'TISHLER TOBACCO AND COFFE'
      },
      {
        date: new Date('2024-04-07T00:00:00.000'),
        authorizationDate: new Date('2024-04-10T00:00:00.000'),
        amount: {
          sum: 500.00,
          instrument: 'EUR'
        },
        merchant: 'REFUND U INOSTRANSTVU'
      },
      {
        date: new Date('2024-04-06T00:00:00.000'),
        authorizationDate: new Date('2024-04-09T00:00:00.000'),
        amount: {
          sum: -370.00,
          instrument: 'RSD'
        },
        merchant: 'LP NOVI CAJ VLADIMIR'
      },
      {
        date: new Date('2024-04-05T00:00:00.000'),
        authorizationDate: new Date('2024-04-09T00:00:00.000'),
        amount: {
          sum: -3282.63,
          instrument: 'RSD'
        },
        merchant: 'Wolt doo'
      }
    ])
  })
})
