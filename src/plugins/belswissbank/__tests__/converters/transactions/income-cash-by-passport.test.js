import { convertBSBToZenMoneyTransactions } from '../../../converters'

describe('Пополнение счета наличными (по паспорту)', () => {
  const account = {
    id: 'account',
    instrument: 'USD'
  }

  const smsTx = {
    cardTransactionId: 94484897,
    docId: 3134341,
    openwayId: 59774541,
    transactionDate: 1637050320000,
    transactionType: 'Пополнение счета наличными (по паспорту)',
    transactionCategory: 'Request',
    transactionResult: 'Успешно',
    transactionAmount: 270,
    transactionCurrency: 'USD',
    transactionDetails: '257.00 USD',
    city: '',
    countryCode: '',
    accountRest: null,
    accountCurrency: '',
    accountRestDate: 1637050320000,
    colour: 1,
    last4: '0731, NIKOLAY NIKOLAEV'
  }

  const expectedZmTx = {
    comment: 'Пополнение счета наличными (по паспорту)',
    date: new Date('2021-11-16T08:12:00.000Z'),
    merchant: {
      city: null,
      country: null,
      location: null,
      mcc: null,
      title: '257.00 USD'
    },
    movements: [
      {
        id: null,
        account: {
          type: 'cash',
          instrument: 'USD',
          syncIds: null,
          company: null
        },
        invoice: null,
        sum: -270,
        fee: 0
      },
      {
        account: {
          id: 'account'
        },
        fee: 0,
        id: '94484897',
        invoice: null,
        sum: 270
      }
    ]
  }

  it('converts as hold when there is no statement to join', () => {
    expect(convertBSBToZenMoneyTransactions([
      {
        account,
        smsTxs: [smsTx],
        statementTxs: []
      }
    ], [])).toEqual([
      {
        ...expectedZmTx,
        hold: true
      }
    ])
  })

  it('converts as non-hold when there is statement to join', () => {
    expect(
      convertBSBToZenMoneyTransactions([
        {
          account,
          smsTxs: [smsTx],
          statementTxs: [
            {
              realDate: '20211116 12:00:00',
              operationDate: '20211117 12:00:00',
              transactionAmount: 270,
              currencyIso: 'USD',
              amount: 271
            }
          ]
        }
      ], [])
    ).toEqual([
      {
        ...expectedZmTx,
        hold: false
      }
    ])
  })
})
