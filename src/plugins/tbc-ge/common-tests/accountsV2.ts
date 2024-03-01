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
