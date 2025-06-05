import { ConvertedAccount } from '../models'
import { AccountType } from '../../../types/zenmoney'

export const accountGel: ConvertedAccount = {
  tag: 'account',
  acctKey: '1337',
  account: {
    id: '1337',
    instrument: 'GEL',
    type: AccountType.ccard,
    title: '',
    balance: 0,
    syncIds: []
  }
}

export const accountUsd: ConvertedAccount = {
  tag: 'account',
  acctKey: '1338',
  account: {
    id: '1338',
    instrument: 'USD',
    type: AccountType.ccard,
    title: '',
    balance: 0,
    syncIds: []
  }
}

export const accountEur: ConvertedAccount = {
  tag: 'account',
  acctKey: '1339',
  account: {
    id: '1339',
    type: AccountType.ccard,
    title: 'Universal Account',
    instrument: 'EUR',
    balance: -514.78,
    syncIds: []
  }
}

export const depositGel: ConvertedAccount = {
  account: {
    balance: 100.05,
    capitalization: true,
    endDateOffset: 1,
    endDateOffsetInterval: 'year',
    id: '1339',
    instrument: 'GEL',
    payoffInterval: 'month',
    payoffStep: 1,
    percent: 0.75,
    startBalance: 100,
    startDate: new Date('2022-05-04T00:00:00.000+04:00'),
    syncIds: [
      '1339'
    ],
    title: 'ENLARG',
    type: AccountType.deposit
  },
  acctKey: '1339',
  tag: 'deposit'
}

export const depositUSD: ConvertedAccount = {
  account:
    {
      id: '1340',
      type: AccountType.deposit,
      title: 'Deposit (USD)',
      instrument: 'USD',
      syncIds: ['1340'],
      balance: 23010.52,
      startDate: new Date('Mon May 16 2022 23:00:00 GMT+0300 (GMT+03:00)'),
      startBalance: 23010.52,
      capitalization: true,
      percent: 0.4,
      endDateOffsetInterval: 'day',
      endDateOffset: 27988,
      payoffInterval: 'month',
      payoffStep: 1
    },
  acctKey: '1340',
  tag: 'deposit'
}
