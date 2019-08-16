import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accNum: '40817810007430488118',
        accName: 'Текущий счет',
        balance: { amount: 0, currency: 'RUR' },
        status: { code: 'NORMAL', value: 'Открыт' },
        bic: '046015061',
        openDate: '2018-06-03T00:00:00.000+0300',
        paySign: true,
        withdrawalSign: true,
        contractName: 'БОР-64765',
        name: 'checking',
        idExt: '78793766244',
        bsc: 'IBSO',
        updateTime: 1565885230924,
        productType: 'CURRENT',
        amountVisible: true,
        preferentialRate: false,
        '@type': 'current'
      },
      {
        products: [
          {
            id: '40817810007430488118',
            type: 'account'
          }
        ],
        account: {
          id: '40817810007430488118',
          type: 'checking',
          title: 'Текущий счет',
          instrument: 'RUR',
          syncID: [
            '40817810007430488118'
          ],
          balance: 0
        }
      }
    ]
  ])('converts current account', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
