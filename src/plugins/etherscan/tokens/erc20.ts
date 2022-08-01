import { Account, AccountType } from '../../../types/zenmoney'
import { Preferences, fetch } from '../common'
import { AccountResponse } from './types'

interface TokenConfig {
  title: string
  contractAddress: string
  instrument: string
  convertBalance: (value: number) => number
}

const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    title: 'USDT',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    instrument: 'USD',
    convertBalance: (value) => value / 1000000
  },
  {
    title: 'USDC',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    instrument: 'USD',
    convertBalance: (value) => value / 1000000
  },
  {
    title: 'BUSD',
    contractAddress: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    instrument: 'USD',
    convertBalance: (value) => value / 1000000
  }
]

const generateTokenAddress = (address: string, token: TokenConfig): string => {
  return `${address}-${token.contractAddress}`
}

export async function fetchAddressTokens (preferences: Preferences, address: string): Promise<Account[]> {
  const result = await Promise.all(SUPPORTED_TOKENS.map(async token => {
    const response = await fetch<AccountResponse>({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: token.contractAddress,
      address,
      tag: 'latest',
      apiKey: preferences.apiKey
    })

    const balance = Number(response.result)

    const id = generateTokenAddress(address, token)
    const account: Account = {
      id,
      type: AccountType.checking,
      title: `${token.title} ${address}`,
      instrument: token.instrument,
      balance: token.convertBalance(balance),
      syncIds: [id]
    }

    return account
  }))

  return result.filter((account) => account.balance !== 0)
}

/* Эндпоинт etherscan для получения инфы про все токены — платный.
   Поэтому обходим тут все поддерживаемые токены по каждому адресу отдельно */
export async function fetchAccounts (
  preferences: Preferences
): Promise<Account[]> {
  const result = await Promise.all(preferences.account.split(',').map(async (address) => {
    const tokensAccounts = await fetchAddressTokens(preferences, address)

    return tokensAccounts
  }))

  return result.flat()
}
