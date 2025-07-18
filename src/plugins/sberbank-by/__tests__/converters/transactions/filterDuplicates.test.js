import { convertTransactions } from '../../../converters'

describe('filterDuplicates', () => {
  it.each([
    [
      [
        {
          sourceSystem: 4,
          eventId: '6022425000410383389811',
          contractId: '10957794',
          cardPAN: '911238******4812',
          cardId: '1771310095',
          eventDate: 1712911020000,
          transactionCode: '01000R',
          transactionName: 'SOU Sber Bank > Minsk BLR Терминал: WWL90902 RRN:410383389811 AuthCode:602242',
          merchantId: '0802082',
          merchantPlace: 'SOU Sber Bank > Minsk BLR',
          transactionSum: -50,
          transactionCurrency: '933',
          commissionSum: 0,
          commissionCurrency: '933',
          rnnCode: '410383389811',
          authorizationCode: '602242',
          eventStatus: 0,
          payAvailable: false
        },
        {
          sourceSystem: 2,
          eventId: '2838330599',
          contractId: '10979524',
          contractCurrency: '933',
          cardPAN: '',
          eventDate: 1712911022000,
          processingDate: 1712869200000,
          transactionType: 1,
          transactionCode: '1',
          transactionName: 'Открытие',
          operationCode: '1000001',
          transactionSum: 50,
          transactionCurrency: '933',
          eventStatus: 1,
          payAvailable: false
        },
        {
          sourceSystem: 3,
          eventId: '610515495',
          contractId: '10957794',
          cardPAN: '911238******4812',
          cardId: '1771310095',
          eventDate: 1712911020000,
          transactionType: -1,
          transactionCode: '1463',
          transactionName: 'Открытие вклада в BYN (on-line) 3151077C051PB8',
          transactionSum: 50,
          transactionCurrency: '933',
          rnnCode: '410395086342',
          authorizationCode: '602242',
          eventStatus: 0,
          souServiceCode: 1463,
          souEventId: '610515495',
          payAvailable: false
        }
      ],
      {
        10957794: {
          id: 'account-1',
          instrument: 'BYN'
        },
        10979524: {
          id: 'account-2',
          instrument: 'BYN'
        }
      },
      [
        {
          comment: null,
          date: new Date('2024-04-12T08:37:00.000Z'),
          hold: true,
          merchant: {
            city: 'Minsk',
            country: 'BLR',
            location: null,
            mcc: null,
            title: 'SOU Sber Bank'
          },
          movements: [
            {
              account: { id: 'account-1' },
              fee: 0,
              id: '6022425000410383389811',
              invoice: null,
              sum: -50
            }
          ]
        },
        {
          hold: false,
          date: new Date('2024-04-12T08:37:02.000Z'),
          movements: [
            {
              id: '2838330599',
              account: { id: 'account-2' },
              invoice: null,
              sum: 50,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Открытие'
        }
      ]
    ]
  ])('converts filter duplicates transactions', (apiTransactions, accountsByContractNumber, transactions) => {
    expect(convertTransactions(apiTransactions, accountsByContractNumber)).toEqual(transactions)
  })
})
