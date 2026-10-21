import { readFileSync } from 'fs'
import { join } from 'path'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'
import { OnlineSource } from '../../../models'
import { combineOnlineTransactions, matchingCardMerchant } from '../../../converters/online'
import { convertTransactions } from '../../../converters'

/** Load complete observed records without sharing mutable test state. */
function scenario (): { fixture: { onlineResponse: { data: { entries: unknown[] } }, history: unknown[] }, account: AccountOrCard, source: OnlineSource, fromDate: Date } {
  const fixture: { onlineResponse: { data: { entries: unknown[] } }, history: unknown[] } = JSON.parse(readFileSync(join(__dirname, '../../fixtures/online.json'), 'utf8'))
  const account = { id: '1570010000000002', type: AccountType.ccard as const, title: 'Visa AMD', instrument: 'AMD', syncIds: ['1570010000000002'], balance: 0 }
  const source = { accountId: account.id, cardId: '100000002', entries: fixture.onlineResponse.data.entries }
  const fromDate = new Date('2022-08-02T02:17:09+04:00')
  return { fixture, account, source, fromDate }
}

it('imports the observed recent authorization as a pending expense (STATUS-001)', () => {
  const { account, source, fromDate } = scenario()
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '620257')
  expect(combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate).transactions).toEqual([{
    date: new Date('2022-08-17T16:53:47.000Z'),
    hold: true,
    movements: [{ id: 'online:100000002:620257:2022-08-17T16:53:47.000Z:1570010000000002', account: { id: account.id }, sum: -1837.45, fee: 0, invoice: null }],
    merchant: { fullTitle: 'MARKETA GROUP LLC  CITYONE FRA', mcc: null, location: null },
    comment: null
  }])
})

it('keeps the observed approved transfer once despite its online authorization (ID-001)', () => {
  const { account, source, fromDate, fixture } = scenario()
  const history = fixture.history.slice(0, 1)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '610143')
  expect(combineOnlineTransactions(history, transactions, [{ ...source, entries }], [account], fromDate).transactions).toEqual(transactions)
})

it('preserves both observed same-ID authorizations with distinct times as separate pending payments (ID-001)', () => {
  const { account, source, fromDate } = scenario()
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '870857')
  const result = combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate)
  expect(result.transactions).toEqual(['2022-08-14T07:04:15.000Z', '2022-08-14T06:51:51.000Z'].map(date => ({
    date: new Date(date),
    hold: true,
    movements: [{ id: `online:100000002:870857:${date}:${account.id}`, account: { id: account.id }, sum: -3920.84, fee: 0, invoice: null }],
    merchant: { fullTitle: 'SHOPXYZ GROUP 1 28/4 EXAMPLE ROADNAME STR. CITYONE FRA', mcc: null, location: null },
    comment: null
  })))
})

it('does not import settled online entries alongside their history records', () => {
  const { account, source, fromDate, fixture } = scenario()
  const history = fixture.history.slice(1)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const entries = source.entries.filter(entry => (entry as { state: string }).state === 'SETTLED')
  const dates = ['2022-08-16T18:38:03.000Z', '2022-08-16T12:16:45.000Z', '2022-08-15T13:45:45.000Z', '2022-08-15T13:45:18.000Z', '2022-08-14T07:10:49.000Z']
  expect(combineOnlineTransactions(history, transactions, [{ ...source, entries }], [account], fromDate).transactions).toEqual(transactions.map((transaction, index) => ({ ...transaction, date: new Date(dates[index]) })))
})

it('deduplicates repeated source records and keeps identical output on repeated imports', () => {
  const { account, source, fromDate } = scenario()
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '620257')
  const first = combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate)
  expect(combineOnlineTransactions([], [], [{ ...source, entries: [...entries, ...entries] }], [account], fromDate, undefined, first.state)).toEqual(first)
})

// Model an already imported operation using observed settled records to verify identity persistence.
it('[model] retains the imported identity when history arrives and online is no longer present', () => {
  const { account, source, fromDate, fixture } = scenario()
  const record = source.entries.find(entry => (entry as { id: string }).id === '630389')
  const history = fixture.history.slice(1, 2)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const state = { imported: [{ accountId: account.id, cardId: source.cardId, record }], historyAliases: {} }
  const expected = transactions.map(transaction => ({ ...transaction, date: new Date('2022-08-16T18:38:03.000Z'), movements: transaction.movements.map(movement => ({ ...movement, id: `online:100000002:630389:2022-08-16T18:38:03.000Z:${account.id}` })) }))
  const result = combineOnlineTransactions(history, transactions, [], [account], fromDate, undefined, state)
  expect(combineOnlineTransactions(history, transactions, [], [account], fromDate, undefined, result.state).transactions).toEqual(expected)
})

// Model saved identities using the observed SHOPCHAR records and their truncated history references.
it('[model] links distinct recorded payments using their bank reference prefixes without amount-only grouping', () => {
  const { account, source, fromDate, fixture } = scenario()
  const entries = source.entries.filter(entry => ['640467', '650581', '650629'].includes((entry as { id: string }).id))
  const history = fixture.history.slice(2, 5)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const state = { imported: entries.map(record => ({ accountId: account.id, cardId: source.cardId, record })), historyAliases: {} }
  const identities = [
    ['640467', '2022-08-16T12:16:45.000Z'],
    ['650581', '2022-08-15T13:45:45.000Z'],
    ['650629', '2022-08-15T13:45:18.000Z']
  ]
  expect(combineOnlineTransactions(history, transactions, [], [account], fromDate, undefined, state).transactions).toEqual(transactions.map((transaction, index) => ({
    ...transaction, date: new Date(identities[index][1]), movements: transaction.movements.map(movement => ({ ...movement, id: `online:${source.cardId}:${identities[index][0]}:${identities[index][1]}:${account.id}` }))
  })))
})

it('honors the original authorization timestamp at the requested interval boundaries', () => {
  const { account, source } = scenario()
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '620257')
  const after = combineOnlineTransactions([], [], [{ ...source, entries }], [account], new Date('2022-08-17T16:53:47.001Z'))
  const before = combineOnlineTransactions([], [], [{ ...source, entries }], [account], new Date('2022-08-02T02:17:09.000Z'), new Date('2022-08-17T16:53:46.999Z'))
  expect([after.transactions, before.transactions]).toEqual([[], []])
})

// Model disappearance from the current statement; cached authorizations must never be replayed.
it('[model] keeps only identity metadata when an authorization disappears from online activity', () => {
  const { account, source, fromDate } = scenario()
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '620257')
  const first = combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate)
  expect(combineOnlineTransactions([], [], [], [account], fromDate, undefined, first.state).transactions).toEqual([])
})

// Repeated records model overlapping pages, not a different bank payload format.
it('[model] deduplicates an observed transfer despite repeated history records', () => {
  const { account, source, fromDate, fixture } = scenario()
  const history = fixture.history.slice(0, 1)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '610143')
  expect(combineOnlineTransactions([...history, ...history], transactions, [{ ...source, entries }], [account], fromDate).transactions).toEqual(transactions)
})

it('excludes a booked payment whose verified initiation precedes the requested interval (DATE-001)', () => {
  const { account, source, fixture } = scenario()
  const fromDate = new Date('2022-08-17T02:17:09.000Z')
  const history = fixture.history.slice(1, 2)
  const transactions = convertTransactions(history, [account], {}, fromDate)
  const entries = source.entries.filter(entry => (entry as { id: string }).id === '630389')
  expect(combineOnlineTransactions(history, transactions, [{ ...source, entries }], [account], fromDate).transactions).toEqual([])
})

/** Load the complete observed lifecycle records and separate older booked payments. */
function lifecycleScenario (): { fixture: { onlineResponse: { data: { entries: unknown[] } }, preauthorization: unknown, settledPreauthorization: unknown, bookedHistory: unknown[] }, account: AccountOrCard, source: OnlineSource, fromDate: Date } {
  const fixture: { onlineResponse: { data: { entries: unknown[] } }, preauthorization: unknown, settledPreauthorization: unknown, bookedHistory: unknown[] } = JSON.parse(readFileSync(join(__dirname, '../../fixtures/online-lifecycle.json'), 'utf8'))
  const account = { id: '1570010000000002', type: AccountType.ccard as const, title: 'Visa AMD', instrument: 'AMD', syncIds: ['1570010000000002'], balance: 0 }
  const source = { accountId: account.id, cardId: '100000002', entries: fixture.onlineResponse.data.entries }
  return { fixture, account, source, fromDate: new Date('2026-05-01T00:00:00+04:00') }
}

it('returns the observed pre-purchase authorization as a pending expense (STATUS-001)', () => {
  const { fixture, fromDate } = lifecycleScenario()
  const account = { id: '1570010000000003', type: AccountType.ccard as const, title: 'Visa USD', instrument: 'USD', syncIds: ['1570010000000003'], balance: 0 }
  const source = { accountId: account.id, cardId: '100000003', entries: [fixture.preauthorization] }
  expect(combineOnlineTransactions([], [], [source], [account], fromDate).transactions).toEqual([{
    date: new Date('2026-05-23T11:42:40.000Z'),
    hold: true,
    movements: [{ id: 'online:100000003:740467:2026-05-23T11:42:40.000Z:1570010000000003', account: { id: account.id }, sum: -92.47, fee: 0, invoice: null }],
    merchant: { fullTitle: 'PAYMENT *TUTOR FR  12345678 FRA', mcc: null, location: null },
    comment: null
  }])
})

// Model previously imported identities using unmodified observed settled records, not an invented authorization response.
it('[model] reconciles the observed pre-purchase and completion identities once per ride (ID-001)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const imported = source.entries.slice(0, 4).map(record => ({ accountId: account.id, cardId: source.cardId, record }))
  const state = { imported, historyAliases: {} }
  const expected = [0, 2].map(index => ({ ...imported[index], origin: { id: `online:${source.cardId}:${(imported[index + 1].record as { id: string }).id}:${(imported[index + 1].record as { operationDate: string }).operationDate}`, date: (imported[index + 1].record as { operationDate: string }).operationDate } }))
  expect(combineOnlineTransactions([], [], [source], [account], fromDate, undefined, state)).toEqual({ transactions: [], state: { imported: expected, historyAliases: {} } })
})

it('matches the observed online and booked merchant spellings without changing their text (ID-001)', () => {
  const { fixture, source } = lifecycleScenario()
  const online = source.entries[0] as { details: string }
  const history = fixture.bookedHistory as Array<{ details: string }>
  expect(history.map(record => matchingCardMerchant(online.details, record.details))).toEqual([true, true, true])
})

// Repeated imports exercise persisted lifecycle metadata using complete observed records.
it('[model] preserves reconciled purchase origins across repeated imports (ID-001, DATE-001)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const imported = source.entries.slice(0, 4).map(record => ({ accountId: account.id, cardId: source.cardId, record }))
  const first = combineOnlineTransactions([], [], [source], [account], fromDate, undefined, { imported, historyAliases: {} })
  expect(combineOnlineTransactions([], [], [source], [account], fromDate, undefined, first.state)).toEqual(first)
})

it('does not match observed unrelated merchants when their references or amounts might coincide (ID-001)', () => {
  const { fixture } = lifecycleScenario()
  const { source } = scenario()
  const online = source.entries[1] as { details: string }
  const history = fixture.bookedHistory as Array<{ details: string }>
  expect(history.map(record => matchingCardMerchant(online.details, record.details))).toEqual([false, false, false])
})

// Model a repeat run using the observed before/after states of the same independent authorization.
it('[model] removes the observed settled authorization from the current pending statement (STATUS-001)', () => {
  const { fixture, fromDate } = lifecycleScenario()
  const account = { id: '1570010000000003', type: AccountType.ccard as const, title: 'Visa USD', instrument: 'USD', syncIds: ['1570010000000003'], balance: 0 }
  const source = { accountId: account.id, cardId: '100000003', entries: [fixture.preauthorization] }
  const first = combineOnlineTransactions([], [], [source], [account], fromDate)
  expect(combineOnlineTransactions([], [], [{ ...source, entries: [fixture.settledPreauthorization] }], [account], fromDate, undefined, first.state)).toEqual({ transactions: [], state: first.state })
})

// Model independent card identities without modifying any observed bank record.
it('[model] does not combine pre-purchase and completion records assigned to different cards (ID-001)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const imported = [
    { accountId: account.id, cardId: source.cardId, record: source.entries[0] },
    { accountId: account.id, cardId: '100000004', record: source.entries[1] }
  ]
  const state = { imported, historyAliases: {} }
  expect(combineOnlineTransactions([], [], [], [account], fromDate, undefined, state)).toEqual({ transactions: [], state })
})

// Model disappearance of the original stage and reordered overlapping current sources.
it('[model] retains the original purchase identities when only their completions remain online (ID-001, DATE-001)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const imported = source.entries.slice(0, 4).map(record => ({ accountId: account.id, cardId: source.cardId, record }))
  const first = combineOnlineTransactions([], [], [source], [account], fromDate, undefined, { imported, historyAliases: {} })
  const entries = [source.entries[2], source.entries[0]]
  expect(combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate, undefined, JSON.parse(JSON.stringify(first.state)))).toEqual(first)
})
