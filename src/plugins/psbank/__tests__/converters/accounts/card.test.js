import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        cardAccountId: 149216921,
        cards: [
          {
            'cardId': 149216922,
            'account': {
              'cardAccountId': 149216922,
              'mainCreditLimit': 0.0,
              'isOwner': true,
              'programType': {
                'programTypeId': 16,
                'name': 'Зарплатная карта'
              },
              'accountType': 2,
              'tariffNameIndex': '84',
              'currency': {
                'currencyId': 1,
                'name': 'Российский рубль',
                'nameIso': 'RUR'
              },
              'office': {
                'officeId': 1,
                'briefName': 'Головной офис',
                'branch': {
                  'branchId': 1,
                  'briefName': 'Москва',
                  'bic': '044525555',
                  'corrAccount': '30101810400000000555',
                  'bank': {
                    'bankGroup': {
                      'bankGroupId': 1,
                      'name': 'Банковская группа Промсвязьбанк'
                    },
                    'bankId': 1,
                    'briefName': 'ПАО "Промсвязьбанк"',
                    'contactPhoneMoscow': '8 (495) 787-33-33',
                    'contactPhoneRussia': '8 (800) 333-03-03',
                    'bic': '044525555',
                    'inn': '7744000912',
                    'displayMember': '044525555',
                    'name': 'Публичное акционерное общество "Промсвязьбанк"',
                    'correspondenceAccount': '30101810400000000555'
                  }
                },
                'address': '109052 г.Москва, ул.Смирновская, д.10, стр.22'
              },
              'accountingBranch': {
                'branchId': 1,
                'briefName': 'Москва',
                'bic': '044525555',
                'corrAccount': '30101810400000000555',
                'bank': {
                  'bankGroup': {
                    'bankGroupId': 1,
                    'name': 'Банковская группа Промсвязьбанк'
                  },
                  'bankId': 1,
                  'briefName': 'ПАО "Промсвязьбанк"',
                  'contactPhoneMoscow': '8 (495) 787-33-33',
                  'contactPhoneRussia': '8 (800) 333-03-03',
                  'bic': '044525555',
                  'inn': '7744000912',
                  'displayMember': '044525555',
                  'name': 'Публичное акционерное общество "Промсвязьбанк"',
                  'correspondenceAccount': '30101810400000000555'
                }
              },
              'name': 'Our MIR Cards',
              'availableBalance': 0.0,
              'status': 2,
              'entityIdentifier': {
                'entityType': 209,
                'identifier': '149216922'
              }
            },
            'cardNumber': '220003..8163',
            'state': 255,
            'changePinCodeStatus': 1,
            'smallImageSrc': '/res/i/ci/B3CF33C2FFA3A34E2E54F00692195438.png',
            'largeImageSrc': '/res/i/ci/B3CF33C2FFA3A34E2E54F00692195438.png',
            'themeColor': '#959CAB',
            'isSmsNotificationActive': true,
            'is3DSecureActive': true,
            'isOwner': true,
            'productionDate': '2018-10-30T00:00:00Z',
            'expireDate': '2022-10-31T00:00:00Z',
            'name': 'Our MIR Cards',
            'type': 5,
            'cardProduct': {
              'cardProductId': 27,
              'name': 'МИР Классическая Привилегия Плюс'
            },
            'entityIdentifier': {
              'entityType': 207,
              'identifier': '149216922'
            },
            'tariffNameIndex': '84'
          }
        ],
        mainCreditLimit: 0.0,
        isOwner: true,
        programType: {
          'programTypeId': 16,
          'name': 'Зарплатная карта'
        },
        accountType: 2,
        tariffNameIndex: '84',
        currency: {
          'currencyId': 1,
          'name': 'Российский рубль',
          'nameIso': 'RUR'
        },
        office: {
          'officeId': 1,
          'briefName': 'Головной офис',
          'branch': {
            'branchId': 1,
            'briefName': 'Москва',
            'bic': '044525555',
            'corrAccount': '30101810400000000555',
            'bank': {
              'bankGroup': {
                'bankGroupId': 1,
                'name': 'Банковская группа Промсвязьбанк'
              },
              'bankId': 1,
              'briefName': 'ПАО "Промсвязьбанк"',
              'contactPhoneMoscow': '8 (495) 787-33-33',
              'contactPhoneRussia': '8 (800) 333-03-03',
              'bic': '044525555',
              'inn': '7744000912',
              'displayMember': '044525555',
              'name': 'Публичное акционерное общество "Промсвязьбанк"',
              'correspondenceAccount': '30101810400000000555'
            }
          },
          'address': '109052 г.Москва, ул.Смирновская, д.10, стр.22'
        },
        accountingBranch: {
          'branchId': 1,
          'briefName': 'Москва',
          'bic': '044525555',
          'corrAccount': '30101810400000000555',
          'bank': {
            'bankGroup': {
              'bankGroupId': 1,
              'name': 'Банковская группа Промсвязьбанк'
            },
            'bankId': 1,
            'briefName': 'ПАО "Промсвязьбанк"',
            'contactPhoneMoscow': '8 (495) 787-33-33',
            'contactPhoneRussia': '8 (800) 333-03-03',
            'bic': '044525555',
            'inn': '7744000912',
            'displayMember': '044525555',
            'name': 'Публичное акционерное общество "Промсвязьбанк"',
            'correspondenceAccount': '30101810400000000555'
          }
        },
        name: '40817810851008796880',
        availableBalance: 0.0,
        status: 2,
        entityIdentifier: {
          'entityType': 209,
          'identifier': '149216921'
        }
      },
      {
        product: {
          id: 149216921,
          type: 'card'
        },
        account: {
          id: '149216921',
          type: 'ccard',
          title: 'Зарплатная карта',
          instrument: 'RUB',
          syncID: [
            '220003******8163',
            '40817810851008796880'
          ],
          available: 0,
          creditLimit: 0
        }
      }
    ],
    [
      {
        cardAccountId: 147598578,
        cards: [
          {
            cardId: 147598579,
            account: {
              cardAccountId: 147598579,
              mainCreditLimit: 60000,
              isGrace: true,
              isOwner: true,
              programType: {
                programTypeId: 59,
                name: 'Двойной кэшбэк'
              },
              accountType: 2,
              tariffNameIndex: '260',
              currency: {
                currencyId: 1,
                name: 'Российский рубль',
                nameIso: 'RUR'
              },
              office: {
                officeId: 39,
                briefName: 'Сибирский',
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
                    briefName: 'ПАО \' Промсвязьбанк \'',
                    contactPhoneMoscow: '8 (495) 787-33-33',
                    contactPhoneRussia: '8 (800) 333-03-03',
                    bic: '044525555',
                    inn: '7744000912',
                    displayMember: '044525555',
                    name: 'Публичное акционерное общество \' Промсвязьбанк \'',
                    correspondenceAccount: '30101810400000000555'
                  }
                },
                address: '630099, Новосибирская область, г.Новосибирск, ул.Серебренниковская, д. 37а'
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
                  briefName: 'ПАО \' Промсвязьбанк \'',
                  contactPhoneMoscow: '8 (495) 787-33-33',
                  contactPhoneRussia: '8 (800) 333-03-03',
                  bic: '044525555',
                  inn: '7744000912',
                  displayMember: '044525555',
                  name: 'Публичное акционерное общество \' Промсвязьбанк \'',
                  correspondenceAccount: '30101810400000000555'
                }
              },
              name: 'Our EuroCard/MasterCard',
              availableBalance: 10028.97,
              status: 2,
              entityIdentifier: {
                entityType: 209,
                identifier: '147598579'
              }
            },
            cardNumber: '520373..0231',
            state: 255,
            pinCodeStatus: 3,
            changePinCodeStatus: 1,
            smallImageSrc: '/res/i/ci/D0ADF74D741F6B6C6910E2BACECC48D2.png',
            largeImageSrc: '/res/i/ci/13A2F7386E9081B829E04BC12CE8FA44.png',
            themeColor: '#959CAB',
            is3DSecureActive: true,
            isOwner: true,
            productionDate: '2018-10-02T00:00:00Z',
            expireDate: '2022-10-31T00:00:00Z',
            name: 'Our EuroCard/MasterCard',
            type: 2,
            cardProduct: {
              cardProductId: 23,
              name: 'MasterCard World'
            },
            entityIdentifier: {
              entityType: 207,
              identifier: '147598579'
            },
            tariffNameIndex: '260'
          }
        ],
        mainCreditLimit: 60000,
        isGrace: true,
        isOwner: true,
        programType: {
          programTypeId: 59,
          name: 'Двойной кэшбэк'
        },
        accountType: 2,
        tariffNameIndex: '260',
        currency: {
          currencyId: 1,
          name: 'Российский рубль',
          nameIso: 'RUR'
        },
        office: {
          officeId: 39,
          briefName: 'Сибирский',
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
              briefName: 'ПАО \' Промсвязьбанк \'',
              contactPhoneMoscow: '8 (495) 787-33-33',
              contactPhoneRussia: '8 (800) 333-03-03',
              bic: '044525555',
              inn: '7744000912',
              displayMember: '044525555',
              name: 'Публичное акционерное общество \' Промсвязьбанк \'',
              correspondenceAccount: '30101810400000000555'
            }
          },
          address: '630099, Новосибирская область, г.Новосибирск, ул.Серебренниковская, д. 37а'
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
            briefName: 'ПАО \' Промсвязьбанк \'',
            contactPhoneMoscow: '8 (495) 787-33-33',
            contactPhoneRussia: '8 (800) 333-03-03',
            bic: '044525555',
            inn: '7744000912',
            displayMember: '044525555',
            name: 'Публичное акционерное общество \' Промсвязьбанк \'',
            correspondenceAccount: '30101810400000000555'
          }
        },
        name: '40817810351008737145',
        availableBalance: 10028.97,
        status: 2,
        entityIdentifier: {
          entityType: 209,
          identifier: '147598578'
        }
      },
      {
        product: {
          id: 147598578,
          type: 'card'
        },
        account: {
          id: '147598578',
          type: 'ccard',
          title: 'Двойной кэшбэк',
          instrument: 'RUB',
          syncID: [
            '520373******0231',
            '40817810351008737145'
          ],
          available: 10028.97,
          creditLimit: 60000
        }
      }
    ],
    [
      {
        cardAccountId: 148578404,
        cards: [
          {
            cardId: 148578405,
            account: {
              cardAccountId: 148578405,
              mainCreditLimit: 0,
              isOwner: true,
              programType: { programTypeId: 16, name: 'Зарплатная карта' },
              accountType: 2,
              tariffNameIndex: '7',
              currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
              office: {
                officeId: 1,
                briefName: 'Головной офис',
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
                address: '109052 г.Москва, ул.Смирновская, д.10, стр.22'
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
              name: 'Our EuroCard/MasterCard',
              availableBalance: 0,
              status: 2,
              entityIdentifier: { entityType: 209, identifier: '148578405' }
            },
            cardNumber: '520373..6823',
            state: 255,
            pinCodeStatus: 3,
            changePinCodeStatus: 1,
            smallImageSrc: '/res/i/ci/DFF0DBA9B8AEA6D60D9F51AC06F20E13.png',
            largeImageSrc: '/res/i/ci/481A02033068DBD0AF34D324B54D91C4.png',
            themeColor: '#959CAB',
            isSmsNotificationActive: true,
            isOwner: true,
            productionDate: '2018-10-12T00:00:00Z',
            expireDate: '2022-10-31T00:00:00Z',
            name: 'Our EuroCard/MasterCard',
            type: 2,
            productTariffUrl: 'http://www.psbank.ru/~/media/Files/Product Documents/Personal/tar_card.ashx',
            cardProduct: { cardProductId: 23, name: 'MasterCard World' },
            entityIdentifier: { entityType: 207, identifier: '148578405' },
            tariffNameIndex: '7'
          }
        ],
        mainCreditLimit: 0,
        isOwner: true,
        programType: { programTypeId: 16, name: 'Зарплатная карта' },
        accountType: 2,
        tariffNameIndex: '7',
        currency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        office: {
          officeId: 1,
          briefName: 'Головной офис',
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
          address: '109052 г.Москва, ул.Смирновская, д.10, стр.22'
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
        name: '40817810551008759347',
        clientLabel: 'ЗП',
        availableBalance: 0,
        status: 2,
        entityIdentifier: { entityType: 209, identifier: '148578404' }
      },
      {
        product: {
          id: 148578404,
          type: 'card'
        },
        account: {
          id: '148578404',
          type: 'ccard',
          title: 'Зарплатная карта',
          instrument: 'RUB',
          syncID: [
            '520373******6823',
            '40817810551008759347'
          ],
          available: 0,
          creditLimit: 0
        }
      }
    ],
    [
      {
        cardAccountId: 155051465,
        cards: [
          {
            cardId: 155051467,
            account: {
              cardAccountId: 155051467,
              mainCreditLimit: 0,
              isOwner: true,
              programType: { programTypeId: 58, name: 'Твой кэшбэк' },
              accountType: 2,
              tariffNameIndex: '259',
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
              name: 'Our EuroCard/MasterCard',
              availableBalance: 5256.04,
              status: 2,
              entityIdentifier: { entityType: 209, identifier: '155051467' }
            },
            cardNumber: '520373..7923',
            state: 255,
            pinCodeStatus: 3,
            changePinCodeStatus: 1,
            smallImageSrc: '/res/i/ci/9AB16508337AFC9B593E27E4BF1D9DC9.png',
            largeImageSrc: '/res/i/ci/FDE06FFC78F761ED3430FB6AF28AD90B.png',
            themeColor: '#959CAB',
            isSmsNotificationActive: true,
            is3DSecureActive: true,
            isOwner: true,
            productionDate: '2019-01-16T00:00:00Z',
            expireDate: '2023-01-31T00:00:00Z',
            name: 'Our EuroCard/MasterCard',
            type: 2,
            cardProduct: { cardProductId: 23, name: 'MasterCard World' },
            entityIdentifier: { entityType: 207, identifier: '155051467' },
            tariffNameIndex: '259'
          }
        ],
        mainCreditLimit: 0,
        isOwner: true,
        programType: { programTypeId: 58, name: 'Твой кэшбэк' },
        accountType: 2,
        tariffNameIndex: '259',
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
        name: '40817810251008985343',
        availableBalance: 5256.04,
        status: 2,
        entityIdentifier: { entityType: 209, identifier: '155051465' }
      },
      {
        product: {
          id: 155051465,
          type: 'card'
        },
        account: {
          id: '155051465',
          type: 'ccard',
          title: 'Твой кэшбэк',
          instrument: 'RUB',
          syncID: [
            '520373******7923',
            '40817810251008985343'
          ],
          available: 5256.04,
          creditLimit: 0
        }
      }
    ]
  ])('converts card account', (apiAccount, accounts) => {
    expect(convertAccount(apiAccount)).toEqual(accounts)
  })
})
