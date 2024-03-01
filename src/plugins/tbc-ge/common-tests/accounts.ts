import { ConvertedProduct } from '../models'
import { AccountType } from '../../../types/zenmoney'

export const savingUSD: ConvertedProduct = {
  account: {
    balance: 0,
    id: '10975953',
    instrument: 'USD',
    savings: true,
    syncIds: [
      'GE40TB7692936615123456'
    ],
    title: 'My Saving',
    type: AccountType.checking
  },
  coreAccountId: 10975953,
  tag: 'account'
}

export const debitCardGEL: ConvertedProduct = {
  account: {
    balance: 48.48,
    id: '10971234',
    instrument: 'GEL',
    syncIds: [
      'GE59TB7692945061654321'
    ],
    title: 'My Account',
    type: AccountType.ccard
  },
  coreAccountId: 10971234,
  holdTransactions: [],
  tag: 'card'
}

export const debitCardUSD: ConvertedProduct = {
  account: {
    balance: 4898.48,
    id: '10971235',
    instrument: 'USD',
    syncIds: [
      'GE59TB7692945061654321'
    ],
    title: 'My Account',
    type: AccountType.ccard
  },
  coreAccountId: 10971235,
  holdTransactions: [],
  tag: 'card'
}

export const depositGEL: ConvertedProduct = {
  account: {
    balance: 125000,
    capitalization: true,
    endDateOffset: 2,
    endDateOffsetInterval: 'year',
    id: '11225773',
    instrument: 'GEL',
    payoffInterval: 'month',
    payoffStep: 1,
    percent: 1.49,
    startBalance: 125000,
    startDate: new Date('2022-05-19T00:00:00.000+04:00'),
    syncIds: [
      'GE54TB7511736615001234'
    ],
    title: 'My Deposit',
    type: AccountType.deposit
  },
  depositId: 5750726,
  tag: 'deposit'
}
