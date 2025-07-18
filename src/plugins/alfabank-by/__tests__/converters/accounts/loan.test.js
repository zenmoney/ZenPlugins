import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '3014301YB50050270',
          type: 'account',
          info:
            {
              title: 'Текущий счет',
              number: 'BY57 ALFA 3014 301Y B500 5027 0000',
              amount: { amount: 0, currIso: 'BYN' }
            }
        },
        {
          id: '3014301YB5005',
          type: 'credit',
          info:
            {
              title: 'Рассрочка телефон',
              number: '3014301YB50052701',
              amount: { amount: 0, currIso: 'BYN' }
            }
        }
      ],
      [
        {
          mainProduct: null,
          products: [
            {
              id: '3014301YB50050270',
              type: 'account'
            }
          ],
          account: {
            id: '3014301YB50050270',
            type: 'checking',
            title: 'Рассрочка телефон',
            instrument: 'BYN',
            syncID: [
              'BY57ALFA3014301YB50050270000',
              '3014301YB50052701'
            ],
            balance: 0
          }
        }
      ]
    ],
    [
      [
        {
          id: '30143005XI0060270',
          type: 'account',
          info:
            {
              title: 'Счет рассрочки покупки частями',
              number: 'BY85 ALFA 3014 3005 XI00 6027 0000',
              amount: { amount: 0, currIso: 'BYN' }
            }
        },
        {
          id: '30143005XI006',
          type: 'credit',
          info:
            {
              title: 'Покупка частями',
              number: 'Доступный лимит',
              amount: { amount: 0, currIso: 'BYN' }
            }
        }
      ],
      [
        {
          mainProduct: null,
          products: [
            {
              id: '30143005XI0060270',
              type: 'account'
            }
          ],
          account: {
            id: '30143005XI0060270',
            type: 'checking',
            title: 'Покупка частями',
            instrument: 'BYN',
            syncID: [
              'BY85ALFA30143005XI0060270000',
              '30143005006'
            ],
            balance: 0
          }
        }
      ]
    ]
  ])('converts loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
