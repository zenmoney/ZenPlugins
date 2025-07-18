import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '52024645741507',
        amount: {
          amount: -21.21,
          currIso: 'BYN'
        },
        date: '2020-03-12T18:53:56',
        description: 'BREST Покупка товара / получение услуг SHOP "EVROOPT" MVV',
        operationAmount: null,
        cardMask: '4.1507',
        status: 'normal',
        number: 'BY50 ALFA 3014 4414 9600 9027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY50ALFA30144414960090270000']
      },
      {
        hold: false,
        date: new Date('2020-03-12T18:53:56+03:00'),
        movements: [
          {
            id: '52024645741507',
            account: { id: 'account' },
            invoice: null,
            sum: -21.21,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'BREST',
          title: 'SHOP "EVROOPT" MVV',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '52337144159491',
        amount: {
          amount: -51.65,
          currIso: 'BYN'
        },
        date: '2020-03-15T14:54:17',
        description: 'GATWICK Покупка товара / получение услуг JAMIE\'S DINER - DELI T',
        operationAmount: {
          amount: -16.8,
          currIso: 'GBP'
        },
        cardMask: '5.9491',
        status: 'normal',
        number: 'BY19 ALFA 3014 309W VQ00 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY19ALFA3014309WVQ0010270000']
      },
      {
        hold: false,
        date: new Date('2020-03-15T14:54:17+03:00'),
        movements: [
          {
            id: '52337144159491',
            account: { id: 'account' },
            invoice: {
              sum: -16.8,
              instrument: 'GBP'
            },
            sum: -51.65,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'GATWICK',
          title: 'JAMIE\'S DINER - DELI T',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '52337144159491',
        title: 'SHOP "EVROOPT" MVV',
        amount: {
          amount: -17.57,
          currIso: 'BYN'
        },
        date: '2020-05-29T10:32:36',
        description: 'PINSK BLR',
        operationAmount: null,
        cardMask: '5.7884',
        status: 'normal',
        number: 'BY63 ALFA 3014 309W VQ00 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY63ALFA3014309WVQ0010270000']
      },
      {
        hold: false,
        date: new Date('2020-05-29T10:32:36+03:00'),
        movements: [
          {
            id: '52337144159491',
            account: { id: 'account' },
            invoice: null,
            sum: -17.57,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'PINSK',
          title: 'SHOP "EVROOPT" MVV',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '65329012055084',
        title: 'SHOP "SISTERS" BPSB',
        amount: {
          amount: -69.98,
          currIso: 'BYN'
        },
        date: '2020-07-05T19:57:28',
        description: 'MINSKIY R-N BLR',
        operationAmount: null,
        cardMask: '5.5084',
        status: 'normal',
        number: 'BY46 ALFA 3014 4808 3101 6027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY46ALFA30144808310160270000']
      },
      {
        hold: false,
        date: new Date('2020-07-05T19:57:28+03:00'),
        movements: [
          {
            id: '65329012055084',
            account: { id: 'account' },
            invoice: null,
            sum: -69.98,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'MINSKIY R-N',
          title: 'SHOP "SISTERS" BPSB',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '147555058041019',
        title: 'PT JOGA-STUDIYA',
        amount: {
          amount: -78,
          currIso: 'BYN'
        },
        date: '2021-05-18T11:03:33',
        description: 'MINSK BLR (7941)',
        operationAmount: null,
        cardMask: '4.1019',
        status: 'normal',
        number: 'BY42 ALFA 3014 6348 6600 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY42ALFA30146348660010270000']
      },
      {
        hold: false,
        date: new Date('2021-05-18T11:03:33+0300'),
        movements: [
          {
            id: '147555058041019',
            account: { id: 'account' },
            invoice: null,
            sum: -78,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          title: 'PT JOGA-STUDIYA',
          mcc: 7941,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '145357847052803',
        title: 'I.-RES. "WWW.GOELEVEN.',
        amount: {
          amount: -2.55,
          currIso: 'BYN'
        },
        date: '2021-05-16T20:36:13',
        description: 'MINSK BLR (7999)',
        operationAmount: null,
        cardMask: '5.2803',
        status: 'normal',
        number: 'BY71 ALFA 3014 30DK U600 1027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY71ALFA301430DKU60010270000']
      },
      {
        hold: false,
        date: new Date('2021-05-16T20:36:13+0300'),
        movements: [
          {
            id: '145357847052803',
            account: { id: 'account' },
            invoice: null,
            sum: -2.55,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          title: 'I.-RES. "WWW.GOELEVEN.',
          mcc: 7999,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '137427783041965',
        title: 'RBO N4 KFC-MASHEROVA B',
        amount: {
          amount: -7.7,
          currIso: 'BYN'
        },
        date: '2021-05-11T20:53:10',
        description: 'BREST Покупка товара / получение услуг RBO N4 KFC-MASHEROVA BRES (5812)',
        operationAmount: null,
        cardMask: '4.1965',
        status: 'normal',
        number: 'BY41 ALFA 3014 30DK U600 3027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY41ALFA301430DKU60030270000']
      },
      {
        hold: false,
        date: new Date('2021-05-11T20:53:10+0300'),
        movements: [
          {
            id: '137427783041965',
            account: { id: 'account' },
            invoice: null,
            sum: -7.7,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'BREST',
          title: 'RBO N4 KFC-MASHEROVA B',
          mcc: 5812,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '140109583041965',
        title: 'STOLOVAYA N 16',
        amount: {
          amount: -4.97,
          currIso: 'BYN'
        },
        date: '2021-05-13T13:25:16',
        description: 'BREST Покупка товара / получение услуг STOLOVAYA N 16 (5812)',
        operationAmount: null,
        cardMask: '4.1965',
        status: 'normal',
        number: 'BY41 ALFA 3014 30DK U600 3027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'BYN',
        syncID: ['BY41ALFA301430DKU60030270000']
      },
      {
        hold: false,
        date: new Date('2021-05-13T13:25:16+0300'),
        movements: [
          {
            id: '140109583041965',
            account: { id: 'account' },
            invoice: null,
            sum: -4.97,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'BREST',
          title: 'STOLOVAYA N 16',
          mcc: 5812,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '613655368046707',
        title: 'MILEONAIR APP',
        amount: {
          amount: -0.01,
          currIso: 'USD'
        },
        date: '2022-03-04T02:51:30',
        description: 'MOSKVA RUS (4722)',
        operationAmount: {
          amount: -1,
          currIso: 'RUB'
        },
        cardMask: '4.6707',
        status: 'normal',
        number: 'BY63 ALFA 3014 30LV PV00 2027 0000',
        operationType: null
      },
      {
        id: 'account',
        instrument: 'USD',
        syncID: ['BY63ALFA301430LVPV0020270000']
      },
      {
        date: new Date('2022-03-03T23:51:30.000Z'),
        hold: false,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '613655368046707',
            invoice: {
              instrument: 'RUB',
              sum: -1
            },
            sum: -0.01
          }
        ],
        merchant: {
          city: 'MOSKVA',
          country: 'RUS',
          location: null,
          mcc: 4722,
          title: 'MILEONAIR APP'
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
