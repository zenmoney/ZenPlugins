import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '210429_115110_102043180899',
        externalId: '102043180899',
        source: {
          accountNumber: '26205011376033',
          name: 'Николаев Николай Николаевич',
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
        comment: null,
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
        description: '*;101;3280909674;Єдиний соціальний внесок ФОП Николаев Николай Николаевич за серпень 2021 р.;;;'
      },
      { id: '1337', instrument: 'UAH', syncIds: ['UA253253650000000260020009840'] },
      {
        comment: '*;101;3280909674;Єдиний соціальний внесок ФОП Николаев Николай Николаевич за серпень 2021 р.;;;',
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
    ],
    [
      {
        id: '220111_230556_2022-01-11T23:05:56.000+02:00',
        externalId: '795507368',
        source:
          {
            accountNumber: '5168*',
            name: 'Николаев Николай Николаевич',
            currency: 'UAH'
          },
        amountInCents: -819421,
        approvalCode: '507368',
        currency: 'UAH',
        localAmountInCents: -819421,
        operationDate: 1641935156000,
        finalizationDate: 1641935156000,
        description: 'PZU UKRAINE',
        cardId: '4028243',
        holdMarker: 'holdMarker'
      },
      { id: '1337', instrument: 'UAH', syncIds: ['26200011493739', '5168********3152'] },
      {
        hold: true,
        date: new Date('2022-01-11T21:05:56.000Z'),
        movements:
          [
            {
              id: '220111_230556_2022-01-11T23:05:56.000+02:00',
              account: { id: '1337' },
              invoice: null,
              sum: -8194.21,
              fee: 0
            }
          ],
        merchant:
          {
            fullTitle: 'PZU UKRAINE',
            mcc: null,
            location: null
          },
        comment: null
      }
    ],
    [
      {
        id: '211230_190525_102343596282',
        externalId: '102343596282',
        source:
          {
            accountNumber: '26200011493739',
            name: 'Николаев Николай Николаевич',
            currency: 'UAH'
          },
        amountInCents: -2000000,
        currency: 'UAH',
        localAmountInCents: -2000000,
        operationDate: 1640883925000,
        finalizationDate: 1640920322000,
        description: 'KREDOBANK',
        cardId: '4028243'
      },
      { id: '1337', instrument: 'UAH', syncIds: ['26200011493739', '5168********3152'] },
      {
        hold: false,
        date: new Date('2021-12-30T17:05:25.000Z'),
        movements:
          [
            {
              id: '211230_190525_102343596282',
              account: { id: '1337' },
              invoice: null,
              sum: -20000,
              fee: 0
            }
          ],
        merchant: { fullTitle: 'KREDOBANK', mcc: null, location: null },
        comment: null
      }
    ]
  ])('convert outcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
