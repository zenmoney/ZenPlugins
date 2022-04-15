import { convertToZenMoneyAccount } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        cardId: 6207711,
        expiryDate: 1740690000000,
        maskedCardNumber: '1234*******3242', // '<string[16]>'
        active: true,
        enabled: true,
        amount: 220.64,
        currency: '933',
        brand: 'MasterCard Standart зп, БПЦ',
        type: 1007,
        status: 1,
        balanceStatus: null,
        statusText: 'Карта активна',
        contract: '<string[9]>',
        cashBack: false,
        name: null,
        current: false,
        rbsContract: '<string[18]>',
        secureEnabled: false,
        secureType: 'NONE',
        ownerName: '<string[15]>',
        ownerNameLat: '<string[15]>',
        ownerNameKir: 'Николаев Николай Николаевич',
        isOwnDocument: true,
        iban: 'BY60UNBS30145110051521050933',
        createDate: 1645178895000,
        isApplePaySupported: true,
        token: null,
        loyal: 1,
        authStrongCard: false,
        points: null
      },
      {
        id: '6207711',
        title: 'MasterCard Standart зп, БПЦ',
        type: 'ccard',
        syncID: ['3242'],
        instrument: 'BYN',
        balance: 220.64
      }
    ]
  ])('converts account', (apiCard, account) => {
    expect(convertToZenMoneyAccount(apiCard)).toEqual(account)
  })
})
