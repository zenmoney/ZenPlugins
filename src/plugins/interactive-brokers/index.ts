import { parseXml } from '../../common/xmlUtils'
import { requestFlexXML } from './api'
import { parseFlexXML } from './flexParser'
import { convertToZenmoney } from './converter'

export async function scrape (args: any): Promise<any> {
  const { flexToken, queryId } = args.preferences

  if (flexToken == null || flexToken === '' || queryId == null || queryId === '') {
    throw new Error('IBKR: flexToken and queryId are required')
  }

  // 1) Retrieve XML
  const xml = await requestFlexXML(flexToken, queryId)
  const xmlObj = parseXml(xml)
  // 2) Parse XML
  const parsed = parseFlexXML(xmlObj)

  // 3) Convert to ZenMoney format
  return convertToZenmoney(parsed)
}
