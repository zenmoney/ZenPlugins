import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts account-1', () => {
    expect(convertAccount({
      accountNumber: '40702810610000000179',
      status: 'NORM',
      name: 'Мой счет',
      currency: '643',
      balance: {
        otb: 54202.31,
        authorized: 9952.48,
        pendingPayments: 0,
        pendingRequisitions: 0
      }
    })).toEqual({
      id: '40702810610000000179',
      type: 'checking',
      title: 'Мой счет',
      instrument: 'RUB',
      available: 64154.79,
      syncID: ['40702810610000000179']
    })
  })

  it('converts account-2', () => {
    expect(convertAccount({
      accountNumber: '40802810000001951957',
      name: 'Рублевый счет',
      status: 'NORM',
      tariffName: 'Тарифный план "Простой" RUB',
      tariffCode: 'TFLE1.1',
      currency: '643',
      createdOn: '2021-03-30',
      mainFlag: 'Y',
      bankBik: '044525974',
      accountType: 'Current',
      activationDate: '2021-03-30',
      balance: {
        balance: 60462.94,
        realOtb: 60462.94,
        otb: 135462.94,
        authorized: 0,
        pendingPayments: 0,
        pendingRequisitions: 0
      }
    })).toEqual({
      id: '40802810000001951957',
      type: 'checking',
      title: 'Рублевый счет',
      instrument: 'RUB',
      balance: 60462.94,
      creditLimit: 75000,
      syncID: ['40802810000001951957']
    })
  })
})
