const FLEX_URL = 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService'

/**
 * Main function: requests Flex XML using token + queryId
 */
export async function requestFlexXML (token: string, queryId: string): Promise<string> {
  const ref = await sendRequest(token, queryId)
  return await getStatement(token, ref)
}

/**
 * Step 1: SendRequest → obtain ReferenceCode
 */
async function sendRequest (token: string, queryId: string): Promise<string> {
  const url = `${FLEX_URL}.SendRequest`
  const body = `t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=3`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  const text = await response.text()

  // IBKR errors
  if (text.includes('<ErrorCode>')) {
    const code = extractTag(text, 'ErrorCode') ?? ''
    const msg = extractTag(text, 'ErrorMessage') ?? ''
    throw new Error(`IBKR SendRequest error ${code}: ${msg}`)
  }

  const ref = extractTag(text, 'ReferenceCode')
  if (ref == null || ref === '') {
    throw new Error('IBKR did not return ReferenceCode')
  }

  return ref
}

/**
 * Step 2: GetStatement → retrieve the Flex XML
 */
async function getStatement (token: string, ref: string): Promise<string> {
  const url = `${FLEX_URL}.GetStatement`
  const body = `t=${encodeURIComponent(token)}&q=${encodeURIComponent(ref)}&v=3`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  const text = await response.text()

  // IBKR errors
  if (text.includes('<ErrorCode>')) {
    const code = extractTag(text, 'ErrorCode') ?? ''
    const msg = extractTag(text, 'ErrorMessage') ?? ''
    throw new Error(`IBKR GetStatement error ${code}: ${msg}`)
  }

  // Verify that this is Flex XML
  if (!text.includes('<FlexQueryResponse')) {
    throw new Error('IBKR returned unexpected format (not Flex XML)')
  }

  return text
}

/**
 * Helper to extract <Tag>value</Tag>
 */
function extractTag (xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`))
  return (m != null) ? m[1] : null
}
