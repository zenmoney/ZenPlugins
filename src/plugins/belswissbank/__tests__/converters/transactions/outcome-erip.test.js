import { convertBSBToZenMoneyTransactions } from '../../../converters'

describe('Товары и услуги (LIFE:) НА № ТЕЛЕФОНА)', () => {
  const account = {
    id: 'account',
    instrument: 'BYN'
  }

  const smsTx = {
    cardTransactionId: 101399297,
    docId: 4879509,
    openwayId: 66688928,
    transactionDate: 1648892640000,
    transactionType: 'Товары и услуги',
    transactionCategory: 'Request',
    transactionResult: 'Успешно',
    transactionAmount: 16.8,
    transactionCurrency: 'BYN',
    transactionDetails: 'INTERNET-BANKING BSB',
    city: 'MINSK',
    countryCode: 'BLR',
    accountRest: 364.77,
    accountCurrency: 'BYN',
    accountRestDate: 1648892640000,
    colour: 2,
    last4: '9867'
  }

  const archiveTx = {
    paymentId: 12992625,
    paymentDate: 1648892675000,
    last4: '9867',
    amount: 16.8,
    currencyIso: 'BYN',
    target: '256839111',
    name: 'LIFE:) НА № ТЕЛЕФОНА',
    paymentTypeIcon: 1,
    diType: 9191,
    isReversible: true,
    status: 'COMPLETED',
    response: { __omitted__: true },
    comment: null,
    imageId: null,
    linkExpirationTime: null,
    isBePaid: false,
    isTorn: false,
    linkTorn: null,
    expiredTornDate: null,
    paymentIdTorn: null,
    rrn: null,
    authCode: null
  }

  const expectedZmTx = {
    comment: null,
    date: new Date('2022-04-02T09:44:00.000Z'),
    hold: true,
    merchant: {
      city: 'MINSK',
      country: 'BLR',
      location: null,
      mcc: null,
      title: 'LIFE:) НА № ТЕЛЕФОНА, 256839111'
    },
    movements: [
      {
        account: { id: 'account' },
        fee: 0,
        id: '101399297',
        invoice: null,
        sum: -16.8
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
    ], [archiveTx])).toEqual([
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
              realDate: '20220402 12:00:00',
              operationDate: '20220404 12:00:00',
              transactionAmount: 16.8,
              currencyIso: 'BYN',
              amount: 16.8
            }
          ]
        }
      ], [archiveTx])
    ).toEqual([
      {
        ...expectedZmTx,
        hold: false
      }
    ])
  })
})
