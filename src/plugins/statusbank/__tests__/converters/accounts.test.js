import { convertAccount, convertLinkedAccountSource } from '../../converters'

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

  const standaloneAccount = {
    statementExecutionId: '73129901-a1b2c3-account-2048571-b735-getordering-1',
    Id: ['73124567-a1b2c3'],
    No: ['договор N 307451928'],
    ProductType: ['ACCOUNT'],
    Balance: ['12,34'],
    ProductTypeName: ['Счёт без карты'],
    Currency: ['840']
  }

  it('maps a standalone bank account to a checking account', () => {
    expect(convertAccount(standaloneAccount)).toEqual({
      id: '73124567',
      transactionsAccId: '73129901-a1b2c3-account-2048571-b735-getordering-1',
      latestTrID: null,
      type: 'checking',
      title: 'Счёт без карты 307451928',
      currencyCode: '840',
      instrument: 'USD',
      balance: 12.34,
      syncID: ['307451928'],
      productId: '73124567-a1b2c3',
      productType: 'ACCOUNT'
    })
  })

  it('does not expose an account tied to a card', () => {
    const linkedAccount = {
      ...standaloneAccount,
      ProductTypeName: ['Счёт с картой'],
      LinkedProductType: ['MS'],
      LinkedProductId: ['73120042-d4e5f6']
    }

    expect(convertAccount(linkedAccount)).toBeNull()
    expect(convertLinkedAccountSource(linkedAccount)).toEqual({
      id: '73120042',
      transactionsAccId: '73129901-a1b2c3-account-2048571-b735-getordering-1',
      type: 'card',
      instrument: 'USD',
      productId: '73124567-a1b2c3',
      productType: 'ACCOUNT',
      latestTrID: null
    })
  })
})
