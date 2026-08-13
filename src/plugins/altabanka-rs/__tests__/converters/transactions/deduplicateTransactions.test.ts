import { deduplicateTransactions } from '../../../converters'

describe('deduplicateTransactions', () => {
  it('merges soft-key duplicates with different movement ids and clears hold', () => {
    const apiTransactions = [
      {
        hold: false,
        date: new Date('2026-04-20T00:00:00+03:00'),
        movements: [
          {
            id: 'id_7cWphlX3tccaSRuyJBJ%2FkOeBphfT%2BQT0jeil5wQLjq3SbJYHJufNuQ4xOKCs1NLcjDw7gJ6bbt18CEy8fwYHelJtPWruc1kZ',
            account: { id: '0001000384425' },
            sum: -1471.4,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Wolt doo>972546560588 RS',
          mcc: null,
          location: null
        },
        comment: null
      },
      {
        hold: true,
        date: new Date('2026-04-20T00:00:00+03:00'),
        movements: [
          {
            id: 'id_7cWphlX3tcfNgM88h%2Fi2lkwoHJVMrVNj9D5iK%2By2VrS7xybcfLabrxaHHsoqjgwgxD%2BlOh8kvuNMeIJPJZarf%2BkHrZrNINt8',
            account: { id: '0001000384425' },
            sum: -1471.4,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Wolt doo>972546560588 RS',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
    const transactions = [
      {
        hold: false,
        date: new Date('2026-04-20T00:00:00+03:00'),
        movements: [
          {
            id: 'id_7cWphlX3tccaSRuyJBJ%2FkOeBphfT%2BQT0jeil5wQLjq3SbJYHJufNuQ4xOKCs1NLcjDw7gJ6bbt18CEy8fwYHelJtPWruc1kZ',
            account: { id: '0001000384425' },
            sum: -1471.4,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Wolt doo>972546560588 RS',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(deduplicateTransactions(apiTransactions)).toEqual(transactions)
  })

  it('prefers posted when hold and posted share the canonical reference id', () => {
    const hold = {
      hold: true,
      date: new Date('2026-07-13T00:00:00'),
      movements: [
        {
          id: 'id_20000001R',
          account: { id: '190000100000000001' },
          sum: -100,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'GALEN PHARM> RS',
        mcc: null,
        location: null
      },
      comment: null
    }
    const posted = {
      hold: false,
      date: new Date('2026-07-14T00:00:00'),
      movements: [
        {
          id: 'id_20000001R',
          account: { id: '190000100000000001' },
          sum: -100,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'MP333 LONDON BG BEOGRAD',
        mcc: null,
        location: null
      },
      comment: null
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(deduplicateTransactions([hold, posted])).toEqual([posted])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(deduplicateTransactions([posted, hold])).toEqual([posted])
  })

  it('does not crash on foreign-currency transactions with null movement sum', () => {
    const foreign = {
      hold: false,
      date: new Date('2026-07-13T00:00:00'),
      movements: [
        {
          id: 'id_20000002E',
          account: { id: '190000100000000001' },
          sum: null,
          fee: 0,
          invoice: { sum: -10, instrument: 'EUR' }
        }
      ],
      merchant: {
        fullTitle: 'SOME MERCHANT PARIS',
        mcc: null,
        location: null
      },
      comment: null
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(deduplicateTransactions([foreign])).toEqual([foreign])
  })
})
