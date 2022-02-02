import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          id: '12487186',
          providerId: 'card',
          legalNumber: '12487186',
          subproductCode: 'individual_credit_acc_default',
          mainAccountNumber: '26205011376033',
          mainAccountCurrency: 'UAH',
          balance: 133,
          productTitle: 'Рахунок',
          productSystemKey: 'individual_credit_card_acc',
          iban: 'UA533253650000026205011376033',
          currentInterestRate: 0.0,
          showAndOperationRule: {
            mainScreenShowAllowed: false,
            redirectToParentObjectAllowed: true,
            debitAllowed: true,
            debitAllowedAtOperationsList: [
              'CONTRACT_TO_CONTRACT',
              'INTRABANK_TRANSFER',
              'BILLER_PAYMENT',
              'SEP_TRANSFER',
              'CARD_TO_CARD',
              'CARD_TO_CONTRACT',
              'OUTER_CARD_TO_OUTER_CARD',
              'MAKE_CONTRACT'
            ],
            creditAllowed: true,
            creditAllowedAtOperationsList: [
              'CONTRACT_TO_CONTRACT',
              'INTRABANK_TRANSFER',
              'BILLER_PAYMENT',
              'SEP_TRANSFER',
              'CARD_TO_CARD',
              'CARD_TO_CONTRACT',
              'OUTER_CARD_TO_OUTER_CARD',
              'MAKE_CONTRACT'
            ]
          },
          accountStateCodeName: '1',
          usedCreditLimit: 0,
          lastTransactionValue: '-10167',
          blockedAmounValue: '0',
          isDebitBlocked: 'false',
          cardsList: [
            {
              id: '3632841',
              cardNumberMask: '5571********0501',
              expiryMonth: '01',
              expiryYear: '2023',
              ownerName: 'NIKOLAEV NIKOLAY',
              status: 'ACTIVE',
              statusName: 'CHST0',
              bankCardType: 'MasterCard',
              attributes: [
                {
                  key: 'mobInformAvailableOnlyFinancialPhoneNumber',
                  value: 'true'
                }, { key: 'isBtnActivateAvailable', value: 'false' }, {
                  key: 'isBtnLockAvailable',
                  value: 'true'
                }, { key: 'isBtnUnLockAvailable', value: 'false' }, {
                  key: 'isBtnChangeLimitAvailable',
                  value: 'true'
                }, { key: 'isActiveProduct', value: 'true' }, { key: 'isCreditCard', value: 'true' }, {
                  key: 'skin',
                  value: 'Mc_Black'
                }, { key: 'textUnderSkin', value: 'White' }, {
                  key: 'productTitle',
                  value: 'CREDIT CARD INSTANT MasterCard'
                }, { key: 'isPrimaryCard', value: 'true' }, {
                  key: 'lastTransactionValue',
                  value: '10300'
                }, { key: 'lastTransactionDate', value: '11.08.2021' }
              ],
              limits: null,
              cleareFromResponseToUI: false,
              settings: null,
              showAndOperationRule: {
                mainScreenShowAllowed: true,
                redirectToParentObjectAllowed: false,
                debitAllowed: true,
                debitAllowedAtOperationsList: [
                  'CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'MAKE_CONTRACT'
                ],
                creditAllowed: true,
                creditAllowedAtOperationsList: [
                  'CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'MAKE_CONTRACT'
                ]
              },
              details: {
                id: '12487186',
                providerId: 'card',
                legalNumber: '12487186',
                subproductCode: 'individualK_credit_acc_7090',
                mainAccountNumber: '26205011376033',
                mainAccountCurrency: 'UAH',
                balance: 133,
                productTitle: 'Базовий-Кредитна картка',
                productSystemKey: 'individual_credit_card_acc',
                iban: 'UA533253650000026205011376033',
                currentInterestRate: 0.0,
                showAndOperationRule: {
                  mainScreenShowAllowed: false,
                  redirectToParentObjectAllowed: true,
                  debitAllowed: true,
                  debitAllowedAtOperationsList: [
                    'CONTRACT_TO_CONTRACT',
                    'INTRABANK_TRANSFER',
                    'BILLER_PAYMENT',
                    'SEP_TRANSFER',
                    'CARD_TO_CARD',
                    'CARD_TO_CONTRACT',
                    'OUTER_CARD_TO_OUTER_CARD',
                    'MAKE_CONTRACT'
                  ],
                  creditAllowed: true,
                  creditAllowedAtOperationsList: [
                    'CONTRACT_TO_CONTRACT',
                    'INTRABANK_TRANSFER',
                    'BILLER_PAYMENT',
                    'SEP_TRANSFER',
                    'CARD_TO_CARD',
                    'CARD_TO_CONTRACT',
                    'OUTER_CARD_TO_OUTER_CARD',
                    'MAKE_CONTRACT'
                  ]
                },
                isBtnMobInformActivateAvailable: 'false',
                autoBuyType: 'none',
                usedCreditLimit: 0,
                overdraftStateId: '2',
                lastTransactionValue: '-10167',
                overDebt: '0,00',
                overDealNo: '602017OVR',
                mobInformEnabled: 'true',
                bankName: 'АТ "КРЕДОБАНК"',
                isDebitBlocked: 'false',
                replenishmentPurpose: 'Поповнення рахунку Николаев Николай Николаевич',
                cardsList: [
                  {
                    id: '3632841',
                    cardNumberMask: '5571********0501',
                    expiryMonth: '01',
                    expiryYear: '2023',
                    ownerName: 'NIKOLAEV NIKOLAY',
                    status: 'ACTIVE',
                    statusName: 'CHST0',
                    bankCardType: 'MasterCard',
                    attributes: [
                      {
                        key: 'isBtnAndroidPushProvisioningAvailiable',
                        value: 'true'
                      }, { key: 'isBtnIosPushProvisioningAvailiable', value: 'true' }, {
                        key: 'isBtnActivateAvailable',
                        value: 'false'
                      }, { key: 'isBtnLockAvailable', value: 'true' }, {
                        key: 'isBtnUnLockAvailable',
                        value: 'false'
                      }, { key: 'isBtnChangeLimitAvailable', value: 'true' }, {
                        key: 'isActiveProduct',
                        value: 'true'
                      }, {
                        key: 'panUniqueReferenceId',
                        value: 'FAPLMC00001462152654216ff99e455b83a38162252d70bf'
                      }, {
                        key: 'tokenIds',
                        value: '[{"tokenId":"DAPLMC00001462156957b53af5cd4fcd92091dab6cbf1337","status":"ACTIVE"},{"tokenId":"DAPLMC00001462156957b53af5cd4fcd92091dab6cbf01337","status":"ACTIVE"}]'
                      }, { key: 'isCreditCard', value: 'true' }, {
                        key: 'skin',
                        value: 'Mc_Black'
                      }, { key: 'textUnderSkin', value: 'White' }, {
                        key: 'productTitle',
                        value: 'CREDIT CARD INSTANT MasterCard'
                      }, { key: 'isPrimaryCard', value: 'true' }, {
                        key: 'mobInformEnabled',
                        value: 'true'
                      }, { key: 'phone', value: '+380661531337' }, {
                        key: 'isBtnSendPinAvailable',
                        value: 'true'
                      }, {
                        key: 'isBtnMobInformChangeAvailable',
                        value: 'false'
                      }, {
                        key: 'isBtnMobInformActivateAvailable',
                        value: 'false'
                      }, { key: 'isBtnMobInformDeactivateAvailable', value: 'true' }, {
                        key: 'masterCardReward',
                        value: '591089'
                      }, { key: 'lastTransactionValue', value: '' }
                    ],
                    limits: [
                      {
                        type: 'ATM',
                        otherType: null,
                        amount: 2000000,
                        currency: null,
                        quantity: -1,
                        termType: 'DAY',
                        termValue: 1,
                        dateFrom: null,
                        dateTill: null
                      }, {
                        type: 'POS',
                        otherType: null,
                        amount: 10000000,
                        currency: null,
                        quantity: -1,
                        termType: 'DAY',
                        termValue: 1,
                        dateFrom: null,
                        dateTill: null
                      }, {
                        type: 'OTHER',
                        otherType: 'cashPos',
                        amount: 25000000,
                        currency: null,
                        quantity: -1,
                        termType: 'DAY',
                        termValue: 1,
                        dateFrom: null,
                        dateTill: null
                      }, {
                        type: 'INTERNET',
                        otherType: null,
                        amount: 1000000,
                        currency: null,
                        quantity: -1,
                        termType: 'DAY',
                        termValue: 1,
                        dateFrom: null,
                        dateTill: null
                      }, {
                        type: 'TOTAL',
                        otherType: null,
                        amount: -1,
                        currency: null,
                        quantity: 10,
                        termType: 'DAY',
                        termValue: 1,
                        dateFrom: null,
                        dateTill: null
                      }
                    ],
                    cleareFromResponseToUI: false,
                    settings: null,
                    showAndOperationRule: {
                      mainScreenShowAllowed: true,
                      redirectToParentObjectAllowed: false,
                      debitAllowed: true,
                      debitAllowedAtOperationsList: [
                        'CONTRACT_TO_CONTRACT',
                        'INTRABANK_TRANSFER',
                        'BILLER_PAYMENT',
                        'SEP_TRANSFER',
                        'CARD_TO_CARD',
                        'CARD_TO_CONTRACT',
                        'OUTER_CARD_TO_OUTER_CARD',
                        'MAKE_CONTRACT'
                      ],
                      creditAllowed: true,
                      creditAllowedAtOperationsList: [
                        'CONTRACT_TO_CONTRACT',
                        'INTRABANK_TRANSFER',
                        'BILLER_PAYMENT',
                        'SEP_TRANSFER',
                        'CARD_TO_CARD',
                        'CARD_TO_CONTRACT',
                        'OUTER_CARD_TO_OUTER_CARD',
                        'MAKE_CONTRACT'
                      ]
                    }
                  }
                ],
                rateId: null,
                overInterestRate: '0.0',
                overAmount: '0',
                ownerName: 'Николаев Николай Николаевич',
                lastTransactionDate: '12.08.2021',
                isBtnMobInformChangeAvailable: 'true',
                creditLimit: 2000000,
                overDealId: '14212831',
                accountStateCodeName: '1',
                ownerTaxId: '3280909674',
                autoBuyValue: '0',
                blockedAmounValue: '0',
                isMainAccount: 'false',
                isOwnAccount: 'true',
                bankId: '325365',
                savingAccountNumber: null,
                savingAccountBalance: null,
                phone: '+380661531337',
                isBtnMobInformDeactivateAvailable: 'true',
                ibanForReplenishment: 'UA53 325365 00000 26205011376033',
                overExpectedCloseDate: '2021-10-01',
                autoSellValue: '0',
                isCreditAccount: 'true',
                autoSellType: 'none',
                isActiveProduct: 'true'
              }
            }
          ],
          rateId: null,
          isOwnAccount: 'true',
          savingAccountNumber: null,
          savingAccountBalance: null,
          lastTransactionDate: '12.08.2021',
          creditLimit: 2000000,
          isActiveProduct: 'true'
        }
      ],
      [
        {
          account: {
            balance: 1.33,
            creditLimit: 20000,
            gracePeriodEndDate: new Date('2021-10-01T00:00:00.000+03:00'),
            id: '12487186',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA533253650000026205011376033',
              '26205011376033',
              '5571********0501'
            ],
            title: 'Базовий-Кредитна картка',
            totalAmountDue: 0,
            type: 'ccard'
          },
          products: [
            {
              cardId: '3632841',
              contractType: 'card',
              id: '12487186'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: '14578619',
          providerId: 'card',
          legalNumber: '14578619',
          subproductCode: 'individual_credit_acc_default',
          mainAccountNumber: '26200031498598',
          mainAccountCurrency: 'UAH',
          balance: -1995818,
          productTitle: 'Рахунок',
          productSystemKey: 'individual_credit_card_acc',
          iban: 'UA513253650000026200031498598',
          currentInterestRate: 0,
          showAndOperationRule:
            {
              mainScreenShowAllowed: false,
              redirectToParentObjectAllowed: true,
              debitAllowed: true,
              debitAllowedAtOperationsList:
                [
                  'CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'MAKE_CONTRACT'
                ],
              creditAllowed: true,
              creditAllowedAtOperationsList:
                [
                  'CONTRACT_TO_CONTRACT',
                  'INTRABANK_TRANSFER',
                  'BILLER_PAYMENT',
                  'SEP_TRANSFER',
                  'CARD_TO_CARD',
                  'CARD_TO_CONTRACT',
                  'OUTER_CARD_TO_OUTER_CARD',
                  'MAKE_CONTRACT'
                ]
            },
          accountStateCodeName: '1',
          usedCreditLimit: 1995818,
          lastTransactionValue: '6390',
          blockedAmounValue: '0',
          isDebitBlocked: 'false',
          cardsList:
            [
              {
                id: '4095344',
                cardNumberMask: '5571********9593',
                expiryMonth: '05',
                expiryYear: '2026',
                ownerName: 'NIKOLAY NIKOLAEV',
                status: 'ACTIVE',
                statusName: 'CHST0',
                bankCardType: 'MasterCard',
                attributes:
                  [
                    {
                      key: 'mobInformAvailableOnlyFinancialPhoneNumber',
                      value: 'true'
                    },
                    { key: 'isBtnActivateAvailable', value: 'false' },
                    { key: 'isBtnLockAvailable', value: 'true' },
                    { key: 'isBtnUnLockAvailable', value: 'false' },
                    { key: 'isBtnChangeLimitAvailable', value: 'true' },
                    { key: 'isActiveProduct', value: 'true' },
                    { key: 'isCreditCard', value: 'true' },
                    { key: 'skin', value: 'Mc_Black' },
                    { key: 'textUnderSkin', value: 'White' },
                    { key: 'productTitle', value: 'CREDIT CARD INSTANT MasterCard' },
                    { key: 'isPrimaryCard', value: 'true' },
                    { key: 'lastTransactionValue', value: '-6390' },
                    { key: 'lastTransactionDate', value: '05.10.2021' }
                  ],
                limits: null,
                cleareFromResponseToUI: false,
                settings: null,
                showAndOperationRule:
                  {
                    mainScreenShowAllowed: true,
                    redirectToParentObjectAllowed: false,
                    debitAllowed: true,
                    debitAllowedAtOperationsList:
                      [
                        'CONTRACT_TO_CONTRACT',
                        'INTRABANK_TRANSFER',
                        'BILLER_PAYMENT',
                        'SEP_TRANSFER',
                        'CARD_TO_CARD',
                        'CARD_TO_CONTRACT',
                        'OUTER_CARD_TO_OUTER_CARD',
                        'MAKE_CONTRACT'
                      ],
                    creditAllowed: true,
                    creditAllowedAtOperationsList:
                      [
                        'CONTRACT_TO_CONTRACT',
                        'INTRABANK_TRANSFER',
                        'BILLER_PAYMENT',
                        'SEP_TRANSFER',
                        'CARD_TO_CARD',
                        'CARD_TO_CONTRACT',
                        'OUTER_CARD_TO_OUTER_CARD',
                        'MAKE_CONTRACT'
                      ]
                  },
                details: {
                  id: '14578619',
                  providerId: 'card',
                  legalNumber: '14578619',
                  subproductCode: 'individualK_credit_acc_74900',
                  mainAccountNumber: '26200031498598',
                  mainAccountCurrency: 'UAH',
                  balance: -1995818,
                  productTitle: 'VIP- Кредитна картка',
                  productSystemKey: 'individual_credit_card_acc',
                  iban: 'UA513253650000026200031498598',
                  currentInterestRate: 0,
                  showAndOperationRule:
                    {
                      mainScreenShowAllowed: false,
                      redirectToParentObjectAllowed: true,
                      debitAllowed: true,
                      debitAllowedAtOperationsList:
                        [
                          'CONTRACT_TO_CONTRACT',
                          'INTRABANK_TRANSFER',
                          'BILLER_PAYMENT',
                          'SEP_TRANSFER',
                          'CARD_TO_CARD',
                          'CARD_TO_CONTRACT',
                          'OUTER_CARD_TO_OUTER_CARD',
                          'MAKE_CONTRACT'
                        ],
                      creditAllowed: true,
                      creditAllowedAtOperationsList:
                        [
                          'CONTRACT_TO_CONTRACT',
                          'INTRABANK_TRANSFER',
                          'BILLER_PAYMENT',
                          'SEP_TRANSFER',
                          'CARD_TO_CARD',
                          'CARD_TO_CONTRACT',
                          'OUTER_CARD_TO_OUTER_CARD',
                          'MAKE_CONTRACT'
                        ]
                    },
                  isBtnMobInformActivateAvailable: 'false',
                  autoBuyType: 'none',
                  usedCreditLimit: 1995818,
                  overdraftStateId: '',
                  lastTransactionValue: '6390',
                  overDebt: '-1995818',
                  overDealNo: '',
                  mobInformEnabled: 'true',
                  bankName: 'АТ "КРЕДОБАНК"',
                  isDebitBlocked: 'false',
                  replenishmentPurpose: 'Поповнення рахунку Брагінський Ліор Віталійович',
                  cardsList:
                    [
                      {
                        id: '4095344',
                        cardNumberMask: '5571********9593',
                        expiryMonth: '05',
                        expiryYear: '2026',
                        ownerName: 'NIKOLAY NIKOLAEV',
                        status: 'ACTIVE',
                        statusName: 'CHST0',
                        bankCardType: 'MasterCard',
                        attributes:
                          [
                            { key: 'isBtnAndroidPushProvisioningAvailiable', value: 'true' },
                            { key: 'isBtnIosPushProvisioningAvailiable', value: 'true' },
                            { key: 'isBtnActivateAvailable', value: 'false' },
                            { key: 'isBtnLockAvailable', value: 'true' },
                            { key: 'isBtnUnLockAvailable', value: 'false' },
                            { key: 'isBtnChangeLimitAvailable', value: 'true' },
                            { key: 'isActiveProduct', value: 'true' },
                            {
                              key: 'panUniqueReferenceId',
                              value: 'FAPLMC0000146215f40666339fe042838df32fa350cebe8e'
                            },
                            {
                              key: 'tokenIds',
                              value: '[{"tokenId":"DAPLMC0000146215289dbad04c6346eabe916e7067d804b0","status":"ACTIVE"},{"tokenId":"DAPLMC00001462153495457745a342f38510df7788de9c6f","status":"ACTIVE"}]'
                            },
                            { key: 'isCreditCard', value: 'true' },
                            { key: 'skin', value: 'Mc_Black' },
                            { key: 'textUnderSkin', value: 'White' },
                            { key: 'productTitle', value: 'CREDIT CARD INSTANT MasterCard' },
                            { key: 'isPrimaryCard', value: 'true' },
                            { key: 'mobInformEnabled', value: 'true' },
                            { key: 'phone', value: '+380673082153' },
                            { key: 'isBtnSendPinAvailable', value: 'true' },
                            { key: 'isBtnMobInformChangeAvailable', value: 'false' },
                            { key: 'isBtnMobInformActivateAvailable', value: 'false' },
                            { key: 'isBtnMobInformDeactivateAvailable', value: 'true' },
                            { key: 'masterCardReward', value: '797830' },
                            { key: 'lastTransactionValue', value: '' }
                          ],
                        limits:
                          [
                            {
                              type: 'ATM',
                              otherType: null,
                              amount: 2000000,
                              currency: null,
                              quantity: -1,
                              termType: 'DAY',
                              termValue: 1,
                              dateFrom: null,
                              dateTill: null
                            },
                            {
                              type: 'POS',
                              otherType: null,
                              amount: 10000000,
                              currency: null,
                              quantity: -1,
                              termType: 'DAY',
                              termValue: 1,
                              dateFrom: null,
                              dateTill: null
                            },
                            {
                              type: 'OTHER',
                              otherType: 'cashPos',
                              amount: 25000000,
                              currency: null,
                              quantity: -1,
                              termType: 'DAY',
                              termValue: 1,
                              dateFrom: null,
                              dateTill: null
                            },
                            {
                              type: 'INTERNET',
                              otherType: null,
                              amount: 2500000,
                              currency: null,
                              quantity: -1,
                              termType: 'DAY',
                              termValue: 1,
                              dateFrom: null,
                              dateTill: null
                            },
                            {
                              type: 'TOTAL',
                              otherType: null,
                              amount: -1,
                              currency: null,
                              quantity: 100,
                              termType: 'DAY',
                              termValue: 1,
                              dateFrom: null,
                              dateTill: null
                            }
                          ],
                        cleareFromResponseToUI: false,
                        settings: null,
                        showAndOperationRule:
                          {
                            mainScreenShowAllowed: true,
                            redirectToParentObjectAllowed: false,
                            debitAllowed: true,
                            debitAllowedAtOperationsList:
                              [
                                'CONTRACT_TO_CONTRACT',
                                'INTRABANK_TRANSFER',
                                'BILLER_PAYMENT',
                                'SEP_TRANSFER',
                                'CARD_TO_CARD',
                                'CARD_TO_CONTRACT',
                                'OUTER_CARD_TO_OUTER_CARD',
                                'MAKE_CONTRACT'
                              ],
                            creditAllowed: true,
                            creditAllowedAtOperationsList:
                              [
                                'CONTRACT_TO_CONTRACT',
                                'INTRABANK_TRANSFER',
                                'BILLER_PAYMENT',
                                'SEP_TRANSFER',
                                'CARD_TO_CARD',
                                'CARD_TO_CONTRACT',
                                'OUTER_CARD_TO_OUTER_CARD',
                                'MAKE_CONTRACT'
                              ]
                          }
                      }
                    ],
                  rateId: null,
                  overInterestRate: '',
                  overAmount: '',
                  ownerName: 'Николаев Николай Николаевич',
                  lastTransactionDate: '08.10.2021',
                  isBtnMobInformChangeAvailable: 'true',
                  creditLimit: 2000000,
                  overDealId: '',
                  accountStateCodeName: '1',
                  ownerTaxId: '3481300959',
                  autoBuyValue: '0',
                  blockedAmounValue: '0',
                  isMainAccount: 'false',
                  isOwnAccount: 'true',
                  bankId: '325365',
                  savingAccountNumber: null,
                  savingAccountBalance: null,
                  phone: '+380673082153',
                  isBtnMobInformDeactivateAvailable: 'true',
                  ibanForReplenishment: 'UA51 325365 00000 26200031498598',
                  overExpectedCloseDate: '',
                  autoSellValue: '0',
                  isCreditAccount: 'true',
                  autoSellType: 'none',
                  isActiveProduct: 'true'
                }
              }
            ],
          rateId: null,
          isOwnAccount: 'true',
          savingAccountNumber: null,
          savingAccountBalance: null,
          lastTransactionDate: '08.10.2021',
          creditLimit: 2000000,
          isActiveProduct: 'true'
        }
      ],
      [
        {
          account: {
            balance: -19958.18,
            creditLimit: 20000,
            id: '14578619',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA513253650000026200031498598',
              '26200031498598',
              '5571********9593'
            ],
            title: 'VIP- Кредитна картка',
            type: 'ccard'
          },
          products: [
            {
              cardId: '4095344',
              contractType: 'card',
              id: '14578619'
            }
          ]
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
