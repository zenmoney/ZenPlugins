import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        cards: [
          {
            internalAccountId: '5687326',
            currency: '840',
            closeDate: 1682802000000,
            cardAccountNumber: '964212037851',
            accountStatus: 'OPEN',
            cards: [{
              cardNumberMasked: '5*** **** **** 4492',
              cardHash: 'Npvqw6rXjVyt-Z8YVSGKrhrc3DjShcB4HNZvNnDuTJs6_5W5jcky0oKDcFSqT6B4VXw7s2LiV3L-L5AHAdRlFw',
              cardType: {
                value: 22,
                name: 'Mastercard "Моцная картка"',
                imageUri: 'https://alseda.by/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                paySysImageUri: 'https://alseda.by/media/public/icMastercard.png',
                textColor: 'ffffffff',
                paySystemName: 'Mastercard'
              },
              expireDate: 1682802000000,
              owner: 'NIKOLAY NIKOLAEV',
              canActivateSmsNotification: true,
              canSendPin: true,
              canSendCVV: false,
              canGetCardNumberPath: false,
              displayOnMain: 1,
              payment: '0',
              currency: '840',
              numberDaysBeforeCardExpiry: 990,
              canChange3D: true,
              riskLevel: 'MCHS',
              applePaySupported: true,
              virtual: false,
              balance: '3,49'
            }],
            bankCode: '39',
            rkcCode: '1094',
            accountType: '222',
            period: 0,
            ibanNum: 'BY61BAPB30140000964212037851',
            branchCode: '964',
            overdraftAvailable: false
          }
        ],
        deposits: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              'Npvqw6rXjVyt-Z8YVSGKrhrc3DjShcB4HNZvNnDuTJs6_5W5jcky0oKDcFSqT6B4VXw7s2LiV3L-L5AHAdRlFw'
            ],
            type: 'card',
            accountType: '222',
            bankCode: '39',
            currencyCode: '840',
            internalAccountId: '5687326',
            rkcCode: '1094'
          },
          account: {
            id: '5687326',
            type: 'ccard',
            title: '*4492',
            instrument: 'USD',
            syncID: [
              '964212037851',
              '5***********4492'
            ],
            balance: 3.49
          }
        }
      ]
    ],
    [
      {
        cards: [
          {
            internalAccountId: '5010404',
            currency: '933',
            closeDate: 1604091600000,
            cardAccountNumber: '964102143761',
            accountStatus: 'OPEN',
            cards:
              [{
                cardNumberMasked: '5*** **** **** 1833',
                cardHash: 'Mtq3Yjl841djA2tvODQHOrsVj-EM67UE_WO2DrwmFHbUuh8xfA_JRemhSMrXxxoCGLk2saBBKk4lUw0uOmy3Uw',
                cardType:
                {
                  value: 22,
                  name: 'Mastercard "Моцная картка"',
                  imageUri: 'https://alseda.by/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                  paySysImageUri: 'https://alseda.by/media/public/icMastercard.png',
                  textColor: 'ffffffff',
                  paySystemName: 'Mastercard'
                },
                expireDate: 1604091600000,
                owner: 'NIKOLAY NIKOLAEV',
                canActivateSmsNotification: true,
                canSendPin: true,
                canSendCVV: false,
                canGetCardNumberPath: false,
                personalizedName: 'Моцная картка',
                displayOnMain: 1,
                payment: '1',
                currency: '933',
                numberDaysBeforeCardExpiry: 73,
                canChange3D: true,
                riskLevel: 'Y',
                overdraftLimit: 1000,
                applePaySupported: true,
                virtual: false,
                balance: '248,52'
              }],
            bankCode: '39',
            rkcCode: '1035',
            accountType: '111',
            period: 0,
            ibanNum: 'BY22BAPB30140000964102143761',
            branchCode: '964',
            overdraftAvailable: false
          }
        ],
        deposits: [],
        current: [],
        loans: [
          {
            internalAccountId: '19159171',
            currency: '933',
            agreementDate: 1576530000000,
            openDate: 1576530000000,
            endDate: 1669755600000,
            accountNumber: '19159171',
            productCode: '3267',
            productName: 'Онлайн овердрафтный кредит стандартный ',
            contractId: '303459474',
            rkcCode: '964',
            percentRate: 11.64,
            residualAmount: '335',
            plannedEndDate: 1606683600000,
            amountInitial: 1000,
            associatedAccount: '0102143761',
            status: 'OPEN',
            currencyCode: '933',
            passportKey: '960',
            creditHolderName: 'Николаев Н. Н.',
            overdraftLimit: 1000,
            docBanPayments: 0
          }
        ]
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              'Mtq3Yjl841djA2tvODQHOrsVj-EM67UE_WO2DrwmFHbUuh8xfA_JRemhSMrXxxoCGLk2saBBKk4lUw0uOmy3Uw'
            ],
            type: 'card',
            accountType: '111',
            bankCode: '39',
            currencyCode: '933',
            internalAccountId: '5010404',
            rkcCode: '1035'
          },
          account: {
            id: '5010404',
            type: 'ccard',
            title: '*1833',
            instrument: 'BYN',
            syncID: [
              '964102143761',
              '5***********1833'
            ],
            balance: 248.52,
            creditLimit: 1000
          }
        }
      ]
    ],
    [
      {
        cards: [
          {
            internalAccountId: '4898591',
            currency: '933',
            closeDate: 1614459600000,
            cardAccountNumber: '401102128631',
            accountStatus: 'OPEN',
            cards:
              [{
                cardNumberMasked: '5*** **** **** 4096',
                cardHash: 'Zb80-Kgrltpv-Z5VK22Sb6CYDWiUA0JrVETVUNnshOnuyZttrLTcpwYQoFarC8w8eJAD6A1nNST0I45YGhIUJw',
                cardType:
                {
                  value: 22,
                  name: 'Mastercard "Моцная картка"',
                  imageUri: 'https://alseda.by/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                  paySysImageUri: 'https://alseda.by/media/public/icMastercard.png',
                  textColor: 'ffffffff',
                  paySystemName: 'Mastercard'
                },
                expireDate: 1614459600000,
                owner: 'NIKOLAY NIKOLAEV',
                canActivateSmsNotification: true,
                canSendPin: true,
                canSendCVV: false,
                canGetCardNumberPath: false,
                displayOnMain: 1,
                payment: '1',
                currency: '933',
                numberDaysBeforeCardExpiry: 187,
                canChange3D: true,
                riskLevel: 'Y',
                applePaySupported: true,
                virtual: false,
                balance: '119,68'
              }],
            bankCode: '39',
            rkcCode: '1115',
            accountType: '111',
            period: 0,
            ibanNum: 'BY83BAPB30140000401102128631 ',
            branchCode: '964',
            overdraftAvailable: true
          }
        ],
        deposits: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              'Zb80-Kgrltpv-Z5VK22Sb6CYDWiUA0JrVETVUNnshOnuyZttrLTcpwYQoFarC8w8eJAD6A1nNST0I45YGhIUJw'
            ],
            type: 'card',
            accountType: '111',
            bankCode: '39',
            currencyCode: '933',
            internalAccountId: '4898591',
            rkcCode: '1115'
          },
          account: {
            id: '4898591',
            type: 'ccard',
            title: '*4096',
            instrument: 'BYN',
            syncID: [
              '401102128631',
              '5***********4096'
            ],
            balance: 119.68
          }
        }
      ]
    ],
    [
      {
        cards: [
          {
            internalAccountId: '3480354',
            currency: '933',
            closeDate: 1627678800000,
            cardAccountNumber: '401105057884',
            accountStatus: 'OPEN',
            cards:
            [{
              cardNumberMasked: '5*** **** **** 1320',
              cardHash: '1fOpM0pLwfn9mVjRQ8JYBvc_V9iGJ7fMlOxbUuZjx-1mpmjMAxI1nCvZVzs9tFllPUk3vDBFodms-YCOZERNSw',
              cardType: {
                value: 22,
                name: 'Mastercard "Моцная картка"',
                imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                textColor: 'ffffffff',
                paySystemName: 'Mastercard',
                priorityStatus: 4
              },
              expireDate: 1627678800000,
              owner: 'NIKOLAY NIKOLAEV',
              canActivateSmsNotification: true,
              canSendPin: true,
              canSendCVV: false,
              canGetCardNumberPath: false,
              displayOnMain: 1,
              payment: '1',
              currency: '933',
              numberDaysBeforeCardExpiry: 234,
              canChange3D: true,
              riskLevel: 'Y',
              applePaySupported: true,
              virtual: false,
              balance: '6,22'
            }],
            bankCode: '39',
            rkcCode: '1128',
            accountType: '111',
            period: 0,
            ibanNum: 'BY75BAPB30140000401105057884',
            branchCode: '964',
            overdraftAvailable: true
          }
        ],
        deposits: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              '1fOpM0pLwfn9mVjRQ8JYBvc_V9iGJ7fMlOxbUuZjx-1mpmjMAxI1nCvZVzs9tFllPUk3vDBFodms-YCOZERNSw'
            ],
            type: 'card',
            accountType: '111',
            bankCode: '39',
            currencyCode: '933',
            internalAccountId: '3480354',
            rkcCode: '1128'
          },
          account: {
            id: '3480354',
            type: 'ccard',
            title: '*1320',
            instrument: 'BYN',
            syncID: [
              '401105057884',
              '5***********1320'
            ],
            balance: 6.22
          }
        }
      ]
    ],
    [
      {
        cards: [
          {
            internalAccountId: '3480354',
            currency: '933',
            closeDate: 1627678800000,
            cardAccountNumber: '401105057884',
            accountStatus: 'OPEN',
            cards:
            [{
              cardNumberMasked: '5*** **** **** 1320',
              cardHash: '1fOpM0pLwfn9mVjRQ8JYBvc_V9iGJ7fMlOxbUuZjx-1mpmjMAxI1nCvZVzs9tFllPUk3vDBFodms-YCOZERNSw',
              cardType: {
                value: 22,
                name: 'Mastercard "Моцная картка"',
                imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                textColor: 'ffffffff',
                paySystemName: 'Mastercard',
                priorityStatus: 4
              },
              expireDate: 1627678800000,
              owner: 'NIKOLAY NIKOLAEV',
              canActivateSmsNotification: true,
              canSendPin: true,
              canSendCVV: false,
              canGetCardNumberPath: false,
              displayOnMain: 1,
              payment: '1',
              currency: '933',
              numberDaysBeforeCardExpiry: 234,
              canChange3D: true,
              riskLevel: 'Y',
              applePaySupported: true,
              virtual: false,
              balance: null
            }],
            bankCode: '39',
            rkcCode: '1128',
            accountType: '111',
            period: 0,
            ibanNum: 'BY75BAPB30140000401105057884',
            branchCode: '964',
            overdraftAvailable: true
          }
        ],
        deposits: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              '1fOpM0pLwfn9mVjRQ8JYBvc_V9iGJ7fMlOxbUuZjx-1mpmjMAxI1nCvZVzs9tFllPUk3vDBFodms-YCOZERNSw'
            ],
            type: 'card',
            accountType: '111',
            bankCode: '39',
            currencyCode: '933',
            internalAccountId: '3480354',
            rkcCode: '1128'
          },
          account: {
            id: '3480354',
            type: 'ccard',
            title: '*1320',
            instrument: 'BYN',
            syncID: [
              '401105057884',
              '5***********1320'
            ],
            balance: null
          }
        }
      ]
    ],
    [
      {
        cards: [
          {
            internalAccountId: '3410311',
            currency: '933',
            closeDate: 1617138000000,
            cardAccountNumber: '913105000022',
            accountStatus: 'NOT_AVAILABLE',
            cards:
              [
                {
                  cardNumberMasked: '5*** **** **** 4232',
                  cardHash: 'cVCW1RTeGyfaCswKPhNy0A4WZCNIuy1fU80pTmvbB5XZiNkm6ARh3Dy7CWiiyZr4vQnU9om-MwrDQwiENRcU1A',
                  cardType:
                    {
                      value: 16,
                      name: 'Mastercard Gold',
                      imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_Gold_201910178.png',
                      paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                      textColor: 'ffffffff',
                      paySystemName: 'Mastercard',
                      priorityStatus: 5
                    },
                  expireDate: 1617138000000,
                  owner: 'NIKOLAY NIKOLAEV',
                  canActivateSmsNotification: true,
                  canSendPin: true,
                  canSendCVV: false,
                  canGetCardNumberPath: false,
                  displayOnMain: 1,
                  payment: '0',
                  currency: '933',
                  numberDaysBeforeCardExpiry: 50,
                  additional: false,
                  canChange3D: true,
                  riskLevel: 'VCHS',
                  applePaySupported: true,
                  premiumServicesAvailable: false,
                  cardStatusList: 'IN_PRODUCTION',
                  withIndividualDesign: true,
                  cardOwnershipType: 0,
                  virtual: false,
                  pension: false,
                  couldBeReissue: true
                },
                {
                  cardNumberMasked: '5*** **** **** 0136',
                  cardHash: 'VIfJnXjiKCB2gvLYse3ds3IVvWBzCQ8SBKlY5ghbJw9q6pbCRMVgRowOE3mzzprhpgRJivOJYIFhP_iIn3mVkg',
                  cardType:
                    {
                      value: 16,
                      name: 'Mastercard Gold',
                      imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_Gold_201910178.png',
                      paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                      textColor: 'ffffffff',
                      paySystemName: 'Mastercard',
                      priorityStatus: 5
                    },
                  expireDate: 1617138000000,
                  owner: 'NIKOLAY NIKOLAEV',
                  canActivateSmsNotification: true,
                  canSendPin: true,
                  canSendCVV: false,
                  canGetCardNumberPath: false,
                  displayOnMain: 1,
                  payment: '0',
                  currency: '933',
                  numberDaysBeforeCardExpiry: 50,
                  additional: false,
                  canChange3D: true,
                  riskLevel: 'VCHS',
                  applePaySupported: true,
                  premiumServicesAvailable: false,
                  cardStatusList: 'ACTIVE',
                  withIndividualDesign: true,
                  cardOwnershipType: 0,
                  virtual: false,
                  pension: false,
                  couldBeReissue: true
                },
                {
                  cardNumberMasked: '5*** **** **** 2204',
                  cardHash: '1PIu3mgwu-xJfh37HxEwVb36uu7l8dhdcnIPw84I49Oo7XYQl0jiyT5sFKzvlHrWMZVJ_zWbslrzkrSagwjqbw',
                  cardType:
                    {
                      value: 35,
                      name: 'Mastercard "Прикосновения"',
                      imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_prikocnovenija_201910178.png',
                      paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                      textColor: 'ffffffff',
                      paySystemName: 'Mastercard',
                      priorityStatus: 3
                    },
                  expireDate: 1614459600000,
                  owner: 'NIKOLAY NIKOLAEV',
                  canActivateSmsNotification: true,
                  canSendPin: true,
                  canSendCVV: false,
                  canGetCardNumberPath: false,
                  displayOnMain: 1,
                  payment: '0',
                  currency: '933',
                  numberDaysBeforeCardExpiry: 19,
                  additional: false,
                  canChange3D: true,
                  riskLevel: 'MCHS',
                  applePaySupported: true,
                  premiumServicesAvailable: false,
                  cardStatusList: 'ACTIVE',
                  withIndividualDesign: false,
                  cardOwnershipType: 0,
                  virtual: false,
                  pension: false,
                  couldBeReissue: true
                },
                {
                  cardNumberMasked: '5*** **** **** 3659',
                  cardHash: 'D3mXuDgBekHEUFXUdZ49Sj1iOsqstR2wueUHeyGgS2cLonjypG3omqFe-OG6AaLx6NUFCnnS41Fa-qRX5RX6AA',
                  cardType:
                    {
                      value: 22,
                      name: 'Mastercard "Моцная картка"',
                      imageUri: 'https://www.ibank.belapb.by:4443/media/public/Mastercard_mocnaja_i_credit_201910178.png',
                      paySysImageUri: 'https://www.ibank.belapb.by:4443/media/public/icMastercard.png',
                      textColor: 'ffffffff',
                      paySystemName: 'Mastercard',
                      priorityStatus: 4
                    },
                  expireDate: 1667163600000,
                  owner: 'NIKOLAY NIKOLAEV',
                  canActivateSmsNotification: true,
                  canSendPin: true,
                  canSendCVV: false,
                  canGetCardNumberPath: false,
                  displayOnMain: 1,
                  payment: '1',
                  currency: '933',
                  numberDaysBeforeCardExpiry: 629,
                  additional: false,
                  canChange3D: true,
                  riskLevel: 'MCHS',
                  applePaySupported: true,
                  premiumServicesAvailable: false,
                  cardStatusList: 'ACTIVE',
                  withIndividualDesign: false,
                  cardOwnershipType: 0,
                  virtual: false,
                  pension: false,
                  couldBeReissue: false
                }
              ],
            bankCode: '39',
            rkcCode: '1089',
            accountType: '111',
            period: 0,
            ibanNum: 'BY16BAPB30140000913105000022',
            branchCode: '964',
            overdraftAvailable: true
          }
        ],
        deposits: [],
        current: [],
        loans: []
      },
      [
        {
          mainProduct: {
            carsdHashes: [
              'VIfJnXjiKCB2gvLYse3ds3IVvWBzCQ8SBKlY5ghbJw9q6pbCRMVgRowOE3mzzprhpgRJivOJYIFhP_iIn3mVkg',
              '1PIu3mgwu-xJfh37HxEwVb36uu7l8dhdcnIPw84I49Oo7XYQl0jiyT5sFKzvlHrWMZVJ_zWbslrzkrSagwjqbw',
              'D3mXuDgBekHEUFXUdZ49Sj1iOsqstR2wueUHeyGgS2cLonjypG3omqFe-OG6AaLx6NUFCnnS41Fa-qRX5RX6AA'
            ],
            type: 'card',
            accountType: '111',
            bankCode: '39',
            currencyCode: '933',
            internalAccountId: '3410311',
            rkcCode: '1089'
          },
          account: {
            id: '3410311',
            type: 'ccard',
            title: '*0136',
            instrument: 'BYN',
            syncID: [
              '913105000022',
              '5***********0136',
              '5***********2204',
              '5***********3659'
            ],
            balance: null
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
