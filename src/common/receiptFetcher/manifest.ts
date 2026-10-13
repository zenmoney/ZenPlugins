import isRegExp from 'lodash/isRegExp.js'
import type { ReceiptFetcherDescriptor, SerializedMatcher } from '../../types/receiptFetcher'

const countries = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '))
const receiptOperations = ['fetchReceipt', 'parseReceiptCode'] as const

function check (condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function keys (value: unknown, allowed: string[], description: string): asserts value is Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value) && !isRegExp(value), `Invalid ${description}`)
  check(Object.keys(value).every(key => allowed.includes(key)), `Unknown ${description} property`)
}

function serializeMatcher (matcher: unknown): SerializedMatcher {
  let nodes = 0
  function visit (value: unknown, depth: number): SerializedMatcher {
    check(depth < 32, 'Matcher is too deep')
    check(++nodes <= 256, 'Matcher has too many nodes')
    if (typeof value === 'string') {
      check(value.length > 0, 'Empty matcher string')
      return value
    }
    if (isRegExp(value)) {
      check(/^[imsu]*$/.test(value.flags), 'Unsupported matcher regex flags')
      return { regex: { source: value.source, flags: value.flags } }
    }
    keys(value, ['all', 'any', 'not'], 'matcher')
    const names = Object.keys(value)
    check(names.length === 1, 'Matcher must have exactly one operator')
    const name = names[0]
    if (name === 'not') return { not: visit(value.not, depth + 1) }
    const children = value[name]
    check(Array.isArray(children) && children.length > 0, 'Matcher lists must not be empty')
    const serialized = Array.from(children, item => visit(item, depth + 1))
    return name === 'all' ? { all: serialized } : { any: serialized }
  }
  return visit(matcher, 0)
}

// Validate receipt metadata before producing portable artifact metadata.
export function serializeManifest (manifest: unknown): ReceiptFetcherDescriptor {
  keys(manifest, ['id', 'countryCodes', 'capabilities'], 'manifest')
  check(typeof manifest.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z]{2}$/.test(manifest.id), 'Invalid source plugin id')
  check(Array.isArray(manifest.countryCodes), 'Invalid countryCodes')
  const countryCodes = Array.from(manifest.countryCodes, (code: unknown) => {
    check(typeof code === 'string' && countries.has(code), 'Invalid countryCodes')
    return code
  })
  check(new Set(countryCodes).size === countryCodes.length, 'Invalid countryCodes')
  keys(manifest.capabilities, [...receiptOperations], 'capabilities')
  check(Object.keys(manifest.capabilities).length > 0, 'At least one capability is required')
  const capabilities: ReceiptFetcherDescriptor['capabilities'] = {}
  for (const name of receiptOperations) {
    if (!Object.prototype.hasOwnProperty.call(manifest.capabilities, name)) continue
    const capability = manifest.capabilities[name]
    keys(capability, ['matcher'], 'capability')
    capabilities[name] = Object.prototype.hasOwnProperty.call(capability, 'matcher')
      ? { matcher: capability.matcher === null ? null : serializeMatcher(capability.matcher) }
      : {}
  }
  return {
    id: manifest.id,
    countryCodes,
    capabilities,
    files: { js: ['index.js'] }
  }
}
