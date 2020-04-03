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
          bonuslessReason: 'OTHER',
          details: []
        },
        cardId: 1230000,
        channel: 'WEB',
        connector: 'по шаблону',
        contractId: 9870000,
        date: 1500274313000,
        eventId: null,
        id: 169516833,
        itemType: 'OPERATION',
        money: {
          accountAmount: {
            amount: 300,
            currency: 'RUR'
          },
          amount: 300,
          amountDetail: {
            amount: 300,
            own: 300,
            credit: 0,
            commission: 0
          },
          currency: 'RUR',
          income: false
        },
        movements: [
          {
            amount: 300,
            contractId: 9870000,
            currency: 'RUR',
            date: 1500274313000,
            id: '169516833#250163427',
            income: false,
            type: 'AUTHORIZATION_HOLD'
          },
          {
            amount: 300,
            currency: 'RUR',
            date: 1500276849000,
            id: '169516833#324662614',
            income: false,
            type: 'WITHDRAW'
          }
        ],
        payReceipt: {
          previewAvailable: false
        },
        payTemplate: {
          id: '165025009',
          name: 'Tinkoff Black',
          code: 'PAY_TEMPLATE165025009',
          accepted: true,
          repeatable: true
        },
        paymentDetail: {
          payee: 'Петров Иван Иванович',
          payeeAccount: '40817810800000500000',
          payeeBankBic: '044525974',
          payeeBankName: 'АО "ТИНЬКОФФ БАНК"',
          purposePayment: 'Перевод средств по договору № 5007770000 Петров Иван Иванович НДС не облагается'
        },
        serviceCode: 'FDTOWN',
        status: '0#DONE',
        title: 'Tinkoff Black',
        type: 'FDT_RBS_COMMISSION',
        typeName: 'Перевод на счет'
      },
      {
        9870000: 'c-1230000'
      }
    )

    expect(transaction).toEqual(Object.assign({}, entity(), {
      id: '169516833',
      date: 1500274313000,
      income: 300,
      outcome: 300,
      incomeAccount: 'checking#RUB',
      outcomeAccount: 'c-1230000',
      comment: [
        'Перевод на счет: АО "ТИНЬКОФФ БАНК"',
        'Получатель: Петров Иван Иванович'
      ].join('\n')
    }))
  })
})
