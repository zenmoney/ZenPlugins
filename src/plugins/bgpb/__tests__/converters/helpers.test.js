import { transactionsUnique } from '../../converters'

describe('transactionsUnique', () => {
  it('should return one element', () => {
    const arr = transactionsUnique([
      {
        'comment': null,
        'date': new Date('2019-01-02T19:02:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'DOUGLAS',
          'country': 'GB',
          'location': null,
          'mcc': 1200,
          'title': 'SHOP'
        },
        'movements':
        [
          {
            'account': {
              'id': '11161311-117d11'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'EUR',
              'sum': -250
            },
            'sum': -300
          }
        ]
      },
      {
        'comment': null,
        'date': new Date('2019-01-02T19:02:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'DOUGLAS',
          'country': 'GB',
          'location': null,
          'mcc': 1200,
          'title': 'SHOP'
        },
        'movements':
        [
          {
            'account': {
              'id': '11161311-117d11'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'EUR',
              'sum': -250
            },
            'sum': -300
          }
        ]
      }
    ])

    expect(arr).toEqual([
      {
        'comment': null,
        'date': new Date('2019-01-02T19:02:00.000Z'),
        'hold': false,
        'merchant': {
          'city': 'DOUGLAS',
          'country': 'GB',
          'location': null,
          'mcc': 1200,
          'title': 'SHOP'
        },
        'movements':
        [
          {
            'account': {
              'id': '11161311-117d11'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'EUR',
              'sum': -250
            },
            'sum': -300
          }
        ]
      }
    ])
  })
})
