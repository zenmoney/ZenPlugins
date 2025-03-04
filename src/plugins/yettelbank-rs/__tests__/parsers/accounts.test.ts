import { parseAccounts } from '../../fetchApi'
import { loadHtmlFile } from '../../helpers'

const accountsBody = loadHtmlFile('__tests__/parsers/accounts.html')

describe('parseAccounts', () => {
  it.each([
    [
      accountsBody,
      [
        {
          id: '4815162342',
          name: '4815162342-RSD',
          currency: 'RSD',
          balance: 39367.79
        },
        {
          id: '4815162342-EUR',
          name: '4815162342-EUR',
          currency: 'EUR',
          balance: 0
        }
      ]
    ]
  ])('parses accounts', (accountsBody, accountsArray) => {
    expect(parseAccounts(accountsBody)).toEqual(accountsArray)
  })
})
