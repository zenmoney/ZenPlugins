import codeToCurrencyLookup from '../../../../../common/codeToCurrencyLookup'
import { card, convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const accounts = [{
    id: '2007549330000000',
    type: card,
    title: 'Личные, BYN - "Maxima Plus"',
    currencyCode: 933,
    instrument: codeToCurrencyLookup[933],
    balance: 99.9,
    syncID: ['2007549330000000'],
    rkcCode: '004'
  }]

  it('convert into cash transaction', () => {
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
      date: new Date(1553158380000),
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
})
