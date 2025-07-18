import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '30144414960030270',
          type: 'account',
          info:
            {
              title: 'USD',
              number: 'BY43 ALFA 3014 4414 9600 3027 0000',
              amount: { amount: 1700, currIso: 'USD' }
            }
        },
        {
          id: '30144414960080270',
          type: 'account',
          info:
            {
              title: 'как всегда',
              number: 'BY65 ALFA 3014 4414 9600 8027 0000',
              amount: { amount: 0, currIso: 'BYN' }
            }
        },
        {
          id: '30144414960090270',
          type: 'account',
          info:
            {
              title: 'BYN',
              number: 'BY50 ALFA 3014 4414 9600 9027 0000',
              amount: { amount: 2.69, currIso: 'BYN' }
            }
        },
        {
          id: '30144414960030270',
          type: 'card',
          info:
            {
              title: 'Mastercard Smart Gold',
              number: '5***5397',
              amount: { amount: 1700, currIso: 'USD' }
            }
        },
        {
          id: '30144414960090270',
          type: 'card',
          info:
            {
              title: 'Mastercard Standard',
              number: '5***5064',
              amount: { amount: 2.69, currIso: 'BYN' }
            }
        },
        {
          id: '30144414960090270',
          type: 'card',
          info:
            {
              title: 'Visa Smart Gold',
              number: '4***1507',
              amount: { amount: 2.69, currIso: 'BYN' }
            }
        },
        {
          id: '30144414960030270',
          type: 'card',
          info:
            {
              title: 'Mastercard Standard',
              number: '5***8804',
              amount: { amount: 1700, currIso: 'USD' }
            }
        },
        {
          id: '30144414960090270',
          type: 'card',
          info:
            {
              title: 'Visa Classic',
              number: '4***7205',
              amount: { amount: 2.69, currIso: 'BYN' }
            }
        }
      ],
      [
        {
          mainProduct: {
            id: '30144414960030270',
            type: 'account'
          },
          products: [],
          account: {
            id: '30144414960030270',
            type: 'ccard',
            title: 'USD',
            instrument: 'USD',
            syncID: [
              'BY43ALFA30144414960030270000',
              '5***5397',
              '5***8804'
            ],
            balance: 1700
          }
        },
        {
          mainProduct: {
            id: '30144414960080270',
            type: 'account'
          },
          products: [],
          account: {
            id: '30144414960080270',
            type: 'checking',
            title: 'как всегда',
            instrument: 'BYN',
            syncID: [
              'BY65ALFA30144414960080270000'
            ],
            balance: 0
          }
        },
        {
          mainProduct: {
            id: '30144414960090270',
            type: 'account'
          },
          products: [],
          account: {
            id: '30144414960090270',
            type: 'ccard',
            title: 'BYN',
            instrument: 'BYN',
            syncID: [
              'BY50ALFA30144414960090270000',
              '5***5064',
              '4***1507',
              '4***7205'
            ],
            balance: 2.69
          }
        }
      ]
    ]
  ])('converts card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
