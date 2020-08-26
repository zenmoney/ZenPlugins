import {
  convertWallet
} from '../../converters'

describe('convertWallet', () => {
  it('converts wallet USD', () => {
    expect(convertWallet({
      ownerName: 'IVAN IVANOV',
      state: 'ACTIVE',
      currency: { name: 'USD', scale: 2 },
      walletId: 'USD-99031231-0001',
      private: true,
      isPrivate: true,
      id: 84492,
      account: '22616840199031231001',
      bankName: 'АКБ "Капиталбанк"',
      balance: 252208,
      visible: true,
      absId: null,
      safeMode: 'NONE',
      mfo: '01158'
    })).toEqual({
      id: '84492',
      type: 'checking',
      title: 'Кошелёк USD',
      instrument: 'USD',
      syncIds: [
        '22616840199031231001'
      ],
      balance: 2522.08
    })
  })
  it('converts wallet UZS', () => {
    expect(convertWallet({
      ownerName: 'NIKOLAY NIKOLAEV',
      state: 'ACTIVE',
      currency: { name: 'UZS', scale: 2 },
      walletId: 'UZS-99031231-0001',
      private: true,
      isPrivate: true,
      id: 84493,
      account: '22616000499031231001',
      bankName: 'АКБ "Капиталбанк"',
      balance: 426902,
      visible: true,
      absId: null,
      safeMode: 'NONE',
      mfo: '01158'
    })).toEqual({
      id: '84493',
      type: 'checking',
      title: 'Кошелёк UZS',
      instrument: 'UZS',
      syncIds: [
        '22616000499031231001'
      ],
      balance: 4269.02
    })
  })
})
