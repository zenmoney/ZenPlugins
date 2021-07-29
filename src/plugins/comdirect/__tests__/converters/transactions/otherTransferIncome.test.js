import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        reference: '3E83B8AF2E7E97E8/1',
        bookingStatus: 'BOOKED',
        bookingDate: '2020-06-02',
        amount: {
          value: '158.8',
          unit: 'EUR'
        },
        remitter: {
          holderName: 'Hogs of War GmbH'
        },
        deptor: null,
        creditor: null,
        valutaDate: '2020-06-02',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: '2121',
        newTransaction: false,
        remittanceInfo: '01Refund for a broken helmet F892251 02End-to-End-Ref.:                   032121                               ',
        transactionType: {
          key: 'TRANSFER',
          text: 'Transfer'
        }
      },
      {
        hold: true,
        date: new Date('2020-06-02'),
        movements: [
          {
            id: '3E83B8AF2E7E97E8/1',
            account: { id: 'account' },
            invoice: null,
            sum: 158.8,
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
            sum: -158.8,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Hogs of War GmbH',
          location: null,
          mcc: null
        },
        comment: '[Transfer] Refund for a broken helmet F892251'
      }
    ]
  ])('should convert an incoming Transfer transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'EUR' })).toEqual(transaction)
  })
})
