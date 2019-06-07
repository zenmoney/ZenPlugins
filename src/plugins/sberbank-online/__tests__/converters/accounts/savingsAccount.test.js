import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('returns valid account', () => {
    expect(convertAccount({
      id: '567930851',
      name: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      rate: '4.00',
      closeDate: '05.08.2018',
      smsName: '4892',
      number: '42305200715542994892',
      balance: { amount: '90467.72', currency: { code: 'RUB', name: 'руб.' } },
      availcash: { amount: '60467.72', currency: { code: 'RUB', name: 'руб.' } },
      state: 'OPENED',
      moneyBoxAvailable: 'true',
      arrested: 'false',
      showarrestdetail: 'false'
    }, {
      description: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      period: '0-0-181',
      open: '05.02.2018T00:00:00',
      close: '05.08.2018T00:00:00',
      interestRate: '4.00',
      maxSumWrite: { amount: '60467.72', currency: { code: 'RUB', name: 'руб.' } },
      passbook: 'false',
      crossAgency: 'true',
      prolongation: 'true',
      irreducibleAmt: { amount: '30000.00', currency: { code: 'RUB', name: 'руб.' } },
      name: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
      canChangePercentDestination: 'true',
      moneyBoxAvailable: 'true',
      maxBalance: '1740000.00'
    })).toEqual({
      products: [
        {
          id: '567930851',
          type: 'account',
          instrument: 'RUB'
        }
      ],
      zenAccount: {
        id: 'account:567930851',
        type: 'checking',
        title: 'Управляй ОнЛ@йн 6м - 1г (руб.)',
        instrument: 'RUB',
        balance: 90467.72,
        savings: true,
        syncID: [
          '42305200715542994892'
        ]
      }
    })
  })
})
