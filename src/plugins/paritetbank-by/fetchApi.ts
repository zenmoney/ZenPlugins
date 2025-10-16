import { BASE_API_URl } from './models'
import { fetchJson } from '../../common/network'

const makeUrl = (domain: 'auth' | 'core', url: string) =>
  `${BASE_API_URl}/${domain}/services/v3${url}`

export const authenticate = async (login: string, password: string) => {
  const { body } = await fetchJson(makeUrl('auth', '/authentication/login'), {
    method: 'POST',
    body: {
      // TODO: find a way to properly label device in banking
      login,
      password,
      deviceUDID: '', // generate and save?
      clientKind: 'WEB',
      appID: '1.27'
    }
  })
}

export const fetchAccounts = async () => {
  //
}

export const fetchTransactions = async () => {
  //
}
