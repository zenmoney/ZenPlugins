export interface ParsedEquitySummary {
  baseCurrency: string
  cash: number
  stock: number
  options: number
  crypto: number
  funds: number
  dividendAccruals: number
  total: number
}

export interface ParsedFlex {
  equity: ParsedEquitySummary | null
}

export function parseFlexXML (root: any): ParsedFlex {
  const equityNodes = findNodes(root, 'EquitySummaryByReportDateInBase')
  if (equityNodes.length === 0) {
    return { equity: null }
  }

  const items = Array.isArray(equityNodes) ? equityNodes : [equityNodes]
  const last = items[items.length - 1]

  const getNum = (name: string): number => {
    const v = last[name]
    const s = (v == null) ? '' : (typeof v === 'string' ? v : (Array.isArray(v) ? String(v[0]) : String(v)))
    const n = parseFloat(String(s).replace(',', '.'))
    return Number.isFinite(n) ? n : 0
  }

  return {
    equity: {
      baseCurrency: last.currency != null ? String(last.currency) : 'USD',
      cash: getNum('cash'),
      stock: getNum('stock'),
      options: getNum('options'),
      crypto: getNum('crypto'),
      funds: getNum('funds'),
      dividendAccruals: getNum('dividendAccruals'),
      total: getNum('total')
    }
  }
}

/**
 * Recursively find nodes by name
 */
function findNodes (obj: any, key: string): any[] {
  const results: any[] = []

  if (typeof obj !== 'object' || obj === null) return results

  for (const k of Object.keys(obj)) {
    if (k === key) {
      const val = obj[k]
      if (Array.isArray(val)) results.push(...val)
      else results.push(val)
    }

    const child = obj[k]
    if (typeof child === 'object') {
      results.push(...findNodes(child, key))
    }
  }

  return results
}
