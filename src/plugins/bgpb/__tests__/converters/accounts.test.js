import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
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
    })

    expect(account).toEqual({
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
    })
  })
})
