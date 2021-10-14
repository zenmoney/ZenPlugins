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

  it('convert into cash deposit transaction', () => {
    const transaction = convertTransaction({
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
      operationName: 'Снятие со счета наличных в ПВН банка',
      operationPlace: 'POV-7 BNB PVN',
      operationSign: '-1',
      rrn: '3070000',
      transactionAmount: 3900,
      transactionAuthCode: '791000',
      transactionCurrency: '933',
      transactionDate: 1553158380000
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date(1553029200000),
      movements: [
        {
          id: null,
          account: { id: '2007549330000000' },
          sum: -3900,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: { company: null, instrument: 'BYN', syncIds: null, type: 'cash' },
          sum: 3900,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('convert into cash deposit transaction', () => {
    const transaction = convertTransaction({
      accountNumber: '2007549330000000',
      operationName: 'Пополнение карт наличными через ЕРИП',
      operationPlace: 'POPOLNENIE KARTY',
      merchantId: '450450845011',
      transactionAuthCode: '496154',
      transactionDate: 1633951680000,
      operationDate: 1633886340000,
      transactionAmount: 100,
      transactionCurrency: '933',
      operationAmount: 100,
      operationCurrency: '933',
      operationSign: '1',
      actionGroup: 1802,
      operationClosingBalance: 300,
      cardPAN: '4500000040120000',
      operationCode: 2
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date(1633886340000),
      movements: [
        {
          id: null,
          account: { id: '2007549330000000' },
          sum: 100,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: { company: null, instrument: 'BYN', syncIds: null, type: 'cash' },
          sum: -100,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('convert into income transaction', () => {
    const transaction = convertTransaction({
      accountNumber: '2007549330000000',
      operationPlace: 'POPOLNENIE KARTY ',
      merchantId: '6012',
      transactionAuthCode: '756342',
      operationDate: 1634108020000,
      transactionAmount: 200,
      transactionCurrency: '933',
      operationAmount: 200,
      operationCurrency: '933',
      operationSign: '1',
      operationType: 6,
      cardPAN: '4500000040120000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date(1634108020000),
      movements: [
        {
          id: null,
          account: { id: '2007549330000000' },
          sum: 200,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: { company: null, instrument: 'BYN', syncIds: null, type: 'ccard' },
          sum: -200,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
