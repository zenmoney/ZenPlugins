import { buildQueryString, signQuery } from '../fetchApi'

describe('MEXC request signing', () => {
  it('signs the exact query string sent to MEXC', () => {
    const query = buildQueryString({ startTime: 10, endTime: 20, limit: 1000, empty: undefined })
    expect(query).toBe('startTime=10&endTime=20&limit=1000')
    expect(signQuery('secret', query)).toBe('b1438e4a8006bff3520479c965a58b1399fa69ea5cb5a7f628c1810654053eac')
  })
})
