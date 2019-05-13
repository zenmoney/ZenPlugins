import { convertAccount, addAccountInfo } from '../../converters'

describe('convertAccount', () => {
  let tt = [
    {
      name: 'bad account',
      json: {
        objectType: 'Other'
      },
      expectedAccount: null
    },
    {
      name: 'normal account',
      json: {
        'id': '6505111',
        'info': {
          'description': 'BY31 ALFA 3014 111M RT00 1111 0000',
          'title': 'Карта №1',
          'amount': {
            'format': '###,###,###,###,##0.##',
            'currency': 'BYN',
            'amount': 486.18
          },
          'icon': {
            'title': 'Карта №1',
            'backgroundColorFrom': '#f9589e',
            'backgroundColorTo': '#fe9199',
            'iconUrl': 'v0/Image/49923_392.SVG',
            'captionColor': '#FFFFFF',
            'frameColor': '#c2b7b7',
            'displayType': 'REGULAR'
          }
        },
        'onDesktop': true,
        'type': 'ACCOUNT'
      },
      expectedAccount: {
        id: '6505111',
        type: 'card',
        title: 'Карта №1',
        balance: 486.18,
        instrument: 'BYN',
        syncID: ['BY31ALFA3014111MRT0011110000'],
        productType: 'ACCOUNT'
      }
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      let account = convertAccount(tc.json)
      expect(account).toEqual(tc.expectedAccount)
    })
  })
})
