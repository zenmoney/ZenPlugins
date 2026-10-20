import { convertTransactions } from '../../../converters'
import { accounts, accountId } from '../../../__fixtures__/conversion'
import { additionalHistory } from '../../../__fixtures__/additionalHistory'

describe('ZEN.COM captured correction', () => {
  it('AMOUNT-001 and COMMENT-001 preserves independent ATM fee corrections in their actual account currencies', () => {
    const ilsId = '00000000-0000-4000-8000-000000000016'
    expect(convertTransactions(additionalHistory.slice(14), accounts(), new Set([accountId, ilsId]))).toEqual([
      {
        date: new Date('2024-05-07T15:51:40Z'),
        hold: false,
        movements: [{ id: `00000000-0000-3af9-8000-000000001014:${accountId}`, account: { id: accountId }, sum: -3.86, invoice: null, fee: 0 }],
        merchant: { title: 'ZEN.COM UAB', city: null, country: null, mcc: null, location: null },
        comment: 'Fee for ATM withdrawal'
      },
      {
        date: new Date('2024-04-21T10:43:45Z'),
        hold: false,
        movements: [{ id: `00000000-0000-32ed-8000-000000001015:${accountId}`, account: { id: accountId }, sum: -1.08, invoice: null, fee: 0 }],
        merchant: { title: 'ZEN.COM UAB', city: null, country: null, mcc: null, location: null },
        comment: 'Fee for ATM withdrawal'
      },
      {
        date: new Date('2024-03-11T16:24:32Z'),
        hold: false,
        movements: [{ id: `00000000-0000-33e8-8000-000000001016:${ilsId}`, account: { id: ilsId }, sum: -1.5, invoice: null, fee: 0 }],
        merchant: { title: 'ZEN.COM UAB', city: null, country: null, mcc: null, location: null },
        comment: 'Fee for ATM withdrawal'
      }
    ])
  })
})
