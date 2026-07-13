import { Account, AccountType } from '../../../types/zenmoney'

export const creditCardGelV2: Account = {
  balance: 48.48,
  id: '10FAKE-GEL34',
  instrument: 'GEL',
  syncIds: [
    'GE00TB0000000001111000'
  ],
  title: 'My Account',
  type: AccountType.ccard
}

export const creditCardUsdV2: Account = {
  balance: 48.48,
  id: '10FAKE-USD35',
  instrument: 'USD',
  syncIds: [
    'GE00TB0000000001111001'
  ],
  title: 'My Account',
  type: AccountType.ccard
}

export const creditCardEurV2: Account = {
  balance: 48.48,
  id: '10FAKE-EUR36',
  instrument: 'EUR',
  syncIds: [
    'GE00TB0000000001111002'
  ],
  title: 'My Account',
  type: AccountType.ccard
}

export const depositGEL: Account = {
  id: '12349350',
  type: AccountType.deposit,
  title: 'სახლი',
  instrument: 'GEL',
  syncIds: [
    'GE00TB0000000001111002'
  ],
  balance: 10436.03,
  startDate: new Date('2025-11-17T00:00:00.000+04:00'),
  startBalance: 10436.03,
  capitalization: true,
  percent: 10.9,
  endDateOffsetInterval: 'year',
  endDateOffset: 2,
  payoffInterval: 'month',
  payoffStep: 1
}
