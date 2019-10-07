import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accNum: '40817810300003200218',
        accName: 'Моя копилка',
        balance: { amount: 0.42, currency: 'RUR' },
        status: { code: 'NORMAL', value: 'Открыт' },
        bic: '044525297',
        productCode: '4737',
        productName: 'Моя копилка',
        percent: 0.1,
        deptAmount: 0,
        deptPayDate: '2019-08-31T00:00:00.000+0300',
        conditionAccumulationUrl: 'https://www.open.ru/storage/files/tariffs_moneybox.pdf',
        digitalSign: false,
        name: 'Продукты',
        openDate: '2016-01-05T00:00:00.000+0300',
        contractName: '28299-0000-0952758',
        productType: 'ACCUMULATION',
        bsc: '3C',
        idExt: '2123012',
        amountVisible: true,
        updateTime: 1565878861604,
        preferentialRate: true,
        '@type': 'accumulation'
      },
      {
        products: [
          {
            id: '40817810300003200218',
            type: 'account'
          }
        ],
        account: {
          id: '40817810300003200218',
          type: 'checking',
          title: 'Продукты',
          instrument: 'RUR',
          syncID: [
            '40817810300003200218'
          ],
          available: 0.42,
          savings: true
        }
      }
    ]
  ])('converts savings account', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
