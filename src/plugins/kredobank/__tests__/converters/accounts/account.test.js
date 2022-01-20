import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '5243525243',
          providerId: 'card',
          legalNumber: '5243525243',
          subproductCode: 'individual_default',
          mainAccountNumber: '5243525243',
          mainAccountCurrency: 'UAH',
          balance: 4687937,
          productTitle: 'Рахунок',
          productSystemKey: 'individual_default',
          iban: 'UA7232536503245432542352345',
          currentInterestRate: 0,
          showAndOperationRule: {
            mainScreenShowAllowed: true,
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
              'EXCHANGE_CURRENCY',
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
              'EXCHANGE_CURRENCY',
              'MAKE_CONTRACT'
            ]
          },
          accountStateCodeName: '1',
          usedCreditLimit: 0,
          ibanForReplenishmentFromPoland: 'PL 51 13241234 2639 4700 12441 4543 73 ',
          lastTransactionValue: '-126456',
          isBtnMoneyTransferFromPolandToUkrainAllowed: 'false',
          blockedAmounValue: '0',
          isDebitBlocked: 'false',
          cardsList: [
            {
              id: '3989902',
              cardNumberMask: '5154********0543',
              expiryMonth: '02',
              expiryYear: '2026',
              ownerName: 'JOHN SMITH',
              status: 'ACTIVE',
              statusName: 'CHST0',
              bankCardType: 'MasterCard',
              limits: null,
              cleareFromResponseToUI: false,
              settings: null
            },
            {
              id: '3485566',
              cardNumberMask: '8615********4024',
              expiryMonth: '06',
              expiryYear: '2024',
              ownerName: 'JOHN SMITH',
              status: 'ACTIVE',
              statusName: 'CHST0',
              bankCardType: 'MasterCard',
              limits: null,
              cleareFromResponseToUI: false,
              settings: null
            }
          ],
          rateId: null,
          isOwnAccount: 'true',
          savingAccountNumber: null,
          savingAccountBalance: null,
          lastTransactionDate: '19.01.2022',
          creditLimit: 0,
          isActiveProduct: 'true'
        }
      ],
      [
        {
          available: 46879.37,
          balance: 46879.37,
          id: '5243525243',
          instrument: 'UAH',
          syncIds: [
            '5243525243'
          ],
          title: 'Рахунок - 5243525243',
          type: 'card',
          iban: 'UA7232536503245432542352345',
          bankType: 'card'
        }
      ]
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
