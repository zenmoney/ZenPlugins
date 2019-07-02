import { convertWallets } from '../../../converters'
import * as data from './_data'

describe('convertWallets', () => {
  it('convert wallets', () => {
    expect(convertWallets(data.apiWallets)).toEqual([
      {
        id: '000-123456-USD',
        title: 'EWallet 000-123456 (USD)',
        type: 'checking',
        instrument: 'USD',
        balance: 500,
        startBalance: 0,
        creditLimit: 0,
        company: null,
        syncID: [ '000-123456-USD' ]
      },
      { id: '000-123456-EUR',
        title: 'EWallet 000-123456 (EUR)',
        type: 'checking',
        instrument: 'EUR',
        balance: 0,
        startBalance: 0,
        creditLimit: 0,
        company: null,
        syncID: [ '000-123456-EUR' ]
      },
      { id: '000-123456-RUB',
        title: 'EWallet 000-123456 (RUB)',
        type: 'checking',
        instrument: 'RUB',
        balance: 0,
        startBalance: 0,
        creditLimit: 0,
        company: null,
        syncID: [ '000-123456-RUB' ]
      }
    ])
  })
})
