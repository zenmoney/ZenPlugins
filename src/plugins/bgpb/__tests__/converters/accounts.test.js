import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  var tt = [
    {
      name: 'bank card',
      rawData: {
        'Id': '11161311-117d11',
        'No': '529911******1111',
        'ProductType': 'MS',
        'ProductTypeName': 'Карточка',
        'Subclass': 'Расчетная карточка &quot;Премиальная&quot; MasterCard World',
        'Expired': '20230630',
        'Currency': '840',
        'CustomName': 'Расчетная карточка',
        'Icon': 'NFC_MC_BDW',
        'BankId': 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
        'ExtraData': 'cb727d83-2d8a-4c54-898f-6d45f0eba713'
      },
      expected: {
        id: '11161311-117d11',
        transactionsAccId: null,
        type: 'card',
        title: 'Расчетная карточка*1111',
        currencyCode: '840',
        cardNumber: '529911******1111',
        instrument: 'USD',
        balance: 0,
        syncID: ['1111'],
        productType: 'MS'
      }
    },
    {
      name: 'another bank',
      rawData: {
        'Id': '11161311-117d12',
        'No': '529911******1112',
        'ProductType': 'NON_ONUS',
        'ProductTypeName': 'Карточка Другого банка',
        'Subclass': 'Расчетная карточка &quot;Премиальная&quot; MasterCard World',
        'Expired': '20230630',
        'Currency': '840',
        'CustomName': 'Расчетная карточка',
        'Icon': 'NON_ONUS_VISA',
        'BankId': 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
        'ExtraData': 'cb727d83-2d8a-4c54-898f-6d45f0eba713'
      },
      expected: null
    }
  ]
  tt.forEach(function (tc) {
    it(tc.name, () => {
      const account = convertAccount(tc.rawData)

      expect(account).toEqual(tc.expected)
    })
  })
})
