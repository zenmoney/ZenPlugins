import { converter } from '../../../converters/transaction'

describe('transaction converter', () => {
  it.each([
    [
      {
        date: 1630306371000,
        itemType: 'OPERATION',
        authCode: '962556',
        bonus:
          {
            bonuslessReason: 'MCC',
            incomeExpectations: false,
            details: []
          },
        channel: 'POS',
        description: 'PMR*FIRSTVDS.RU, MOSKVA, 58 KASHIRSKOYE SH',
        movements:
          [
            {
              date: 1630306371000,
              income: false,
              amount: 1,
              currency: 'RUR',
              id: '567487662#1082058096',
              type: 'AUTHORIZATION_HOLD'
            },
            {
              date: 1630306372000,
              income: true,
              amount: 1,
              currency: 'RUR',
              id: '567487662#1082058095',
              type: 'CANCEL_HOLD'
            }
          ],
        title: 'PMR*FIRSTVDS.RU',
        mcc:
          {
            code: '4899',
            groupDescription: 'Коммунальные услуги',
            description: 'Кабельные и другие ТВ услуги',
            groupCode: 'housing'
          },
        type: 'PURCHASE',
        actor: 'CONSUMER',
        money:
          {
            income: false,
            amount: 0,
            amountDetail:
              {
                amount: 0,
                acquirerCommission: 0,
                own: 0,
                commission: 0,
                credit: 0
              },
            currency: 'RUR',
            accountAmount: { amount: 0, currency: 'RUR' }
          },
        contractId: 5165510,
        id: 567487662,
        status: 'HOLD_CANCELED'
      },
      null
    ]
  ])('skips transaction with empty or zero operationAmount', (apiTransaction, transaction) => {
    expect(converter(apiTransaction, { 9870000: 'c-1230000' })).toEqual(transaction)
  })
})
