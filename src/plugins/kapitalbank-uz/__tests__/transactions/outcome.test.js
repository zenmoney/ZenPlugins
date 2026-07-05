import {
  convertCardOrAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        group: {
          title: 'Остальное',
          type: 'OTHER'
        },
        module: 'PROCESSING',
        transactionDate: '2025-01-30 02:03:03.+0000',
        transactionGuid: 'VISA-702ce307-0000-0000-0000-8517b4c9c677',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'APPLE.COM/BILL',
        amount: 399,
        currency: {
          name: 'USD',
          scale: 2
        }
      },
      {
        date: new Date('2025-01-30T02:03:03.000Z'),
        hold: false,
        comment: null,
        merchant: {
          fullTitle: 'APPLE.COM/BILL',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: 'VISA-702ce307-0000-0000-0000-8517b4c9c677',
            account: { id: 'card' },
            invoice: null,
            sum: -3.99,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome USD', (rawTransaction, transaction) => {
    const card = {
      id: 'card',
      instrument: 'USD'
    }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        group: { title: 'Конвертация', type: 'CONVERSION' },
        module: 'CONVERSION',
        transactionDate: '2025-03-01 10:00:00.+0000',
        transactionGuid: 'CNV-abc12345',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'Обмен валюты USD/UZS',
        amount: 10000,
        currency: { name: 'UZS', scale: 2 }
      },
      {
        date: new Date('2025-03-01T10:00:00.000Z'),
        hold: false,
        comment: 'Обмен валюты',
        merchant: null,
        movements: [
          {
            id: 'CNV-abc12345',
            account: { id: 'card' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ]
      }
    ]
  ])('converts CONVERSION module transaction', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        group: { title: 'Вклады', type: 'DEPOSITS' },
        module: 'DEPOSITS_TRANSACTION',
        transactionDate: '2025-04-10 08:00:00.+0000',
        transactionGuid: 'DEP-xyz999',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'Копилка',
        amount: 500000,
        currency: { name: 'UZS', scale: 2 }
      },
      {
        date: new Date('2025-04-10T08:00:00.000Z'),
        hold: false,
        comment: 'Пополнение вклада Копилка',
        merchant: null,
        movements: [
          {
            id: 'DEP-xyz999',
            account: { id: 'card' },
            invoice: null,
            sum: -5000,
            fee: 0
          }
        ]
      }
    ]
  ])('converts DEPOSITS_TRANSACTION module transaction', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        group: { title: 'Вклады', type: 'DEPOSITS' },
        module: 'ACCOUNTS',
        transactionDate: '2025-05-01 00:00:00.+0000',
        transactionGuid: 'ACC-interest-001',
        transactionType: 'CREDIT',
        status: 'SUCCESS',
        name: 'Выплата процентов',
        amount: 25000,
        currency: { name: 'UZS', scale: 2 }
      },
      {
        date: new Date('2025-05-01T00:00:00.000Z'),
        hold: false,
        comment: 'Выплата процентов по вкладу',
        merchant: null,
        movements: [
          {
            id: 'ACC-interest-001',
            account: { id: 'card' },
            invoice: null,
            sum: 250,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        group: { title: 'Переводы', type: 'OTHER' },
        module: 'ACCOUNTS',
        transactionDate: '2025-05-02 12:00:00.+0000',
        transactionGuid: 'ACC-transfer-002',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'Перевод на счёт',
        amount: 100000,
        currency: { name: 'UZS', scale: 2 }
      },
      {
        date: new Date('2025-05-02T12:00:00.000Z'),
        hold: false,
        comment: null,
        merchant: null,
        movements: [
          {
            id: 'ACC-transfer-002',
            account: { id: 'card' },
            invoice: null,
            sum: -1000,
            fee: 0
          }
        ]
      }
    ]
  ])('converts ACCOUNTS module transaction', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
