import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '30147106190010270',
          type: 'account',
          info:
            {
              title: 'Дополнительный счет',
              number: 'BY96 ALFA 3014 7106 1900 1027 0000',
              amount: { amount: 3123.18, currIso: 'BYN' }
            }
        },
        {
          id: '30147106190020270',
          type: 'account',
          info:
            {
              title: 'Счет рассрочки красной карты',
              number: 'BY81 ALFA 3014 7106 1900 2027 0000',
              amount: { amount: 0, currIso: 'BYN' }
            }
        },
        {
          id: '30147106190010270',
          type: 'card',
          info:
            {
              title: 'Visa Rewards',
              number: '4***6687',
              amount: { amount: 3123.18, currIso: 'BYN' }
            }
        },
        {
          id: '3014710619001',
          type: 'credit',
          info:
            {
              title: 'Красная карта, кредитная карта',
              number: '30147106190012701',
              amount: { amount: 3123.18, currIso: 'BYN' }
            }
        },
        {
          id: '3014710619002',
          type: 'credit',
          info:
            {
              title: 'Красная карта, рассрочка',
              number: '30147106190022701',
              amount: { amount: 0, currIso: 'BYN' }
            }
        }
      ],
      [
        {
          mainProduct: null,
          products: [
            {
              id: '30147106190010270',
              type: 'account'
            },
            {
              id: '30147106190020270',
              type: 'account'
            }
          ],
          account: {
            id: '30147106190010270',
            type: 'ccard',
            title: 'Красная карта, кредитная карта',
            instrument: 'BYN',
            syncID: [
              'BY96ALFA30147106190010270000',
              '4***6687',
              'BY81ALFA30147106190020270000'
            ],
            available: 3123.18
          }
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
