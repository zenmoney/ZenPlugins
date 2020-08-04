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
      /*
      account: '41001141885312',
      balance: 2522.08,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 2522.08, available: 2522.08 }
      */
    })).toEqual({
      id: '145769',
      type: 'checking',
      title: 'Счёт RUB',
      instrument: 'RUB',
      syncID: [
        '5312',
        '145769',
        '1001'
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
      /*
      account: '41001141885312',
      balance: 769.02,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 769.02, available: 769.02, hold: 3500 }
      */
    })).toEqual({
      id: '145770',
      type: 'checking',
      title: 'Счёт UZS',
      instrument: 'UZS',
      syncID: [
        '5312',
        '145770',
        '1001'
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
      /*
      account: '41001141885312',
      balance: 2522.08,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 2522.08, available: 2522.08 }
      */
    })).toEqual({
      id: '84492',
      type: 'checking',
      title: 'Кошелёк USD',
      instrument: 'USD',
      syncID: [
        '5312',
        '84492',
        '1001'
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
      /*
      account: '41001141885312',
      balance: 769.02,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 769.02, available: 769.02, hold: 3500 }
      */
    })).toEqual({
      id: '84493',
      type: 'checking',
      title: 'Кошелёк UZS',
      instrument: 'UZS',
      syncID: [
        '5312',
        '84493',
        '1001'
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
      /*
      account: '41001141885312',
      balance: 2522.08,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 2522.08, available: 2522.08 }

       */
    })).toEqual({
      id: '245395',
      type: 'ccard',
      title: 'VISA Electron(Tr)',
      instrument: 'USD',
      syncID: [
        '245395',
        '1434',
        '1901'
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
      /*
      account: '41001141885312',
      balance: 769.02,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 769.02, available: 769.02, hold: 3500 }

       */
    })).toEqual({
      id: '245394',
      type: 'ccard',
      title: 'UZCARD', // ??
      instrument: 'UZS',
      syncID: [
        '245394',
        '2185',
        '22618000499031231002'
      ],
      balance: 3305132.21
    })
  })
})
