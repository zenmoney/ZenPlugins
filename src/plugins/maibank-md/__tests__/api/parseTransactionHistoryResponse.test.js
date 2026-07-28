import { TemporaryUnavailableError } from '../../../../errors'
import { parseTransactionHistoryResponse } from '../../api'

describe('parseTransactionHistoryResponse', () => {
  it('reports unauthorized history responses without reading a missing last transaction', () => {
    expect(() => parseTransactionHistoryResponse({
      status: 401,
      body: {
        transactions: []
      }
    })).toThrow(TemporaryUnavailableError)
  })

  it('returns an empty final page', () => {
    expect(parseTransactionHistoryResponse({
      status: 200,
      body: {
        transactions: []
      }
    })).toEqual([])
  })
})
