import { convertAccount } from '../../converters'
import { ZPAPI } from '../../../../ZPAPI'

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
      conditionsAccId: null,
      type: 'card',
      title: 'Расчетная карточка*1111',
      currencyCode: '840',
      cardNumber: '529911******1111',
      instrument: 'USD',
      balance: 0,
      syncID: ['1111'],
      bankId: 'cb727d83-2d8a-4c54-898f-6d45f0eba713',
      productId: '11161311-117d11',
      productType: 'MS'
    })
  })

  it('maps deposit to zenmoney one', () => {
    const deposit = {
      Id: '28180546-ad468b',
      No: 'BY44OLMP34140000000800598636',
      ProductType: 'DEPOSIT',
      ProductTypeName: 'Номер счёта',
      Currency: '933',
      CustomName: 'мой депозит',
      Opened: '20260130',
      Expired: '20290228',
      Balance: '3 085,85',
      Extra: {
        InterestRate: '15.1% годовых'
      },
      Group: {
        Name: 'Ещё',
        Action: [
          { Id: 'statement-action', Type: 'itwg:OperationTxt3', Name: 'Выписка' },
          { Id: 'conditions-action', Type: 'itwg:Conditions2', Name: 'Условия обслуживания' }
        ]
      }
    }

    expect(convertAccount(deposit)).toEqual({
      id: '28180546',
      transactionsAccId: 'statement-action',
      conditionsAccId: 'conditions-action',
      type: 'deposit',
      title: 'мой депозит*8636',
      currencyCode: '933',
      cardNumber: 'BY44OLMP34140000000800598636',
      instrument: 'BYN',
      balance: 3085.85,
      syncID: ['BY44OLMP34140000000800598636'],
      startDate: new Date('2026-01-30T00:00:00.000Z'),
      startBalance: 3085.85,
      percent: 15.1,
      capitalization: true,
      payoffInterval: 'month',
      payoffStep: 1,
      endDateOffset: 1125,
      endDateOffsetInterval: 'day',
      productId: '28180546-ad468b',
      productType: 'DEPOSIT'
    })

    const api = new ZPAPI({ manifest: {}, preferences: {}, data: {} })
    expect(() => api.addAccount(convertAccount(deposit))).not.toThrow()
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

  it('blocked card', () => {
    expect(convertAccount({
      Id: '57075669-926e47',
      No: '428621******1234',
      Blocked: 'Y',
      ProductType: 'MS',
      ProductTypeName: 'Карточка',
      Subclass: 'Расчетная карточка &quot;Премиальная&quot; MasterCard World скидка 60%',
      Expired: '20230531',
      Currency: '933',
      CustomName: 'Расчетная карточка',
      Icon: 'NFC_MC_BDW',
      BankId: '1949525',
      ExtraData: 'c8fc2f32-d7de-4920-a71b-eb1731874932',
      ExtraData2: '529922'
    })).toBeNull()
  })
})
