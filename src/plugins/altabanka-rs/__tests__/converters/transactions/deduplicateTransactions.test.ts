import { deduplicateTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      // different movements id
      [
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
      ],
      [
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
    ]
  ])('converts income transactions', (apiTransactions, transactions) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(deduplicateTransactions(apiTransactions)).toEqual(transactions)
  })
})
