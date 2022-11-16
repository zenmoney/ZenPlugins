import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        accountType: '5',
        concreteType: '5',
        accountNumber: '3001779330015745',
        operationName: 'Выдача части на другой счет',
        transactionDate: 1663922197000,
        operationDate: 1663922197000,
        transactionAmount: 214.81,
        transactionCurrency: '933',
        operationAmount: 214.81,
        operationCurrency: '933',
        operationSign: '-1',
        actionGroup: 3,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 0,
        operationCode: 3
      },
      [
        {
          id: '3001779330015745',
          type: 'card',
          title: 'Цифровая карта 1-2-3, BYN',
          currencyCode: '933',
          instrument: 'BYN',
          balance: 16.36,
          syncID: ['3001779330015745', '3209'],
          rkcCode: '5761',
          cardHash: 'KWentZ2gnMJh-X-nu5P0n_pI1NH3yRcQWSIo6L9yosYbPAiEDT7s4Do1WKRhS3qrUqn4Vf2ghhj2LLhW-fA3Fg'
        }
      ],
      {
        date: new Date('2022-09-23T08:36:37.000Z'),
        movements:
          [
            {
              id: null,
              account: { id: '3001779330015745' },
              invoice: null,
              sum: -214.81,
              fee: 0
            }
          ],
        merchant: null,
        comment: null,
        hold: false,
        groupKeys: [
          '2022-09-23_BYN_214.81'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, accounts, transaction) => {
    expect(convertTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
