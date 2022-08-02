import { convertTransaction } from '../../../converters'

const OWN_ACCOUNT = 'ACCOUNT_ID'

describe('convertTransaction', () => {
  it('should handle payment operation', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      txid: '1',
      vin: [
        {
          txid: '1',
          vout: 0,
          prevout: {
            scriptpubkey_address: OWN_ACCOUNT,
            value: 100
          }
        }
      ],
      vout: [
        {
          scriptpubkey_address: 'TEST',
          value: 100
        }
      ],
      status: {
        confirmed: true,
        block_time: 1659189723
      }
    })

    expect(result?.movements[0].sum).toBeLessThanOrEqual(0)
  })

  it('should handle deposit operation', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      txid: '1',
      vin: [
        {
          txid: '1',
          vout: 0,
          prevout: {
            scriptpubkey_address: 'TEST',
            value: 100
          }
        }
      ],
      vout: [
        {
          scriptpubkey_address: OWN_ACCOUNT,
          value: 100
        }
      ],
      status: {
        confirmed: true,
        block_time: 1659189723
      }
    })

    expect(result?.movements[0].sum).toBeGreaterThan(0)
  })

  it('should convert operation amount', () => {
    const result = convertTransaction(OWN_ACCOUNT, {
      txid: '1',
      vin: [
        {
          txid: '1',
          vout: 0,
          prevout: {
            scriptpubkey_address: '1',
            value: 100000000
          }
        }
      ],
      vout: [
        {
          scriptpubkey_address: OWN_ACCOUNT,
          value: 100000000
        }
      ],
      status: {
        confirmed: true,
        block_time: 1659189723
      }
    })

    expect(result?.movements[0].sum).toBe(1000000)
  })
})
