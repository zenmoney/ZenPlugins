import { parseTransactions } from '../../fetchApi'

describe('parseTransactions', () => {
  it('parses transactions', () => {
    const html = `
      <div class="transactions-table">
        <table>
          <tr>
            <td class="transaction-title">Payment</td>
            <td class="transaction-date">01.02.2023</td>
            <td class="transaction-amount">100.00RSD</td>
            <td class="transaction-arrow"></td>
          </tr>
        </table>
      </div>
    `

    const transactions = parseTransactions(html, false)
    expect(transactions).toHaveLength(1)

    expect(transactions[0]).toEqual({
      isPending: false,
      date: new Date(2023, 1, 1),
      title: 'Payment',
      amount: 100,
      currency: 'RSD'
    })
  })

  it('parses expense transactions with negative amount', () => {
    const html = `
      <div class="transactions-table">
        <table>
          <tr>
            <td class="transaction-title">Payment</td>
            <td class="transaction-date">01.02.2023</td>
            <td class="transaction-amount">100.00RSD</td>
            <td class="transaction-arrow expense"></td>
          </tr>
        </table>
      </div>
    `

    const transactions = parseTransactions(html, false)
    expect(transactions).toHaveLength(1)

    expect(transactions[0]).toEqual({
      isPending: false,
      date: new Date(2023, 1, 1),
      title: 'Payment',
      amount: -100,
      currency: 'RSD'
    })
  })

  it('returns empty array if no transactions found', () => {
    const html = '<div class="no-results">No transactions for selected period</div>'

    const transactions = parseTransactions(html, false)
    expect(transactions).toEqual([])
  })

  it('returns empty array if transactions table is empty', () => {
    const html = '<div>No transactions table</div>'

    const transactions = parseTransactions(html, false)
    expect(transactions).toEqual([])
  })
})
