import { processAccounts } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5010002939',
              currency: '933',
              balance: 96.8,
              openDate: 1566334800000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027200105010002939',
              productCode: '501',
              productName: 'Зарплатная Банк BYN',
              contractId: '201876474',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 5170',
                    cardHash: 'SfqwCdDKhPV9RICHwbbzwXA1Kbaox-d_lL8Tw0vMxlgT1Wz_-MrvYfinXOvwhiSAAx-Aj7jY24CJ96XOtIL8AQ',
                    cardType:
                      {
                        value: 38,
                        name: ' ',
                        imageUri: 'https://alseda.by/media/public/VG_ZP_1.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'INACTIVE',
                    expireDate: 1693429200000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Gold BYN.Пакет Зарплатный премиум с манибэк',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '4005' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 750,
                    additionalCardType: 2,
                    canChange3D: true,
                    cardDepartmentName: 'Центральное отделение',
                    cardDepartmentAddress: 'г. Минск;ул. Коммунистическая 49',
                    canChangeStatus: true,
                    retailCardId: 262032623,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    statusReason: '261',
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  },
                  {
                    cardNumberMasked: '4*** **** **** 0027',
                    cardHash: 'lIUdkHSEqam9vQXbr5QG8NIEX8jRSCBqr6451L4xLnXAmi1SRU490vjeazLX9mFEk5PNilnw4vMIsicfCAB-cA',
                    cardType:
                      {
                        value: 38,
                        name: ' ',
                        imageUri: 'https://alseda.by/media/public/VG_ZP_1.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1693429200000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Gold BYN.Пакет Зарплатный премиум с манибэк',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 750,
                    additionalCardType: 2,
                    canChange3D: true,
                    cardDepartmentName: 'Доставка почтой',
                    cardDepartmentAddress: 'г. Минск и другие города РБ; По почте',
                    canChangeStatus: true,
                    retailCardId: 262756093,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '1',
              rkcName: 'Центральное отделение',
              accountType: '1',
              ibanNum: 'BY64MMBN30140001005010008428',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '6000078901',
              currency: '840',
              balance: 414.03,
              openDate: 1604610000000,
              accountNumber: 'BY10MMBN30140000840008400000',
              cardAccountNumber: '027201006000078901',
              productCode: '600',
              productName: 'Личная USD',
              contractId: '272436413',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 4146',
                    cardHash: 'mL6GRkaVnsKiHqso99M25zWT4biOk34YWl3YyxRitZaeNziyqlliCKRDxiYvqbQnt_KK_2tiigDGlD_fe-FibQ',
                    cardType:
                      {
                        value: 55,
                        name: 'Mastercard Standard. Пакет Классический',
                        imageUri: 'https://alseda.by/media/public/Mastercard_Standard.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                        textColor: 'ffffffff',
                        paySystemName: 'Mastercard'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1764450000000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'Без Платы.БГПБ Masterсard Standard USD.Пакет Классический',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1572,
                    canChange3D: true,
                    cardDepartmentName: 'Центральное отделение',
                    cardDepartmentAddress: 'г. Минск;ул. Коммунистическая 49',
                    canChangeStatus: true,
                    retailCardId: 272436415,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '1',
              ibanNum: 'BY03MMBN30140010006000078901',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '6110013446',
              currency: '978',
              openDate: 1628197200000,
              accountNumber: 'BY36MMBN30140000978009780000',
              cardAccountNumber: '027201006110013446',
              productCode: '611',
              productName: 'Личная EUR',
              contractId: '308887885',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              reissueCards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 0826',
                    cardType:
                      {
                        value: 64,
                        name: 'Mastercard Standard. Пакет Классический',
                        imageUri: 'https://alseda.by/media/public/Mastercard_Standard_D_MC_ST_BLUE.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                        textColor: 'ffffffff',
                        paySystemName: 'Mastercard'
                      },
                    cardStatus: 'INACTIVE',
                    expireDate: 1788123600000,
                    owner: 'NIKOLAY NIKOLAEV',
                    processing: '2',
                    stateSignature: 'DORECEIVED',
                    additionalCardType: 1,
                    canChange3D: true,
                    cardDepartmentName: 'Доставка почтой',
                    cardDepartmentAddress: 'г. Минск и другие города РБ; По почте'
                  }
                ],
              bankCode: '288',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '1',
              ibanNum: 'BY74MMBN30140010006110013446',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            }
          ],
        depositAccount:
          [
            {
              internalAccountId: '15740000155',
              currency: '840',
              openDate: 1625778000000,
              endDate: 1633726800000,
              accountNumber: 'BY68MMBN34140000000008400000',
              productCode: '1574',
              productName: 'Вклад "Хуткi" в USD,EUR,RUB',
              balanceAmount: 5046.45,
              contractId: '304968603',
              interestRate: 2.4,
              accountStatus: 'OPEN',
              bankCode: '288',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '0',
              ibanNum: 'BY30MMBN34140010015740000155',
              canSell: false,
              canCloseSameCurrency: true,
              canCloseOtherCurrency: true,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true,
              plannedEndDate: 1633726800000,
              bare: false,
              canOnlineWithdrawPercentsToAnotherAccountWithSameCurrency: true,
              canOnlineWithdrawPercentsToAnotherAccountWithAnotherCurrency: true,
              irrevocable: false
            },
            {
              internalAccountId: '15680000738',
              currency: '933',
              openDate: 1628456400000,
              endDate: 1636405200000,
              accountNumber: 'BY70MMBN34140000000009330000',
              productCode: '1568',
              productName: 'Вклад "На Мару" в BYN',
              balanceAmount: 10,
              contractId: '309082522',
              interestRate: 13,
              accountStatus: 'OPEN',
              bankCode: '288',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '0',
              ibanNum: 'BY93MMBN34140010015680000738',
              canSell: false,
              canCloseSameCurrency: true,
              canCloseOtherCurrency: true,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true,
              plannedEndDate: 1636405200000,
              bare: false,
              canOnlineWithdrawPercentsToAnotherAccountWithSameCurrency: true,
              canOnlineWithdrawPercentsToAnotherAccountWithAnotherCurrency: true,
              irrevocable: false
            }
          ],
        currentAccount:
          [
            {
              internalAccountId: '1030004194',
              currency: '840',
              openDate: 1604610000000,
              accountNumber: 'BY77MMBN30140000000008400000',
              productCode: '103',
              productName: 'Текущий валютный счет',
              balanceAmount: 0,
              contractId: '272436517',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY60MMBN30140010001030004194',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true
            },
            {
              internalAccountId: '1030004645',
              currency: '643',
              openDate: 1618174800000,
              accountNumber: 'BY30MMBN30140000000006430000',
              productCode: '103',
              productName: 'Текущий валютный счет',
              balanceAmount: 0,
              contractId: '292715209',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY08MMBN30140010001030004645',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true
            },
            {
              internalAccountId: '0030009044',
              currency: '933',
              openDate: 1628110800000,
              accountNumber: 'BY79MMBN30140000000009330000',
              productCode: '3',
              productName: 'Текущий счет BYN',
              balanceAmount: 0,
              contractId: '308778536',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY08MMBN30140010000030009044',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true
            }
          ]
      },
      [
        {
          product: {
            id: '15740000155',
            accountType: '0',
            currencyCode: '840'
          },
          account: {
            balance: 5046.45,
            capitalization: true,
            endDateOffset: 92,
            endDateOffsetInterval: 'day',
            id: '15740000155',
            instrument: 'USD',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 2.4,
            startBalance: 5046.45,
            startDate: new Date('2021-07-08T21:00:00.000Z'),
            syncIds: [
              '15740000155'
            ],
            title: 'Вклад "Хуткi" в USD,EUR,RUB',
            type: 'deposit'
          }
        },
        {
          product: {
            id: '15680000738',
            accountType: '0',
            currencyCode: '933'
          },
          account: {
            balance: 10,
            capitalization: true,
            endDateOffset: 92,
            endDateOffsetInterval: 'day',
            id: '15680000738',
            instrument: 'BYN',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 13,
            startBalance: 10,
            startDate: new Date('2021-08-08T21:00:00.000Z'),
            syncIds: [
              '15680000738'
            ],
            title: 'Вклад "На Мару" в BYN',
            type: 'deposit'
          }
        },
        {
          product: {
            id: '1030004194',
            accountType: '5',
            currencyCode: '840'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '1030004194',
            instrument: 'USD',
            savings: false,
            syncIds: [
              '1030004194'
            ],
            title: 'Текущий валютный счет',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            id: '1030004645',
            accountType: '5',
            currencyCode: '643'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '1030004645',
            instrument: 'RUB',
            savings: false,
            syncIds: [
              '1030004645'
            ],
            title: 'Текущий валютный счет',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            id: '0030009044',
            accountType: '5',
            currencyCode: '933'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '0030009044',
            instrument: 'BYN',
            savings: false,
            syncIds: [
              '0030009044'
            ],
            title: 'Текущий счет BYN',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            id: '5010002939',
            cardHash: 'SfqwCdDKhPV9RICHwbbzwXA1Kbaox-d_lL8Tw0vMxlgT1Wz_-MrvYfinXOvwhiSAAx-Aj7jY24CJ96XOtIL8AQ',
            type: 'ccard',
            currencyCode: '933',
            rkcCode: '1'
          },
          account: {
            id: '5010002939',
            type: 'ccard',
            title: 'Зарплатная Банк BYN',
            instrument: 'BYN',
            syncIds: [
              '4***********5170',
              '4***********0027'
            ],
            balance: 96.8
          }
        },
        {
          product: {
            id: '6000078901',
            cardHash: 'mL6GRkaVnsKiHqso99M25zWT4biOk34YWl3YyxRitZaeNziyqlliCKRDxiYvqbQnt_KK_2tiigDGlD_fe-FibQ',
            type: 'ccard',
            currencyCode: '840',
            rkcCode: '10'
          },
          account: {
            id: '6000078901',
            type: 'ccard',
            title: 'Личная USD',
            instrument: 'USD',
            syncIds: [
              '5***********4146'
            ],
            balance: 414.03
          }
        },
        null
      ]
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5020028311',
              currency: '933',
              balance: 81.74,
              openDate: 1615323600000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027211205020028311',
              productCode: '502',
              productName: 'Зарплатная МТС/Исключительная',
              contractId: '288746509',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 3330',
                    cardHash: '45BOYgj663x47b29hzLbVvNZs2BaoTUkbsW-HtdiWGSiNojcp4p72929J8OclqE608gjNBD60ga3sariIb4GQg',
                    cardType:
                      {
                        value: 30,
                        name: 'Masterсard Standard. Пакет Исключительный Специальный',
                        imageUri: 'https://alseda.by/media/public/MasterCard_Standard_zp.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                        textColor: 'ffffffff',
                        paySystemName: 'Mastercard'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1703970000000,
                    owner: 'INSTANT ISKL',
                    tariffName: 'БГПБ Masterсard Standard BYN. Пакет Исключительный Специальный instant',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 873,
                    canChange3D: true,
                    cardDepartmentName: 'Офис "На Лобанка"',
                    cardDepartmentAddress: 'г. Минск;ул. Лобанка 22',
                    canChangeStatus: true,
                    retailCardId: 278089193,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '112',
              rkcName: 'Офис "На Лобанка"',
              accountType: '1',
              ibanNum: 'BY34MMBN30140112005020028311',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            }
          ]
      },
      [
        {
          product: {
            id: '5020028311',
            cardHash: '45BOYgj663x47b29hzLbVvNZs2BaoTUkbsW-HtdiWGSiNojcp4p72929J8OclqE608gjNBD60ga3sariIb4GQg',
            currencyCode: '933',
            rkcCode: '112',
            type: 'ccard'
          },
          account: {
            id: '5020028311',
            balance: 81.74,
            instrument: 'BYN',
            syncIds: ['5***********3330'],
            title: 'Зарплатная МТС/Исключительная',
            type: 'ccard'
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(processAccounts(apiAccounts)).toEqual(accounts)
  })
})
