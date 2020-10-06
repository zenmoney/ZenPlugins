/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
      {
        actor: 'CONSUMER',
        bonus: {
          bonuslessReason: 'OTHER',
          incomeExpectations: false
        },
        channel: 'POS',
        contractId: 9870000,
        counterpartyCode: 'DEPOSIT_BIC_044525555',
        date: 1465373434000,
        eventId: null,
        id: 81979970,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 200,
            currency: 'RUR'
          },
          amount: 200,
          amountDetail: {
            amount: 200,
            own: 200,
            commission: 0,
            credit: 0
          },
          currency: 'RUR',
          income: true
        },
        movements: [
          {
            amount: 200,
            currency: 'RUR',
            date: 1465373434000,
            id: '81979970#109122023',
            income: true,
            type: 'INCOME'
          }
        ],
        paymentDetail: {
          depositBankName: 'ПАО "ПРОМСВЯЗЬБАНК"',
          depositBankBic: '044525555'
        },
        status: 'DONE',
        subtitle: 'Проценты на остаток',
        title: 'Начисление процентов на остаток',
        type: 'DEPOSIT_PROC'
      },
      {
        date: new Date(1465373434000),
        movements: [
          {
            id: '81979970',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        comment: 'Начисление процентов на остаток ПАО "ПРОМСВЯЗЬБАНК"',
        hold: false,
        merchant: null
      }
    ]
  ])('converts deposit procents 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
