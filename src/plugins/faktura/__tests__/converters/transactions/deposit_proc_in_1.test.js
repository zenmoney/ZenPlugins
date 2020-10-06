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
          incomeExpectations: false,
          bonuslessReason: 'OTHER',
          details: []
        },
        channel: 'POS',
        connector: 'в банке',
        contractId: 9870000,
        counterpartyCode: 'openbank',
        date: 1503392258000,
        eventId: null,
        id: 178195544,
        itemType: 'OPERATION',
        money: {
          amount: 200,
          accountAmount: {
            amount: 200,
            currency: 'RUR'
          },
          income: true,
          amountDetail: {
            amount: 200,
            commission: 0,
            credit: 0,
            own: 200

          },
          currency: 'RUR'
        },
        movements: [
          {
            amount: 200,
            currency: 'RUR',
            date: 1503392258000,
            id: '178195544#346568166',
            income: true,
            type: 'INCOME'
          }
        ],
        paymentDetail: {
          depositBankBic: '044525297',
          depositBankName: 'ФИЛИАЛ ЦЕНТРАЛЬНЫЙ ПАО БАНКА \'ФК ОТКРЫТИЕ\'',
          depositCapitalizedBegin: 1500742800000,
          depositCapitalizedEnd: 1503248400000
        },
        status: 'DONE',
        title: 'ФИЛИАЛ ЦЕНТРАЛЬНЫЙ ПАО БАНКА \'ФК ОТКРЫТИЕ\'',
        type: 'DEPOSIT_PROC',
        typeName: 'Начисление процентов на остаток'
      },
      {
        date: new Date(1503392258000),
        movements: [
          {
            id: '178195544',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        comment: 'Начисление процентов на остаток ФИЛИАЛ ЦЕНТРАЛЬНЫЙ ПАО БАНКА \'ФК ОТКРЫТИЕ\'',
        hold: false,
        merchant: null
      }
    ]
  ])('converts deposit procents', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
