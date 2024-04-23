import { convertExchangeRates } from '../../../converters'

const input = `
<tr>
            <td align="center" colspan="9">E- BANKING EXCHANGE RATE LIST NO.: 66<br></br>APPLICABLE AS AT: 05.04.2024.</td>
          </tr>
          <tr>
            <td align="center" width="5%" rowspan="2">Currency code</td>
            <td align="center" width="5%" rowspan="2">Currency designation</td>
            <td align="center" width="15%" rowspan="2">Country</td>       
            <td align="center" width="10%" rowspan="2">Unit</td>
            <td align="center" colspan="3" width="30%">For foreign exchange</td>            
            <td align="center" colspan="2" width="20%">For foreign cash</td>
          </tr><tr>
            <td align="center" width="12%">Buying exchange rate</td>
<td align="center" width="12%">Middle exchange rate</td>
            <td align="center" width="12%">Selling exchange rate</td>                 
            <td align="center" width="12%">Buying exchange rate</td>
            <td align="center" width="12%">Selling exchange rate</td>
          </tr>

<tr valign="top">
<td align="center">978<br></br></td>
<td align="center">EUR<br></br></td>
<td align="left"><img src='../slike2/EUR.gif' height="11" width="16"/>&nbsp;E M U          <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">        116.7883<br></br></td>
<td align="center">        117.1397<br></br></td>
<td align="center">        117.4911<br></br></td>
<td align="center">        116.7883<br></br></td>
<td align="center">        117.6083<br></br></td>
</tr>

<tr valign="top">
<td align="center">036<br></br></td>
<td align="center">AUD<br></br></td>
<td align="left"><img src='../slike2/AUD.gif' height="11" width="16"/>&nbsp;AUSTRALIJA     <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">         70.0520<br></br></td>
<td align="center">         71.1188<br></br></td>
<td align="center">         72.1856<br></br></td>
<td align="center">         70.0520<br></br></td>
<td align="center">         72.1856<br></br></td>
</tr>

<tr valign="top">
<td align="center">124<br></br></td>
<td align="center">CAD<br></br></td>
<td align="left"><img src='../slike2/CAD.gif' height="11" width="16"/>&nbsp;KANADA         <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">         78.5289<br></br></td>
<td align="center">         79.7248<br></br></td>
<td align="center">         80.9207<br></br></td>
<td align="center">         78.5289<br></br></td>
<td align="center">         80.9207<br></br></td>
</tr>

<tr valign="top">
<td align="center">208<br></br></td>
<td align="center">DKK<br></br></td>
<td align="left"><img src='../slike2/DKK.gif' height="11" width="16"/>&nbsp;DANSKA         <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">         15.4678<br></br></td>
<td align="center">         15.7034<br></br></td>
<td align="center">         15.9390<br></br></td>
<td align="center">         15.4678<br></br></td>
<td align="center">         15.9390<br></br></td>
</tr>

<tr valign="top">
<td align="center">578<br></br></td>
<td align="center">NOK<br></br></td>
<td align="left"><img src='../slike2/NOK.gif' height="11" width="16"/>&nbsp;NORVESKA       <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">          9.9009<br></br></td>
<td align="center">         10.0517<br></br></td>
<td align="center">         10.2025<br></br></td>
<td align="center">          9.9009<br></br></td>
<td align="center">         10.2025<br></br></td>
</tr>

<tr valign="top">
<td align="center">643<br></br></td>
<td align="center">RUB<br></br></td>
<td align="left"><img src='../slike2/RUB.gif' height="11" width="16"/>&nbsp;RUSIJA         <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">          1.1140<br></br></td>
<td align="center">          1.1726<br></br></td>
<td align="center">          1.2312<br></br></td>
<td align="center">          0.0000<br></br></td>
<td align="center">          0.0000<br></br></td>
</tr>

<tr valign="top">
<td align="center">752<br></br></td>
<td align="center">SEK<br></br></td>
<td align="left"><img src='../slike2/SEK.gif' height="11" width="16"/>&nbsp;SVEDSKA        <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">          9.9941<br></br></td>
<td align="center">         10.1463<br></br></td>
<td align="center">         10.2985<br></br></td>
<td align="center">          9.9941<br></br></td>
<td align="center">         10.2985<br></br></td>
</tr>

<tr valign="top">
<td align="center">756<br></br></td>
<td align="center">CHF<br></br></td>
<td align="left"><img src='../slike2/CHF.gif' height="11" width="16"/>&nbsp;SVAJCARSKA     <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">        118.0506<br></br></td>
<td align="center">        119.8483<br></br></td>
<td align="center">        121.6460<br></br></td>
<td align="center">        118.0506<br></br></td>
<td align="center">        121.6460<br></br></td>
</tr>

<tr valign="top">
<td align="center">826<br></br></td>
<td align="center">GBP<br></br></td>
<td align="left"><img src='../slike2/GBP.gif' height="11" width="16"/>&nbsp;VEL. BRITANIJA <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">        134.5570<br></br></td>
<td align="center">        136.6061<br></br></td>
<td align="center">        138.6552<br></br></td>
<td align="center">        134.5570<br></br></td>
<td align="center">        138.6552<br></br></td>
</tr>

<tr valign="top">
<td align="center">840<br></br></td>
<td align="center">USD<br></br></td>
<td align="left"><img src='../slike2/USD.gif' height="11" width="16"/>&nbsp;S A D          <br></br></td>
<td align="center">  1<br></br></td>
<td align="center">        106.5299<br></br></td>
<td align="center">        108.1522<br></br></td>
<td align="center">        109.7745<br></br></td>
<td align="center">        106.5299<br></br></td>
<td align="center">        109.7745<br></br></td>
</tr>
`

describe('convertExchangeRates', () => {
  it('converts exchange rates', () => {
    expect(convertExchangeRates(input)).toEqual(new Map([
      ['EUR', 117.1397],
      ['AUD', 71.1188],
      ['CAD', 79.7248],
      ['DKK', 15.7034],
      ['NOK', 10.0517],
      ['RUB', 1.1726],
      ['SEK', 10.1463],
      ['CHF', 119.8483],
      ['GBP', 136.6061],
      ['USD', 108.1522]
    ]))
  })
})
