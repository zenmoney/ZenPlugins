import { AccountType } from '../../../../../types/zenmoney'
import { convertTransactions } from '../../../converters'
import { accounts, accountId } from '../../../__fixtures__/conversion'
import { additionalHistory } from '../../../__fixtures__/additionalHistory'

describe('ZEN.COM captured cashTransfer', () => {
  it('TRANSFER-001 preserves the ATM debit and opposite cash amount in the withdrawal currency', () => {
    expect(convertTransactions([additionalHistory[6]], accounts(), new Set([accountId]))).toEqual([{
      date: new Date('2026-06-04T15:40:13Z'),
      hold: false,
      movements: [
        { id: `00000000-0000-3ce3-8000-000000001006:${accountId}`, account: { id: accountId }, sum: -170.89, invoice: { sum: -20000, instrument: 'RSD' }, fee: 0 },
        { id: null, account: { type: AccountType.cash, instrument: 'RSD', company: null, syncIds: null }, sum: 20000, invoice: null, fee: 0 }
      ],
      merchant: { title: 'BEOGRAD BULEVAR', city: 'BEOGRAD', country: 'SRB', mcc: null, location: null },
      comment: null
    }])
  })
})
