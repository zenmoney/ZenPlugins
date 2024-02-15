import {
  convertDeposit
} from '../../converters'

describe('convertDeposit', () => {
  it('converts deposit USD', () => {
    expect(convertDeposit({
      ownerName: 'NAME SURNAME',
      state: 'ACTIVE',
      currency: {
        name: 'UZS',
        scale: 2
      },
      accrual: 747945,
      intRepayAcc: '20206000000000002001',
      depRepayAcc: '20206000000000002001',
      nextIntAmount: 747945,
      mobile: true,
      private: true,
      isPrivate: true,
      id: 37646,
      account: '20206000000000002001',
      bankName: 'АКБ \'Капиталбанк\'',
      balance: 1300000000,
      visible: false,
      absId: '18580180',
      safeMode: 'NONE',
      mfo: '01158',
      name: 'Проценты каждый день на счет',
      rate: '21.0',
      openDate: 1691521200000,
      closeDate: 1757358000000,
      depositType: '164',
      incAllowed: true,
      decAllowed: true,
      earlyClosure: true,
      minAmount: 1000000000,
      KapitalOnline: true,
      depositMessage: '',
      imageUrl: 'https://online.kapitalbank.uz/static/deposit-type/uzs.png',
      details: 'STANDARD'
    })).toEqual({
      id: '18580180',
      type: 'deposit',
      title: 'Депозит Проценты каждый день на счет',
      instrument: 'UZS',
      syncIds: [
        '18580180'
      ],
      balance: 13000000.00,
      percent: 21,
      capitalization: false,
      endDateOffset: 25,
      endDateOffsetInterval: 'month',
      payoffInterval: null,
      payoffStep: 0,
      startDate: new Date('2023-08-08T19:00:00.000Z')
    })
  })
})
