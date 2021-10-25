import codeToCurrencyLookup from '../../../../../common/codeToCurrencyLookup'
import { card, convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const accounts = [{
    id: '2007549330000000',
    type: card,
    title: 'Личные, BYN - "Maxima Plus"',
    currencyCode: '933',
    instrument: codeToCurrencyLookup[933],
    balance: 99.9,
    syncID: ['2007549330000000'],
    rkcCode: '004'
  }]

  const tt = [
    {
      name: 'no operation name',
      transaction: {
        accountNumber: '2007549330000000',
        accountType: '1',
        actionGroup: 1802,
        cardPAN: '4500000040120000',
        concreteType: '1',
        merchantId: '1600000',
        operationAmount: 3900,
        operationCode: 3,
        operationCurrency: '933',
        operationDate: 1553029200000,
        operationName: '',
        operationPlace: 'Garage',
        operationSign: '-1',
        rrn: '3070000',
        transactionAmount: 3900,
        transactionAuthCode: '791000',
        transactionCurrency: '933',
        transactionDate: 1553158380000
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1553029200000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: -3900,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Garage',
          location: null,
          mcc: null
        },
        comment: null
      }
    },
    {
      name: 'payment in internet banking',
      transaction: {
        accountNumber: '2007549330000000',
        accountType: '1',
        actionGroup: 1802,
        cardPAN: '4500000040120000',
        concreteType: '1',
        merchantId: '1600000',
        operationAmount: 3900,
        operationCode: 3,
        operationCurrency: '933',
        operationDate: 1553029200000,
        operationName: 'Списание по операции ПЦ "Оплата услуг в ИБ" ',
        operationPlace: 'BNB - OPLATA USLUG',
        operationSign: '-1',
        rrn: '3070000',
        transactionAmount: 3900,
        transactionAuthCode: '791000',
        transactionCurrency: '933',
        transactionDate: 1553158380000
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1553029200000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: -3900,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    },
    {
      name: 'capitalization',
      transaction: {
        accountNumber: '2007549330000000',
        accountType: '1',
        actionGroup: 1802,
        clientName: 'Vasia Pupkin',
        concreteType: '1',
        merchantId: '1600000',
        operationAmount: 2,
        operationCode: 999,
        operationCurrency: '933',
        operationDate: 1553029200000,
        operationName: 'Капитализация (%% тек.периода ко вкладу)',
        operationSign: '1',
        transactionAmount: 2,
        transactionCurrency: '933',
        transactionDate: 1553158380000
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1553029200000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: 2,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Капитализация (%% тек.периода ко вкладу)'
      }
    },
    {
      name: 'capitalization with zero procents',
      transaction: {
        accountType: '1',
        concreteType: '1',
        accountNumber: '2007549330000000',
        operationName: 'Капитализация (%% тек.периода ко вкладу)',
        transactionDate: 1593532140000,
        operationDate: 1593532140000,
        transactionAmount: 0,
        transactionCurrency: '933',
        operationAmount: 0,
        operationCurrency: '933',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Аседовская Майя Григорьевна',
        operationClosingBalance: 422.79,
        operationCode: 999
      },
      expectedTransaction: null
    },
    {
      name: 'deposit capitalization',
      transaction: {
        accountType: '0',
        concreteType: '0',
        accountNumber: '2007549330000000',
        operationName: 'Капитализация. Удержано подоходного налога 0.21',
        transactionDate: 1553158380000,
        operationDate: 1553158380000,
        transactionAmount: 1.6,
        transactionCurrency: '933',
        operationAmount: 1.6,
        operationCurrency: '933',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Vasia Pupkin',
        operationClosingBalance: 8.06,
        operationCode: 999
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1553158380000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: 1.6,
            fee: 0.21,
            invoice: null
          }
        ],
        merchant: null,
        comment: 'Капитализация'
      }
    },
    {
      name: 'add money to deposit',
      transaction: {
        accountNumber: '2007549330000000',
        accountType: '0',
        actionGroup: 2,
        clientName: 'Vasia Pupkin',
        concreteType: '0',
        operationAmount: 200,
        operationClosingBalance: 1,
        operationCode: 999,
        operationCurrency: '933',
        operationDate: 1553029200000,
        operationName: 'On-line пополнение договора (списание с БПК)',
        operationSign: '1',
        transactionAmount: 200,
        transactionCurrency: '933',
        transactionDate: 1553158380000
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1553029200000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: 200,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    },
    {
      name: 'operation in USD',
      transaction: {
        accountNumber: '2007549330000000',
        accountType: '1',
        cardPAN: '1*** **** **** 1234',
        merchantId: '1234',
        operationAmount: 3.49,
        operationCurrency: '840',
        operationDate: 1635058305000,
        operationPlace: 'APPLE.COM/BILL',
        operationSign: '-1',
        transactionAmount: 8.64,
        transactionAuthCode: '342346',
        transactionCurrency: '933'
      },
      expectedTransaction: {
        hold: false,
        date: new Date(1635058305000),
        movements: [
          {
            id: null,
            account: { id: '2007549330000000' },
            sum: -8.64,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'APPLE.COM/BILL',
          location: null,
          mcc: null,
        },
        comment: '3.49 USD'
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, accounts)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }
})
