import { convertAccount } from '../../../converters'
import { AccountData, BunqAccountType } from '../../../models'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

const bunqAccount: AccountData = {
  type: BunqAccountType.Bank,
  id: 3782,
  description: 'Account name',
  currency: 'EUR',
  balance: { value: '222.12' },
  alias: [
    { type: 'IBAN', value: '333444555', name: 'Alias name' }
  ],
  status: 'ACTIVE'
}

const convertedAccount: AccountOrCard = {
  type: AccountType.checking,
  title: 'Account name',
  instrument: 'EUR',
  balance: 222.12,
  syncIds: ['3782', '333444555'],
  id: '3782'
}

describe('convertAccounts', () => {
  it('converts current account', () => {
    expect(convertAccount(bunqAccount)).toEqual(convertedAccount)
  })
})
