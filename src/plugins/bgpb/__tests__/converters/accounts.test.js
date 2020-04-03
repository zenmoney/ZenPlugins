import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  beforeEach(() => {
    global.ZenMoney = { isAccountSkipped: () => false }
  })
  const bankCard = {
    Id: '11161311-117d11',
    No: '529911******1111',
    ProductType: 'MS',
    ProductTypeName: 'Карточка',
    Subclass: 'Расчетная карточка &quot;Премиальная&quot; MasterCard World',
    Expired: '20230630',
    Currency: '840',
    CustomName: 'Расчетная карточка',
    Icon: 'NFC_MC_BDW',
    BankId: 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
    ExtraData: 'cb727d83-2d8a-4c54-898f-6d45f0eba713'
  }
  it('maps bank card to zenmoney one', () => {
    expect(convertAccount(bankCard)).toEqual({
      id: '11161311',
      transactionsAccId: null,
      type: 'card',
      title: 'Расчетная карточка*1111',
      currencyCode: '840',
      cardNumber: '529911******1111',
      instrument: 'USD',
      balance: 0,
      syncID: ['1111'],
      productId: '11161311-117d11',
      productType: 'MS'
    })
  })

  it('maps skipped card to nothing', () => {
    global.ZenMoney = { isAccountSkipped: (accountId) => accountId === '11161311' }
    expect(convertAccount(bankCard)).toBeNull()
  })

  it('maps another bank card to nothing', () => {
    expect(convertAccount({
      Id: '11161311-117d12',
      No: '529911******1112',
      ProductType: 'NON_ONUS',
      ProductTypeName: 'Карточка Другого банка',
      Subclass: 'Расчетная карточка &quot;Премиальная&quot; MasterCard World',
      Expired: '20230630',
      Currency: '840',
      CustomName: 'Расчетная карточка',
      Icon: 'NON_ONUS_VISA',
      BankId: 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
      ExtraData: 'cb727d83-2d8a-4c54-898f-6d45f0eba713'
    })).toBeNull()
  })

  it('disabled card', () => {
    expect(convertAccount({
      Id: '11161311-117d12',
      No: '529911******1112',
      Enabled: 'N',
      ProductType: 'MS',
      ProductTypeName: 'Карточка',
      Subclass: 'Карта покупок',
      Expired: '20230630',
      Currency: '840',
      CustomName: 'Карта покупок',
      Icon: 'NFC_MC_STD_DISABLE',
      BankId: 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
      ExtraData: 'cb727d83-2d8a-4c54-898f-6d45f0eba713'
    })).toBeNull()
  })
})
