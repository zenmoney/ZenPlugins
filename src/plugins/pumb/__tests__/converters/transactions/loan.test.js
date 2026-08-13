import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { convertTransaction } from '../../../converters'

const loanLink = {
  account: {
    id: 'loan:301',
    type: 'loan',
    title: 'Кредит готівкою',
    instrument: 'UAH',
    syncIds: ['LN-301'],
    balance: -500,
    startBalance: 1000,
    capitalization: true,
    percent: null,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDateOffsetInterval: 'year',
    endDateOffset: 1,
    payoffInterval: 'month',
    payoffStep: 1
  },
  fetchParams: { sources: [{ type: 'loan', loanId: 301 }] }
}

const cardLink = {
  account: {
    id: 'account:101',
    type: 'ccard',
    title: '*1111',
    instrument: 'UAH',
    syncIds: ['UA111'],
    balance: 500
  },
  fetchParams: { sources: [{ type: 'account', accountIds: [101] }] }
}

describe('convertTransaction: loan operations', () => {
  it('converts repaid installments and groups them with their account-side payment', () => {
    const loanPayment = convertTransaction({
      type: 'loan',
      loanId: 301,
      data: {
        isRepaid: true,
        operationDate: '2026-08-11',
        termPeriodFrom: '2026-07-11',
        termPeriodTo: '2026-08-11',
        paymentAmount: 5000,
        dueAmount: 3500,
        interestAmount: 1000,
        commissionAmount: 500,
        overdueAmount: 0,
        penaltyAmount: 0
      }
    }, loanLink)
    const cardPayment = convertTransaction({
      type: 'account',
      data: {
        account_id: 101,
        source_system_ref: 'account-payment-ref',
        order_date: '11.08.2026T09:00:00.000Z',
        transaction_type: 'OUT',
        description: 'Погашення кредиту',
        transaction_amount: { value: 5000, currency_code: 'UAH' },
        transaction_details: {
          transaction_date: '11.08.2026T12:00:00',
          account_amount: { value: 5000, currency_code: 'UAH' }
        }
      }
    }, cardLink)

    expect(loanPayment).toEqual({
      hold: false,
      date: new Date('2026-08-10T21:00:00.000Z'),
      movements: [{
        id: '301:2026-08-11:2026-07-11:2026-08-11:5000',
        account: { id: 'loan:301' },
        invoice: null,
        sum: 50,
        fee: 0
      }],
      merchant: null,
      comment: null,
      groupKeys: [null, '2026-08-11_UAH_50']
    })
    expect(cardPayment.groupKeys).toEqual(['account-payment-ref', '2026-08-11_UAH_50'])
    expect(adjustTransactions({ transactions: [cardPayment, loanPayment] })).toEqual([{
      movements: [cardPayment.movements[0], loanPayment.movements[0]],
      date: loanPayment.date,
      hold: false,
      merchant: null,
      comment: null
    }])
  })

  it('does not import future schedule rows as transactions', () => {
    expect(convertTransaction({
      type: 'loan',
      loanId: 301,
      data: {
        isRepaid: false,
        operationDate: '2026-09-11',
        paymentAmount: 5000
      }
    }, loanLink)).toBeNull()
  })
})
