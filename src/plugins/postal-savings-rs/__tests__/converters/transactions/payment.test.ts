import { convertTransactions } from '../../../converters'

describe('payment', () => {
  it('payment', () => {
    expect(convertTransactions(
      '1234567895',
      '<tr>\n' +
    '<td align="right" width="80" nowrap>05.12.2023</td>\n' +
   '<td align="left" width="130" nowrap>ISPLATA VISA&nbsp;NICEFOODS</td>\n' +
   '<td align="right" width="100" nowrap>EUR 978</td>\n' +
   '<td align="right" width="100" nowrap>-17,75</td>\n' +
   '<td align="right" width="40" nowrap>00000</td>\n' +
   '<td align="right" width="100" nowrap>25.705,97</td>\n' +
'</tr>\n' +
'<tr>\n' +
    '<td align="right" width="80" nowrap>06.12.2023</td>\n' +
   '<td align="left" width="130" nowrap>ISPLATA VISA&nbsp;YETTEL D.O.O.</td>\n' +
   '<td align="right" width="100" nowrap>EUR 978</td>\n' +
   '<td align="right" width="100" nowrap>-2,56</td>\n' +
   '<td align="right" width="40" nowrap>00000</td>\n' +
   '<td align="right" width="100" nowrap>25.703,41</td>\n' +
'</tr>\n' +
'<tr>\n' +
    '<td align="right" width="80" nowrap>25.01.2024</td>\n' +
  '<td align="left" width="130" nowrap>ISPLATA VISA&nbsp;</td>\n' +
  '<td align="right" width="100" nowrap>EUR 978</td>\n' +
  '<td align="right" width="100" nowrap>-378,85</td>\n' +
  '<td align="right" width="40" nowrap>00000</td>\n' +
  '<td align="right" width="100" nowrap>20.655,86</td>\n' +
'</tr>')).toEqual([{
      comment: null,
      date: new Date('2024-01-25T00:00:00.000'),
      hold: false,
      merchant: {
        fullTitle: 'ISPLATA VISA',
        location: null,
        mcc: null
      },
      movements: [
        {
          account: {
            id: '1234567895'
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: -378.85
        }
      ]
    }, {
      comment: null,
      date: new Date('2023-12-06T00:00:00'),
      hold: false,
      merchant: {
        fullTitle: 'YETTEL D.O.O.',
        location: null,
        mcc: null
      },
      movements: [
        {
          account: {
            id: '1234567895'
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: -2.56
        }]
    }, {
      comment: null,
      date: new Date('2023-12-05T00:00:00'),
      hold: false,
      merchant: {
        fullTitle: 'NICEFOODS',
        location: null,
        mcc: null
      },
      movements: [
        {
          account: {
            id: '1234567895'
          },
          fee: 0,
          id: null,
          invoice: null,
          sum: -17.75
        }]
    }])
  })
})
