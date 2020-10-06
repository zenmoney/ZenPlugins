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
          bonuslessReason: 'OTHER'
        },
        cardId: 1230000,
        channel: 'WEB',
        connector: 'получателю',
        contractId: 9870000,
        date: 1486040511000,
        eventId: null,
        id: 134621218,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 100,
            currency: 'RUR'
          },
          amount: 100,
          amountDetail: {
            amount: 100,
            own: 100,
            credit: 0,
            commission: 0
          },
          currency: 'RUR',
          income: false
        },
        movements: [
          {
            amount: 100,
            currency: 'RUR',
            date: 1486040511000,
            id: '134621218#165328714',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 100,
            currency: 'RUR',
            date: 1486040522000,
            id: '134621218#228921838',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        payReceipt: {
          previewAvailable: false
        },
        serviceCode: 'FDTOWN',
        status: '0#DONE',
        title: 'Петров Иван Иванович',
        type: 'FDT_RBS_COMMISSION',
        typeName: 'Перевод на счет'
      },
      {
        date: new Date(1486040511000),
        movements: [
          {
            id: '134621218',
            account: { id: 'c-1230000' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'Петров Иван Иванович',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome outer transfer 2', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
