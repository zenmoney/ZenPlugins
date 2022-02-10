import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '210429_115110_102043180899',
        externalId: '102043180899',
        source: {
          accountNumber: '26205011376033',
          name: 'Роман Олегович Антонов',
          currency: 'UAH'
        },
        amountInCents: -4014,
        currency: 'UAH',
        localAmountInCents: -4014,
        operationDate: 1619686270000,
        finalizationDate: 1619735492000,
        description: 'APTEKA',
        cardId: '3632841'
      },
      { id: '1337', instrument: 'UAH', syncIds: ['26205011376033'] },
      {
        comment: 'APTEKA',
        date: new Date('2021-04-29T08:51:10.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'APTEKA',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '210429_115110_102043180899',
            invoice: null,
            sum: -40.14
          }
        ]
      }
    ],
    [
      {
        id: '210913_103313_320',
        externalId: '320',
        source: {
          accountNumber: 'UA768999980000355609204022656',
          bankId: '899998',
          taxId: '44116011',
          name: 'ГУ ДПС у м.Києві (ДПI у Подільському р',
          currency: '980'
        },
        amountInCents: -132000,
        currency: 'UAH',
        localAmountInCents: -132000,
        operationDate: 1631491200000,
        finalizationDate: 1631518393000,
        description: '*;101;3280909674;Єдиний соціальний внесок ФОП Антонов Роман Олегович за серпень 2021 р.;;;'
      },
      { id: '1337', instrument: 'UAH', syncIds: ['UA253253650000000260020009840'] },
      {
        comment: '*;101;3280909674;Єдиний соціальний внесок ФОП Антонов Роман Олегович за серпень 2021 р.;;;',
        date: new Date('2021-09-13T00:00:00.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'ГУ ДПС у м.Києві (ДПI у Подільському р',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '210913_103313_320',
            invoice: null,
            sum: -1320
          }
        ]
      }
    ]
  ])('convert outcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
