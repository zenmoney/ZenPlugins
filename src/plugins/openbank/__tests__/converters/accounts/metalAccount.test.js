import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accNum: '20309A98277075178012',
        accName: 'ОМС',
        balance: { amount: 0, currency: 'A98' },
        status: { code: 'NORMAL', value: 'Открыт' },
        bic: '044525985',
        minPayment: 0.1,
        precision: 1,
        openDate: '2013-06-24T00:00:00.000+0400',
        contractName: 'OMSA98R078012',
        bsc: 'TWR',
        idExt: '1039534',
        amountVisible: true,
        updateTime: 1565883093007,
        productType: 'METAL',
        '@type': 'metal',
        balanceRur: { amount: 0, currency: 'RUR' }
      },
      {
        product: {
          id: '1039534',
          type: 'account'
        },
        account: {
          id: '1039534',
          type: 'checking',
          title: 'ОМС',
          instrument: 'XAU',
          syncID: [
            '20309A98277075178012'
          ],
          balance: 0
        }
      }
    ]
  ])('converts metal account', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
