import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          account: {
            actions: ['INST', 'SMTI', 'STMT'],
            currency: 'KZT',
            number: 'L101107627207',
            priority: 0,
            title: 'Беззалоговый кредит - L101107627207',
            type: 'CRED',
            status: 'ACTIVE',
            showBalance: true,
            allowTransfer: false
          },
          details: {
            actions: ['INST', 'SMTI', 'STMT'],
            currency: 'KZT',
            number: 'L101107627207',
            title: 'Беззалоговый кредит - L101107627207',
            type: 'CRED',
            status: 'ACTIVE',
            balance: 138627.85,
            branchTitle: '',
            dateOpened: 1564164000000,
            termPeriod: 'MONTH',
            branchTermId: '',
            amount: 237375,
            interestRate: 0.12,
            duties:
              [{
                nextPaymentAmount: 10992,
                amount: 237375,
                nextPaymentDate: 1591293600000,
                dateClosed: 1627322400000,
                dateOpened: 1564164000000,
                debt:
                {
                  commission: 0,
                  main: 138621.14,
                  percentage: 6.71,
                  total: 138627.85
                },
                delayedDebt: { commission: 0, main: 0, percentage: 0, total: 0 },
                delayedDebtFine: { commission: 0, main: 0, percentage: 0, total: 0 },
                id: 4966607,
                interestRate: 0.12,
                status: 'ACTIVE',
                type: '',
                number: '',
                overpayment: 99048
              }],
            guarantee: '',
            repaymentAccounts: [],
            validityDate: 1589911200000,
            term: 24,
            expiration: 1628100000000,
            creditType: '',
            servicingBranch: '',
            showBalance: true,
            allowTransfer: false
          }
        }],
      {
        accounts:
          [{
            mainProduct: {
              number: 'L101107627207',
              type: 'credit'
            },
            account: {
              id: '7627207',
              instrument: 'KZT',
              balance: -138627.85,
              startBalance: 237375,
              type: 'loan',
              title: '*7207',
              startDate: new Date(1564164000000),
              capitalization: true,
              percent: 12,
              endDateOffsetInterval: 'day',
              endDateOffset: 740,
              payoffInterval: 'month',
              payoffStep: 1,
              syncID: ['L101107627207']
            }
          }],
        accountsByNumber: {
          L101107627207: {
            id: '7627207',
            instrument: 'KZT',
            balance: -138627.85,
            startBalance: 237375,
            type: 'loan',
            title: '*7207',
            startDate: new Date(1564164000000),
            capitalization: true,
            percent: 12,
            endDateOffsetInterval: 'day',
            endDateOffset: 740,
            payoffInterval: 'month',
            payoffStep: 1,
            syncID: ['L101107627207']
          }
        }
      }
    ],
    [
      [
        {
          account: {
            actions: ['INST', 'SMTI', 'STMT'],
            currency: 'KZT',
            number: 'L101107625729',
            priority: 0,
            title: 'Беззалоговый кредит - L101107625729',
            type: 'CRED',
            status: 'ACTIVE',
            showBalance: true,
            allowTransfer: false
          },
          details: {
            actions: ['INST', 'SMTI', 'STMT'],
            currency: 'KZT',
            number: 'L101107625729',
            title: 'Беззалоговый кредит - L101107625729',
            type: 'CRED',
            status: 'ACTIVE',
            balance: 285134.97,
            branchTitle: '',
            dateOpened: 1564164000000,
            termPeriod: 'MONTH',
            branchTermId: '',
            amount: 488217,
            interestRate: 0.12,
            duties: [{
              nextPaymentAmount: 22606,
              amount: 488217,
              nextPaymentDate: 1591293600000,
              dateClosed: 1627322400000,
              dateOpened: 1564164000000,
              debt:
              {
                commission: 0,
                main: 285121.17,
                percentage: 13.8,
                total: 285134.97
              },
              delayedDebt: { commission: 0, main: 0, percentage: 0, total: 0 },
              delayedDebtFine: { commission: 0, main: 0, percentage: 0, total: 0 },
              id: 4966748,
              interestRate: 0.12,
              status: 'ACTIVE',
              type: '',
              number: '',
              overpayment: 197321
            }],
            guarantee: '',
            repaymentAccounts: [],
            validityDate: 1589911200000,
            term: 24,
            expiration: 1628100000000,
            creditType: '',
            servicingBranch: '',
            showBalance: true,
            allowTransfer: false
          }
        }],
      {
        accounts: [
          {
            mainProduct: {
              number: 'L101107625729',
              type: 'credit'
            },
            account: {
              id: '7625729',
              instrument: 'KZT',
              balance: -285134.97,
              startBalance: 488217,
              type: 'loan',
              title: '*5729',
              startDate: new Date(1564164000000),
              capitalization: true,
              percent: 12,
              endDateOffsetInterval: 'day',
              endDateOffset: 740,
              payoffInterval: 'month',
              payoffStep: 1,
              syncID: ['L101107625729']
            }
          }],
        accountsByNumber: {
          L101107625729: {
            id: '7625729',
            instrument: 'KZT',
            balance: -285134.97,
            startBalance: 488217,
            type: 'loan',
            title: '*5729',
            startDate: new Date(1564164000000),
            capitalization: true,
            percent: 12,
            endDateOffsetInterval: 'day',
            endDateOffset: 740,
            payoffInterval: 'month',
            payoffStep: 1,
            syncID: ['L101107625729']
          }
        }
      }
    ]
  ])('converts loan', (apiAccount, account) => {
    expect(convertAccounts(apiAccount)).toEqual(account)
  })
})
