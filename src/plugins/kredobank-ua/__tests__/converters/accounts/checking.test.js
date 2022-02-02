import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          id: '12148021',
          providerId: 'card',
          legalNumber: '12148021',
          subproductCode: 'entepreneurLight_default',
          mainAccountNumber: '260020009840',
          mainAccountCurrency: 'UAH',
          balance: 11139438,
          productTitle: 'Рахунок',
          productSystemKey: 'entepreneurLight_default',
          iban: 'UA253253650000000260020009840',
          currentInterestRate: 0.0,
          showAndOperationRule: {
            mainScreenShowAllowed: true,
            redirectToParentObjectAllowed: true,
            debitAllowed: false,
            debitAllowedAtOperationsList: [],
            creditAllowed: true,
            creditAllowedAtOperationsList: [
              'CONTRACT_TO_CONTRACT',
              'INTRABANK_TRANSFER',
              'BILLER_PAYMENT',
              'SEP_TRANSFER',
              'CARD_TO_CARD',
              'CARD_TO_CONTRACT',
              'OUTER_CARD_TO_OUTER_CARD',
              'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
              'MAKE_CONTRACT'
            ]
          },
          accountStateCodeName: '1',
          usedCreditLimit: 0,
          lastTransactionValue: '-132000',
          blockedAmounValue: '0',
          isDebitBlocked: 'true',
          cardsList: [],
          rateId: null,
          isOwnAccount: 'true',
          savingAccountNumber: null,
          savingAccountBalance: null,
          lastTransactionDate: '13.09.2021',
          creditLimit: 0,
          isActiveProduct: 'true',
          details: {
            id: '12148021',
            providerId: 'card',
            legalNumber: '12148021',
            subproductCode: 'entepreneurLightK_80074',
            mainAccountNumber: '260020009840',
            mainAccountCurrency: 'UAH',
            balance: 11139438,
            productTitle: 'МБ-Підприємець ІТ – FX Софтсерв',
            productSystemKey: 'entepreneurLight_default',
            iban: 'UA253253650000000260020009840',
            currentInterestRate: 0.0,
            showAndOperationRule: {
              mainScreenShowAllowed: true,
              redirectToParentObjectAllowed: true,
              debitAllowed: false,
              debitAllowedAtOperationsList: [],
              creditAllowed: true,
              creditAllowedAtOperationsList: [
                'CONTRACT_TO_CONTRACT',
                'INTRABANK_TRANSFER',
                'BILLER_PAYMENT',
                'SEP_TRANSFER',
                'CARD_TO_CARD',
                'CARD_TO_CONTRACT',
                'OUTER_CARD_TO_OUTER_CARD',
                'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
                'MAKE_CONTRACT'
              ]
            },
            isBtnMobInformActivateAvailable: 'true',
            autoBuyType: 'none',
            usedCreditLimit: 0,
            overdraftStateId: '',
            lastTransactionValue: '-132000',
            overDebt: '0,00',
            overDealNo: '',
            mobInformEnabled: 'false',
            bankName: 'АТ "КРЕДОБАНК"',
            isDebitBlocked: 'true',
            replenishmentPurpose: 'Поповнення рахунку ФОП НИКОЛАЕВ Н. Н.',
            cardsList: [],
            rateId: null,
            overInterestRate: '',
            overAmount: '',
            ownerName: 'ФОП НИКОЛАЕВ Н. Н.',
            lastTransactionDate: '13.09.2021',
            isBtnMobInformChangeAvailable: 'false',
            creditLimit: 0,
            overDealId: '',
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
            isBtnMobInformDeactivateAvailable: 'false',
            ibanForReplenishment: 'UA25 325365 0000000 260020009840',
            overExpectedCloseDate: '',
            autoSellValue: '0',
            isCreditAccount: 'false',
            autoSellType: 'none',
            isActiveProduct: 'true'
          }
        }
      ],
      [
        {
          account: {
            balance: 111394.38,
            id: '12148021',
            instrument: 'UAH',
            savings: false,
            syncIds: [
              'UA253253650000000260020009840',
              '260020009840'
            ],
            title: 'МБ-Підприємець ІТ – FX Софтсерв',
            type: 'checking'
          },
          products: [
            {
              contractType: 'card',
              id: '12148021'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: '14560970',
          providerId: 'card',
          legalNumber: '14560970',
          subproductCode: 'entepreneurLight_default',
          mainAccountNumber: '260080028133',
          mainAccountCurrency: 'UAH',
          productTitle: 'Рахунок',
          productSystemKey: 'entepreneurLight_default',
          iban: 'UA453253650000000260080028133',
          currentInterestRate: 0,
          showAndOperationRule:
            {
              mainScreenShowAllowed: true,
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
                  'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
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
                  'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
                  'MAKE_CONTRACT'
                ]
            },
          accountStateCodeName: '1',
          usedCreditLimit: 0,
          ibanForReplenishmentFromPoland: 'PL 63 102010 2639 4700 0014 5609 70 ',
          lastTransactionValue: '-352642',
          isBtnMoneyTransferFromPolandToUkrainAllowed: 'false',
          blockedAmounValue: '',
          isDebitBlocked: 'false',
          cardsList: [],
          rateId: null,
          isOwnAccount: 'true',
          savingAccountNumber: null,
          savingAccountBalance: null,
          lastTransactionDate: '11.11.2021',
          creditLimit: null,
          isActiveProduct: 'true',
          details:
            {
              id: '14560970',
              providerId: 'card',
              legalNumber: '14560970',
              subproductCode: 'entepreneurLightK_80074',
              mainAccountNumber: '260080028133',
              mainAccountCurrency: 'UAH',
              productTitle: 'МБ-Підприємець ІТ – FX Софтсерв',
              productSystemKey: 'entepreneurLight_default',
              iban: 'UA453253650000000260080028133',
              currentInterestRate: 0,
              showAndOperationRule:
                {
                  mainScreenShowAllowed: true,
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
                      'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
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
                      'CUSTOM_ORDER_CURRENCY_EXCHANGE_FOP',
                      'MAKE_CONTRACT'
                    ]
                },
              isBtnMobInformActivateAvailable: 'true',
              autoBuyType: 'none',
              usedCreditLimit: 0,
              overdraftStateId: '',
              ibanForReplenishmentFromPoland: 'PL 63 102010 2639 4700 0014 5609 70 ',
              lastTransactionValue: '-352642',
              overDebt: '0,00',
              overDealNo: '',
              mobInformEnabled: 'false',
              isBtnMoneyTransferFromPolandToUkrainAllowed: 'false',
              bankName: 'АТ "КРЕДОБАНК"',
              isDebitBlocked: 'false',
              replenishmentPurpose: 'Поповнення рахунку ФОП Николаев Н. Н.',
              cardsList: [],
              rateId: null,
              overInterestRate: '',
              overAmount: '',
              ownerName: 'ФОП Николаев Н. Н.',
              lastTransactionDate: '11.11.2021',
              isBtnMobInformChangeAvailable: 'false',
              creditLimit: null,
              overDealId: '',
              accountStateCodeName: '1',
              ownerTaxId: '2858511151',
              autoBuyValue: '0',
              blockedAmounValue: '',
              isMainAccount: 'false',
              isOwnAccount: 'true',
              bankId: '325365',
              savingAccountNumber: null,
              savingAccountBalance: null,
              phone: '+380958233808',
              isBtnMobInformDeactivateAvailable: 'false',
              ibanForReplenishment: 'UA45 325365 0000000 260080028133',
              overExpectedCloseDate: '',
              autoSellValue: '0',
              isCreditAccount: 'false',
              autoSellType: 'none',
              isActiveProduct: 'true'
            }
        }
      ],
      [
        {
          account: {
            id: '14560970',
            type: 'checking',
            title: 'МБ-Підприємець ІТ – FX Софтсерв',
            instrument: 'UAH',
            syncIds: [
              'UA453253650000000260080028133',
              '260080028133'
            ],
            savings: false,
            balance: null
          },
          products: [
            {
              contractType: 'card',
              id: '14560970'
            }
          ]
        }
      ]
    ]
  ])('converts checking account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
