import { parseTransaction, parseTransactions } from '../../parsers'

describe('parseTransactions', () => {
  it('should parse API transactions to OtpTransaction', () => {
    const apiTransactions: string[][] = [
      ['0', '840', 'USD', '01.01.2023', 'Test Transaction', '0', '0', '0', '0', '100', '0']
    ]

    const result = parseTransactions(apiTransactions)

    expect(result).toHaveLength(1)
    expect(result[0].date).toEqual(new Date(2023, 0, 1))
    expect(result[0].title).toBe('Test Transaction')
    expect(result[0].amount).toBe(-100)
    expect(result[0].currencyCode).toBe('USD')
    expect(result[0].currencyCodeNumeric).toBe('840')
  })
})

describe('parseTransaction column semantics (pending vs completed)', () => {
  // Pending: empty bookingDate [7], empty status [18], finalFlag [45] = "1"
  it('parses pending row: empty bookingDate and status, finalFlag 1', () => {
    const row = new Array(46).fill('')
    row[1] = '978'
    row[2] = 'EUR'
    row[3] = '06.03.2026 00:00:00'
    row[4] = '1111****2222: ISLAND SPORTS'
    row[7] = ''
    row[8] = '87330155018111'
    row[9] = '1.49'
    row[10] = ''
    row[18] = ''
    row[30] = ''
    row[45] = '1'

    const t = parseTransaction(row)
    expect(t.id).toBe('87330155018111')
    expect(t.bookingDate).toBe('')
    expect(t.status).toBe('')
    expect(t.finalFlag).toBe('1')
    expect(t.amount).toBe(-1.49)
  })

  // Completed: bookingDate [7] set, status [18] = "Izvršen", finalFlag [45] = "0"
  it('parses completed row: bookingDate and status set, finalFlag 0', () => {
    const row = new Array(46).fill('')
    row[1] = '978'
    row[2] = 'EUR'
    row[3] = '04.03.2026 00:00:00'
    row[4] = 'MasterCard debit - PLAYTOMIC.IO'
    row[7] = '05.03.2026 00:00:00'
    row[8] = 'A114944911111'
    row[9] = '40'
    row[10] = ''
    row[18] = 'Izvršen'
    row[30] = ''
    row[45] = '0'

    const t = parseTransaction(row)
    expect(t.id).toBe('A114944911111')
    expect(t.bookingDate).toBe('05.03.2026 00:00:00')
    expect(t.status).toBe('Izvršen')
    expect(t.finalFlag).toBe('0')
    expect(t.amount).toBe(-40)
  })
})
