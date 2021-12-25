import { convertAccounts } from '../../../converters'

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
            type: 'deposit',
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
            type: 'deposit',
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
            type: 'checking',
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
            type: 'checking',
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
            type: 'checking',
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
            accountType: '1',
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
            accountType: '1',
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
                    owner: 'NIKOLAY NIKOLAEV',
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
            accountType: '1',
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
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5000019048',
              balance: 0,
              currencyCode: 933,
              currency: '933',
              openDate: 1594242000000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027201005000019048',
              productCode: '500',
              productName: 'Личная BYN',
              contractId: '256687256',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 5301',
                    cardHash: 'D77wHhvHapGnfxwfGpDCFQeHISg_-WtOu2wqxW2Nc7jK2vbCD5kB23eOynBs8VP0OJsts4aTNWPUfhpulVAMww',
                    cardType:
                      {
                        value: 35,
                        name: 'Visa Classic',
                        imageUri: 'https://alseda.by/media/public/VC_LCH_1.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1753909200000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'Без платы.БГПБ Visa Classic BYN.Пакет Классический',
                    personalizedName: 'Visa Classic BYN',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1413,
                    canChange3D: true,
                    cardDepartmentName: 'Доставка почтой',
                    cardDepartmentAddress: 'г. Минск и другие города РБ; По почте',
                    canChangeStatus: true,
                    retailCardId: 256687258,
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
              ibanNum: 'BY59MMBN30140010005000019048',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '5910000253',
              balance: 500,
              currencyCode: 933,
              currency: '933',
              openDate: 1612818000000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027200105910000253',
              productCode: '591',
              productName: 'НОВАЯ в BYN',
              contractId: '285019532',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 9454',
                    cardHash: 'WRr0sHdJDt6it-ejIDzb-akG-By2CCJHUraJOgJAUl5BOsTnRjltEMTKry35a2vgUCn4tbH2ON7QS8n7cnu2VQ',
                    cardType:
                      {
                        value: 35,
                        name: 'Visa Classic',
                        imageUri: 'https://alseda.by/media/public/VC_LCH_1.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1753909200000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Classic BYN. Пакет НОВАЯ Instant',
                    personalizedName: 'Новая - Visa Classic',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1413,
                    canChange3D: true,
                    cardDepartmentName: 'Офис "Уручье"',
                    cardDepartmentAddress: 'г. Минск;пр. Независимости 185',
                    canChangeStatus: true,
                    retailCardId: 256510112,
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
              ibanNum: 'BY38MMBN30140001005910000253',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            }
          ],
        creditAccount:
          [
            {
              internalAccountId: '5910000253',
              currency: '933',
              openDate: 1612818000000,
              accountNumber: 'BY11MMBN24270600093300000000',
              productCode: '27365',
              productName: '6000_"Новая" кредитная карта "',
              balanceAmount: 0,
              contractId: '285019524',
              accountStatus: 'OPEN',
              rkcCode: '1',
              rkcName: 'Центральное отделение',
              accountType: '51',
              plannedEndDate: 1771534800000,
              associatedAccount: '5910000253',
              limit: 500
            }
          ]
      },
      [
        {
          product: {
            id: '5000019048',
            cardHash: 'D77wHhvHapGnfxwfGpDCFQeHISg_-WtOu2wqxW2Nc7jK2vbCD5kB23eOynBs8VP0OJsts4aTNWPUfhpulVAMww',
            currencyCode: '933',
            rkcCode: '10',
            accountType: '1',
            type: 'ccard'
          },
          account: {
            id: '5000019048',
            balance: 0,
            instrument: 'BYN',
            syncIds: ['4***********5301'],
            title: 'Visa Classic BYN',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '5910000253',
            cardHash: 'WRr0sHdJDt6it-ejIDzb-akG-By2CCJHUraJOgJAUl5BOsTnRjltEMTKry35a2vgUCn4tbH2ON7QS8n7cnu2VQ',
            currencyCode: '933',
            rkcCode: '1',
            accountType: '1',
            type: 'ccard'
          },
          account: {
            id: '5910000253',
            balance: 0,
            creditLimit: 500,
            instrument: 'BYN',
            syncIds: ['4***********9454'],
            title: 'Новая - Visa Classic',
            type: 'ccard'
          }
        }
      ]
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5000019640',
              balance: 4.85,
              currencyCode: 933,
              currency: '933',
              openDate: 1604091600000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027201005000019640',
              productCode: '500',
              productName: 'Личная BYN',
              contractId: '271602907',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 2552',
                    cardHash: 'DZX2z-sMk6m0uw-ajg65hJ5VXXOUH62blQZDldJQmDzdjL7pVdDYDeTsotfG-_eS3VVCPbX2limivQuMB65-BQ',
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
                    expireDate: 1761858000000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'Без Платы.БГПБ Masterсard Standard BYN.Пакет Классический',
                    personalizedName: 'Классический',
                    displayOnMain: 1,
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1505,
                    canChange3D: true,
                    cardDepartmentName: 'Доставка почтой',
                    cardDepartmentAddress: 'г. Минск и другие города РБ; По почте',
                    canChangeStatus: true,
                    retailCardId: 271602909,
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
              ibanNum: 'BY80MMBN30140010005000019640',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '5020028683',
              balance: 0,
              currencyCode: 933,
              currency: '933',
              openDate: 1617051600000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027201505020028683',
              productCode: '502',
              productName: 'Зарплатная МТС/Исключительная',
              contractId: '290917882',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 8085',
                    cardHash: 'gv_iC_H2pncO2FkM9lSYflRBnILc1zRarjGRaY1eBNzNtMZy7YRI69TtquCuDn8Et8ZRE6jNEPyL7DW6odj9XA',
                    cardType:
                      {
                        value: 61,
                        name: ' ',
                        imageUri: 'https://alseda.by/media/public/VG_LCH_1.png\r\n',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1711832400000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Gold BYN. Пакет Исключительный Премиум',
                    personalizedName: 'Исключительный Премиум',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 926,
                    canChange3D: true,
                    cardDepartmentName: 'Отдел дистанционных продаж',
                    cardDepartmentAddress: 'г. Минск; В офисе Банка Дабрабыт ',
                    canChangeStatus: true,
                    retailCardId: 290917884,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '15',
              rkcName: 'Отдел дистанционных продаж',
              accountType: '1',
              ibanNum: 'BY78MMBN30140015005020028683',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '6370005252',
              balance: 0,
              currencyCode: 933,
              currency: '933',
              openDate: 1617310800000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027201006370005252',
              productCode: '637',
              productName: 'Матуля BYN',
              contractId: '291774254',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 1210',
                    cardHash: 'LTgTPAHKxepqqEoE86rbe5_ERaM7g1-Y1Ns2-G7SnxgDTD4VPMWCb3ZkBtcP-xg90L9f1BEEpVZ1KWhYlQQSew',
                    cardType:
                      {
                        value: 39,
                        name: 'Visa Gold',
                        imageUri: 'https://alseda.by/media/public/Dabrabyt_Mama_PRO.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1714424400000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Gold BYN. Пакет Матуля',
                    personalizedName: 'Матуля',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 956,
                    canChange3D: true,
                    cardDepartmentName: 'Доставка почтой',
                    cardDepartmentAddress: 'г. Минск и другие города РБ; По почте',
                    canChangeStatus: true,
                    retailCardId: 291774256,
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
              ibanNum: 'BY53MMBN30140010006370005252',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            }
          ],
        currentAccount:
          [
            {
              internalAccountId: '0030008297',
              currency: '933',
              openDate: 1626728400000,
              accountNumber: 'BY79MMBN30140000000009330000',
              productCode: '3',
              productName: 'Текущий счет BYN',
              balanceAmount: 0,
              contractId: '306482336',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY98MMBN30140010000030008297',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true
            }
          ],
        creditAccount:
          [
            {
              internalAccountId: '555344100666',
              currency: '933',
              openDate: 1626210000000,
              accountNumber: 'BY61MMBN24270530097409330000',
              productCode: '27469',
              productName: '5300_Легкий 18 мес Партнеры',
              balanceAmount: 606.32,
              contractId: '305501889',
              accountStatus: 'OPEN',
              rkcCode: '1',
              rkcName: 'Центральное отделение',
              accountType: '50',
              plannedEndDate: 1673557200000
            }
          ]

      },
      [
        {
          product: {
            accountType: '5',
            type: 'checking',
            currencyCode: '933',
            id: '0030008297'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '0030008297',
            instrument: 'BYN',
            savings: false,
            syncIds: ['0030008297'],
            title: 'Текущий счет BYN',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            cardHash: 'DZX2z-sMk6m0uw-ajg65hJ5VXXOUH62blQZDldJQmDzdjL7pVdDYDeTsotfG-_eS3VVCPbX2limivQuMB65-BQ',
            currencyCode: '933',
            id: '5000019640',
            rkcCode: '10',
            accountType: '1',
            type: 'ccard'
          },
          account: {
            balance: 4.85,
            id: '5000019640',
            instrument: 'BYN',
            syncIds: ['5***********2552'],
            title: 'Классический',
            type: 'ccard'
          }
        },
        {
          product: {
            cardHash: 'gv_iC_H2pncO2FkM9lSYflRBnILc1zRarjGRaY1eBNzNtMZy7YRI69TtquCuDn8Et8ZRE6jNEPyL7DW6odj9XA',
            currencyCode: '933',
            id: '5020028683',
            rkcCode: '15',
            accountType: '1',
            type: 'ccard'
          },
          account: {
            balance: 0,
            id: '5020028683',
            instrument: 'BYN',
            syncIds: ['4***********8085'],
            title: 'Исключительный Премиум',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '6370005252',
            cardHash: 'LTgTPAHKxepqqEoE86rbe5_ERaM7g1-Y1Ns2-G7SnxgDTD4VPMWCb3ZkBtcP-xg90L9f1BEEpVZ1KWhYlQQSew',
            currencyCode: '933',
            rkcCode: '10',
            accountType: '1',
            type: 'ccard'
          },
          account: {
            balance: 0,
            id: '6370005252',
            instrument: 'BYN',
            syncIds: ['4***********1210'],
            title: 'Матуля',
            type: 'ccard'
          }
        },
        {
          product: {
            id: '555344100666',
            accountType: '50',
            type: 'loan',
            currencyCode: '933'
          },
          account: {
            balance: 606.32,
            capitalization: true,
            endDateOffset: 548,
            endDateOffsetInterval: 'day',
            id: '555344100666',
            instrument: 'BYN',
            limit: 0,
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 0,
            startBalance: 606.32,
            startDate: new Date('2021-07-13T21:00:00.000Z'),
            syncIds: ['555344100666'],
            title: '5300_Легкий 18 мес Партнеры',
            type: 'loan'
          }
        }
      ]
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '600-584 USD',
              balance: 636.59,
              currencyCode: 840,
              currency: '840',
              openDate: 1217538000000,
              accountNumber: 'BY10MMBN30140000840008400000',
              cardAccountNumber: '027200116000000584',
              productCode: '600',
              productName: 'Личная USD',
              contractId: '56168172',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 5793',
                    cardHash: 'dR9yiP-m9e3R_B0I_MlCo_nSueCz6n5ksIxMcXcwK2XdzGW1SrqVCEfV1p5P-AYsw5A1k5hbQ6o-Et9PeLjVcw',
                    cardType:
                      {
                        value: 26,
                        name: 'Visa Classic',
                        imageUri: 'https://alseda.by/media/public/Visa_Classic_zp.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1727643600000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'Без платы.БГПБ Visa Classic USD.Пакет Классический',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1105,
                    additionalCardType: 2,
                    canChange3D: true,
                    cardDepartmentName: 'Офис "На Танка" (Закрыто с 01.11.2020)',
                    cardDepartmentAddress: 'г. Минск;ул. Танка 10а',
                    canChangeStatus: true,
                    retailCardId: 206164267,
                    applePaySupported: true,
                    pinDeliveryType: 0,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '102',
              rkcName: 'Офис "На Танка" (Закрыто с 01.11.2020)',
              accountType: '1',
              ibanNum: 'BY19MMBN30140102006000000584',
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
            id: '600-584 USD',
            accountType: '1',
            type: 'ccard',
            cardHash: 'dR9yiP-m9e3R_B0I_MlCo_nSueCz6n5ksIxMcXcwK2XdzGW1SrqVCEfV1p5P-AYsw5A1k5hbQ6o-Et9PeLjVcw',
            currencyCode: '840',
            rkcCode: '102'
          },
          account: {
            id: '600-584 USD',
            balance: 636.59,
            instrument: 'USD',
            syncIds: ['4***********5793'],
            title: 'Личная USD',
            type: 'ccard'
          }
        }
      ]
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5240034533',
              currency: '933',
              balance: 54.48,
              currencyCode: 933,
              openDate: 1627246800000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027200205240034533',
              productCode: '524',
              productName: 'Зарплатная BYN',
              contractId: '307108272',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 9416',
                    cardHash: '-K6Vvu_JKf01uHyDFv6oQxdfxreduoVQe5_YrUgjH8oLZE7jRNBeYlTdnYqYs-gUkjbB8C52VN6YMgZ8tHFjtA',
                    cardType:
                      {
                        value: 62,
                        name: 'БГПБ Visa Classic',
                        imageUri: 'https://alseda.by/media/public/ePWX_Bij.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1722373200000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Visa Classic BYN.Пакет Зарплатный классик с манибэк',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1040,
                    canChange3D: true,
                    cardDepartmentName: 'Управление по Гродненской области',
                    cardDepartmentAddress: 'г. Гродно;ул. Б.Троицкая 1',
                    canChangeStatus: true,
                    retailCardId: 307108274,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    canReissueOldExpire: true,
                    canReissueNewExpire: true
                  }
                ],
              bankCode: '288',
              rkcCode: '2',
              rkcName: 'Управление по Гродненской области',
              accountType: '1',
              ibanNum: 'BY95MMBN30140002005240034533',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            }
          ],
        currentAccount:
          [
            {
              internalAccountId: '0030008294',
              currency: '933',
              openDate: 1626728400000,
              accountNumber: 'BY79MMBN30140000000009330000',
              productCode: '3',
              productName: 'Текущий счет BYN',
              balanceAmount: 0,
              contractId: '306451946',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY82MMBN30140010000030008294',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true
            }
          ],
        corporateCardAccount: // Нужно ли обрабатывать ???
          [
            {
              internalAccountId: '8000001185',
              productCode: '800',
              accountStatus: 'OPEN',
              corpoCards:
                [
                  {
                    cardNumberMasked: '4*** **** **** 7120',
                    cardHash: 'jupXHU9UqJg6Rt5awPeSxHyfdK3F_N_oCQJvC3cRoggWVUdFA_DGQ2UnM0RZJBhAK1gvF43N2tI3LM4wiKEbtg',
                    cardType:
                      {
                        value: 60,
                        name: 'Корпоративный',
                        imageUri: 'https://alseda.by/media/public/Visa_Classic_corpo.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_visa.png',
                        textColor: 'ffffffff',
                        paySystemName: 'VISA'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1690750800000,
                    owner: 'NIKOLAY NIKOLAEV',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    currency: '933',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 674,
                    canChange3D: true,
                    canChangeStatus: true,
                    applePaySupported: true,
                    pinDeliveryType: 1,
                    cardAccountCurrency: [933]
                  }
                ],
              accountUNP: '591037595'
            }
          ]
      },
      [
        {
          product: {
            accountType: '5',
            currencyCode: '933',
            id: '0030008294',
            type: 'checking'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '0030008294',
            instrument: 'BYN',
            savings: false,
            syncIds: ['0030008294'],
            title: 'Текущий счет BYN',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            accountType: '1',
            cardHash: '-K6Vvu_JKf01uHyDFv6oQxdfxreduoVQe5_YrUgjH8oLZE7jRNBeYlTdnYqYs-gUkjbB8C52VN6YMgZ8tHFjtA',
            currencyCode: '933',
            id: '5240034533',
            rkcCode: '2',
            type: 'ccard'
          },
          account: {
            balance: 54.48,
            id: '5240034533',
            instrument: 'BYN',
            syncIds: ['4***********9416'],
            title: 'Зарплатная BYN',
            type: 'ccard'
          }
        },
        {
          product: {
            accountType: '1', // ???
            cardHash: 'jupXHU9UqJg6Rt5awPeSxHyfdK3F_N_oCQJvC3cRoggWVUdFA_DGQ2UnM0RZJBhAK1gvF43N2tI3LM4wiKEbtg',
            currencyCode: '933',
            id: '8000001185',
            rkcCode: '2', // ???
            type: 'ccard'
          },
          account: {
            balance: undefined, // ??? После Запроса баланса
            id: '8000001185',
            instrument: 'BYN',
            syncIds: ['4***********7120'],
            title: 'Корпоративный',
            type: 'ccard'
          }
        }
      ]
    ],
    [
      {
        cardAccount:
          [
            {
              internalAccountId: '5020034798',
              currency: '933',
              balance: 0,
              currencyCode: 933,
              openDate: 1633294800000,
              accountNumber: 'BY93MMBN30140000974009330000',
              cardAccountNumber: '027200105020034798',
              productCode: '502',
              productName: 'Зарплатная МТС/Исключительная',
              contractId: '318173203',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 6291',
                    cardHash: '9kiqaCe4N93X5nfF82yO1n9ghyTnIC2i2I6Iz2jEo0psK4I1tOqfCw9riijgF1OcSGcGoFfhK4zfcRKSCRBMzA',
                    cardType:
                      {
                        value: 64,
                        name: 'Masterсard Standard. Пакет Исключительный Специальный',
                        imageUri: 'https://alseda.by/media/public/Mastercard_Standard_D_MC_ST_BLUE.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                        textColor: 'ffffffff',
                        paySystemName: 'Mastercard'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1730322000000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'БГПБ Masterсard Standard BYN. Пакет Исключительный Специальный',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1069,
                    canChange3D: true,
                    cardDepartmentName: 'Центральное отделение',
                    cardDepartmentAddress: 'г. Минск;ул. Коммунистическая 49',
                    canChangeStatus: true,
                    retailCardId: 318173205,
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
              ibanNum: 'BY52MMBN30140001005020034798',
              canSell: false,
              canCloseSameCurrency: false,
              canCloseOtherCurrency: false,
              canClose: false,
              canRefillSameCurrency: false,
              canRefillOtherCurrency: false,
              canRefill: false
            },
            {
              internalAccountId: '6110013726',
              currency: '978',
              balance: 0,
              currencyCode: 978,
              openDate: 1633467600000,
              accountNumber: 'BY36MMBN30140000978009780000',
              cardAccountNumber: '027201006110013726',
              productCode: '611',
              productName: 'Личная EUR',
              contractId: '318472123',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              cards:
                [
                  {
                    cardNumberMasked: '5*** **** **** 2972',
                    cardHash: 'swlLTWq18-LMw4H7FtrUPVIokBR5cna3qzHDDw2N0oLLyqJAr7LBgnpcWPbLZU2D5ohe621KDJhyI2b-gJqHKg',
                    cardType:
                      {
                        value: 64,
                        name: 'Mastercard Standard. Пакет Классический',
                        imageUri: 'https://alseda.by/media/public/Mastercard_Standard_D_MC_ST_BLUE.png',
                        paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                        textColor: 'ffffffff',
                        paySystemName: 'Mastercard'
                      },
                    cardStatus: 'OPEN',
                    expireDate: 1793394000000,
                    owner: 'NIKOLAY NIKOLAEV',
                    tariffName: 'Без Платы.БГПБ Masterсard Standard EUR.Пакет Классический',
                    notDisplayNotification: 0,
                    processing: '2',
                    payment: '0',
                    status: { code: '0' },
                    stateSignature: 'BETRAY',
                    numberDaysBeforeCardExpiry: 1799,
                    canChange3D: true,
                    cardDepartmentName: 'Центральное отделение',
                    cardDepartmentAddress: 'г. Минск;ул. Коммунистическая 49',
                    canChangeStatus: true,
                    retailCardId: 318472125,
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
              ibanNum: 'BY80MMBN30140010006110013726',
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
              internalAccountId: '15700000793',
              currency: '978',
              openDate: 1633640400000,
              endDate: 1641589200000,
              accountNumber: 'BY96MMBN34140000000009780000',
              productCode: '1570',
              productName: 'Вклад "Шчодры" в USD,EUR,RUB',
              balanceAmount: 425.86,
              contractId: '318889107',
              interestRate: 3.65,
              accountStatus: 'OPEN',
              bankCode: '288',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '0',
              ibanNum: 'BY33MMBN34140010015700000793',
              canSell: false,
              canCloseSameCurrency: true,
              canCloseOtherCurrency: true,
              canClose: false,
              canRefillSameCurrency: true,
              canRefillOtherCurrency: true,
              canRefill: true,
              plannedEndDate: 1641589200000,
              bare: false,
              canOnlineWithdrawPercentsToAnotherAccountWithSameCurrency: true,
              canOnlineWithdrawPercentsToAnotherAccountWithAnotherCurrency: true,
              irrevocable: false
            }
          ],
        currentAccount:
          [
            {
              internalAccountId: '0030009507',
              currency: '933',
              openDate: 1629147600000,
              accountNumber: 'BY79MMBN30140000000009330000',
              productCode: '3',
              productName: 'Текущий счет BYN',
              balanceAmount: 0,
              contractId: '310419561',
              interestRate: 0.0001,
              accountStatus: 'OPEN',
              rkcCode: '10',
              rkcName: 'СДБО физических лиц',
              accountType: '5',
              ibanNum: 'BY20MMBN30140010000030009507',
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
            accountType: '0',
            currencyCode: '978',
            id: '15700000793',
            type: 'deposit'
          },
          account: {
            balance: 425.86,
            capitalization: true,
            endDateOffset: 92,
            endDateOffsetInterval: 'day',
            id: '15700000793',
            instrument: 'EUR',
            payoffInterval: 'month',
            payoffStep: 1,
            percent: 3.65,
            startBalance: 425.86,
            startDate: new Date('2021-10-07T21:00:00.000Z'),
            syncIds: ['15700000793'],
            title: 'Вклад "Шчодры" в USD,EUR,RUB',
            type: 'deposit'
          }
        },
        {
          product: {
            accountType: '5',
            currencyCode: '933',
            id: '0030009507',
            type: 'checking'
          },
          account: {
            available: 0,
            balance: 0,
            creditLimit: 0,
            gracePeriodEndDate: null,
            id: '0030009507',
            instrument: 'BYN',
            savings: false,
            syncIds: ['0030009507'],
            title: 'Текущий счет BYN',
            totalAmountDue: null,
            type: 'checking'
          }
        },
        {
          product: {
            accountType: '1',
            cardHash: '9kiqaCe4N93X5nfF82yO1n9ghyTnIC2i2I6Iz2jEo0psK4I1tOqfCw9riijgF1OcSGcGoFfhK4zfcRKSCRBMzA',
            currencyCode: '933',
            id: '5020034798',
            rkcCode: '1',
            type: 'ccard'
          },
          account: {
            balance: 0,
            id: '5020034798',
            instrument: 'BYN',
            syncIds: ['5***********6291'],
            title: 'Зарплатная МТС/Исключительная',
            type: 'ccard'
          }
        },
        {
          product: {
            accountType: '1',
            cardHash: 'swlLTWq18-LMw4H7FtrUPVIokBR5cna3qzHDDw2N0oLLyqJAr7LBgnpcWPbLZU2D5ohe621KDJhyI2b-gJqHKg',
            currencyCode: '978',
            id: '6110013726',
            rkcCode: '10',
            type: 'ccard'
          },
          account: {
            balance: 0,
            id: '6110013726',
            instrument: 'EUR',
            syncIds: ['5***********2972'],
            title: 'Личная EUR',
            type: 'ccard'
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
