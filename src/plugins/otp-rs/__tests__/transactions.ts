// import { parseTransactions } from '../../../parsers'

import { parseTransactions } from '../parsers'

describe('parseTransactions', () => {
  it('should parse API transactions with RSD currency', () => {
    const apiTransactions = [
      [
        ['', '', ''],
        [
          [
            '',
            '941',
            'RSD',
            '17.12.2024 00:00:00',
            'Test expense',
            '',
            'NAME SURNAME',
            '',
            '87314237254301',
            '1110',
            '',
            '',
            '',
            '',
            '',
            '',
            '325930070731111111',
            '',
            '',
            '',
            'ADDRESS',
            '',
            'CITY',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '1'
          ],
          [
            '',
            '941',
            'RSD',
            '17.12.2024 00:00:00',
            'Test expense 2',
            '',
            'NAME SURNAME',
            '',
            '87314228759901',
            '2500',
            '',
            '',
            '',
            '',
            '',
            '',
            '325930070731111111',
            '',
            '',
            '',
            'ADDRESS',
            '',
            'CITY',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '1'
          ],
          [
            '',
            '941',
            'RSD',
            '16.12.2024 00:00:00',
            'Test expense 3',
            '',
            'NAME SURNAME',
            '16.12.2024 00:00:00',
            '34669932632026',
            '9',
            '',
            '',
            '',
            '',
            '',
            '',
            '325930070731111111',
            '',
            'izvršen',
            '',
            'ADDRESS',
            '',
            'CITY',
            '',
            'Ostalo',
            'Banka',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '9.00',
            '',
            '459472.75',
            '',
            '0'
          ],
          [
            '',
            '941',
            'RSD',
            '16.12.2024 00:00:00',
            'Test income',
            '',
            'NAME SURNAME',
            '16.12.2024 00:00:00',
            '123123',
            '',
            '10',
            '',
            '',
            '',
            '',
            '',
            '325930070731111111',
            '',
            'izvršen',
            '',
            'ADDRESS',
            '',
            'CITY',
            '',
            'Ostalo',
            'Banka',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '459482.75',
            '',
            '0'
          ]
        ]
      ]
    ]
    const responseBody = apiTransactions as string[][][][]
    const result = parseTransactions(responseBody[0][1])

    expect(result).toHaveLength(4)

    // Check first transaction
    expect(result[0].date).toEqual(new Date('2024-12-17T00:00:00'))
    expect(result[0].title).toBe('Test expense')
    expect(result[0].amount).toBe(-1110)
    expect(result[0].currencyCode).toBe('RSD')
    expect(result[0].currencyCodeNumeric).toBe('941')
    // expect(result[0].id).toBe('87314237254301')

    // Check second transaction
    expect(result[1].date).toEqual(new Date('2024-12-17T00:00:00'))
    expect(result[1].title).toBe('Test expense 2')
    expect(result[1].amount).toBe(-2500)
    expect(result[1].currencyCode).toBe('RSD')
    expect(result[1].currencyCodeNumeric).toBe('941')
    // expect(result[1]id).toBe('87314228759901')

    // Check third transaction
    expect(result[2].date).toEqual(new Date('2024-12-16T00:00:00'))
    expect(result[2].title).toBe('Test expense 3')
    expect(result[2].amount).toBe(-9)
    expect(result[2].currencyCode).toBe('RSD')
    expect(result[2].currencyCodeNumeric).toBe('941')
    // expect((result[2] as any).id).toBe('34669932632026')

    // Check fourth transaction
    expect(result[3].date).toEqual(new Date('2024-12-16T00:00:00'))
    expect(result[3].title).toBe('Test income')
    expect(result[3].amount).toBe(10)
    expect(result[3].currencyCode).toBe('RSD')
    expect(result[3].currencyCodeNumeric).toBe('941')
    // expect((result[3] as any).id).toBe('123123')
  })
})
