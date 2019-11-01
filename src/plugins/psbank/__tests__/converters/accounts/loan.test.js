import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        loanProductType: {
          productTypeId: 52,
          loanProgram: {
            programId: 4,
            name: 'Потребительский кредит',
            loanProgramType: 1
          },
          name: 'Нецелевой потребительский кредит'
        },
        issueDate: '2019-03-11T00:00:00Z',
        issueSum: 1000000,
        currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        loanAccount: {
          accountId: 25654610,
          contract: { contractId: 14182253, status: 1 },
          accountType: 1,
          currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
          office: {
            officeId: 6,
            code: 6,
            briefName: 'Стромынка',
            branch: {
              branchId: 1,
              briefName: 'Москва',
              bic: '044525555',
              corrAccount: '30101810400000000555',
              bank: {
                bankGroup: { bankGroupId: 1, name: 'Банковская группа Промсвязьбанк' },
                bankId: 1,
                briefName: 'ПАО "Промсвязьбанк"',
                contactPhoneMoscow: '8 (495) 787-33-33',
                contactPhoneRussia: '8 (800) 333-03-03',
                bic: '044525555',
                inn: '7744000912',
                displayMember: '044525555',
                name: 'Публичное акционерное общество "Промсвязьбанк"',
                correspondenceAccount: '30101810400000000555'
              }
            },
            address: '107076 г. Москва, ул. Стромынка, д. 18, стр. 27'
          },
          accountingBranch: {
            branchId: 1,
            briefName: 'Москва',
            bic: '044525555',
            corrAccount: '30101810400000000555',
            bank: {
              bankGroup: { bankGroupId: 1, name: 'Банковская группа Промсвязьбанк' },
              bankId: 1,
              briefName: 'ПАО "Промсвязьбанк"',
              contactPhoneMoscow: '8 (495) 787-33-33',
              contactPhoneRussia: '8 (800) 333-03-03',
              bic: '044525555',
              inn: '7744000912',
              displayMember: '044525555',
              name: 'Публичное акционерное общество "Промсвязьбанк"',
              correspondenceAccount: '30101810400000000555'
            }
          },
          number: '45507810940000520649',
          name: 'К.д. № 893105619 от 11.03.2019 Николаев Н. Н.'
        },
        repaymentAccount: {
          accountId: 21358897,
          accountType: 1,
          accountingBranch: {
            branchId: 1,
            briefName: 'Москва',
            bic: '044525555',
            corrAccount: '30101810400000000555',
            bank: {
              bankGroup: { bankGroupId: 1, name: 'Банковская группа Промсвязьбанк' },
              bankId: 1,
              briefName: 'ПАО "Промсвязьбанк"',
              contactPhoneMoscow: '8 (495) 787-33-33',
              contactPhoneRussia: '8 (800) 333-03-03',
              bic: '044525555',
              inn: '7744000912',
              displayMember: '044525555',
              name: 'Публичное акционерное общество "Промсвязьбанк"',
              correspondenceAccount: '30101810400000000555'
            }
          },
          number: '40817810840002276980',
          availableBalance: 0,
          requisites: {
            bank: {
              bic: '044525555',
              inn: '7744000912',
              imageSrc: '/res/i/b/55C24BAEE30FBF3C9DA8E35EB05DBBE7.png',
              displayMember: '044525555',
              name: 'ПАО "Промсвязьбанк" г.Москва',
              correspondenceAccount: '30101810400000000555'
            },
            accountingBankName: 'ГУ Банка России по ЦФО',
            beneficiaryName: 'Николаев Николай Николаевич'
          }
        },
        interestRate: 0.12,
        financialState: 1,
        application: {
          state: 4,
          requestedSum: 950000,
          lengthMonths: 48,
          lengthMonthsAsString: '48 месяцев',
          applicationId: 3965757,
          applicationDate: '2019-03-11T00:00:00Z',
          currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
          office: {
            officeId: 6,
            code: 6,
            briefName: 'Стромынка',
            branch: {
              branchId: 1,
              briefName: 'Москва',
              bic: '044525555',
              corrAccount: '30101810400000000555',
              bank: {
                bankGroup: { bankGroupId: 1, name: 'Банковская группа Промсвязьбанк' },
                bankId: 1,
                briefName: 'ПАО "Промсвязьбанк"',
                contactPhoneMoscow: '8 (495) 787-33-33',
                contactPhoneRussia: '8 (800) 333-03-03',
                bic: '044525555',
                inn: '7744000912',
                displayMember: '044525555',
                name: 'Публичное акционерное общество "Промсвязьбанк"',
                correspondenceAccount: '30101810400000000555'
              }
            },
            address: '107076 г. Москва, ул. Стромынка, д. 18, стр. 27'
          },
          request: { requestId: 893105619 }
        },
        lodgementDate: '2019-03-11T00:00:00Z',
        lengthMonths: 48,
        lengthDescription: '48 месяцев',
        planningEndDate: '2023-03-13T00:00:00Z',
        fullLoanValue: 0.11987,
        remainedMainDebtSum: 896997.86,
        nearestPaymentDate: '2019-11-18T00:00:00Z',
        nearestPaymentSums: {
          totalPaymentSum: 26771.11,
          planningMainDebtSum: 17629.1,
          planningInterestSum: 9142.01,
          advancedRepaymentSum: 0,
          totalPlannedSum: 26771.11
        },
        isLoanVacationAvailable: true,
        isNoFormalitiesLoan: true,
        contractId: 14182253,
        brand: { brandId: 1006167, name: 'Без формальностей сотрудники' },
        clientLabel: 'Потреб',
        office: {
          officeId: 6,
          code: 6,
          briefName: 'Стромынка',
          branch: {
            branchId: 1,
            briefName: 'Москва',
            bic: '044525555',
            corrAccount: '30101810400000000555',
            bank: {
              bankGroup: { bankGroupId: 1, name: 'Банковская группа Промсвязьбанк' },
              bankId: 1,
              briefName: 'ПАО "Промсвязьбанк"',
              contactPhoneMoscow: '8 (495) 787-33-33',
              contactPhoneRussia: '8 (800) 333-03-03',
              bic: '044525555',
              inn: '7744000912',
              displayMember: '044525555',
              name: 'Публичное акционерное общество "Промсвязьбанк"',
              correspondenceAccount: '30101810400000000555'
            }
          },
          address: '107076 г. Москва, ул. Стромынка, д. 18, стр. 27'
        },
        number: '893105619',
        name: 'Pre-approved',
        beginDate: '2019-03-11T00:00:00Z',
        status: 2,
        entityIdentifier: { entityType: 69, identifier: '14182253' }
      },
      {
        product: {
          id: 14182253,
          type: 'loan'
        },
        account: {
          id: '14182253',
          type: 'loan',
          title: 'Потребительский кредит',
          instrument: 'RUB',
          syncID: [
            '45507810940000520649'
          ],
          balance: -896997.86,
          startBalance: 1000000,
          startDate: new Date('2019-03-11T00:00:00Z'),
          capitalization: true,
          percent: 12,
          endDateOffset: 48,
          endDateOffsetInterval: 'month',
          payoffStep: 1,
          payoffInterval: 'month'
        }
      }
    ]
  ])('converts loan', (apiAccount, accounts) => {
    expect(convertAccount(apiAccount)).toEqual(accounts)
  })
})
