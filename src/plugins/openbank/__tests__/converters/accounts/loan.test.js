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
        products: [
          {
            id: '10024810000000112345',
            type: 'loan'
          }
        ],
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
    ],
    [
      {
        bsc: 'BINIBS',
        contractNum: 'MЫC026_283032',
        openDate: '2014-08-02',
        bankName: 'Ф-л Московский №2 ПАО Банк "ФК Открытие"',
        bic: '044525175',
        account: { accNum: '45509810402389791274', currency: 'RUR' },
        productName: 'Расчётная карта с лимитом овердрафта',
        name: 'Расчётная карта с лимитом овердрафта',
        type: 'unknown',
        title: 'Расчётная карта с лимитом овердрафта',
        percent: 29,
        loan: 0,
        debt: 0,
        status: 'OPEN',
        endDate: '2019-09-14',
        payment:
          {
            debt: 0,
            percent: 0,
            debtPercent: 0,
            amount: 0,
            totalAmount: 0,
            date: '2019-09-14',
            accountList: ['40817810602389923612']
          },
        overdue:
          {
            debt: 0,
            percentSum: 0,
            fee: 0,
            fine: 0,
            penalties: 0,
            date: '2019-08-23'
          },
        earlyRepaymentDigital: false,
        earlyRepaymentAtm: false,
        fullEarlyRepaymentSum: 0,
        fullEarlyGrRepaymentSum: 0,
        amountVisible: true,
        earlyRepaymentFine: 0,
        earlyRepaymentCommission: 0,
        earlyRepaymentMinSum: 0,
        inn: '7706092528',
        restrictions:
          [
            'TRANSACTIONS',
            'CREDIT_SCHEDULE',
            'PAY',
            'INTERNAL_DESTINATION',
            'DEPOSIT_CLOSE_DESTINATION',
            'INTERNAL_SOURCE',
            'WITHDRAWAL',
            'METAL_SELL'
          ],
        updateTime: 1566553650116,
        id: '45509810402389791274'
      },
      {
        products: [
          {
            id: '45509810402389791274',
            type: 'loan'
          }
        ],
        account: {
          id: '45509810402389791274',
          type: 'loan',
          title: 'Расчётная карта с лимитом овердрафта',
          instrument: 'RUR',
          syncID: [
            '45509810402389791274'
          ],
          balance: 0,
          startBalance: 0,
          startDate: new Date('2014-08-02T00:00:00+03:00'),
          capitalization: true,
          percent: 29,
          endDateOffset: 1869,
          endDateOffsetInterval: 'day',
          payoffStep: 1,
          payoffInterval: 'month'
        }
      }
    ]
  ])('converts loan', (apiAccount, item) => {
    expect(convertAccounts([apiAccount])).toEqual([item])
  })
})
