import { convertAccounts } from '../../../converters'

describe('convertAccounts: loans', () => {
  it('converts active, refunded and written-off loans without silent omissions', () => {
    const links = convertAccounts({
      accounts: [],
      deposits: [],
      loans: [{
        __typename: 'ActiveLoanInfo',
        loanId: 301,
        productName: 'Кредит готівкою',
        agreementNumber: 'LN-301',
        transitIban: 'UA666666666666666666666666666',
        agreementAmount: 500000,
        currencyCode: 'UAH',
        openDate: '2026-01-10',
        closeDate: '2027-01-10',
        totalPaymentAmount: 420000,
        nextPaymentDate: '2026-09-10',
        loanStatus: 'ACTIVE',
        actualCloseDate: null,
        isRefunded: false
      }, {
        __typename: 'ActiveLoanInfo',
        loanId: 302,
        productName: 'Повернений кредит',
        agreementNumber: 'LN-302',
        agreementAmount: 100000,
        currencyCode: 'UAH',
        openDate: '2025-01-10',
        closeDate: '2026-01-10',
        totalPaymentAmount: 0,
        actualCloseDate: '2025-12-01',
        isRefunded: true
      }, {
        __typename: 'WrittenOffLoanInfo',
        writtenOffLoanId: 9001,
        loanId: 303,
        productName: 'Списаний кредит',
        agreementNumber: 'LN-303',
        agreementAmount: 200000,
        currencyCode: 'UAH',
        openDate: '2024-01-10',
        closeDate: '2025-01-10',
        totalPaymentAmount: 150000,
        linkedAccountInfo: { iban: 'UA777777777777777777777777777', number: '26207777777777' },
        loanStatus: 'WRITTEN_OFF'
      }]
    })

    expect(links).toHaveLength(3)
    expect(links[0]).toEqual({
      account: expect.objectContaining({
        id: 'loan:301',
        type: 'loan',
        syncIds: ['LN-301', 'UA666666666666666666666666666', '301'],
        balance: -4200,
        startBalance: 5000,
        payoffInterval: 'month'
      }),
      fetchParams: { sources: [{ type: 'loan', loanId: 301 }] }
    })
    expect(links[1].account).toMatchObject({ id: 'loan:302', archived: true, balance: 0, payoffInterval: null })
    expect(links[2].account).toMatchObject({
      id: 'loan:303',
      archived: true,
      syncIds: ['LN-303', 'UA777777777777777777777777777', '26207777777777'],
      balance: -1500
    })
  })
})
