import { formatRate } from './mappingUtils'

describe('formatRate', () => {
  it('should never output rate below 1', () => {
    expect(formatRate({ transactionAmount: 50, accountAmount: 50 })).toEqual('1.0000')
    expect(formatRate({ transactionAmount: 50, accountAmount: 49 })).toEqual('1.0204')
    expect(formatRate({ transactionAmount: 49, accountAmount: 50 })).toEqual('1/1.0204')
  })
})
