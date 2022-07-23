import fetchMock from 'fetch-mock'
import { AccountResponse, BlockNoResponse, Preferences, TransactionResponse } from '../api'
import { EthereumTransaction } from '../types'

const baseOperation: EthereumTransaction = {
  gasUsed: '21000',
  hash: '0x90bb0dcbe8fa38387145aa17d6ad99f57da91d4c6d4b65b5f7cf56454f73234b',
  from: 'ACCOUNT',
  to: 'OTHER_ACCOUNT',
  value: '870728990000000000',
  gasPrice: '15402961964',
  isError: '0',
  timeStamp: '1658608646'
}

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
  fetchMock.once('https://api.etherscan.io/api?module=account&action=balancemulti&address=1%2C2&tag=latest&apiKey=API_KEY', {
    status: 200,
    body: accountResponseMock
  })
  fetchMock.once('https://api.etherscan.io/api?module=block&action=getblocknobytime&closest=before&timestamp=1640552400&apiKey=API_KEY', {
    status: 200,
    body: startBlockResponseMock
  })
  fetchMock.once('https://api.etherscan.io/api?module=block&action=getblocknobytime&closest=before&timestamp=1641070800&apiKey=API_KEY', {
    status: 200,
    body: endBlockResponseMock
  })
  fetchMock.once('https://api.etherscan.io/api?module=account&action=txlist&address=1&startblock=1&endblock=99999999&page=1&offset=100&sort=desc&apikey=API_KEY', {
    status: 200,
    body: transactionsResponseMock1
  })
  fetchMock.once('https://api.etherscan.io/api?module=account&action=txlist&address=2&startblock=1&endblock=99999999&page=1&offset=100&sort=desc&apikey=API_KEY', {
    status: 200,
    body: transactionsResponseMock2
  })
}
