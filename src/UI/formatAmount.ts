import codeToCurrencyLookup from '../common/codeToCurrencyLookup'

const currencies = new Set(Object.values(codeToCurrencyLookup))
const formatters = new Map<string, Intl.NumberFormat>()

/** Format the browser preview using currency precision and fractional token units. */
export function formatAmount (value: number, instrument = ''): string {
  if (!Number.isFinite(value)) return String(value)
  const currency = instrument.toUpperCase()
  let formatter = formatters.get(currency)
  if (formatter == null) {
    const precision: Intl.NumberFormatOptions = currencies.has(currency)
      ? {
          maximumFractionDigits: new Intl.NumberFormat('en-US', {
            style: 'currency', currency
          }).resolvedOptions().maximumFractionDigits,
          minimumFractionDigits: 0
        }
      : { maximumSignificantDigits: 15 }
    formatter = new Intl.NumberFormat('en-US', { useGrouping: false, ...precision })
    formatters.set(currency, formatter)
  }
  const text = formatter.format(value)
  return text === '-0' ? '0' : text
}
