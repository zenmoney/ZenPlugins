import crypto from 'crypto'
import { randomInt } from '../../common/utils'

// Extracted from the production İşCep 10.12.0 application.
const CONSUMER_KEY = 'A562432E-061C-4584-8252-19F153BF0E31'
const CONSUMER_SECRET = '9A6AA1E9-DFCE-49C1-9A92-4AFB79A63934'
const EMPTY_BODY_HASH = '2jmj7l5rSw0yVb/vlWAYkK/YBwk='

export function createOAuthHeader (
  url: string,
  nonce: string = randomInt(123400, 9999999).toString(),
  timestamp: string = Math.floor(Date.now() / 1000).toString()
): string {
  const parameters: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_body_hash: EMPTY_BODY_HASH,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
  }
  const parameterString = Object.keys(parameters)
    .sort((left, right) => left.toUpperCase().localeCompare(right.toUpperCase(), 'en-US'))
    .map(key => `${key}=${parameters[key]}`)
    .join('&')
  const signatureBase = `POST&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`
  const signature = crypto
    .createHmac('sha1', `${encodeURIComponent(CONSUMER_SECRET)}&`)
    .update(signatureBase, 'ascii')
    .digest('base64')

  return [
    `oauth_body_hash="${EMPTY_BODY_HASH}"`,
    `oauth_consumer_key="${CONSUMER_KEY}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_timestamp="${timestamp}"`,
    'oauth_signature_method="HMAC-SHA1"',
    'oauth_version="1.0"',
    `oauth_signature="${signature}"`
  ].join(',').replace(/^/, 'OAuth ')
}
