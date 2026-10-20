import { fetch } from '../../common/network'
import { InvalidPreferencesError } from '../../errors'

const FLEX_URL = 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService'

function sanitizeReport (body: unknown): unknown {
  if (typeof body !== 'string') return body
  return body
    .replace(/(<ReferenceCode>)[^<]*(<\/ReferenceCode>)/g, '$1<redacted>$2')
    .replace(/(\b(?:name|accountName|accountAlias)=)(["'])(.*?)\2/gi, '$1$2<redacted>$2')
    // The recorded CSV has a separate account identity section before history.
    .replace(/(^"ClientAccountID","Name"[^\r\n]*\r?\n"[^"]*",)"(?:[^"]|"")*"/gm, '$1"<redacted>"')
}

const responseLogMask = {
  headers: { 'set-cookie': true, authorization: true },
  body: sanitizeReport
}

function requestLogMask (reference: boolean): unknown {
  return {
    headers: { cookie: true, authorization: true },
    body: (body: unknown) => typeof body === 'string'
      ? body.replace(reference ? /(^|&)(t|q)=[^&]*/g : /(^|&)(t)=[^&]*/g, '$1$2=<redacted>')
      : body
  }
}

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
    body,
    sanitizeRequestLog: requestLogMask(false),
    sanitizeResponseLog: responseLogMask
  })

  const text: string = response.body as string

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
    body,
    sanitizeRequestLog: requestLogMask(true),
    sanitizeResponseLog: responseLogMask
  })

  const text: string = response.body as string

  // IBKR errors
  if (text.includes('<ErrorCode>')) {
    const code = extractTag(text, 'ErrorCode') ?? ''
    const msg = extractTag(text, 'ErrorMessage') ?? ''
    throw new Error(`IBKR GetStatement error ${code}: ${msg}`)
  }

  // Verify that this is Flex XML
  if (text.startsWith('"ClientAccountID","Name","CurrencyPrimary"')) {
    throw new InvalidPreferencesError('Select XML as the output format of your Interactive Brokers Flex Query, then synchronize again.')
  }
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
