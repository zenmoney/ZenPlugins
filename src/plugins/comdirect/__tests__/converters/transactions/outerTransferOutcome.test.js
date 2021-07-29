import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        reference: '367670FAC04AA6AC/2',
        bookingStatus: 'BOOKED',
        bookingDate: '2020-01-13',
        amount: {
          value: '-119.99',
          unit: 'EUR'
        },
        remitter: null,
        deptor: null,
        creditor: {
          holderName: 'Goerlizter Park Drogerie',
          iban: 'DE07500105173331414435',
          bic: 'BYLADE77'
        },
        valutaDate: '2020-01-13',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: 'nicht angegeben',
        newTransaction: false,
        remittanceInfo: '01Goods and services                 02End-to-End-Ref.:                   03nicht angegeben                    ',
        transactionType: {
          key: 'TRANSFER',
          text: 'Transfer'
        }
      },
      {
        hold: true,
        date: new Date('2020-01-13'),
        movements: [
          {
            id: '367670FAC04AA6AC/2',
            account: { id: 'account' },
            invoice: null,
            sum: -119.99,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: ['DE07500105173331414435'],
              type: 'ccard'
            },
            invoice: null,
            sum: 119.99,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Goerlizter Park Drogerie',
          location: null,
          mcc: null
        },
        comment: '[Transfer] Goods and services'
      }
    ],
    [
      {
        reference: 'J3221141D3951447/2',
        bookingStatus: 'BOOKED',
        bookingDate: '2021-05-21',
        amount: { value: '-601.4', unit: 'EUR' },
        remitter: null,
        deptor: null,
        creditor:
          {
            holderName: 'Commerzbank (Oleg Don)',
            iban: 'DE51120400000442896700',
            bic: 'COBADEFFXXX'
          },
        valutaDate: '2021-05-21',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: 'nicht angegeben',
        newTransaction: false,
        remittanceInfo: '01End-to-End-Ref.: 02nicht angegeben ',
        transactionType: { key: 'TRANSFER', text: 'Transfer' }
      },
      {
        hold: true,
        date: new Date('2021-05-21'),
        movements: [
          {
            id: 'J3221141D3951447/2',
            account: { id: 'account' },
            invoice: null,
            sum: -601.4,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: ['DE51120400000442896700'],
              type: 'ccard'
            },
            invoice: null,
            sum: 601.4,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Commerzbank (Oleg Don)',
          location: null,
          mcc: null
        },
        comment: '[Transfer] '
      }
    ],
    [
      {
        reference: ' ',
        bookingStatus: 'NOTBOOKED',
        bookingDate: null,
        amount: { value: '-51.51', unit: 'EUR' },
        remitter: {},
        deptor: null,
        creditor: null,
        valutaDate: null,
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: 'KAUFLAND BERLIN KOEPENICKBERLIN KOEPENDE 2021-05-12T12:30:36 ',
        transactionType: { key: 'CARD_TRANSACTION', text: 'Card transaction' }
      },
      {
        hold: false,
        date: new Date('2021-05-12T12:30:36.000Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -51.51,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 51.51,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'KAUFLAND BERLIN KOEPENICKBERLIN KOEPENDE',
          location: null,
          mcc: null
        },
        comment: null
      }
    ],
    [
      {
        reference: ' ',
        bookingStatus: 'NOTBOOKED',
        bookingDate: null,
        amount: { value: '-0.05', unit: 'EUR' },
        remitter: {},
        deptor: null,
        creditor: null,
        valutaDate: null,
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: 'NEXTBIKE GERMANY LEIPZIG DE 2021-06-27T13:06:09 ',
        transactionType: { key: 'CARD_TRANSACTION', text: 'Card transaction' }
      },
      {
        date: new Date('2021-06-27T13:06:09.000Z'),
        hold: false,
        movements: [
          {
            id: null,
            account: { id: 'account' },
            fee: 0,
            invoice: null,
            sum: -0.05
          },
          {
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 0.05
          }
        ],
        merchant: {
          fullTitle: 'NEXTBIKE GERMANY LEIPZIG DE',
          location: null,
          mcc: null
        },
        comment: null
      }
    ],
    [
      {
        reference: 'AUD21091F1521653/13113',
        bookingStatus: 'BOOKED',
        bookingDate: '2021-04-01',
        amount: { value: '-10.89', unit: 'EUR' },
        remitter: null,
        deptor: null,
        creditor: null,
        valutaDate: '2021-04-01',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: '01SUMUP .DOAN RESTAURANT -//BERLIN/D022021-03-31T10:04:39 KFN 0 ',
        transactionType: { key: 'CARD_TRANSACTION', text: 'Card transaction' }
      },
      {
        hold: true,
        date: new Date('2021-03-31T10:04:39.000Z'),
        movements: [
          {
            id: 'AUD21091F1521653/13113',
            account: { id: 'account' },
            invoice: null,
            sum: -10.89,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: null,
              type: 'ccard'
            },
            invoice: null,
            sum: 10.89,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: '01SUMUP .DOAN RESTAURANT -//BERLIN/D',
          location: null,
          mcc: null
        },
        comment: null
      }
    ]
  ])('should convert an outgoing Transfer transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'EUR' })).toEqual(transaction)
  })
})
