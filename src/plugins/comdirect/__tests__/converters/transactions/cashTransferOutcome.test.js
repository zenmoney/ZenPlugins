import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        reference: 'A72C16J926IE0IIQ/33129',
        bookingStatus: 'BOOKED',
        bookingDate: '2021-05-17',
        amount: { value: '-90', unit: 'EUR' },
        remitter: { holderName: 'DEUTSCHE BANK' },
        deptor: null,
        creditor: null,
        valutaDate: '2021-05-17',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: '01Bargeldauszahlung 02Deutsche Bank//Berlin/DE 032021-05-14T15:39:57 KFN 0 VJ 2312 ',
        transactionType: { key: 'ATM_WITHDRAWAL', text: 'ATM withdrawal' }
      },
      {
        hold: true,
        date: new Date('2021-05-14T15:39:57.000Z'),
        movements: [
          {
            id: 'A72C16J926IE0IIQ/33129',
            account: { id: 'account' },
            invoice: null,
            sum: -90,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'EUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 90,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: '01Bargeldauszahlung 02Deutsche Bank//Berlin/DE',
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
        amount: { value: '-50', unit: 'EUR' },
        remitter: {},
        deptor: null,
        creditor: null,
        valutaDate: null,
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: 'Transact,GA 7522 Muenchen DE 2021-07-15T12:14:24 ',
        transactionType: { key: 'ATM_WITHDRAWAL', text: 'ATM withdrawal' }
      },
      {
        date: new Date('2021-07-15T12:14:24.000Z'),
        hold: false,
        movements: [
          {
            id: null,
            account: { id: 'account' },
            fee: 0,
            invoice: null,
            sum: -50
          },
          {
            account: {
              company: null,
              instrument: 'EUR',
              syncIds: null,
              type: 'cash'
            },
            id: null,
            fee: 0,
            invoice: null,
            sum: 50
          }
        ],
        merchant: {
          fullTitle: 'Transact,GA 7522 Muenchen DE',
          location: null,
          mcc: null
        },
        comment: null
      }
    ]
  ])('converts cash transfer outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'EUR' })).toEqual(transaction)
  })
})
