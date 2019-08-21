import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        productName: 'Основной доход',
        contractName: '43605-2451-2422746',
        contractId: '18196912',
        contracts:
          [
            {
              contractNum: '42306840851243169824',
              balance: { amount: 6012.18, currency: 'USD' },
              percent: 2.47,
              interestRateWithCapitalization: 2.5,
              deptAmount: 12.61,
              maxWithdrawalAmount: 0,
              deptAmountTotal: 6024.79,
              bic: '045004867',
              productType: 'DEPOSIT',
              bsc: '3C'
            }
          ],
        status: { code: 'NORMAL', value: 'Открыт' },
        expDate: '2020-06-26T00:00:00.000+0300',
        conditionDepositUrl: 'https://www.open.ru/storage/files/deposit_tariff_main.pdf',
        capitalizationSign: true,
        paySign: false,
        lastPayDate: '2019-06-24T00:00:00.000+0300',
        withdrawalSign: true,
        multiCurSign: false,
        deptPayDate: '2019-08-25T00:00:00.000+0300',
        percentFrequency: 1,
        contractDuration: 367,
        openDate: '2019-06-25T00:00:00.000+0300',
        daysElapsed: 51,
        closeable: true,
        bsc: '3C',
        idExt: '8102936',
        amountVisible: true,
        updateTime: 1565892447055,
        preferentialRate: true
      },
      {
        products: [
          {
            id: '42306840851243169824',
            type: 'deposit'
          }
        ],
        account: {
          id: '42306840851243169824',
          type: 'deposit',
          title: 'Основной доход',
          instrument: 'USD',
          syncID: [
            '42306840851243169824'
          ],
          balance: 6012.18,
          startBalance: 6012.18,
          startDate: new Date('2019-06-25T00:00:00.000+03:00'),
          capitalization: true,
          percent: 2.47,
          endDateOffset: 367,
          endDateOffsetInterval: 'day',
          payoffStep: 1,
          payoffInterval: 'month'
        }
      }
    ]
  ])('converts deposit', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
