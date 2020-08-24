import {
  convertWallet
} from '../../converters'

describe('convertWallet', () => {
  it('converts wallet USD', () => {
    expect(convertWallet({
      account: '22616840199031231001',
      id: 84492,
      state: 'ACTIVE',
      balance: 252208,
      currency: { name: 'USD', scale: 2 },
      walletId: 'USD-99031231-0001'
    })).toEqual({
      id: '84492',
      type: 'checking',
      title: 'Кошелёк USD',
      instrument: 'USD',
      syncID: [
        '22616840199031231001'
      ],
      balance: 2522.08
    })
  })
  it('converts wallet UZS', () => {
    expect(convertWallet({
      id: 84493,
      account: '22616000499031231001',
      state: 'ACTIVE',
      balance: 426902,
      currency: { name: 'UZS', scale: 2 },
      walletId: 'UZS-99031231-0001'
    })).toEqual({
      id: '84493',
      type: 'checking',
      title: 'Кошелёк UZS',
      instrument: 'UZS',
      syncID: [
        '22616000499031231001'
      ],
      balance: 4269.02
    })
  })
})
