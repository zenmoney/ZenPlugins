/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'

describe('transaction converter PURCHASE', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        actor: 'CONSUMER',
        bonus: {
          incomeExpectations: true
        },
        channel: 'POS',
        contractId: 9870000,
        counterpartyCode: 'megafon',
        date: 1487711656000,
        description: 'Megafon, Moscow',
        eventId: null,
        id: 138487133,
        itemType: 'OPERATION',
        mcc: {
          description: 'Телекоммуникационные услуги',
          code: '4814'
        },
        money: {
          amount: 100,
          accountAmount: {
            amount: 100,
            currency: 'RUR'
          },
          income: false,
          amountDetail: {
            amount: 100,
            own: 100,
            credit: 0,
            commission: 0,
            acquirerCommission: 0
          },
          currency: 'RUR'
        },
        movements: [
          {
            amount: 100,
            currency: 'RUR',
            date: 1487711656000,
            id: '138487133#174293117',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 100,
            currency: 'RUR',
            date: 1487919798000,
            id: '138487133#241666297',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        status: 'DONE',
        title: 'Мегафон',
        type: 'PURCHASE'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual({
      date: new Date(1487711656000),
      movements: [
        {
          id: '138487133',
          account: { id: 'c-1230000' },
          invoice: null,
          sum: -100,
          fee: 0
        }
      ],
      hold: false,
      merchant: {
        country: null,
        city: 'Moscow',
        title: 'Мегафон',
        mcc: 4814,
        location: null
      },
      comment: null
    })
  })
})
