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
        arbitraryTransfer: true,
        hasHistory: true,
        icon: {
          backgroundColorFrom: '#f9589e',
          backgroundColorTo: '#fe9199',
          captionColor: '#FFFFFF',
          displayType: 'REGULAR',
          frameColor: '#c2b7b7',
          iconUrl: 'v0/Image/49923_392.SVG',
          title: 'Карта №1'
        },
        id: '6505111',
        objectId: '3014111MFE0011110',
        objectType: 'ACCOUNT',
        operations: [
          {
            id: '6505111',
            operation: 'OWNACCOUNTSTRANSFER'
          }],
        tagBalance: 486.18,
        type: 'ACCOUNT'
      },
      expectedAccount: {
        id: '6505111',
        type: 'card',
        title: 'Карта №1',
        balance: 486.18,
        syncID: ['3014111MFE0011110'],
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

describe('convertAccount', () => {
  it('add account info', () => {
    let account = {
      id: '6505111',
      type: 'card',
      title: 'Карта №1',
      balance: 486.18,
      syncID: ['3014111MFE0011110'],
      productType: 'ACCOUNT'
    }
    let fullAccount = addAccountInfo(account, {
      iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
      info: {
        amount: {
          amount: 486.18,
          currency: 'BYN',
          format: '###,###,###,###,##0.##'
        },
        description: 'BY31 ALFA 3014 111M RT00 1111 0000',
        icon: {
          backgroundColorFrom: '#f9589e',
          backgroundColorTo: '#fe9199',
          captionColor: '#FFFFFF',
          displayType: 'REGULAR',
          frameColor: '#c2b7b7',
          iconUrl: 'v0/Image/49923_392.SVG',
          title: 'Карта №1'
        },
        title: 'Карта №1'
      },
      isClosable: false,
      isPayslipAvailable: false,
      objectId: '3014111MFE0011110',
      onDesktop: true,
      startDate: '20171111000000'
    })
    expect(fullAccount).toEqual({
      id: '6505111',
      instrument: 'BYN',
      type: 'card',
      title: 'Карта №1',
      balance: 486.18,
      syncID: ['3014111MFE0011110', 'BY31 ALFA 3014 111M RT00 1111 0000'],
      productType: 'ACCOUNT'
    })
  })
})
