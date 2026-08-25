import { convertAccounts } from '../../converters'

function money (sum, currency) {
  return { sum, currency }
}

describe('convertAccounts for UKRSIB online 2.0', () => {
  it('correlates the full product graph and chooses unique stable syncIds', () => {
    const plans = convertAccounts({
      accounts: [
        {
          id: 'account-1',
          type: 'CARD_ACCOUNT',
          alias: 'Основна картка',
          iban: 'UA00 0000 0000 0000 0000 0000 001',
          number: 'shared-number',
          balance: money(-250, 'UAH'),
          totalAvailableAmount: money(750, 'UAH'),
          overdraft: { overdraftLimit: money(1000, 'UAH') }
        },
        {
          id: 'account-2',
          type: 'SAVINGS_ACCOUNT',
          name: 'Заощадження',
          iban: 'UA00 0000 0000 0000 0000 0000 001',
          number: 'shared-number',
          balance: money(5000, 'UAH')
        },
        {
          id: 'loan-1',
          type: 'LOAN2',
          name: 'Duplicate loan shell',
          number: 'duplicate-shell',
          balance: money(0, 'UAH')
        }
      ],
      cards: [{ id: 'card-1', accountId: 'account-1', pan: '5351 ****** 8896', status: 'ACTIVE' }],
      deposits: [{
        id: 'deposit-1',
        alias: 'Мій депозит',
        currency: 'USD',
        balance: money(1200, 'USD'),
        rate: 4.5,
        period: 365,
        openDate: 1751328000000,
        closeDate: 1782864000000,
        chargingType: 'DEPOSIT'
      }],
      loans: [{
        id: 'loan-1',
        name: 'Кредит готівкою',
        currency: 'UAH',
        amount: money(10000, 'UAH'),
        debtDetails: { amount: money(7200, 'UAH') },
        rate: 18,
        isInstallment: true,
        startDate: 1751328000000,
        endDate: 1782864000000
      }]
    })

    expect(plans).toHaveLength(4)
    expect(plans[0]).toEqual({
      account: {
        id: 'account-1',
        type: 'ccard',
        title: 'Основна картка',
        instrument: 'UAH',
        syncIds: ['5351******8896'],
        balance: -250,
        creditLimit: 1000,
        available: 750,
        savings: false,
        archived: false
      },
      fetchParams: { productIds: ['account-1'], cardIds: ['card-1'] }
    })
    expect(plans[1].account).toMatchObject({
      id: 'account-2',
      type: 'checking',
      savings: true,
      syncIds: ['ACCOUNT-2'],
      balance: 5000
    })
    expect(plans[2].account).toMatchObject({
      id: 'deposit-1',
      type: 'deposit',
      syncIds: ['DEPOSIT-1'],
      balance: 1200,
      capitalization: true,
      percent: 4.5
    })
    expect(plans[3].account).toMatchObject({
      id: 'loan-1',
      type: 'loan',
      syncIds: ['LOAN-1'],
      balance: -7200,
      startBalance: 10000,
      capitalization: true,
      percent: 18
    })
    expect(plans.flatMap(plan => plan.account.syncIds)).toHaveLength(4)
  })

  it('qualifies colliding technical identifiers with the product kind', () => {
    const plans = convertAccounts({
      accounts: [],
      cards: [],
      deposits: [{
        id: 'same-id',
        currency: 'UAH',
        balance: money(1, 'UAH'),
        openDate: 1751328000000,
        period: 30,
        chargingType: 'ACCOUNT'
      }],
      loans: [{
        id: 'same-id',
        currency: 'UAH',
        amount: money(10, 'UAH'),
        startDate: 1751328000000,
        endDate: 1753920000000
      }]
    })

    expect(plans.map(plan => plan.account.syncIds)).toEqual([
      ['DEPOSIT:SAME-ID'],
      ['LOAN:SAME-ID']
    ])
  })
})
