import { parseAccounts } from '../../fetchApi'

describe('parseAccounts', () => {
  it('parses accounts', () => {
    const html = `
      <div class="dashboarad-slider">
        <div class="slide 115038161634943632" data-accountid="115038161634943632">
          <div class="col-right currentBalance currency-RSD">
            5.00
            <span class="amount-stats big-nr">
              <p>5.00</p>
            </span>
          </div>
        </div>
      </div>
    `

    const accounts = parseAccounts(html)
    expect(accounts).toHaveLength(1)
    expect(accounts[0]).toEqual({
      id: '115038161634943632',
      title: '115038161634943632-RSD',
      instrument: 'RSD',
      syncIds: ['115038161634943632'],
      balance: 5
    })
  })

  it('parses accounts with multiple currencies', () => {
    const html = `
      <div class="dashboarad-slider">
        <div class="slide 115038161634943632" data-accountid="115038161634943632">
          <div class="col-right currentBalance currency-RSD">
            5.00
            <span class="amount-stats big-nr">
              <p>5.00</p>
            </span>
          </div>
          <div class="col-right currentBalance currency-EUR">
            10.00
            <span class="amount-stats big-nr">
              <p>10.00</p>
            </span>
          </div>
        </div>
      </div>
    `

    const accounts = parseAccounts(html)
    expect(accounts).toHaveLength(2)

    expect(accounts[0]).toEqual({
      id: '115038161634943632',
      title: '115038161634943632-RSD',
      instrument: 'RSD',
      syncIds: ['115038161634943632'],
      balance: 5
    })

    expect(accounts[1]).toEqual({
      id: '115038161634943632',
      title: '115038161634943632-EUR',
      instrument: 'EUR',
      syncIds: ['115038161634943632'],
      balance: 10
    })
  })

  it('uses fallback method if no accounts found in main method', () => {
    const html = `
      <select id="AccountPicker">
        <option value="115038161634943632">Account 115038161634943632</option>
      </select>
      <div class="slide 115038161634943632">
        <div class="currentBalance currency-RSD">
          5.00
        </div>
      </div>
    `

    const accounts = parseAccounts(html)
    expect(accounts).toHaveLength(1)

    expect(accounts[0]).toEqual({
      id: '115038161634943632',
      title: '115038161634943632-RSD',
      instrument: 'RSD',
      syncIds: ['115038161634943632'],
      balance: 5
    })
  })
})
