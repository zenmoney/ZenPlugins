import { convertAccounts } from '../../../converters'

describe('convertLoan', () => {
  it.each([
    [
      {
        accounts:
          [
            {
              id: 40681777,
              customName: false,
              name: 'Счет RUB',
              productName: 'Счет RUB',
              number: '40817810239923082636',
              state: 'Открыт',
              stateCode: 'open',
              amount: 0,
              type: 'current',
              registryAmount: 0,
              registry2Amount: 0,
              balance: 0,
              currency: 'RUB',
              availableBalance: 0,
              availBalanceRub: 0,
              startDate: '13.03.2014',
              order: 1,
              category: 'account',
              requisites:
                {
                  bankName: 'ФИЛИАЛ "ВОЛОГОДСКИЙ" ПАО "СКБ-БАНК"',
                  address: 'Россия, 190031, Санкт-Петербург г, Московский пр-кт, д.2, корп.6, кв.77Н, лит.А',
                  bic: '041909781',
                  inn: '6608003052',
                  kpp: '352543001',
                  corrAccount: '30101810300000000781'
                },
              allowInPayments: true,
              allowOutPayments: true,
              allowLoanRepayment: false,
              tariffPlanName: 'Стандартный',
              tariffPlanCode: '',
              tariffPlanLinkToRules: '',
              specType: 'EP',
              mostActive: false,
              pdfLink: '/export/account/pdf?id=40681777',
              overdraft: false,
              sbpDefault: false,
              bonusProgramState: 'forbidden',
              availableBonuses: 0,
              accruedBonuses: 0,
              nextAccrualDate: null,
              lockedAmount: 0,
              canClose: false,
              bonusProgramGroup:
                {
                  firstCategory: '0',
                  secondCategory: '0',
                  thirdCategory: '0',
                  selectCategoryDate: null
                },
              petitionId: null,
              tariffPlanCanChange: false
            }
          ],
        cards: [],
        loans:
          [
            {
              id: 40681781,
              bank_system_id: '9625620',
              productName: 'Персональное предложение (потребительский кредит)',
              productCode: '1292',
              customName: true,
              name: 'ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ (потребительский кредит)',
              amount: 216300,
              currency: 'RUB',
              interestRate: 26.9,
              psk: 22.924,
              contractDate: '13.03.2014',
              contractNumber: '39913394134',
              openDate: '13.03.2014',
              endDate: '13.11.2023',
              allowPaymentAmount: 20878.61,
              partialPaymentDate: '14.09.2020',
              planPaymentAmount: 5900,
              mainAccount: '45507810939900624978',
              repaymentAccount: '40817810239923082636',
              recommendedPaymentAmount: 5900,
              partialPaymentAmount: null,
              prepayment: false,
              overdueDebtAmount: 0,
              overdraft: false,
              startPaymentPeriod: null,
              gracePeriodDate: null,
              creditLimit: null,
              availableLimit: null,
              prepaymentApplication: false,
              changeDate: false,
              ownFounds: null,
              changeRepaymentAccount: false,
              partialPaymentMarker: false,
              reduceLimit: false,
              closeLimit: false,
              prepaymentAmount: null,
              prepaymentId: null,
              prepaymentType: null,
              loanHolder: 'ПАО "СКБ-банк"',
              paymentsDelay: true,
              paymentsDelayId: null,
              scheduleChanged: false,
              mortgage: false,
              onlineRepayment: false,
              petitionId: null,
              minLimit: null
            }
          ],
        deposits: []
      },
      [
        {
          id: '40817810239923082636',
          type: 'checking',
          title: 'Счет RUB',
          instrument: 'RUB',
          balance: 0,
          creditLimit: 0,
          syncIds: [
            '40817810239923082636'
          ]
        },
        {
          id: '45507810939900624978',
          type: 'loan',
          title: 'ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ (потребительский кредит)',
          instrument: 'RUB',
          balance: -20878.61,
          capitalization: true,
          percent: 26.9,
          startDate: new Date('2014-03-12T21:00:00.000Z'),
          startBalance: 216300,
          payoffStep: 1,
          payoffInterval: 'month',
          endDateOffset: 116,
          endDateOffsetInterval: 'month',
          syncIds: [
            '45507810939900624978'
          ]
        }
      ]
    ],
    [
      {
        loans:
          [
            {
              id: 882303514,
              bank_system_id: '17028760',
              productName: '«Простой и удобный» (ГЭБ)',
              productCode: '2550',
              customName: false,
              name: '«Простой и удобный» (ГЭБ)',
              amount: 182000,
              currency: 'RUB',
              interestRate: 14.9,
              psk: 14.89,
              contractDate: '07.10.2020',
              contractNumber: '24916798236',
              openDate: '07.10.2020',
              endDate: '07.10.2025',
              allowPaymentAmount: 183111.39,
              partialPaymentDate: '25.11.2020',
              planPaymentAmount: 4300,
              mainAccount: '10098810824900236214',
              repaymentAccount: '40817810900016440959',
              recommendedPaymentAmount: 4300,
              partialPaymentAmount: null,
              prepayment: true,
              overdueDebtAmount: 0,
              overdraft: false,
              startPaymentPeriod: null,
              gracePeriodDate: null,
              creditLimit: null,
              availableLimit: null,
              prepaymentApplication: true,
              changeDate: true,
              ownFounds: null,
              changeRepaymentAccount: false,
              partialPaymentMarker: false,
              reduceLimit: false,
              closeLimit: false,
              prepaymentAmount: null,
              prepaymentId: null,
              prepaymentType: null,
              loanHolder: 'ПАО "СКБ-банк"',
              paymentsDelay: false,
              paymentsDelayId: null,
              scheduleChanged: false,
              mortgage: false,
              onlineRepayment: false,
              petitionId: null,
              minLimit: null
            }
          ]
      },
      [
        {
          id: '10098810824900236214',
          type: 'loan',
          title: '«Простой и удобный» (ГЭБ)',
          instrument: 'RUB',
          balance: -183111.39,
          capitalization: true,
          percent: 14.9,
          startDate: new Date('2020-10-06T21:00:00.000Z'),
          startBalance: 182000,
          payoffStep: 1,
          payoffInterval: 'month',
          endDateOffset: 5,
          endDateOffsetInterval: 'year',
          syncIds: [
            '10098810824900236214'
          ]
        }
      ]
    ]
  ])('converts Loan', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
