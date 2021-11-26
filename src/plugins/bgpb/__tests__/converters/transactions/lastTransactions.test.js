import { convertLastTransaction } from '../../../converters'

describe('convertLastTransaction', () => {
  it.each([
    [
      {
        id: '2021-23876315',
        acceptedTime: 1619513263000,
        pushMessageText: 'Card1111; Оплата: 326,85 USD; 27.04.21 11:47:24; Lamoda,Minskiy r-n,,BLR; MCC: 5651; Dostupno: 1 496,43 BYN',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'USD',
          syncID: ['1111']
        }
      ],
      {
        date: new Date('2021-04-27T11:47:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -326.85,
              fee: 0
            }
          ],
        merchant:
          {
            mcc: 5651,
            location: null,
            title: 'Lamoda',
            city: 'Minskiy r-n',
            country: null
          },
        comment: null,
        hold: false
      }
    ],
    [
      {
        id: '2021-60762231',
        acceptedTime: 1632423510000,
        pushMessageText: 'Otmena; Card1111; Предавторизация: 0,06 BYN; 23.09.21 21:58:19; YANDEX.TAXI,Schipol,NLD; Dostupno: 0,37 BYN',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'USD',
          syncID: ['1111']
        }
      ],
      null
    ],
    [
      {
        id: '2021-55569910',
        acceptedTime: 1630749546000,
        pushMessageText: 'Neuspeshno; Card1111; Предавторизация (бронь): 326,97 RUB; 04.09.21 12:58:58; QWB*Qiwi Koshelek,MOSKVA,RUS;',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'USD',
          syncID: ['1111']
        }
      ],
      null
    ],
    [
      {
        id: '2021-60762210',
        acceptedTime: 1632423500000,
        pushMessageText: 'Card1111; Предавторизация (бронь): 0,06 BYN; 23.09.21 21:58:16; YANDEX.TAXI,Schipol,NLD; MCC: 4121; Dostupno: 0,31 BYN',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'BYN',
          syncID: ['1111']
        }
      ],
      {
        date: new Date('2021-09-23T21:58:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -0.06,
              fee: 0
            }
          ],
        merchant:
          {
            mcc: 4121,
            location: null,
            title: 'YANDEX.TAXI',
            city: 'Schipol',
            country: 'NLD'
          },
        comment: null,
        hold: false
      }
    ],
    [
      {
        id: '2021-55952172',
        acceptedTime: 1630922283000,
        pushMessageText: 'Card1111; Смена PIN; Комиссия 2 BYN; 06.09.21 12:57:57;',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'BYN',
          syncID: ['1111']
        }
      ],
      {
        date: new Date('2021-09-06T12:57:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: null,
              sum: -2,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'Смена PIN',
        hold: false
      }
    ],
    [
      {
        id: '2021-59078057',
        acceptedTime: 1631948005000,
        pushMessageText: 'Card1111; Оплата: 58,00 TRY; 18.09.21 09:53:18; ONE STOP MARKET,MUGLA,TUR; MCC: 5411; Dostupno: 3,59 EUR',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'EUR',
          syncID: ['1111']
        }
      ],
      {
        date: new Date('2021-09-18T09:53:00+0300'),
        movements:
          [
            {
              id: null,
              account: { id: 'account' },
              invoice: {
                instrument: 'TRY',
                sum: -58
              },
              sum: null,
              fee: 0
            }
          ],
        merchant:
          {
            mcc: 5411,
            location: null,
            title: 'ONE STOP MARKET',
            city: 'MUGLA',
            country: 'TUR'
          },
        comment: null,
        hold: false
      }
    ],
    [
      {
        id: '2021-76370567',
        acceptedTime: 1637420781000,
        pushMessageText: 'Card1111; Проверка карты: 0,00 USD; 20.11.21 18:06:15; Visa Provisioning Service,,BY; MCC: 6012; Dostupno: 1 248,36 BYN',
        eventType: 4
      },
      [
        {
          id: 'account',
          instrument: 'BYN',
          syncID: ['1111']
        }
      ],
      null
    ]
  ])('converts last transactions', (apiTransaction, accounts, transaction) => {
    expect(convertLastTransaction(apiTransaction, accounts)).toEqual(transaction)
  })
})
