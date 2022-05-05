import { convertBSBToZenMoneyTransactions } from '../../../converters'

describe('Товары и услуги (Перевод между картами)', () => {
  const account = {
    id: 'account',
    instrument: 'BYN'
  }

  const smsTx = {
    cardTransactionId: 100028552,
    docId: 3524681,
    openwayId: 65318183,
    transactionDate: 1646383980000,
    transactionType: 'Товары и услуги',
    transactionCategory: 'Request',
    transactionResult: 'Успешно',
    transactionAmount: 5,
    transactionCurrency: 'BYN',
    transactionDetails: 'PERSON TO PERSON I-B BSB',
    city: 'MINSK',
    countryCode: 'BLR',
    accountRest: 597.91,
    accountCurrency: 'BYN',
    accountRestDate: 1646383980000,
    colour: 2,
    last4: '1128'
  }

  const archiveTx = {
    paymentId: 12773198,
    paymentDate: 1646383983000,
    last4: '1128',
    amount: 5,
    currencyIso: 'BYN',
    target: '460122xxxxxx1234, Владимиров В.В.',
    name: 'Перевод между картами',
    paymentTypeIcon: 8,
    diType: 9120,
    isReversible: false,
    status: 'COMPLETED',
    response: { __omitted__: true },
    comment: 'привет с Донецка',
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
    comment: 'привет с Донецка',
    date: new Date('2022-03-04T08:53:00.000Z'),
    hold: true,
    merchant: {
      city: 'MINSK',
      country: 'BLR',
      location: null,
      mcc: null,
      title: 'Перевод между картами, 460122xxxxxx1234, Владимиров В.В.'
    },
    movements: [
      {
        account: { id: 'account' },
        fee: 0,
        id: '100028552',
        invoice: null,
        sum: -5
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
              realDate: '20220304 12:00:00',
              operationDate: '20220307 12:00:00',
              transactionAmount: 5,
              currencyIso: 'BYN',
              amount: 5
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
