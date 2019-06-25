import * as request from './request'

export async function scrape ({ preferences, fromDate, toDate }) {
  const login = await request.authenthicate(preferences.login, preferences.password)
  console.log(login)

  return {
    accounts: [],
    transactions: []
  }
}
