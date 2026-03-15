import { parseXml } from '../../../common/xmlUtils'
import { parseFlexXML } from '../flexParser'
import { convertToZenmoney } from '../converter'

describe('convertToZenmoney', () => {
  it('converts parsed flex into accounts with balances', () => {
    const xml = `<?xml version="1.0"?>
<FlexQueryResponse>
  <EquitySummaryByReportDateInBase>
    <currency>USD</currency>
    <cash>1000.50</cash>
    <stock>2000.25</stock>
    <options>300</options>
    <crypto>0</crypto>
    <funds>150</funds>
    <dividendAccruals>5</dividendAccruals>
    <total>3455.75</total>
  </EquitySummaryByReportDateInBase>
</FlexQueryResponse>`

    const parsed = parseFlexXML(parseXml(xml))
    const res = convertToZenmoney(parsed)

    expect(res.accounts).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'IBKR_CASH', balance: expect.closeTo(1000.5, 1e-6), instrument: 'USD' }),
      expect.objectContaining({ id: 'IBKR_STOCK', balance: expect.closeTo(2000.25, 1e-6) }),
      expect.objectContaining({ id: 'IBKR_OPTIONS', balance: expect.closeTo(300, 1e-6) }),
      expect.objectContaining({ id: 'IBKR_CRYPTO', balance: expect.closeTo(0, 1e-6) }),
      expect.objectContaining({ id: 'IBKR_FUNDS', balance: expect.closeTo(150, 1e-6) }),
      expect.objectContaining({ id: 'IBKR_DIVIDENDS', balance: expect.closeTo(5, 1e-6) })
    ]))
  })
})
