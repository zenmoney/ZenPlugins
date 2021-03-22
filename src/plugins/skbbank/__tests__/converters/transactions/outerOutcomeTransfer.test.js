import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 969519764,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'transfer-own',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
            descriptions:
              {
                operationDescription: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 425686.13,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: 'На "Обыкновенное чудо!!"',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-03-02T13:49:53+05:00',
            payWallet: null,
            direction: 'internal',
            comment: null,
            productAccount: '40817810825715720880',
            productCardId: null
          },
        details: {
          actions: ['sendCheck', 'print'],
          amount: 425686.13,
          bankSystemId: '7079064656',
          category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
          chargeDate: '2021-03-02T13:50:22+05:00',
          comment: 'Перевод между счетами через систему ДБО',
          convAmount: null,
          convCurrency: null,
          currency: 'RUB',
          dateCreated: '2021-03-02T13:49:53+05:00',
          descriptions:
            {
              operationDescription: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
              productDescription: 'Счет Mastercard Unembossed',
              productType: 'Со счета карты'
            },
          direction: 'internal',
          feeAmount: 0,
          feeCurrency: 'RUB',
          firstCurrency: null,
          id: 969519764,
          mainRequisite: 'На "Обыкновенное чудо!!"',
          operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
          orderedRequisites: [],
          payeeAccount: '42306810925701652119',
          payeeBic: '046577756',
          payerAccount: '40817810825715720880',
          payerBic: '046577756',
          productAccount: '40817810825715720880',
          productCardId: null,
          rate: null,
          requisites: {},
          secondCurrency: null,
          state: 'processed',
          transactionType: 'transfer-own'
        }
      },
      {
        '40817810825715720880': { id: 'account1', instrument: 'RUB' },
        '42305810725700366005': { id: 'account2', instrument: 'RUB' }
      },
      {
        date: new Date('2021-03-02T13:49:53+05:00'),
        hold: false,
        comment: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
        merchant: null,
        movements: [
          {
            id: '969519764',
            account: { id: 'account1' },
            invoice: null,
            sum: -425686.13,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: [
                '42306810925701652119'
              ],
              company: null
            },
            invoice: null,
            sum: 425686.13,
            fee: 0
          }
        ]
      }
    ]
  ])('should convert outer outcome transfer', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
