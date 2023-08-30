import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const account = {
    id: 'account',
    instrument: 'USD',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          operationName: 'BAPB - OPLATA USLUG',
          operationPlace: 'BLR-MINSK-WWL90002-0900324',
          transactionDate: 1587394694000,
          operationDate: 1587416400000,
          transactionAmount: -200.00,
          transactionCurrency: 'USD',
          operationAmount: -200.00,
          operationCurrency: 'USD'
        },
        {
          operationName: 'Другие платежи',
          transactionDate: 1596844800000,
          operationDate: 1596834000000,
          transactionAmount: 403.16,
          transactionCurrency: 'USD',
          operationAmount: 403.16,
          operationCurrency: 'USD'
        },
        {
          operationName: 'BAPB - OPLATA USLUG',
          operationPlace: 'BLR-MINSK-SMS90401-0900324',
          transactionDate: 1587376169000,
          operationDate: 1587416400000,
          transactionAmount: 495.00,
          transactionCurrency: 'BYN',
          operationAmount: 200.24,
          operationCurrency: 'USD'
        },
        {
          operationName: 'BAPB - OPLATA USLUG',
          operationPlace: 'BLR-MINSK-SMS90401-0900324',
          transactionDate: 1589284729000,
          operationDate: 1589317200000,
          transactionAmount: 500.00,
          transactionCurrency: 'BYN',
          operationAmount: 203.09,
          operationCurrency: 'USD'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1587394694000),
          movements: [
            {
              id: '1587394694000_-200',
              account: { id: 'account' },
              invoice: null,
              sum: -200.00,
              fee: 0
            }
          ],
          merchant: {
            title: 'BAPB',
            city: 'MINSK',
            country: 'BLR',
            location: null,
            mcc: null
          },
          comment: null
        },
        {
          hold: false,
          date: new Date(1596844800000),
          movements: [
            {
              id: '1596844800000_-403.16',
              account: { id: 'account' },
              invoice: null,
              sum: -403.16,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Другие платежи'
        },
        {
          hold: false,
          date: new Date(1587376169000),
          movements: [
            {
              id: '1587376169000_-200.24',
              account: { id: 'account' },
              invoice: {
                instrument: 'BYN',
                sum: -495.00
              },
              sum: -200.24,
              fee: 0
            }
          ],
          merchant: {
            title: 'BAPB', // очень спорное решение
            city: 'MINSK',
            country: 'BLR',
            location: null,
            mcc: null
          },
          comment: null
        },
        {
          hold: false,
          date: new Date(1589284729000),
          movements: [
            {
              id: '1589284729000_-203.09',
              account: { id: 'account' },
              invoice: {
                instrument: 'BYN',
                sum: -500.00
              },
              sum: -203.09,
              fee: 0
            }
          ],
          merchant: {
            title: 'BAPB',
            city: 'MINSK',
            country: 'BLR',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ]
  ])('converts outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
  const eurAccount = {
    id: 'account',
    instrument: 'EUR',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          accountType: '9716',
          concreteType: '9716',
          accountNumber: '9716114',
          transactionDate: 1602968400000,
          operationDate: 1602968400000,
          operationAmount: 0.03,
          operationCurrency: '978',
          operationPercentsAmount: 0.03,
          operationPercentsCurrency: '978',
          amountAfterOperaion: 500.58,
          percentAmountAfterOperation: 0.03,
          operationDirection: 4
        },
        {
          accountType: '9716',
          concreteType: '9716',
          accountNumber: '9716114',
          operationName: 'Списание налога с начисленных процентов',
          transactionDate: 1602968400000,
          operationDate: 1602968400000,
          operationAmount: 0.03,
          operationCurrency: '978',
          operationPercentsAmount: 0.03,
          operationPercentsCurrency: '978',
          amountAfterOperaion: 500.58,
          percentAmountAfterOperation: 0,
          operationDirection: 4
        }
      ],
      [
        {
          hold: false,
          date: new Date(1602968400000),
          movements: [
            {
              id: '1602968400000_-0.03',
              account: { id: 'account' },
              invoice: null,
              sum: -0.03,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Списание налога с начисленных процентов'
        }
      ]
    ]
  ])('converts outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, eurAccount)).toEqual(transaction)
  })
  const account1 = {
    id: 'account',
    instrument: 'BYN',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          operationName: 'Ежемесячная плата за предоставление услуги SMS-информирование',
          transactionDate: 1601413200000,
          operationDate: 1601413200000,
          operationAmount: -1.15,
          operationCurrency: 'BYN'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1601413200000),
          movements: [
            {
              id: '1601413200000_-1.15',
              account: { id: 'account' },
              invoice: null,
              sum: -1.15,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Ежемесячная плата за предоставление услуги SMS-информирование'
        }
      ]
    ],
    [
      [
        {
          operationName: 'SHOP "KIRMASH"',
          operationPlace: 'BLR-PINSK-SHE52516-0083152',
          transactionDate: 1605432193000,
          operationDate: 1605474000000,
          transactionAmount: -42.1,
          transactionCurrency: 'BYN',
          operationAmount: -42.1,
          operationCurrency: 'BYN'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1605432193000),
          movements: [
            {
              id: '1605432193000_-42.1',
              account: { id: 'account' },
              invoice: null,
              sum: -42.1,
              fee: 0
            }
          ],
          merchant: {
            title: 'SHOP "KIRMASH"', // очень спорное решение
            city: 'PINSK',
            country: 'BLR',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          operationName: 'TP "OAZIS"',
          operationPlace: 'BLR-PINSK-SHC02722-0084406',
          transactionDate: 1605622101000,
          operationDate: 1605646800000,
          transactionAmount: -6.38,
          transactionCurrency: 'BYN',
          operationAmount: -6.38,
          operationCurrency: 'BYN'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1605622101000),
          movements: [
            {
              id: '1605622101000_-6.38',
              account: { id: 'account' },
              invoice: null,
              sum: -6.38,
              fee: 0
            }
          ],
          merchant: {
            title: 'TP "OAZIS"',
            city: 'PINSK',
            country: 'BLR',
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          accountType: '3097',
          concreteType: '3097',
          accountNumber: '4242015000376',
          operationDate: 1609362000000,
          operationAmount: 5.1,
          description: 'Начисление процентов по основному долгу'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1609362000000),
          movements: [
            {
              id: '1609362000000_-5.1',
              account: { id: 'account' },
              invoice: null,
              sum: -5.1,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Начисление процентов по основному долгу'
        }
      ]
    ],
    [
      [
        {
          operationName: 'OPLATA USLUG',
          operationPlace: 'BLR-MINSK-INF12744-0002048',
          transactionDate: 1634547807000,
          operationDate: 1634590800000,
          transactionAmount: -130.59,
          transactionCurrency: 'BYN',
          operationAmount: -130.59,
          operationCurrency: 'BYN'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1634547807000),
          movements:
            [
              {
                id: '1634547807000_-130.59',
                account: { id: 'account' },
                invoice: null,
                sum: -130.59,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'OPLATA USLUG'
        }
      ]
    ]
  ])('converts outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account1)).toEqual(transaction)
  })
})
