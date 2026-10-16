import { BankCapture } from '../../../testModels'
import { readFileSync } from 'fs'
import { join } from 'path'
import { convertAccounts, convertTransactions, verifyDepositHistory } from '../../../converters'

import { Movement, Transaction } from '../../../../../types/zenmoney'

const capture: BankCapture = JSON.parse(readFileSync(join(__dirname, '../../fixtures/capture.json'), 'utf8'))
const accounts = convertAccounts(capture.graph, capture.products).accounts
const fromDate = new Date('2026-07-01T00:00:00+04:00')
/** Convert selected fixture records using the captured graph and fixed import boundary. */
const convert = (history: readonly unknown[]): Transaction[] => convertTransactions(history, accounts, capture.details, fromDate)
/** Build the independently expected own-account movement for a fixture transaction. */
const movement = (id: string, suffix: string, sum: number): Movement => ({ id: `${id}:157001000000000${suffix}`, account: { id: `157001000000000${suffix}` }, sum, fee: 0, invoice: null })

it('preserves a purchase descriptor without substituting the card processor', () => {
  expect(convert([capture.history[1]])).toEqual([{
    date: new Date(1788865956000),
    hold: false,
    movements: [movement('da4e5adc-c1ae-5d8f-a6ea-2c781c04512a', '2', -9225)],
    merchant: { fullTitle: 'EATORIA 1 Yerevan AM 178048', mcc: null, location: null },
    comment: null
  }])
})

it('preserves a standalone bank fee once with its own ID', () => {
  expect(convert([capture.history[0], capture.history[0]])).toEqual([{
    date: new Date(1788866009000),
    hold: false,
    movements: [movement('8913cabb-bf43-5a80-8712-e5440a81df9c', '2', -45)],
    merchant: { fullTitle: 'Գանձում փոխանցման համար Ամերիաբ', mcc: null, location: null },
    comment: null
  }])
})

it('returns one internal transfer with both confirmed movements (TRANSFER-001)', () => {
  expect(convert([capture.history[2]])).toEqual([{
    date: new Date(1788862832000),
    hold: false,
    movements: [movement('997f0aa0-9adb-57d6-b945-df79b890c7cd', '5', -450000), movement('997f0aa0-9adb-57d6-b945-df79b890c7cd', '2', 450000)],
    merchant: null,
    comment: 'Transfer of own funds'
  }])
})

it('uses settled debit and documented credit for FX without treating rounding as a fee', () => {
  expect(convert([capture.history[16]])).toEqual([{
    date: new Date(1788410924000),
    hold: false,
    movements: [movement('d2c7e298-cd08-5d05-9a3a-992e72d14b9f', '0', -239996.1), movement('d2c7e298-cd08-5d05-9a3a-992e72d14b9f', '1', 653.94)],
    merchant: null,
    comment: 'Transfer of own funds'
  }])
})

it('converts every captured operation and remains stable on overlapping repeats', () => {
  const first = convert(capture.history)
  expect(first).toHaveLength(205)
  expect(first.filter(t => t.movements.length === 2 && t.movements.every(m => 'id' in m.account))).toHaveLength(19)
  expect(first.filter(t => t.movements.length === 2)).toHaveLength(26)
  expect(convert([...capture.history, ...capture.history])).toEqual(first)
  expect(convert(capture.history)).toEqual(first)
})

it('includes both interval boundaries and imposes no upper filter when absent', () => {
  const date = new Date(1788865956000)
  expect(convertTransactions([capture.history[1]], accounts, capture.details, date, date)).toEqual(convert([capture.history[1]]))
  expect(convertTransactions([capture.history[1]], accounts, capture.details, new Date(date.getTime() + 1))).toEqual([])
  expect(convertTransactions([capture.history[1]], accounts, capture.details, fromDate, new Date(date.getTime() - 1))).toEqual([])
})

it('checks the complete deposit ledger and rejects unverified older deposit movements', () => {
  const deposit = accounts.filter(a => a.id === 'deposit:1010756356')[0]
  expect(verifyDepositHistory(capture.depositHistory, capture.history, deposit, fromDate)).toEqual({})
  expect(() => verifyDepositHistory(capture.depositHistory, capture.history, deposit, new Date('2025-01-01'))).toThrow()
})

it('preserves salary as income with its purpose and sender', () => {
  expect(convert([capture.history[44]])).toEqual([{
    date: new Date(1787815713000),
    hold: false,
    movements: [movement('aaf19de0-0a1e-5516-899b-2818a3f3241a', '5', 1774575)],
    merchant: { title: '«ՕՐԻՆԱԿ 017» ՍՊԸ', city: null, country: null, mcc: null, location: null },
    comment: 'Աշխատավարձ'
  }])
})

it('preserves a P2P recipient and the masked external card', () => {
  expect(convert([capture.history[8]])).toEqual([{
    date: new Date(1788764409000),
    hold: false,
    movements: [movement('e1e0a8d0-561c-59a0-86ca-c96e4fca411c', '2', -9000), {
      id: null, account: { type: null, instrument: 'AMD', company: null, syncIds: ['4318********0095'] }, sum: 9000, fee: 0, invoice: null
    }],
    merchant: { title: 'SAMPLE PERSON 007', city: null, country: null, mcc: null, location: null },
    comment: 'Personal transfer'
  }])
})

it('uses EUR account impact for a closed deposit repayment, retaining the contract purpose', () => {
  expect(convert([capture.history[130]])).toEqual([{
    date: new Date(1785320376000),
    hold: false,
    movements: [movement('de32151e-a662-5f32-a93e-51a2c3e5bdd5', '6', 5738.88)],
    merchant: { title: 'ՍԱՄՎԵԼ ՊԵՏՐՈՍՅԱՆ 004', city: null, country: null, mcc: null, location: null },
    comment: 'N NA100001 Ավանդի մարում'
  }])
})

it('converts all four July-to-October pages including the previously omitted page zero', () => {
  const records = [...capture.recentHistory, ...capture.history]
  const result = convert(records)
  expect(result).toHaveLength(305)
  expect(result.filter(t => t.movements.length === 2 && t.movements.every(m => 'id' in m.account))).toHaveLength(23)
  expect(result.filter(t => t.movements.length === 2)).toHaveLength(39)
  expect(convert([...records, ...records])).toEqual(result)
  expect(result.some(t => t.date.getTime() === fromDate.getTime())).toBe(true)
})
