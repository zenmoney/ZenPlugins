/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/transaction'
import { entity } from '../../../zenmoney_entity/transaction'

describe('transaction converter', () => {
  it('should return zenmoney transaction object', () => {
    const transaction = converter(
      {
        actor: 'CONSUMER',
        bonus: {
          incomeExpectations: false,
          bonuslessReason: 'OTHER'
        },
        cardId: 1230000,
        channel: 'WEB',
        connector: 'на имя',
        contractId: 1141426,
        date: 1487138070000,
        eventId: null,
        id: 137032162,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 20,
            currency: 'USD'
          },
          amount: 20,
          amountDetail: {
            amount: 20,
            own: 20,
            credit: 0,
            commission: 0
          },
          currency: 'USD',
          income: false
        },
        movements: [
          {
            amount: 20,
            currency: 'USD',
            date: 1487138070000,
            id: '137032162#170897529',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 20,
            currency: 'USD',
            date: 1487138077000,
            id: '137032162#236000724',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        paymentDetail: {
          transferKey: '648543240',
          transferStatus: 'DONE',
          city: 'Россия, Санкт-Петербург, coreWalletId: 88000'
        },
        serviceCode: 'DP2Wallet',
        status: '0#DONE',
        title: 'Петров Иван Иванович',
        type: 'ZKDP',
        typeName: 'Перевод «Золотая Корона»',
        walletId: 88410
      },
      {}
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '137032162',
      date: 1487138070000,
      income: 20,
      outcome: 20,
      incomeAccount: 'cash#USD',
      outcomeAccount: 'w-88410',
      comment: [
        'Перевод «Золотая Корона»: Петров Иван Иванович',
        'Код: 648543240'
      ].join('\n')
    }))
  })
})
