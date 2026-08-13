import fetchMock from 'fetch-mock'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { TemporaryError } from '../../../errors'
import { fetchAccounts, fetchTransactions } from '../api'

const BASE_URL = 'https://b2c-api.kapitalbank.uz/api/v1'
const auth = {
  deviceId: 'device-id',
  sessionId: 'session-id',
  accessToken: 'access-token',
  refreshToken: 'refresh-token'
}

describe('Kapitalbank API', () => {
  beforeEach(() => {
    const pluginData = makePluginDataApi({})
    global.ZenMoney = pluginData.methods
  })

  afterEach(() => fetchMock.restore())

  it('fetches bank products and card balances without converting them', async () => {
    const card = {
      guid: 'CP-00000000-0000-0000-0000-000000000001',
      cardName: 'Main card',
      maskedPan: '427832******0001',
      currency: { name: 'USD', scale: 2 }
    }
    const balance = {
      balance: 12345,
      currency: { name: 'USD', scale: 2 }
    }
    const account = {
      guid: 'AP-00000000-0000-0000-0000-000000000002'
    }
    const deposit = {
      guid: 'DP-00000000-0000-0000-0000-000000000003'
    }
    fetchMock.once(/\/cards\?/, { status: 200, body: [card] })
    fetchMock.once(`${BASE_URL}/cards/balance/${card.guid}`, { status: 200, body: balance })
    fetchMock.once(`${BASE_URL}/accounts`, { status: 200, body: [account] })
    fetchMock.once(`${BASE_URL}/deposits`, { status: 200, body: [deposit] })

    await expect(fetchAccounts(auth)).resolves.toEqual([
      { type: 'card', data: card, balance },
      { type: 'account', data: account },
      { type: 'deposit', data: deposit }
    ])
  })

  it('fetches every transaction history page and preserves the product type', async () => {
    const product = {
      id: 'DP-00000000-0000-0000-0000-000000000003',
      type: 'deposit'
    }
    const firstTransaction = { paymentDate: '2026-01-10 12:00:00.+0000' }
    const secondTransaction = { paymentDate: '2026-01-11 12:00:00.+0000' }
    fetchMock.once(`${BASE_URL}/deposits/history/${product.id}?page=0&size=15`, {
      status: 200,
      body: { content: [firstTransaction], totalPages: 2 }
    })
    fetchMock.once(`${BASE_URL}/deposits/history/${product.id}?page=1&size=15`, {
      status: 200,
      body: { content: [secondTransaction], totalPages: 2 }
    })

    await expect(fetchTransactions(
      auth,
      product,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-31T00:00:00.000Z')
    )).resolves.toEqual([
      { type: 'deposit', data: firstTransaction },
      { type: 'deposit', data: secondTransaction }
    ])
  })

  it('rejects malformed transaction history instead of silently returning no operations', async () => {
    const product = {
      id: 'AP-00000000-0000-0000-0000-000000000002',
      type: 'cardOrAccount'
    }
    fetchMock.once(/\/history\/transactions\?/, {
      status: 200,
      body: { totalPages: 1 }
    })

    await expect(fetchTransactions(
      auth,
      product,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-31T00:00:00.000Z')
    )).rejects.toBeInstanceOf(TemporaryError)
  })
})
