import { convertTransaction } from '../../../bnb/converters'
import { BNBTransaction } from '../../../bnb/types'

const OWN_ACCOUNT = 'ACCOUNT_ID'
const baseMock: BNBTransaction = {
  timeStamp: '1658608646',
  hash: '0x90bb0dcbe8fa38387145aa17d6ad99f57da91d4c6d4b65b5f7cf56454f73234b',
  from: '1',
  to: '2',
  value: '870728990000000000',
  gasPrice: '15402961964',
  isError: '0',
  gasUsed: '21000'
}

describe('convertTransaction', () => {
  it('should handle payment operation', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      ...baseMock,
      from: OWN_ACCOUNT
    })

    expect(result?.movements[0].sum).toBeLessThanOrEqual(0)
    expect(result?.movements[0].fee).toBeLessThan(0)
  })

  it('should handle deposit operation', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      ...baseMock,
      to: OWN_ACCOUNT
    })

    expect(result?.movements[0].sum).toBeGreaterThan(0)
    expect(result?.movements[0].fee).toBe(0)
  })

  it('should ignore errored operations', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      ...baseMock,
      isError: '1'
    })

    expect(result).toBe(null)
  })

  it('should ignore value = 0 operations', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      ...baseMock,
      value: '0'
    })

    expect(result).toBe(null)
  })

  it('should convert operation amount', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      ...baseMock,
      value: '1000000000000000000'
    })

    expect(result?.movements[0].sum).toBe(1000000)
  })
})
