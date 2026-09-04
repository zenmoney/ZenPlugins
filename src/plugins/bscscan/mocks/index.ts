import fetchMock from 'fetch-mock'
import { AccountResponse, BlockNoResponse, TransactionResponse } from '../bnb/types'
import { Preferences } from '../types'

export const preferencesMock: Preferences = {
  apiKey: 'API_KEY',
  account: '1,2'
}

export const accountResponseMock: AccountResponse = {
  status: '1',
  message: 'OK',
  result: [
    {
      account: '1',
      balance: '2000000000000000000'
    },
    {
      account: '2',
      balance: '10000000000000000000'
    }
  ]
}

export const startBlockResponseMock: BlockNoResponse = {
  status: '1',
  message: 'OK',
  result: '1'
}

export const endBlockResponseMock: BlockNoResponse = {
  status: '1',
  message: 'OK',
  result: '99999999'
}

export const transactionsResponseMock1: TransactionResponse = {
  status: '1',
  message: 'OK',
  result: [
    {
      hash: '1',
      from: '1',
      to: 'OTHER_ACCOUNT',
      value: '1000000000000000000',
      timeStamp: '1438269988',
      isError: '0',
      gasPrice: '15402961964',
      gasUsed: '21000'
    },
    {
      hash: '2',
      from: 'OTHER_ACCOUNT',
      to: '1',
      value: '2000000000000000000',
      timeStamp: '1438269988',
      isError: '0',
      gasPrice: '15402961964',
      gasUsed: '21000'
    },
    {
      hash: '3',
      from: '1',
      to: '2',
      value: '1000000000000000000',
      timeStamp: '1438269988',
      isError: '0',
      gasPrice: '15402961964',
      gasUsed: '21000'
    }
  ]
}

export const transactionsResponseMock2: TransactionResponse = {
  status: '1',
  message: 'OK',
  result: [
    {
      hash: '3',
      from: '1',
      to: '2',
      value: '1000000000000000000',
      timeStamp: '1438269988',
      isError: '0',
      gasPrice: '15402961964',
      gasUsed: '21000'
    }
  ]
}

export function mockEndPoints (): void {
  fetchMock.post('https://bnb-mainnet.g.alchemy.com/v2/API_KEY', (_url: string, options: { body: string }) => {
    const request = JSON.parse(options.body)
    const ok = (result: unknown): { status: number, body: { jsonrpc: string, id: number, result: unknown } } => ({
      status: 200,
      body: { jsonrpc: '2.0', id: 1, result }
    })
    if (request.method === 'eth_getBalance') {
      return ok(request.params[0] === '1' ? '0x1bc16d674ec80000' : '0x8ac7230489e80000')
    }
    if (request.method === 'eth_getTransactionReceipt') {
      return ok({ gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00', status: '0x1' })
    }
    const params = request.params[0]
    const incoming = params.toAddress != null
    const account = params.toAddress ?? params.fromAddress
    const row = (hash: string, from: string, to: string, value: string): {
      hash: string
      from: string
      to: string
      rawContract: { value: string }
      metadata: { blockTimestamp: string }
    } => ({
      hash, from, to, rawContract: { value }, metadata: { blockTimestamp: '2015-07-30T15:26:28.000Z' }
    })
    const transfers = account === '1'
      ? incoming
        ? [row('2', 'OTHER_ACCOUNT', '1', '0x1bc16d674ec80000')]
        : [row('1', '1', 'OTHER_ACCOUNT', '0xde0b6b3a7640000'), row('3', '1', '2', '0xde0b6b3a7640000')]
      : incoming
        ? [row('3', '1', '2', '0xde0b6b3a7640000')]
        : []
    return ok({ transfers })
  })
}
