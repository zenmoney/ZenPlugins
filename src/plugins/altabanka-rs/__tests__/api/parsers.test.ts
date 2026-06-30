import { parseAccounts, parseTransactions } from '../../parsers'

describe('parseAccounts', () => {
  it('should parse accounts from GetAllAccountBalance response', () => {
    const response = [
      ['', 'Tekući račun bez red. priliva', 'PUB-RT-8', '78.96', '0', 'effective',
        '190000100038442537', '2201.13', 'RSD', '', '0', '', '', '', '0',
        'RS35190000100038442537', 'Tekući račun bez red. priliva', '3420',
        '30.06.2026 00:00:00', '01.01.0001 00:00:00', ''],
      ['', 'Devizni račun rezidenti', 'PUB-RT-301', '0', '0', 'effective',
        '190003100045788779', '0.00', 'EUR', '', '0', '', '', '', '0',
        'RS35190003100045788779', 'Devizni račun rezidenti', '870',
        '04.06.2026 00:00:00', '01.01.0001 00:00:00', '']
    ]

    expect(parseAccounts(response)).toEqual([
      {
        name: 'Tekući račun bez red. priliva',
        productCoreID: 'PUB-RT-8',
        accountNumber: '190000100038442537',
        balance: 2201.13,
        currency: 'RSD',
        iban: 'RS35190000100038442537'
      },
      {
        name: 'Devizni račun rezidenti',
        productCoreID: 'PUB-RT-301',
        accountNumber: '190003100045788779',
        balance: 0,
        currency: 'EUR',
        iban: 'RS35190003100045788779'
      }
    ])
  })
})

describe('parseTransactions', () => {
  it('should parse debit transactions', () => {
    const response = [
      [
        ['', '', ''],
        [
          ['', '', '', '0001000384425', '', 'd', '', '29.06.2026 09:13:02',
            '30.06.2026 09:13:02', '', '77718351061001', '', '', '', '',
            'J071                        BEOGRAD  STAR', '', '',
            'RS35190000100038442537', '', '', '', '', '', '', '', '',
            '447.00', '', '', 'RSD', 'wdw', '', '', '', '', '', '',
            '0', '', 'b', '', '', '', '200011', '', '', '', '',
            '447.00', '', '', '941', '', '', '', '', '', '', '', '',
            '30.06.2026 09:13:02', '', '', 'crd']
        ]
      ]
    ]

    const result = parseTransactions(response)

    expect(result).toEqual([
      {
        id: '77718351061001',
        date: new Date('2026-06-29T09:13:02'),
        direction: 'd',
        amount: -447,
        currency: 'RSD',
        description: 'J071                        BEOGRAD  STAR'
      }
    ])
  })

  it('should parse credit transactions', () => {
    const response = [
      [
        ['', '', ''],
        [
          ['', '', '', '0001000384425', '', 'c', '', '27.06.2026 09:11:10',
            '27.06.2026 09:11:10', '', '87700175591001', '', '', '', '',
            'Uplata na tekuci racun', '', '',
            'RS35190000100038442537', '', '', '', '', '', '', '', '',
            '3420.00', '', '', 'RSD', 'dep', '', '', '', '', '', '',
            '0', '', 'b', '', '', '', '10201', '', '', '', '',
            '3420.00', '', '', 'TORSUNOVA', '', '', '', '', '', '', '', '',
            '27.06.2026 09:11:10', '', '', 'brn']
        ]
      ]
    ]

    const result = parseTransactions(response)

    expect(result).toEqual([
      {
        id: '87700175591001',
        date: new Date('2026-06-27T09:11:10'),
        direction: 'c',
        amount: 3420,
        currency: 'RSD',
        description: 'Uplata na tekuci racun'
      }
    ])
  })

  it('should return empty array when no transactions', () => {
    const response = [[['', '', ''], []]]
    expect(parseTransactions(response)).toEqual([])
  })
})
