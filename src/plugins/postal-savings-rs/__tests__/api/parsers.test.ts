import { parseAccountInfo, parseHiddenFields, parseLoginStep, parseTransactions } from '../../parsers'
import { splitPeriod } from '../../index'

// Markup as the bank served it in October 2026, with the identifiers shortened.
function row (day: string, month: string, id: string, title: string, lines: string[], status: string, amount: string, negative: boolean): string {
  return `
    <div class="transaction-list-item" data-type="transferitem">
      <div class="date-holder">
        <span class="date-num">${day}</span>
        <span>${month}</span>
      </div>
      <div class="icon-holder" data-utility="popupFromLink" data-href="/webapp/AccountData/Transactions/Details?q=abc"></div>
      <div class="text-holder" id="${id}" data-utility="popupFromLink" data-href="/webapp/AccountData/Transactions/Details?q=abc">
        <span class="transaction-list-item-title">${title}</span>
        ${lines.map(line => `<span class="transaction-list-item-desc">${line}</span>`).join('\n')}
        <span class="status-span no-tablet b">${status}</span>
      </div>
      <div class="amount-holder" data-utility="popupFromLink">
        <span class="main-amount${negative ? ' negative-amount' : ''}">
          ${amount}
        </span>
      </div>
    </div>`
}

const transactionsPage = `<div id="grid-content">
  ${row('16', 'okt', 'CT-61963670812-2963248479093/3', 'Transakcija karticom', ['Broj kartice: 4870xxxxxx5802', 'ANTHROPIC* CLAUDE SUB, ANTHROPIC.COM'], 'Izvršena', '18,00 EUR', true)}
  ${row('15', 'okt', '1593262888906509/1', 'Automatska transakcija', ['Uplata na avista devizni račun 200000013026891957 uplatilac DANIIL LEFANOV'], 'Izvršena', '5.000,00 EUR', false)}
  ${row('30', 'sep', 'CT-58282013075-279845382909/1', 'Menjačka transakcija', ['Od: 200-0000130268919-57', 'Za: 200-0000130268919-57', 'Naplata provizije za vodjenje racuna za period 01.09.26 do 30.09.26'], 'Izvršena', '0,43 EUR', true)}
  ${row('17', 'okt', 'CT-1/1', 'Transakcija karticom', ['Broj kartice: 4870xxxxxx5802', 'HELD SHOP'], 'Na čekanju', '2,00 EUR', true)}
  ${row('20', 'dec', 'CT-2/1', 'Transakcija karticom', ['Broj kartice: 4870xxxxxx5802', 'LAST YEAR SHOP'], 'Izvršena', '1,00 EUR', true)}
  ${row('3', 'mar', 'CT-3/2', 'Transakcija karticom', ['Broj kartice: 4870xxxxxx3216', 'BONJUK BAY, MUGLA'], 'Izvršena', '-855,00 EUR', true)}
</div>`

describe('parseTransactions', () => {
  const fromDate = new Date(2025, 0, 1)
  const toDate = new Date(2026, 9, 17)
  const transactions = parseTransactions(transactionsPage, fromDate, toDate)

  it('reads booked rows only', () => {
    expect(transactions.map(t => t.id)).toEqual([
      'id_CT-61963670812-2963248479093/3',
      'id_1593262888906509/1',
      'id_CT-58282013075-279845382909/1',
      'id_CT-2/1',
      'id_CT-3/2'
    ])
  })

  it('reads the date, the sign and the amount', () => {
    expect(transactions.map(t => [t.date, t.amount, t.currency])).toEqual([
      [new Date(2026, 9, 16), -18, 'EUR'],
      [new Date(2026, 9, 15), 5000, 'EUR'],
      [new Date(2026, 8, 30), -0.43, 'EUR'],
      [new Date(2025, 11, 20), -1, 'EUR'],
      [new Date(2026, 2, 3), 855, 'EUR']
    ])
  })

  it('takes the merchant, not the card number or the accounts, as the address', () => {
    expect(transactions.map(t => t.address)).toEqual([
      'ANTHROPIC* CLAUDE SUB, ANTHROPIC.COM',
      'Uplata na avista devizni račun 200000013026891957 uplatilac DANIIL LEFANOV',
      'Naplata provizije za vodjenje racuna za period 01.09.26 do 30.09.26',
      'LAST YEAR SHOP',
      'BONJUK BAY, MUGLA'
    ])
  })
})

describe('parseAccountInfo', () => {
  const slide = (card: string): string => `
    <div class="slide" data-item-value="200000013026891957" data-accountnumber="200000013026891957" data-cardnumber="${card}" data-filter-value="current-account">
      <div class="account-box"><p class="acc-name">DANIIL LEFANOV</p><p class="acc-nr">200-0000130268919-57</p>
        Raspoloživo stanje <select><option data-amount="5.080,83" data-accountnumber="200000013026891957" value="EUR">EUR</option></select>
        Rezervisana sredstva <select><option data-amount="0,00" data-accountnumber="200000013026891957" value="EUR">EUR</option></select>
      </div>
    </div>`

  it('keeps an account once though the carousel repeats it, with its available balance', () => {
    expect(parseAccountInfo(slide('') + slide('') + slide(''))).toEqual([{
      id: '200000013026891957',
      cardNumber: '',
      accountNumber: '200000013026891957',
      name: 'DANIIL LEFANOV',
      currency: 'EUR',
      balance: 5080.83
    }])
  })
})

describe('login steps', () => {
  it('tells the credentials form, the device choice and the wait for the push apart', () => {
    expect(parseLoginStep('<input type="text" name="Username_ID" id="Username_ID" /><input type="password" name="Password_ID" id="Password_ID" />')).toEqual({ kind: 'credentials' })
    expect(parseLoginStep('<input type="hidden" name="Devices_Id" id="Devices_Id" value="2386301414" />')).toEqual({ kind: 'devices' })
    expect(parseLoginStep('<input type="submit" style="display:none;" data-action-type="3" id="1" name="1" data-utility="checkCallbackStatus" data-period="1000" data-url="/webapp/Identity/Login/CallbackStatus" data-work-item-id="w1" />'))
      .toEqual({ kind: 'waiting', workItemId: 'w1' })
    expect(parseLoginStep('<p>Molimo sačekajte</p>')).toEqual({ kind: 'unknown' })
  })

  it('carries the hidden fields of a form', () => {
    expect(parseHiddenFields('<input type="hidden" id="workitemId" name="workitemid" value="abc" /><input type="hidden" name="ActiveLoginMethod" id="ActiveLoginMethod" value="usernamepush" />'))
      .toEqual({ workitemid: 'abc', ActiveLoginMethod: 'usernamepush' })
  })
})

describe('splitPeriod', () => {
  it('cuts a long period into windows shorter than a year, newest first', () => {
    const windows = splitPeriod(new Date(2023, 0, 1), new Date(2026, 9, 17))
    expect(windows[0][1]).toEqual(new Date(2026, 9, 17))
    expect(windows[windows.length - 1][0]).toEqual(new Date(2023, 0, 1))
    for (const [start, end] of windows) {
      expect((end.getTime() - start.getTime()) / 86400000).toBeLessThan(300)
    }
  })
})
