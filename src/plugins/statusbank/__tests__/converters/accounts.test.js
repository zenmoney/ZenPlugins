import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  beforeEach(() => {
    global.ZenMoney = { isAccountSkipped: () => false }
  })
  const bankCard = {
    lastTrxExecutionId: 'xxxx',
    statementExecutionId: 'yyyy',
    Id: ['11161311-117d11'],
    No: ['529911******1111'],
    ProductType: ['MS'],
    Balance: ['0,00'],
    ProductTypeName: ['Карточка'],
    Expired: ['20230630'],
    Currency: ['840'],
    BankId: ['cb727d83-2d8a-4c54-898f-6d45f0eba713']
  }
  it('maps bank card to zenmoney one', () => {
    expect(convertAccount(bankCard)).toEqual({
      id: '11161311',
      accountID: NaN,
      transactionsAccId: 'yyyy',
      latestTrID: 'xxxx',
      type: 'card',
      title: 'Карточка*1111',
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
})
