import { AccountType } from '../../../../types/zenmoney'
import { convertPdfStatementAccount } from '../../converters/accounts'
import { StatementAccount } from '../../models'

describe('convertPdfStatementAccount', () => {
  it('maps statement account to ccard with syncIds', () => {
    const raw: StatementAccount = {
      id: 'KZ38886D224304110804',
      title: 'Home Credit *8517',
      balance: 178913.98,
      instrument: 'KZT',
      date: '2026-04-05T00:00:00.000',
      type: 'ccard',
      startDate: null,
      startBalance: null,
      capitalization: null,
      endDate: null
    }
    const { account, date } = convertPdfStatementAccount(raw)
    expect(account.type).toBe(AccountType.ccard)
    expect(account.id).toBe('KZ38886D224304110804')
    expect(account.syncIds).toEqual(['KZ38886D224304110804'])
    expect(account.instrument).toBe('KZT')
    expect(account.balance).toBe(178913.98)
    expect(account.title).toBe('Home Credit *8517')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(5)
  })

  it('maps deposit statement to deposit account', () => {
    const raw: StatementAccount = {
      id: 'KZ38886D224304110804',
      title: 'Home Credit Депозит Простой',
      balance: 648513.36,
      instrument: 'KZT',
      date: '2026-04-12T00:00:00.000',
      type: 'deposit',
      startDate: '2026-03-13T00:00:00.000',
      startBalance: 0,
      capitalization: null,
      endDate: '2026-04-12T00:00:00.000'
    }
    const { account, date } = convertPdfStatementAccount(raw)
    expect(account.type).toBe(AccountType.deposit)
    expect(account.title).toBe('Home Credit Депозит Простой')
    expect(date.getFullYear()).toBe(2026)
  })
})
