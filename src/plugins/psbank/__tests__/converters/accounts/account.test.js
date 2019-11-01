import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        accountId: 28321950,
        contract: {
          contractId: 15460392,
          brand: {
            brandId: 1006094
          },
          clientLabel: 'Права',
          request: {
            requestId: 1031544564
          },
          office: {
            officeId: 536,
            code: 23,
            briefName: 'ОО "Томский"',
            branch: {
              branchId: 5,
              code: 4,
              briefName: 'Сибирский',
              bic: '045004816',
              corrAccount: '30101810500000000816',
              bank: {
                bankGroup: {
                  bankGroupId: 1,
                  name: 'Банковская группа Промсвязьбанк'
                },
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
            address: '634009, Томская, область, г. Томск, Ленина проспект, д. 82б'
          },
          number: '1031544564',
          name: 'Накопительный счет "Доходный"',
          beginDate: '2019-09-26T00:00:00Z',
          status: 2,
          entityIdentifier: {
            entityType: 5,
            identifier: '15460392'
          }
        },
        accountType: 1,
        currency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        office: {
          officeId: 536,
          code: 23,
          briefName: 'ОО "Томский"',
          branch:
            {
              branchId: 5,
              code: 4,
              briefName: 'Сибирский',
              bic: '045004816',
              corrAccount: '30101810500000000816',
              bank: {
                bankGroup: {
                  bankGroupId: 1,
                  name: 'Банковская группа Промсвязьбанк'
                },
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
          address: '634009, Томская, область, г. Томск, Ленина проспект, д. 82б'
        },
        accountingBranch: {
          branchId: 1,
          briefName: 'Москва',
          bic: '044525555',
          corrAccount: '30101810400000000555',
          bank: {
            bankGroup: {
              bankGroupId: 1,
              name: 'Банковская группа Промсвязьбанк'
            },
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
        number: '40817810140002917648',
        name: 'Накопительный счет Доходный',
        clientLabel: 'Права',
        balance: 1000,
        availableBalance: 1000,
        isWithReplenishment: true,
        isWithSubtraction: true,
        openDate: '2019-09-26T00:00:00Z',
        status: 2,
        entityIdentifier: {
          entityType: 5,
          identifier: '28321950'
        }
      },
      {
        product: {
          id: 28321950,
          type: 'account'
        },
        account: {
          id: '28321950',
          type: 'checking',
          title: 'Права',
          instrument: 'RUB',
          syncID: [
            '40817810140002917648'
          ],
          balance: 1000
        }
      }
    ],
    [
      {
        accountId: 27033433,
        contract: {
          contractId: 14842853,
          brand: { brandId: 1006205 },
          request: { requestId: 958752495 },
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
          number: '958752495',
          name: 'Накопительный счёт "Честная ставка"',
          beginDate: '2019-06-17T00:00:00Z',
          status: 2,
          entityIdentifier: { entityType: 5, identifier: '14842853' }
        },
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
        number: '40817810140002732195',
        name: 'Накопительный счёт Честная ставка',
        clientLabel: 'Накопительный счёт Честная ставка',
        balance: 26.3,
        availableBalance: 26.3,
        isWithReplenishment: true,
        isWithSubtraction: true,
        openDate: '2019-06-17T00:00:00Z',
        status: 2,
        entityIdentifier: { entityType: 5, identifier: '27033433' }
      },
      {
        product: {
          id: 27033433,
          type: 'account'
        },
        account: {
          id: '27033433',
          type: 'checking',
          title: 'Накопительный счёт Честная ставка',
          instrument: 'RUB',
          syncID: [
            '40817810140002732195'
          ],
          balance: 26.3
        }
      }
    ],
    [
      {
        isSaving: true,
        accountId: 21719136,
        contract: {
          contractId: 13455600,
          brand: { brandId: 1006169 },
          clientLabel: 'Кредитный 2250 рэ',
          request: { requestId: 822869959 },
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
          number: '822869959',
          name: 'Накопительный счет "Акцент на процент"',
          beginDate: '2018-11-19T00:00:00Z',
          status: 2,
          entityIdentifier: { entityType: 5, identifier: '13455600' }
        },
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
        number: '40817810640002337524',
        name: 'Накопительный счет Акцент на процент',
        clientLabel: 'Кредитный 2250 рэ',
        balance: 0.33,
        availableBalance: 0.33,
        isWithReplenishment: true,
        isWithSubtraction: true,
        openDate: '2018-11-19T00:00:00Z',
        status: 2,
        entityIdentifier: { entityType: 5, identifier: '21719136' }
      },
      {
        product: {
          id: 21719136,
          type: 'account'
        },
        account: {
          id: '21719136',
          type: 'checking',
          title: 'Кредитный 2250 рэ',
          instrument: 'RUB',
          syncID: [
            '40817810640002337524'
          ],
          balance: 0.33,
          savings: true
        }
      }
    ],
    [
      {
        accountId: 21358897,
        contract: {
          contractId: 13224285,
          brand: { brandId: 2 },
          clientLabel: 'Кредитный 26800 рэ',
          request: { requestId: 798365541 },
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
          number: '798365541',
          name: 'Текущий',
          beginDate: '2018-10-09T00:00:00Z',
          status: 2,
          entityIdentifier: { entityType: 5, identifier: '13224285' }
        },
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
        number: '40817810840002276980',
        name: 'Текущий',
        clientLabel: 'Кредитный 26800 рэ',
        balance: 0,
        availableBalance: 0,
        isWithReplenishment: true,
        isWithSubtraction: true,
        openDate: '2018-10-09T00:00:00Z',
        status: 2,
        entityIdentifier: { entityType: 5, identifier: '21358897' }
      },
      {
        product: {
          id: 21358897,
          type: 'account'
        },
        account: {
          id: '21358897',
          type: 'checking',
          title: 'Кредитный 26800 рэ',
          instrument: 'RUB',
          syncID: [
            '40817810840002276980'
          ],
          balance: 0
        }
      }
    ]
  ])('converts account', (apiAccount, accounts) => {
    expect(convertAccount(apiAccount)).toEqual(accounts)
  })
})
