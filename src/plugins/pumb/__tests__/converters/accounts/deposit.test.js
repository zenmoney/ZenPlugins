import { convertAccounts } from '../../../converters'

describe('convertAccounts: deposits', () => {
  it('uses current application details to derive a stable active deposit', () => {
    const [link] = convertAccounts({
      accounts: [],
      deposits: [{
        id: 201,
        archived: false,
        displayName: 'Дохідний',
        agreementNumber: 'DP-201',
        interestIban: 'UA444444444444444444444444444',
        returnIban: 'UA555555555555555555555555555',
        maturityDate: '2027-08-11',
        termMonths: 12,
        currencyCode: 'USD',
        balance: 10000,
        interestRate: 250,
        capitalizationFlag: true,
        interestPaymentPeriod: 'M'
      }],
      loans: []
    })

    expect(link).toEqual({
      account: {
        id: 'deposit:201',
        type: 'deposit',
        title: 'Дохідний',
        instrument: 'USD',
        syncIds: [
          'DP-201',
          'UA444444444444444444444444444',
          'UA555555555555555555555555555',
          '201'
        ],
        balance: 100,
        startBalance: 100,
        capitalization: true,
        percent: 2.5,
        startDate: new Date('2026-08-10T21:00:00.000Z'),
        endDateOffsetInterval: 'year',
        endDateOffset: 1,
        payoffInterval: 'month',
        payoffStep: 1
      },
      fetchParams: { sources: [{ type: 'deposit', depositId: 201 }] }
    })
  })

  it('converts archived deposits instead of dropping them', () => {
    const [link] = convertAccounts({
      accounts: [],
      deposits: [{
        id: 202,
        archived: true,
        productName: 'Архівний вклад',
        agreementNumber: 'DP-202',
        openDate: '2024-01-10',
        maturityDate: '2025-01-10',
        currencyCode: 'UAH',
        lastBalance: 0,
        interestRate: 140
      }],
      loans: []
    })

    expect(link.account).toMatchObject({
      id: 'deposit:202',
      type: 'deposit',
      syncIds: ['DP-202'],
      balance: 0,
      startDate: new Date('2024-01-09T22:00:00.000Z'),
      endDateOffsetInterval: 'year',
      endDateOffset: 1,
      payoffInterval: null,
      archived: true
    })
  })

  it('keeps only the previous active-deposit ID when no natural identifier exists', () => {
    const [link] = convertAccounts({
      accounts: [],
      deposits: [{
        id: 203,
        archived: false,
        displayName: 'Вклад',
        maturityDate: '2027-08-11',
        termMonths: 12,
        currencyCode: 'UAH',
        balance: 10000,
        interestRate: 100,
        capitalizationFlag: true,
        interestPaymentPeriod: 'M'
      }],
      loans: []
    })

    expect(link.account.syncIds).toEqual(['203'])
  })
})
