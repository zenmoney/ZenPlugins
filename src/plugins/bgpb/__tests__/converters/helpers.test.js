import { mergeStatementAndLastTransactions, transactionsUnique } from '../../converters'

describe('transactionsUnique', () => {
  it('should return one element', () => {
    const arr = transactionsUnique([
      {
        comment: null,
        date: new Date('2019-01-02T19:02:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements:
        [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: null,
            invoice: {
              instrument: 'EUR',
              sum: -250
            },
            sum: -300
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-01-02T19:02:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements:
        [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: null,
            invoice: {
              instrument: 'EUR',
              sum: -250
            },
            sum: -300
          }
        ]
      }
    ])

    expect(arr).toEqual([
      {
        comment: null,
        date: new Date('2019-01-02T19:02:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements:
        [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: null,
            invoice: {
              instrument: 'EUR',
              sum: -250
            },
            sum: -300
          }
        ]
      }
    ])
  })
})

describe('mergeStatementAndLastTransactions', () => {
  function transaction ({ id, date, sum, comment, hold = false }) {
    return {
      comment,
      date: new Date(date),
      hold,
      merchant: null,
      movements: [{
        account: { id: 'card-account' },
        fee: 0,
        id,
        invoice: null,
        sum
      }]
    }
  }

  it('removes cross-source copies one-to-one while preserving repeated transfers', () => {
    const statements = [
      transaction({ id: 'statement-1', date: '2026-05-15T10:55:00+03:00', sum: -250, comment: 'PEREVOD (SPISANIE)' }),
      transaction({ id: 'statement-2', date: '2026-05-15T11:05:00+03:00', sum: -250, comment: 'PEREVOD (SPISANIE)' }),
      transaction({ id: 'statement-3', date: '2026-05-15T12:00:00+03:00', sum: 500, comment: 'ZACHISLENIE NA KARTU' })
    ]
    const history = [
      transaction({ id: 'history-1', date: '2026-05-15T10:55:51+03:00', sum: -250, comment: 'Перевод средств (списание, на др.банки)' }),
      transaction({ id: 'history-2', date: '2026-05-15T11:05:42+03:00', sum: -250, comment: 'Перевод средств (списание, на др.банки)' }),
      transaction({ id: 'history-3', date: '2026-05-15T12:00:17+03:00', sum: 500, comment: 'Перевод средств (пополнение)' })
    ]

    expect(mergeStatementAndLastTransactions(statements, history)).toEqual(statements)
  })

  it('keeps pending and semantically different recent operations', () => {
    const statement = transaction({ id: 'statement', date: '2026-05-29T09:00:00+03:00', sum: -100, comment: 'PEREVOD (SPISANIE)' })
    const pending = transaction({ id: 'pending', date: '2026-05-29T09:00:30+03:00', sum: -100, comment: 'Перевод средств', hold: true })
    const purchase = transaction({ id: 'purchase', date: '2026-05-29T09:00:45+03:00', sum: -100, comment: 'Оплата покупки' })

    expect(mergeStatementAndLastTransactions([statement], [pending, purchase])).toEqual([statement, pending, purchase])
  })
})
