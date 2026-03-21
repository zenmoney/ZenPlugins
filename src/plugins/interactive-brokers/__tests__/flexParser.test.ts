import { parseXml } from '../../../common/xmlUtils'
import { parseFlexXML } from '../flexParser'

describe('parseFlexXML', () => {
  it('parses equity summary from Flex XML', () => {
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

    const xmlObj = parseXml(xml)
    const parsed = parseFlexXML(xmlObj)

    expect(parsed.equity).not.toBeNull()
    if (parsed.equity == null) throw new Error('parsed.equity is null')
    const eq = parsed.equity

    expect(eq.baseCurrency).toBe('USD')
    expect(eq.cash).toBeCloseTo(1000.5)
    expect(eq.stock).toBeCloseTo(2000.25)
    expect(eq.options).toBeCloseTo(300)
    expect(eq.crypto).toBeCloseTo(0)
    expect(eq.funds).toBeCloseTo(150)
    expect(eq.dividendAccruals).toBeCloseTo(5)
    expect(eq.total).toBeCloseTo(3455.75)
  })
})
