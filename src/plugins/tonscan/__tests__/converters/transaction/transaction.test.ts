import { convertTonTransaction, convertJettonTransfer } from '../../../converters'

const otherAddress = 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ'

describe('convertTonTransaction', () => {
  const walletInfo = {
    address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr',
    balance: 0
  }

  it('should correctly convert TON transaction', () => {
    const rawTransaction = {
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: otherAddress,
      toAddress: walletInfo.address,
      quantity: 56793400000,
      timestamp: 1624118401
    }

    const convertedTransaction = {
      hold: false,
      date: new Date(1624118401 * 1000),
      movements: [
        {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
          account: { id: walletInfo.address },
          sum: 56.79,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: otherAddress,
        mcc: null,
        location: null
      },
      comment: null
    }

    expect(convertTonTransaction(rawTransaction, walletInfo)).toEqual(convertedTransaction)
  })

  it('correctly sets the operation sign', () => {
    const rawTransaction = {
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: walletInfo.address,
      toAddress: otherAddress,
      quantity: 56793400000,
      timestamp: 1624118401
    }

    const result = convertTonTransaction(rawTransaction, walletInfo)

    expect(result?.movements[0].sum).toEqual(-56.79)
  })

  it('ignores transactions with amount < 0.01', () => {
    const rawTransaction = {
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: otherAddress,
      toAddress: walletInfo.address,
      quantity: 1000000, // 0.001 TON
      timestamp: 1624118401
    }

    const result = convertTonTransaction(rawTransaction, walletInfo)

    expect(result).toBe(null)
  })
})

describe('convertJettonTransfer', () => {
  const ourAddress = 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h3VWvcr'
  const jettonInfo = {
    address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4syjVB',
    jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE',
    jettonType: 'USDT',
    title: 'Any Jetton Name',
    owner: ourAddress,
    balance: 0,
    decimals: 6
  }
  const anotherJettonInfo = {
    address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm14sVVXcZ',
    jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028B1465EFCC3621VFR', // some random address
    jettonType: 'ANY',
    title: 'Another Jetton Name 2',
    owner: ourAddress,
    balance: 0,
    decimals: 6
  }
  const jettons = [jettonInfo, anotherJettonInfo]

  it('should correctly convert Jetton transfer', () => {
    const rawTransfer = {
      jettonAddress: jettonInfo.address,
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: otherAddress,
      toAddress: jettonInfo.address,
      quantity: 93426000,
      timestamp: 1624118402
    }
    const convertedTransfer = {
      hold: false,
      date: new Date(1624118402 * 1000),
      movements: [
        {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
          account: { id: jettonInfo.address },
          sum: 93.42,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: otherAddress,
        mcc: null,
        location: null
      },
      comment: null
    }
    expect(convertJettonTransfer(rawTransfer, jettons)).toEqual(convertedTransfer)
  })

  it('returns null if transfer does not belong to passed jettons', () => {
    const rawTransfer = {
      jettonAddress: 'some unknown jetton address',
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: otherAddress,
      toAddress: jettonInfo.address,
      quantity: 93400000,
      timestamp: 1624118402
    }

    expect(convertJettonTransfer(rawTransfer, jettons)).toBe(null)
  })

  it('skips transactions with amount < 0.01', () => {
    const rawTransfer = {
      jettonAddress: jettonInfo.address,
      transactionId: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm3h2sWVcQ',
      fromAddress: otherAddress,
      toAddress: jettonInfo.address,
      quantity: 1000, // 0.001 USDT
      timestamp: 1624118402
    }

    expect(convertJettonTransfer(rawTransfer, jettons)).toBe(null)
  })
})
