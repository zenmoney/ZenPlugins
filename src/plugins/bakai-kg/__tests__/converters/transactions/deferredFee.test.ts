import { convertTransactions } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { getArray, getOptNumber, getOptString } from '../../../../../types/get'
import { AccountType, Transaction } from '../../../../../types/zenmoney'
import recent from '../../fixtures/deferred-fee-172741.json'
import older from '../../fixtures/deferred-fee-169869.json'
import expectedCapture from '../../fixtures/deferred-fee-172741-expected.json'

const account = { id: '1006', type: AccountType.ccard as const, title: 'Test card', instrument: 'USD', syncIds: [] }
const recentOperations = getArray(recent, 'statement.operations')
const expected = expectedCapture as Array<Omit<Transaction, 'date'> & { date: string }>
const from = new Date('2026-04-01T00:00:00+06:00')

it('counts the deferred issuer fee once and preserves the entire observed statement (AMOUNT-001, AMOUNT-002)', () => {
  const transactions = adjustTransactions({ transactions: convertTransactions(recentOperations, account, from) })
  expect(transactions).toEqual(expected.map(row => ({ ...row, date: new Date(row.date) })))
  expect(Math.round(transactions.reduce((total, transaction) => total + transaction.movements.reduce((sum, movement) => sum + (movement.sum ?? 0) + movement.fee, 0), 0) * 100) / 100).toBe(54.51)
})

it('retains the observed P2P credit after a deferred issuer fee from log 169869 (AMOUNT-002)', () => {
  const pair = getArray(older, 'statement.operations').filter(row => getOptString(row, 'type_code') === 'OPTP0119' || getOptString(row, 'utrnno') === '606951158')
  expect(adjustTransactions({ transactions: convertTransactions(pair, account, from) })).toEqual([{
    hold: null,
    date: new Date('2026-07-09T00:00:00+06:00'),
    movements: [{ id: '606951158:credit', account: { id: '1006' }, invoice: null, sum: 30, fee: -20 }],
    merchant: { title: 'UNID*IVAN IVANOV', city: null, country: null, mcc: 6012, location: null },
    comment: null
  }])
})

it('keeps an unmatched real zero-value issuer fee reportable instead of guessing a debit', () => {
  const fee = recentOperations.filter(row => getOptNumber(row, 'amount') === 0)
  expect(() => convertTransactions(fee, account, from)).toThrow('Deferred issuer fee cannot be matched unambiguously')
})

it('[model] rejects an ambiguous fee match caused by duplicate input records', () => {
  // Model overlapping ingestion of the same observed credit, not a new bank format.
  const credit = recentOperations.find(row => getOptString(row, 'utrnno') === '710301130')
  expect(() => convertTransactions([...recentOperations, credit], account, from)).toThrow('Deferred issuer fee cannot be matched unambiguously')
})
