import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        bsc: '3C',
        contractNum: 'APP_280313171614581',
        openDate: '2013-04-26',
        bankName: 'ФИЛИАЛ ЦЕНТРАЛЬНЫЙ ПАО БАНКА "ФК ОТКРЫТИЕ"',
        bic: '044525297',
        account: { accNum: '10024810000000112345', currency: 'RUR' },
        productName: 'Потребительский кредит',
        name: 'Потребительский кредит',
        type: 'consumer',
        title: 'НОМОС: Договор выкупленный, ХИТ2 (RUR)',
        percent: 18.9,
        loan: 170000,
        debt: 0,
        status: 'NORMAL',
        endDate: '2018-04-26',
        payment: {
          debt: 0,
          percent: 0,
          debtPercent: 0,
          amount: 0,
          totalAmount: 0,
          date: '2018-04-26',
          accountList: ['-']
        },
        overdue: {
          debt: 0,
          percentSum: 0,
          fee: 0,
          fine: 0,
          penalties: 0,
          date: '2019-08-15'
        },
        insurance: 0,
        compensationInsurance: 0,
        earlyRepaymentDigital: false,
        earlyRepaymentAtm: false,
        fullEarlyRepaymentSum: 0,
        fullEarlyGrRepaymentSum: 0,
        amountVisible: true,
        scheduleRecalcMode: 0,
        earlyRepaymentFine: 0,
        earlyRepaymentCommission: 0,
        earlyRepaymentMinSum: 0,
        updateTime: 1565883091866,
        id: '10024810000000112345'
      },
      {
        product: {
          id: '10024810000000112345',
          type: 'loan'
        },
        account: {
          id: '10024810000000112345',
          type: 'loan',
          title: 'Потребительский кредит',
          instrument: 'RUR',
          syncID: [
            '10024810000000112345'
          ],
          balance: 0,
          startBalance: 170000,
          startDate: new Date('2013-04-26T00:00:00+03:00'),
          capitalization: true,
          percent: 18.9,
          endDateOffset: 5,
          endDateOffsetInterval: 'year',
          payoffStep: 1,
          payoffInterval: 'month'
        }
      }
    ]
  ])('converts loan', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
