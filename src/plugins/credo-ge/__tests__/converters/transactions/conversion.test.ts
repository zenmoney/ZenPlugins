import { convertTransaction, mergeForeignCurrencyPairs } from '../../../converters'
import { TransactionType } from '../../../models'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('mergeForeignCurrencyPairs', () => {
  it('keeps both legs of an automatic conversion from another own account for a card payment', () => {
    // A card payment in USD funded from the EUR account: three transactionPagingList records posted at the same second,
    // the USD credit and the EUR debit of the exchange and the card payment on the USD account. Observed in a
    // statement of 2026-11-01. Sanitized: transaction and statement entry ids replaced, amounts (including the amount
    // in the payment description) scaled by a common factor, merchant replaced.
    const eurAccount: Account = {
      id: '11',
      type: AccountType.ccard,
      title: 'GE00CD0000000000000011EUR',
      instrument: 'EUR',
      syncIds: ['11'],
      savings: false,
      balance: 100,
      available: 100
    }
    const usdAccount: Account = {
      id: '12',
      type: AccountType.ccard,
      title: 'GE00CD0000000000000011USD',
      instrument: 'USD',
      syncIds: ['12'],
      savings: false,
      balance: 0,
      available: 0
    }
    const usdCredit = convertTransaction({
      amountEquivalent: 189.49,
      canRepeat: false,
      canReverse: false,
      credit: 73.0,
      currency: 'USD',
      debit: null,
      description: 'Currency exchange',
      isCardBlock: false,
      operationDateTime: '2026-10-29T13:16:00',
      operationType: 'Currency exchange',
      operationTypeId: null,
      stmtEntryId: '270100000000001.000001',
      transactionId: 'FT26302XQ7RB',
      transactionType: null,
      transactionTypeId: 310,
      transactionTypeName: 'Currency_exchange'
    }, usdAccount)
    const eurDebit = convertTransaction({
      amountEquivalent: 198.22,
      canRepeat: false,
      canReverse: false,
      credit: null,
      currency: 'EUR',
      debit: 68.65,
      description: 'Currency exchange',
      isCardBlock: false,
      operationDateTime: '2026-10-29T13:16:00',
      operationType: 'Currency exchange',
      operationTypeId: null,
      stmtEntryId: '270100000000002.000001',
      transactionId: 'FT26302K4NWD',
      transactionType: null,
      transactionTypeId: 310,
      transactionTypeName: 'Currency_exchange'
    }, eurAccount)
    const payment = convertTransaction({
      amountEquivalent: 189.49,
      canRepeat: false,
      canReverse: false,
      credit: null,
      currency: 'USD',
      debit: 73.0,
      description: 'Payment - SHOP* ONLINE TBS 73.00 USD 28.10.2026',
      isCardBlock: false,
      operationDateTime: '2026-10-29T13:16:00',
      operationType: 'Card payment',
      operationTypeId: null,
      stmtEntryId: '270100000000003.000001',
      transactionId: 'FT2630201MZP',
      transactionType: TransactionType.AccountWithdrawal,
      transactionTypeId: 545,
      transactionTypeName: 'Card_operation'
    }, usdAccount)

    expect(usdCredit).toEqual({
      hold: false,
      date: new Date('2026-10-29T13:16:00'),
      movements: [{ id: 'FT26302XQ7RB', account: { id: '12' }, invoice: null, sum: 73, fee: 0 }],
      merchant: null,
      comment: 'Currency exchange',
      groupKeys: ['conversion_' + new Date('2026-10-29T13:16:00').getTime().toString()]
    })
    expect(eurDebit).toEqual({
      hold: false,
      date: new Date('2026-10-29T13:16:00'),
      movements: [{ id: 'FT26302K4NWD', account: { id: '11' }, invoice: null, sum: -68.65, fee: 0 }],
      merchant: null,
      comment: 'Currency exchange',
      groupKeys: ['conversion_' + new Date('2026-10-29T13:16:00').getTime().toString()]
    })
    expect(payment).toEqual({
      hold: false,
      date: new Date('2026-10-29T13:16:00'),
      movements: [{ id: 'FT2630201MZP', account: { id: '12' }, invoice: null, sum: -73, fee: 0 }],
      merchant: { fullTitle: 'SHOP* ONLINE TBS', mcc: null, location: null },
      comment: null,
      groupKeys: [null]
    })

    // The USD credit is not a duplicate of the payment: with the EUR debit it is the exchange that funded the payment.
    // Dropping it leaves the USD account short by the payment amount and the EUR debit as a separate expense.
    expect(mergeForeignCurrencyPairs([usdCredit, eurDebit, payment])).toEqual([
      {
        hold: false,
        date: new Date('2026-10-29T13:16:00'),
        movements: [{ id: 'FT26302XQ7RB', account: { id: '12' }, invoice: null, sum: 73, fee: 0 }],
        merchant: null,
        comment: 'Currency exchange',
        groupKeys: ['conversion_' + new Date('2026-10-29T13:16:00').getTime().toString()]
      },
      {
        hold: false,
        date: new Date('2026-10-29T13:16:00'),
        movements: [{ id: 'FT26302K4NWD', account: { id: '11' }, invoice: null, sum: -68.65, fee: 0 }],
        merchant: null,
        comment: 'Currency exchange',
        groupKeys: ['conversion_' + new Date('2026-10-29T13:16:00').getTime().toString()]
      },
      {
        hold: false,
        date: new Date('2026-10-29T13:16:00'),
        movements: [{ id: 'FT2630201MZP', account: { id: '12' }, invoice: null, sum: -73, fee: 0 }],
        merchant: { fullTitle: 'SHOP* ONLINE TBS', mcc: null, location: null },
        comment: null,
        groupKeys: [null]
      }
    ])
  })
})
