import { convertTransaction, deduplicateTransactions } from '../../../converters'
import { Account, AccountType, ExtendedTransaction } from '../../../../../types/zenmoney'

const account: Account = {
  balance: 100000,
  id: '12345678',
  instrument: 'UZS',
  savings: false,
  syncIds: ['860000******1234'],
  title: 'Test card',
  type: AccountType.ccard
}

describe('get.synced.history transactions', () => {
  it('converts the compact P2P payload without detail-only fields', () => {
    expect(convertTransaction({
      id: 'history-1',
      payment_id: 0,
      amount: 25000,
      service_name: 'Perevod P2P',
      short_desc: 'Transfer to a card',
      datetime: 1786104000,
      account_id: 12345678,
      image: 'https://cdn.click.uz/app/evo/service/payment/p2p_debit.png',
      credit: false,
      currency: 'UZS'
    }, account)).toEqual({
      hold: null,
      date: new Date('2026-08-07T12:00:00.000Z'),
      movements: [{
        id: null,
        account: { id: '12345678' },
        invoice: null,
        sum: -25000,
        fee: 0
      }, {
        id: null,
        account: {
          syncIds: null,
          type: 'ccard',
          company: null,
          instrument: 'UZS'
        },
        invoice: null,
        sum: 25000,
        fee: 0
      }],
      merchant: null,
      comment: 'Transfer to a card',
      groupKeys: ['2026-08-07_UZS_25000']
    })
  })

  it('uses invoice for a foreign-currency card operation', () => {
    expect(convertTransaction({
      id: 'history-usd-1',
      amount: 12.34,
      service_name: 'TEST CAFE',
      datetime: 1786104000,
      account_id: 12345678,
      image: 'https://cdn.click.uz/app/evo/service/payment/transType_755.png',
      credit: false,
      currency: 'USD'
    }, account)).toEqual({
      hold: null,
      date: new Date('2026-08-07T12:00:00.000Z'),
      movements: [{
        id: 'history-usd-1',
        account: { id: '12345678' },
        invoice: { sum: -12.34, instrument: 'USD' },
        sum: null,
        fee: 0
      }],
      merchant: {
        fullTitle: 'TEST CAFE',
        mcc: null,
        location: null
      },
      comment: null,
      groupKeys: ['2026-08-07_USD_12.34']
    })
  })

  it('does not remove distinct equal payments made within one hour', () => {
    const first = convertTransaction({
      id: 'history-1',
      amount: 1000,
      service_name: 'TEST SERVICE',
      datetime: 1786104000,
      credit: false,
      currency: 'UZS'
    }, account)
    const second = convertTransaction({
      id: 'history-2',
      amount: 1000,
      service_name: 'TEST SERVICE',
      datetime: 1786104010,
      credit: false,
      currency: 'UZS'
    }, account)

    expect(deduplicateTransactions([first, second] as ExtendedTransaction[])).toEqual([first, second])
  })
})
