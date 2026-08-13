jest.mock('../../../../common/network', () => ({
  fetchJson: jest.fn()
}))

const { fetchJson } = require('../../../../common/network')
const { fetchTransactions } = require('../../api')

describe('fetchTransactions', () => {
  beforeEach(() => {
    fetchJson.mockReset()
    global.ZenMoney = {
      device: {
        model: 'test-device'
      }
    }
  })

  it('fetches transactions from events only', async () => {
    const events = [
      {
        eventId: 'stable-event-id',
        eventStatus: 0
      }
    ]
    fetchJson.mockResolvedValue({
      body: {
        errorInfo: { errorCode: '0' },
        event: events
      }
    })

    const auth = {
      token: 'token',
      device: {
        androidId: 'android-id'
      }
    }
    const contractNumber = ['contract-1']
    const transactions = await fetchTransactions(
      auth,
      [{ id: 'card-1' }, { id: 'card-2' }],
      new Date(2026, 5, 1),
      new Date(2026, 5, 10),
      contractNumber
    )

    expect(transactions).toEqual(events)
    expect(fetchJson).toHaveBeenCalledTimes(1)
    expect(fetchJson.mock.calls[0][0]).toBe('https://digital.sber-bank.by/SBOLServer/rest/client/events')
    expect(fetchJson.mock.calls[0][1].body).toEqual({
      contractNumber,
      endDate: '2026-06-10',
      startDate: '2026-06-01'
    })
  })
})
