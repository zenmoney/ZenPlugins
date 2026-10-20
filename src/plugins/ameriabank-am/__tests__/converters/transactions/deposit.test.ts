import { readFileSync } from 'fs'
import { join } from 'path'
import { convertAccounts, convertTransactions, verifyDepositHistory } from '../../../converters'
import { BankCapture } from '../../../testModels'
import { Movement, Transaction } from '../../../../../types/zenmoney'

const capture: BankCapture = JSON.parse(readFileSync(join(__dirname, '../../fixtures/capture.json'), 'utf8'))
const history: { history: readonly unknown[] } = JSON.parse(readFileSync(join(__dirname, '../../fixtures/deposit-history.json'), 'utf8'))
const accounts = convertAccounts(capture.graph, capture.products).accounts
const deposit = accounts.filter(a => a.id === 'deposit:1010756356')[0]
const fromDate = new Date('2025-05-29T00:00:00+04:00')
/** Independently specify the bank-ID movement and its observed account impact. */
const movement = (id: string, account: string, sum: number): Movement => ({ id: `${id}:${account}`, account: { id: account }, sum, fee: 0, invoice: null })
/** Independently specify each income, tax, and confirmed deposit transfer. */
const expected = (): Transaction[] => [
  { date: new Date('2025-05-29T06:02:05Z'), hold: false, movements: [movement('99e0e1fb-e308-5ca1-ad95-d881ab6807ba', '1570010000000007', -24000), movement('99e0e1fb-e308-5ca1-ad95-d881ab6807ba', deposit.id, 24000)], merchant: null, comment: 'N NA100002 Ավանդի ներգրավում' },
  { date: new Date('2025-11-28T22:50:42Z'), hold: false, movements: [movement('4df629d0-a695-5708-bca6-a2d69ba144ad', '1570010000000007', -27.84)], merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 099', city: null, country: null, mcc: null, location: null }, comment: 'Հարկի գանձում տոկոսի կապիտալացումի' },
  { date: new Date('2025-11-28T22:50:42Z'), hold: false, movements: [movement('9c99efa6-2cde-54d3-9644-1338457110d9', '1570010000000007', 27.84)], merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 004', city: null, country: null, mcc: null, location: null }, comment: 'Հարկի գանձում տոկոսի կապիտալացումի' },
  { date: new Date('2025-11-28T22:50:42Z'), hold: false, movements: [movement('2b480710-99bb-548e-8fcf-a31984e643a4', '1570010000000007', 250.41)], merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 004', city: null, country: null, mcc: null, location: null }, comment: 'N NA100002 Տոկոսների կապիտալացում' },
  { date: new Date('2025-11-28T22:50:42Z'), hold: false, movements: [movement('5e6d0127-ea4c-53d3-9272-5cba21002966', '1570010000000007', -250.41), movement('5e6d0127-ea4c-53d3-9272-5cba21002966', deposit.id, 250.41)], merchant: null, comment: 'N NA100002 Տոկոսների կապիտալացում' },
  { date: new Date('2026-05-31T22:37:32Z'), hold: false, movements: [movement('d533fd82-fe8a-5565-82b6-3732d8664053', '1570010000000007', -264.06), movement('d533fd82-fe8a-5565-82b6-3732d8664053', deposit.id, 264.06)], merchant: null, comment: 'N NA100002 Տոկոսների կապիտալացում' },
  { date: new Date('2026-05-31T22:37:32Z'), hold: false, movements: [movement('076b51a4-672f-524d-9f91-92822cd73f53', '1570010000000007', 293.4)], merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 004', city: null, country: null, mcc: null, location: null }, comment: 'N NA100002 Տոկոսների կապիտալացում,' },
  { date: new Date('2026-05-31T22:37:32Z'), hold: false, movements: [movement('e9fb42a4-da79-52e2-bd40-5114e93cf6ee', '1570010000000007', -29.34)], merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 099', city: null, country: null, mcc: null, location: null }, comment: 'Հարկի գանձում տոկոսի կապիտալացումի' }
]
/** Reconcile the complete bank ledger before converting the shared history once. */
const convert = (records = history.history, from = fromDate, to?: Date): Transaction[] => convertTransactions(records, accounts, {}, from, to, verifyDepositHistory(capture.depositHistory, records, deposit, from, to))

it('imports opening, net capitalization transfers, interest and tax exactly once (AMOUNT-001, TRANSFER-004)', () => {
  expect(convert()).toEqual(expected())
})

it('preserves bank identities across repeated and overlapping history (ID-001)', () => {
  expect(convert([...history.history, ...history.history])).toEqual(expected())
})

it('preserves the same complete operations when the bank returns history in reverse order (ID-001)', () => {
  expect(convert([...history.history].reverse())).toEqual(expected().reverse())
})

it('includes both exact bank timestamp boundaries before the date-only ledger timestamp (DATE-001)', () => {
  const date = new Date('2026-05-31T22:37:32Z')
  expect(convert(history.history, date, date)).toEqual(expected().slice(5))
})

it('excludes an operation after the upper timestamp while retaining its full-day verification context (DATE-001)', () => {
  expect(convert(history.history, fromDate, new Date('2026-05-31T22:37:31.999Z'))).toEqual(expected().slice(0, 5))
})

it('excludes operations before the lower timestamp without fabricating date-only ledger movements (DATE-001)', () => {
  expect(convert(history.history, new Date('2026-05-31T22:37:32.001Z'))).toEqual([])
})

it('returns no deposit movements when all ledger dates precede the requested period', () => {
  expect(convert(history.history, new Date('2026-07-01T00:00:00+04:00'))).toEqual([])
})

it('keeps the complete monetary result identical on a second conversion (ID-001)', () => {
  expect(convert()).toEqual(expected())
})

it('keeps the full result unchanged when the ledger order changes (ID-001)', () => {
  const links = verifyDepositHistory([...capture.depositHistory].reverse(), history.history, deposit, fromDate)
  expect(convertTransactions(history.history, accounts, {}, fromDate, undefined, links)).toEqual(expected())
})

it('reconciles the deposit balance and leaves no repeated interest or tax effect on the funding account (AMOUNT-002)', () => {
  const result = convert()
  const impact = (account: string): number => Math.round(result.flatMap(t => t.movements).filter(m => 'id' in m.account && m.account.id === account).reduce((sum, m) => sum + (m.sum ?? 0) + m.fee, 0) * 100) / 100
  expect({ deposit: impact(deposit.id), funding: impact('1570010000000007'), transactions: result.length }).toEqual({ deposit: 24514.47, funding: -24000, transactions: 8 })
})

// Model a missing tax source independently of bank response formatting.
it('[model] rejects missing tax verification instead of silently skipping the ledger tax', () => {
  expect(() => convert(history.history.filter((_, i) => i !== 7))).toThrow()
})

// Model a missing bank interest credit, independent of the bank record grammar.
it('[model] rejects a capitalization with missing interest instead of importing a partial funding flow', () => {
  expect(() => convert(history.history.filter((_, i) => i !== 6))).toThrow()
})

// Model loss of the observed separate credit required to reconcile November's net interest.
it('[model] rejects a missing tax-sized credit instead of guessing gross interest', () => {
  expect(() => convert(history.history.filter((_, i) => i !== 2))).toThrow()
})

// Model a missing ledger event independently of protocol parsing.
it('[model] rejects an in-period deposit transfer with no ledger evidence', () => {
  expect(() => verifyDepositHistory(capture.depositHistory.slice(0, 8), history.history, deposit, fromDate)).toThrow()
})

// Model an unknown lifecycle event that must remain a reportable error.
it('[model] rejects an unrecognized in-period ledger event', () => {
  const entry = capture.depositHistory[0] as Record<string, unknown>
  expect(() => verifyDepositHistory([...capture.depositHistory, { ...entry, type: 'modeled-unknown', transactionType: 'modeled-unknown' }], history.history, deposit, fromDate)).toThrow()
})

// Model loss of one required source, without inventing a bank response variant.
it('[model] rejects incomplete shared history instead of returning partial deposit data', () => {
  expect(() => convert(history.history.slice(1))).toThrow()
})

// Model an ambiguous history identity, independent of the bank record grammar.
it('[model] rejects two indistinguishable transfer candidates with different bank IDs', () => {
  const opening = history.history[0] as Record<string, unknown>
  expect(() => convert([...history.history, { ...opening, transactionId: 'modeled-distinct-id' }])).toThrow()
})
