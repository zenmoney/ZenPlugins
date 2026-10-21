import { readFileSync } from 'fs'
import { join } from 'path'
import { Account, AccountOrCard, AccountType, Transaction } from '../../../../../types/zenmoney'
import { OnlineSource } from '../../../models'
import { combineOnlineTransactions, matchingCardMerchant } from '../../../converters/online'
import { convertAccounts, convertTransactions } from '../../../converters'
import { BankCapture } from '../../../testModels'

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
  const source = { accountId: account.id, cardId: '100000002', entries: fixture.onlineResponse.data.entries.slice(0, 4) }
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
  expect(combineOnlineTransactions([], [], [source], [account], fromDate, undefined, state)).toEqual({ transactions: completedPurchases(), state: { imported: expected, historyAliases: {} } })
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
  expect(combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate, undefined, JSON.parse(JSON.stringify(first.state)))).toEqual({ transactions: completedPurchases().reverse(), state: first.state })
})

/** Reuse the complete account graph for the same observed source account and receiving card. */
function transferScenario (): { history: unknown[], accounts: Account[], source: OnlineSource, fromDate: Date, expected: Transaction[], pending: Transaction[] } {
  const fixture: { onlineResponse: { data: { entries: unknown[] } }, history: unknown[] } = JSON.parse(readFileSync(join(__dirname, '../../fixtures/online-transfer.json'), 'utf8'))
  const capture: BankCapture = JSON.parse(readFileSync(join(__dirname, '../../fixtures/capture.json'), 'utf8'))
  const accounts = convertAccounts(capture.graph, capture.products).accounts
  const source = { accountId: '1570010000000002', cardId: '900000431', entries: fixture.onlineResponse.data.entries }
  const fromDate = new Date('2026-05-28T00:00:00+04:00')
  const expected: Transaction[] = [{
    date: new Date('2026-05-28T07:16:44.000Z'),
    hold: false,
    movements: [
      { id: '0f857c57-b772-5f54-b58b-8f2222eda1af:1570010000000005', account: { id: '1570010000000005' }, sum: -42873.61, fee: 0, invoice: null },
      { id: '0f857c57-b772-5f54-b58b-8f2222eda1af:1570010000000002', account: { id: '1570010000000002' }, sum: 42873.61, fee: 0, invoice: null }
    ],
    merchant: null,
    comment: 'Transfer of own funds'
  }]
  const pending: Transaction[] = [{
    date: new Date('2026-05-28T07:16:44.000Z'),
    hold: true,
    movements: [{ id: 'online:900000431:810143:2026-05-28T07:16:44.000Z:1570010000000002', account: { id: source.accountId }, sum: 42873.61, fee: 0, invoice: null }],
    merchant: { fullTitle: 'EXAMPLEBANK API GATE 7 A.EXAMPLE STR. SAMPLECITY FRA', mcc: null, location: null },
    comment: null
  }]
  return { history: fixture.history, accounts, source, fromDate, expected, pending }
}

it('returns the observed full own-account transfer once despite the receiving card authorization (TRANSFER-004)', () => {
  const { history, accounts, source, fromDate, expected } = transferScenario()
  const booked = convertTransactions(history, accounts, {}, fromDate)
  expect(combineOnlineTransactions(history, booked, [source], accounts, fromDate)).toEqual({ transactions: expected, state: { imported: [], historyAliases: {} } })
})

// Model an earlier import of the observed card-side credit; the full transfer must keep its booked IDs.
it('[model] keeps booked transfer identities when removing a previously imported receiving authorization (ID-001, TRANSFER-004)', () => {
  const { history, accounts, source, fromDate, expected } = transferScenario()
  const booked = convertTransactions(history, accounts, {}, fromDate)
  const imported = source.entries.map(record => ({ accountId: source.accountId, cardId: source.cardId, record }))
  expect(combineOnlineTransactions(history, booked, [source], accounts, fromDate, undefined, { imported, historyAliases: {} })).toEqual({ transactions: expected, state: { imported: [], historyAliases: {} } })
})

it('preserves the observed incoming authorization while its booked transfer is unavailable (STATUS-001, TRANSFER-001)', () => {
  const { accounts, source, fromDate, pending } = transferScenario()
  expect(combineOnlineTransactions([], [], [source], accounts, fromDate).transactions).toEqual(pending)
})

// Model a repeat import after the transient card-side record has disappeared.
it('[model] removes obsolete receiving-credit metadata without replaying it alongside the full transfer (TRANSFER-004)', () => {
  const { history, accounts, source, fromDate, expected } = transferScenario()
  const booked = convertTransactions(history, accounts, {}, fromDate)
  const imported = source.entries.map(record => ({ accountId: source.accountId, cardId: source.cardId, record }))
  expect(combineOnlineTransactions(history, booked, [], accounts, fromDate, undefined, { imported, historyAliases: {} })).toEqual({ transactions: expected, state: { imported: [], historyAliases: {} } })
})

// Model missing converted counterpart evidence without altering the observed bank records.
it('[model] retains the receiving authorization when no confirmed full transfer was converted (TRANSFER-001)', () => {
  const { history, accounts, source, fromDate, pending } = transferScenario()
  expect(combineOnlineTransactions(history, [], [source], accounts, fromDate).transactions).toEqual(pending)
})

// Model repeated imports and overlapping copies of the same complete observed records.
it('[model] keeps the full transfer and its booked identities stable across overlapping imports (TRANSFER-004, ID-001)', () => {
  const { history, accounts, source, fromDate, expected } = transferScenario()
  const booked = convertTransactions(history, accounts, {}, fromDate)
  const first = combineOnlineTransactions(history, booked, [source], accounts, fromDate)
  const repeated = { ...source, entries: [...source.entries, ...source.entries] }
  expect(combineOnlineTransactions([...history, ...history], booked, [repeated], accounts, fromDate, undefined, first.state)).toEqual({ transactions: expected, state: { imported: [], historyAliases: {} } })
})

/** Expected final payments derived from the complete observed completion/pre-purchase pairs. */
function completedPurchases (): Transaction[] {
  return [{
    date: new Date('2026-05-27T13:19:19.000Z'),
    hold: false,
    movements: [{ id: 'online:100000002:710143:2026-05-27T13:19:19.000Z:1570010000000002', account: { id: '1570010000000002' }, sum: -2873.41, fee: 0, invoice: null }],
    merchant: { fullTitle: 'RIDEAPP.GO 42/7 EXAMPLE STR. SAMPLECITY FRA', mcc: null, location: null },
    comment: null
  }, {
    date: new Date('2026-05-27T07:41:25.000Z'),
    hold: false,
    movements: [{ id: 'online:100000002:720257:2026-05-27T07:41:25.000Z:1570010000000002', account: { id: '1570010000000002' }, sum: -1639.27, fee: 0, invoice: null }],
    merchant: { fullTitle: 'RIDEAPP.GO 42/7 EXAMPLE STR. SAMPLECITY FRA', mcc: null, location: null },
    comment: null
  }]
}

it('imports the observed settled completions once before their booked history arrives (STATUS-001, TRANSFER-004)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const entries = source.entries.slice(0, 4)
  expect(combineOnlineTransactions([], [], [{ ...source, entries }], [account], fromDate).transactions).toEqual(completedPurchases())
})

// Model source arrival order using complete observed records without inventing bank responses.
it('[model] preserves an emitted completion identity when its initiation record arrives later (ID-001, DATE-001)', () => {
  const { account, source, fromDate } = lifecycleScenario()
  const first = combineOnlineTransactions([], [], [{ ...source, entries: [source.entries[0]] }], [account], fromDate)
  const expected = completedPurchases()[0]
  const movement = { ...expected.movements[0], id: 'online:100000002:710143:2026-05-27T17:04:19.000Z:1570010000000002' }
  expect(first.transactions).toEqual([{ ...expected, date: new Date('2026-05-27T17:04:19.000Z'), movements: [movement] }])
  const current = { ...source, entries: source.entries.slice(0, 2) }
  const second = combineOnlineTransactions([], [], [current], [account], fromDate, undefined, first.state)
  expect(second.transactions).toEqual([{ ...expected, movements: [movement] }])
  expect(combineOnlineTransactions([], [], [current], [account], fromDate, undefined, JSON.parse(JSON.stringify(second.state)))).toEqual(second)
})

it('filters completed purchases by initiation date rather than completion date (DATE-001)', () => {
  const { account, source } = lifecycleScenario()
  expect(combineOnlineTransactions([], [], [source], [account], new Date('2026-05-27T14:00:00.000Z')).transactions).toEqual([])
})
