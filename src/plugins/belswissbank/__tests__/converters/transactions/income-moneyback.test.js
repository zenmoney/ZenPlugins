import { convertBSBToZenMoneyTransactions } from '../../../converters'

describe('Зачисление Money-back', () => {
  const account = {
    id: 'account',
    instrument: 'BYN'
  }

  const smsTx = {
    cardTransactionId: 100292434,
    docId: 3788563,
    openwayId: 65582065,
    transactionDate: 1646910420000,
    transactionType: 'Зачисление Money-back',
    transactionCategory: 'Request',
    transactionResult: 'Успешно',
    transactionAmount: 0.1,
    transactionCurrency: 'BYN',
    transactionDetails: '179.58 BYN',
    city: '',
    countryCode: '',
    accountRest: null,
    accountCurrency: '',
    accountRestDate: 1646910420000,
    colour: 1,
    last4: '1234, NIKOLAY NIKOLAEV'
  }

  const expectedZmTx = {
    comment: 'Зачисление Money-back',
    date: new Date('2022-03-10T11:07:00.000Z'),
    merchant: {
      city: null,
      country: null,
      location: null,
      mcc: null,
      title: '179.58 BYN'
    },
    movements: [
      {
        account: {
          id: 'account'
        },
        fee: 0,
        id: '100292434',
        invoice: null,
        sum: 0.1
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
              realDate: '20220310 12:00:00',
              operationDate: '20220312 12:00:00',
              transactionAmount: 0.1,
              currencyIso: 'BYN',
              amount: 0.1
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
