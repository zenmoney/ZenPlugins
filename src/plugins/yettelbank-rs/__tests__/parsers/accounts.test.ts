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
          name: 'Current account',
          currency: 'RSD',
          balance: 39367.79
        }
      ]
    ]
  ])('parses accounts', (accountsBody, accountsArray) => {
    expect(parseAccounts(accountsBody)).toEqual(accountsArray)
  })
})
