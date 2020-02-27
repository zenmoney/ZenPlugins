import { get } from 'lodash'
import { makeRequest } from './makeRequest'
import { ApiType } from './apiType'
import { BrokerAccountConverter } from '../converters/brokerAccountConverter'

export class InvestingInfoService {
  constructor (session) {
    this.session = session
  }

  async getAccounts (fromDate) {
    const brokerAccountsResponse = await makeRequest(
      ApiType.INVESTING,
      'POST',
      'user/broker_accounts',
      {
        authSession: this.session
      },
      response => get(response, 'body.payload.accounts')
    )
    const brokerAccounts = brokerAccountsResponse.body.payload.accounts

    const portfolioAllAccountsResponse = await makeRequest(
      ApiType.INVESTING,
      'GET',
      'portfolio/all_accounts',
      {
        authSession: this.session
      },
      response => get(response, 'body.payload.accounts')
    )
    const portfolioAllAccounts = portfolioAllAccountsResponse.body.payload.accounts

    const userOperationsResponse = await makeRequest(
      ApiType.INVESTING,
      'POST',
      'user/operations',
      {
        authSession: this.session,
        body: {
          from: fromDate,
          to: new Date(),
          overnightsDisabled: true
        },
        bodyType: 'json'
      },
      response => get(response, 'body.payload.items')
    )
    const userOperations = userOperationsResponse.body.payload.items

    let operationTypes = userOperations.map(x => x.operationType)
    operationTypes = operationTypes.filter((v, i, s) => s.indexOf(v) === i)
    console.log(operationTypes)

    for (const i in brokerAccounts) {
      const brokerAccount = brokerAccounts[i]

      const currencyLimitsResponse = await makeRequest(
        ApiType.INVESTING,
        'POST',
        'portfolio/currency_limits',
        {
          authSession: this.session,
          body: {
            brokerAccountType: brokerAccount.brokerAccountType
          },
          bodyType: 'json'
        },
        response => get(response, 'body.payload.data')
      )
      const currencyLimits = currencyLimitsResponse.body.payload.data

      const purchasedSecurities = (await makeRequest(
        ApiType.INVESTING,
        'POST',
        'portfolio/purchased_securities',
        {
          authSession: this.session,
          body: {
            brokerAccountType: brokerAccount.brokerAccountType
          },
          bodyType: 'json'
        },
        response => get(response, 'body.payload.data')
      )).body.payload.data

      brokerAccount.currencyLimits = currencyLimits
      brokerAccount.purchasedSecurities = purchasedSecurities
    }

    const brokerAccountConverter = new BrokerAccountConverter()

    let accounts = []
    for (const i in brokerAccounts) {
      const brokerAccount = brokerAccounts[i]
      const portfolioAllAccountsFiltered = portfolioAllAccounts
        .filter(x => x.brokerAccountType === brokerAccount.brokerAccountType)
      if (portfolioAllAccountsFiltered.length === 0) {
        continue
      }
      const portfolioAccount = portfolioAllAccountsFiltered[0]
      const operations = userOperations.filter(x => x.accountType === brokerAccount.brokerAccountType)

      brokerAccount.portfolio = portfolioAccount
      brokerAccount.operations = operations

      for (const j in brokerAccount.currencyLimits) {
        const currencyLimit = brokerAccount.currencyLimits[j]
        const brokerCurrencyAccount = {}

        Object.assign(brokerCurrencyAccount, brokerAccount)

        delete brokerCurrencyAccount.currencyLimits

        brokerCurrencyAccount.currencyLimit = currencyLimit
        brokerCurrencyAccount.operations = brokerCurrencyAccount.operations
          .filter(x => x.currency === currencyLimit.currency)
        brokerCurrencyAccount.purchasedSecurities = brokerCurrencyAccount.purchasedSecurities
          .filter(x => x.currentAmount.currency === currencyLimit.currency)

        accounts.push(brokerAccountConverter.convert(brokerCurrencyAccount))
      }
    }

    accounts = accounts.filter(x => x)

    for (const i in accounts) {
      const account = accounts[i]
      for (const j in account.transactions) {
        const transaction = account.transactions[j]
        let movements = []
        for (const k in transaction.movements) {
          const movement = transaction.movements[k]
          if (movement.account.needId) {
            const targetAccounts = accounts.filter(x => x.instrument === movement.account.needId)
            if (targetAccounts.length !== 0) {
              movement.account.id = targetAccounts[0].id
              delete movement.account.needId
            } else {
              continue
            }
          }

          movements.push(movement)
        }
        transaction.movements = movements
      }
    }

    return accounts.filter(x => x)
  }
}
