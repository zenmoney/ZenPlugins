const { SessionStore } = require('../../../../scripts/bootloaderServer/sessionStore')

function makeStore () {
  return new SessionStore({
    plugin: { id: 'test', version: '1', build: 1 },
    storageDirectory: '/unused',
    persist: false,
    limit: 20
  })
}

describe('Bootloader SessionStore', () => {
  it('creates a new id for every scrape and derives sandbox state', () => {
    const store = makeStore()
    const first = store.create()
    const second = store.create()
    expect(second.id).not.toBe(first.id)

    store.addEvents(second.id, [
      { type: 'state:get', payload: { key: 'auth', value: { token: 'old' } } },
      { type: 'state:set', payload: { key: 'auth', value: { token: 'new' } } },
      { type: 'state:save', payload: {} },
      { type: 'accounts:add', payload: { items: [{ id: 'account' }] } },
      { type: 'transactions:add', payload: { items: [{ id: 'transaction' }] } },
      { type: 'session:result', payload: { success: true } }
    ])

    const session = store.get(second.id)
    expect(session.status).toBe('success')
    expect(session.state.initial).toEqual({ auth: { token: 'old' } })
    expect(session.state.current).toEqual({ auth: { token: 'new' } })
    expect(session.state.saved).toEqual({ auth: { token: 'new' } })
    expect(session.accounts).toEqual([{ id: 'account' }])
    expect(session.transactions).toEqual([{ id: 'transaction' }])
  })

  it('compares named checkpoints with the previous session', () => {
    const store = makeStore()
    const first = store.create()
    store.addEvents(first.id, [
      { type: 'checkpoint', payload: { name: 'parsed', value: { count: 1 } } }
    ])
    const second = store.create()
    store.addEvents(second.id, [
      { type: 'checkpoint', payload: { name: 'parsed', value: { count: 2 } } }
    ])

    expect(store.get(second.id).checkpointComparisons.parsed).toEqual({
      current: { count: 2 },
      previous: { count: 1 },
      previousSessionId: first.id
    })
  })

  it('starts a session with data supplied by the development server', () => {
    const store = makeStore()
    const session = store.create({}, { auth: { token: 'imported' }, device: { id: 'device-id' } })

    expect(session.state.initial).toEqual({
      auth: { token: 'imported' },
      device: { id: 'device-id' }
    })
    expect(session.state.current).toEqual(session.state.initial)
    expect(session.state.saved).toBeNull()
  })

  it('applies changed session settings before a new scrape', () => {
    const store = makeStore()
    store.create()
    const newest = store.create()

    store.configure({ persist: false, limit: 1 })

    expect(store.persist).toBe(false)
    expect(store.limit).toBe(1)
    expect(store.list().map(session => session.id)).toEqual([newest.id])
  })
})
