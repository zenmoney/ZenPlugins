/** Amount strings from Home Credit PDFs: "+ 417,64 ₸", "- 134,00 ₸" */
export function parseSumFromAmountString (amount: string): number {
  const m = amount.match(/^([-+])\s*((?:\d\s*)+,\d{2})\s*₸/)
  if (m == null) {
    return parseFloat(amount.replace(',', '.').replace(/[^\d.-]/g, ''))
  }
  const sign = m[1] === '-' ? -1 : 1
  const num = parseFloat(m[2].replace(/\s/g, '').replace(',', '.'))
  return sign * num
}
