import { Merchant } from '../../types/zenmoney'

import { KEYWORDS_TO_REMOVE } from './constants'

const countryByCode: Record<string, string> = {
  KZ: 'Kazakhstan',
  CN: 'China',
  BY: 'Belarus',
  RU: 'Russia',
  US: 'USA',
  GB: 'UK',
  TR: 'Turkey',
  AE: 'UAE',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  PL: 'Poland',
  UA: 'Ukraine',
  UZ: 'Uzbekistan',
  KG: 'Kyrgyzstan',
  TJ: 'Tajikistan'
}

const cityMatchers: Array<{ marker: RegExp, city: string, country?: string }> = [
  { marker: /ALMATY/i, city: 'Almaty', country: 'Kazakhstan' },
  { marker: /ASTANA/i, city: 'Astana', country: 'Kazakhstan' },
  { marker: /NUR-SULTAN/i, city: 'Astana', country: 'Kazakhstan' },
  { marker: /SHYMKENT/i, city: 'Shymkent', country: 'Kazakhstan' },
  { marker: /KARAGANDA/i, city: 'Karaganda', country: 'Kazakhstan' },
  { marker: /AKTOBE/i, city: 'Aktobe', country: 'Kazakhstan' },
  { marker: /TARAZ/i, city: 'Taraz', country: 'Kazakhstan' },
  { marker: /PAVLODAR/i, city: 'Pavlodar', country: 'Kazakhstan' },
  { marker: /UST-KAMENOGORSK/i, city: 'Ust-Kamenogorsk', country: 'Kazakhstan' },
  { marker: /SEMEY/i, city: 'Semey', country: 'Kazakhstan' },
  { marker: /ATYRAU/i, city: 'Atyrau', country: 'Kazakhstan' },
  { marker: /KYZYLORDA/i, city: 'Kyzylorda', country: 'Kazakhstan' },
  { marker: /KOSTANAY/i, city: 'Kostanay', country: 'Kazakhstan' },
  { marker: /URALSK/i, city: 'Uralsk', country: 'Kazakhstan' },
  { marker: /PETROPAVLOVSK/i, city: 'Petropavlovsk', country: 'Kazakhstan' },
  { marker: /TURKISTAN/i, city: 'Turkistan', country: 'Kazakhstan' },
  { marker: /KOKSHETAU/i, city: 'Kokshetau', country: 'Kazakhstan' },
  { marker: /TEMIRTAU/i, city: 'Temirtau', country: 'Kazakhstan' },
  { marker: /TALDYKORGAN/i, city: 'Taldykorgan', country: 'Kazakhstan' },
  { marker: /EKIBASTUZ/i, city: 'Ekibastuz', country: 'Kazakhstan' },
  { marker: /RUDNY/i, city: 'Rudny', country: 'Kazakhstan' },
  { marker: /ZHEZKAZGAN/i, city: 'Zhezkazgan', country: 'Kazakhstan' },
  // Foreign
  { marker: /LONDON/i, city: 'London', country: 'UK' },
  { marker: /NEW YORK/i, city: 'New York', country: 'USA' },
  { marker: /DUBAI/i, city: 'Dubai', country: 'UAE' },
  { marker: /ISTANBUL/i, city: 'Istanbul', country: 'Turkey' },
  { marker: /MOSCOW/i, city: 'Moscow', country: 'Russia' },
  { marker: /ST.?PETERSBURG/i, city: 'St. Petersburg', country: 'Russia' },
  { marker: /KIEV/i, city: 'Kiev', country: 'Ukraine' },
  { marker: /KYIV/i, city: 'Kyiv', country: 'Ukraine' },
  { marker: /TASHKENT/i, city: 'Tashkent', country: 'Uzbekistan' },
  { marker: /BISHKEK/i, city: 'Bishkek', country: 'Kyrgyzstan' },
  { marker: /DUSHANBE/i, city: 'Dushanbe', country: 'Tajikistan' }
]

const KEYWORD_REGEXES = KEYWORDS_TO_REMOVE.map(k => new RegExp(`\\b${k}\\b`, 'gi'))

export function cleanMerchantTitle (text: string | null): string | null {
  if (text == null || text.trim() === '') return null

  let cleanedText = text

  // Remove MCC, Dates, and long numeric IDs first
  cleanedText = cleanedText
    .replace(/MCC:?\s*\d{4}/gi, '')
    .replace(/\b\d{2}\.\d{2}\.\d{2,4}\b/g, '') // Dates like 01.01.2023
    .replace(/\b\d{6,}\b/g, '') // Long numeric IDs
    .replace(/[<>]/g, ' ') // Formatting artifacts

  // Remove generic keywords
  for (const regex of KEYWORD_REGEXES) {
    cleanedText = cleanedText.replace(regex, '')
  }

  // Remove artifacts and extra spaces
  cleanedText = cleanedText
    .replace(/["']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return cleanedText.length > 0 ? cleanedText : null
}

export function detectCityCountryLocation (text: string | null): { city?: string | null, country?: string | null, locationPoint: string } | null {
  if (text == null) return null
  const upper = text.toUpperCase()

  let country: string | null = null
  // Look for country code at the end (e.g. "MerchName KZ")
  const codeMatch = upper.match(/\b([A-Z]{2})\s*$/)
  if (codeMatch?.[1] != null && countryByCode[codeMatch[1]] != null) {
    country = countryByCode[codeMatch[1]]
  }

  let city: string | null = null
  let cityCountry: string | undefined
  for (const matcher of cityMatchers) {
    if (matcher.marker.test(upper)) {
      city = matcher.city
      cityCountry = matcher.country
      break
    }
  }

  const hasLocation = city !== null || country !== null
  const locationPoint = cleanLocationPoint(text, hasLocation)

  if (!hasLocation) {
    return { locationPoint }
  }

  return { city, country: cityCountry ?? country, locationPoint }
}

function cleanLocationPoint (text: string, hasLocation: boolean): string {
  let result = text

  // Common prefixes/suffixes to strip
  const stripPatterns = [
    /^\s*IP\s+/i,
    /^TOO\s+/i,
    /^LLP\s+/i,
    /^JSC\s+/i,
    /^AO\s+/i,
    /^\s*G\.?\s+/i, // Gorod
    /^\s*K\.?\s+/i // Kala
  ]

  for (const pattern of stripPatterns) {
    result = result.replace(pattern, '')
  }

  // Remove city names if they are part of the merchant string and we found a location
  const markers = cityMatchers.map(m => m.marker)
  for (const marker of markers) {
    const globalMarker = new RegExp(marker.source, 'gi')
    result = result.replace(globalMarker, '')
  }

  if (hasLocation) {
    // Remove trailing country codes
    result = result.replace(/\b(KZ|CN|BY|RU|US|GB|TR|AE)\b/gi, '')
  }

  result = result.replace(/\s{2,}/g, ' ').trim()
  result = result.replace(/[\s,.]+$/, '').trim()

  return result
}

export function parseMerchant (description: string): Merchant | null {
  const cleanedTitle = cleanMerchantTitle(description)

  if (cleanedTitle === null) {
    return null
  }

  const loc = detectCityCountryLocation(cleanedTitle)

  let title = cleanedTitle
  let city: string | null = null
  let country: string | null = null

  if (loc !== null) {
    title = loc.locationPoint
    city = loc.city ?? null
    country = loc.country ?? null
  }

  if (title === '') {
    return null
  }

  return {
    title,
    city,
    country,
    mcc: null,
    location: null
    // category is optional (undefined)
  }
}

export function cleanTransactionComment (text: string, merchant: Merchant | any): string {
  let cleaned = text

  if (merchant?.mcc != null) {
    cleaned = cleaned.replace(/MCC:?\s*(\d{4})/gi, '')
  }

  if (merchant?.city != null) {
    const matcher = cityMatchers.find(m => m.city === merchant.city)
    if (matcher != null) {
      cleaned = cleaned.replace(matcher.marker, '')
    }
  }

  if (merchant?.country != null) {
    const countryCodes = Object.keys(countryByCode).join('|')
    cleaned = cleaned.replace(new RegExp(`\\b(${countryCodes})\\b`, 'gi'), '')
  }

  cleaned = cleaned.replace(/\b(KZT|USD|EUR|RUB|GBP)\b/gi, '')

  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
  return cleaned
}
