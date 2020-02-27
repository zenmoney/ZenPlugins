import { get, values } from 'lodash'
import { makeRequest } from './makeRequest'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../../common/accounts'
import { Account } from '../models/account'
import { convertTransactions } from '../converters/legacyConverters'
import { ApiType } from './apiType'
import { Transaction } from '../models/transaction'

export class BankInfoService {
  constructor (session) {
    this.session = session
  }

  async getAccounts (fromDate) {
    const body = {
      requestsData: JSON.stringify(
        [
          {
            key: 'accounts',
            operation: 'accounts_flat'
          },
          {
            key: 'operations',
            operation: 'operations',
            params: {
              start: fromDate
            }
          }
        ])
    }

    const response = await makeRequest(
      ApiType.BANK,
      'POST',
      'grouped_requests',
      {
        authSession: this.session,
        body: body
      },
      response => get(response, 'body.payload.accounts.payload') && get(response, 'body.payload.operations.payload')
    )

    let accountsArray = []
    const fetchedAccounts = response.body.payload.accounts.payload
    for (const i in fetchedAccounts) {
      const account = new Account(fetchedAccounts[i], 'bank')
      if (!account.id) {
        continue
      }

      accountsArray.push(account)
    }

    accountsArray = ensureSyncIDsAreUniqueButSanitized({ accounts: values(accountsArray), sanitizeSyncId })
    accountsArray = accountsArray.map(x => new Account(x))

    let accountsDictionary = {}
    for (const i in accountsArray) {
      const account = accountsArray[i]
      accountsDictionary[account.id] = account
    }

    const transactions = convertTransactions(response.body.payload.operations.payload, accountsDictionary)

    for (const i in accountsArray) {
      const account = accountsArray[i]
      account.transactions = transactions.filter(x => x.movements.filter(y => y.account.id === account.id).length > 0)

      for (const j in account.transactions) {
        account.transactions[j] = new Transaction(account.transactions[j], account)
      }
    }

    return accountsArray
  }
}
