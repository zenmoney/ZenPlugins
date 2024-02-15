import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts accounts', () => {
    expect(convertAccount({
      id: 123456789,
      type: 5
    }, 'blah-blah \n' +
'<td width="40%">Name and surname:</td>\n' +
'<td>IVANOV                  IVAN         </td>\n' +
'</tr>\n' +
'<tr>\n' +
'<td>Foreign currency account:</td>\n' +
'<td>123456789</td>\n' +
'</tr>\n' +
'<tr>\n' +
'<td>Address of residence:</td>\n' +
'blah\n' +
'<tr>\n' +
'<td>Balance for currency EUR 978:</td>\n' +
'<td>20.520,77\n' +
'</table>')).toEqual(
      {
        balance: 20520.77,
        creditLimit: 0,
        id: '1234567895',
        instrument: 'EUR',
        syncIds: ['1234567895'],
        title: 'Foreign currency account',
        type: 'ccard'
      })
  })
})
