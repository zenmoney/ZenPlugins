import { convertBSBToZenMoneyTransactions } from '../../../converters'

describe('Пополнение счета наличными', () => {
  const account = {
    id: 'account',
    instrument: 'EUR'
  }

  const smsTx = {
    cardTransactionId: 100534077,
    docId: 4030206,
    openwayId: 65823708,
    transactionDate: 1647342420000,
    transactionType: 'Пополнение счета наличными',
    transactionCategory: 'Request',
    transactionResult: 'Успешно',
    transactionAmount: 5540,
    transactionCurrency: 'EUR',
    transactionDetails: '5534.00 EUR',
    city: '',
    countryCode: '',
    accountRest: null,
    accountCurrency: '',
    accountRestDate: 1647342420000,
    colour: 1,
    last4: '<string[24]>'
  }
  const expectedZmTx = {
    comment: 'Пополнение счета наличными',
    date: new Date('2022-03-15T11:07:00.000Z'),
    hold: true,
    merchant: {
      city: null,
      country: null,
      location: null,
      mcc: null,
      title: '5534.00 EUR'
    },
    movements: [
      {
        id: null,
        account: {
          type: 'cash',
          instrument: 'EUR',
          syncIds: null,
          company: null
        },
        invoice: null,
        sum: -5540,
        fee: 0
      },
      {
        account: {
          id: 'account'
        },
        fee: 0,
        id: '100534077',
        invoice: null,
        sum: 5540
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
              realDate: '20220315 12:00:00',
              operationDate: '20220317 12:00:00',
              transactionAmount: 5540,
              currencyIso: 'EUR',
              amount: 5534
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
