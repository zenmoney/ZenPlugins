import {
  convertAccount
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
      syncIds: [
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
      syncIds: [
        '20206000099031231001'
      ],
      balance: 459.57
    })
  })
})
