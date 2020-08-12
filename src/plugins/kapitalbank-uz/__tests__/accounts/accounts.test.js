import {
  convertAccount,
  convertWallet,
  convertCard
} from '../../converters'

describe('convertAccount', () => {
  it('converts account RUB', () => {
    expect(convertAccount({
      id: 145769,
      state: 'ACTIVE',
      account: '20206643099031231001',
      balance: 252208,
      currency: { name: 'RUB', scale: 2 },
      absId: '2519691'
    })).toEqual({
      id: '145769',
      type: 'checking',
      title: 'Счёт RUB',
      instrument: 'RUB',
      syncID: [
        '20206643099031231001'
      ],
      balance: 2522.08
    })
  })
  it('converts account UZS', () => {
    expect(convertAccount({
      id: 145770,
      account: '20206000099031231001',
      state: 'ACTIVE',
      balance: 45957,
      currency: { name: 'UZS', scale: 2 },
      absId: '3291536'
    })).toEqual({
      id: '145770',
      type: 'checking',
      title: 'Счёт UZS',
      instrument: 'UZS',
      syncID: [
        '20206000099031231001'
      ],
      balance: 459.57
    })
  })
})

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

describe('convertAccount', () => {
  it('converts account VISA', () => {
    expect(convertCard({
      id: 245395,
      account: '22618840799031231901',
      title: 'VISA Electron(Tr)',
      state: 'ACTIVE',
      pan: '427833******1434',
      currency: { name: 'USD', scale: 2 },
      type: 'VISA',
      balance: 1500
    })).toEqual({
      id: '245395',
      type: 'ccard',
      title: 'VISA Electron(Tr)',
      instrument: 'USD',
      syncID: [
        '427833******1434',
        '22618840799031231901'
      ],
      balance: 15.00
    })
  })
  it('converts account UZCARD', () => {
    expect(convertCard({
      id: 245394,
      account: '22618000499031231002',
      state: 'ACTIVE',
      pan: '860049******2185',
      currency: { name: 'UZS', scale: 2 },
      type: 'UZCARD',
      balance: 330513221
    })).toEqual({
      id: '245394',
      type: 'ccard',
      title: undefined, // 'UZCARD', // Нужно ли добавить 'UZCARD' вместо undefined ???
      instrument: 'UZS',
      syncID: [
        '860049******2185',
        '22618000499031231002'
      ],
      balance: 3305132.21
    })
  })
})
