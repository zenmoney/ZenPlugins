import { convertTransaction } from '../../../converters'
import { Transaction as CredoTransaction } from '../../../models'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('convertTransaction', () => {
  it.each([
    // Service fee
    [
      {
        credit: null,
        currency: 'USD',
        transactionType: null,
        transactionId: 'FT24061LCZWR',
        debit: 5,
        description: 'სხვა და სხვა საკომისიო',
        isCardBlock: false,
        operationDateTime: '2024-03-01 12:07:00',
        stmtEntryId: '205159562843649.010001',
        canRepeat: false,
        canReverse: false,
        amountEquivalent: 13.3,
        operationType: 'Service fee',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: false,
        date: new Date('2024-03-01 12:07:00'),
        movements: [
          {
            id: 'FT24061LCZWR',
            account: { id: '13' },
            invoice: null,
            sum: -5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Service fee',
        groupKeys: [null]
      }
    ],
    // Cash withdrawal in ATM (same with normal payments)
    [
      {
        credit: null,
        currency: 'USD',
        transactionType: 'AccountWithdrawal',
        transactionId: 'FT240615DDTH',
        debit: 124.31,
        description: 'განაღდება - CANARA BANK 10000.00 INR 29.02.2024',
        isCardBlock: false,
        operationDateTime: '2024-03-01 12:07:00',
        stmtEntryId: '205151791943649.000001',
        canRepeat: false,
        canReverse: false,
        amountEquivalent: 330.65,
        operationType: 'Card transaction',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: false,
        date: new Date('2024-03-01 12:07:00'),
        movements: [
          {
            id: 'FT240615DDTH',
            account: { id: '13' },
            invoice: { sum: -10000, instrument: 'INR' },
            sum: -124.31,
            fee: 0
          }
        ],
        merchant: { fullTitle: 'CANARA BANK', mcc: null, location: null },
        comment: null,
        groupKeys: [null]
      }
    ],
    // On-hold transaction
    [
      {
        credit: null,
        currency: 'USD',
        transactionType: 'CardBlockedTransaction',
        transactionId: '24866829',
        debit: 28.43,
        description: 'PRIME ONE>GOA                         IN',
        isCardBlock: true,
        operationDateTime: '2024-03-01 07:57:20',
        stmtEntryId: 'block_24866829',
        canRepeat: false,
        canReverse: false,
        amountEquivalent: 0,
        operationType: 'Card transaction',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: true,
        comment: null,
        date: new Date('2024-03-01 07:57:20'),
        groupKeys: [null],
        merchant: {
          fullTitle: 'PRIME ONE>GOA                         IN',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '13' },
            fee: 0,
            id: '24866829',
            invoice: null,
            sum: -28.43
          }
        ]
      }
    ],
    // Income
    [
      {
        credit: 1000,
        currency: 'USD',
        transactionType: null,
        transactionId: 'FT24045CRK6D',
        debit: null,
        description: 'TOPUP Services.',
        isCardBlock: false,
        operationDateTime: '2024-02-14 14:07:00',
        stmtEntryId: '204998434150835.000001',
        canRepeat: false,
        canReverse: true,
        amountEquivalent: 18561.9,
        operationType: 'Foreign currency incoming transfer',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: false,
        comment: 'Foreign currency incoming transfer | TOPUP Services.',
        date: new Date('2024-02-14 14:07:00'),
        groupKeys: [null],
        merchant: null,
        movements: [
          {
            account: { id: '13' },
            fee: 0,
            id: 'FT24045CRK6D',
            invoice: null,
            sum: 1000
          }
        ]
      }
    ],
    // Transfer in same currency
    [
      {
        credit: null,
        currency: 'USD',
        transactionType: 'Transferbetweenownaccounts',
        transactionId: 'FT24060TFMQ2',
        debit: 50,
        description: 'Personal Transfer.',
        isCardBlock: false,
        operationDateTime: '2024-02-29 07:23:00',
        stmtEntryId: '205140745526585.000002',
        canRepeat: false,
        canReverse: false,
        amountEquivalent: 133.03,
        operationType: 'Transfer between own accounts',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: false,
        comment: 'Transfer between own accounts',
        date: new Date('2024-02-29 07:23:00'),
        groupKeys: ['FT24060TFMQ2'],
        merchant: null,
        movements: [
          {
            account: { id: '13' },
            fee: 0,
            id: 'FT24060TFMQ2',
            invoice: null,
            sum: -50
          }
        ]
      }
    ],
    // Transfer with currency conversion
    [
      {
        credit: null,
        currency: 'USD',
        transactionType: null,
        transactionId: 'FT24057767GM',
        debit: 61.84,
        description: 'უნაღდო კონვერტაცია',
        isCardBlock: false,
        operationDateTime: '2024-02-26 12:48:00',
        stmtEntryId: '205118014046118.000001',
        canRepeat: false,
        canReverse: false,
        amountEquivalent: 164.06,
        operationType: 'Currency conversion',
        operationTypeId: null
      },
      {
        id: '13',
        type: AccountType.ccard,
        title: 'Card 13',
        instrument: 'USD',
        syncIds: ['13'],
        savings: false,
        balance: 10.00,
        available: 10.00
      },
      {
        hold: false,
        comment: 'Currency conversion',
        date: new Date('2024-02-26 12:48:00'),
        groupKeys: [`conversion_${new Date('2024-02-26 12:48:00').getTime()}`],
        merchant: null,
        movements: [
          {
            account: { id: '13' },
            fee: 0,
            id: 'FT24057767GM',
            invoice: null,
            sum: -61.84
          }
        ]
      }
    ]
  ])('converts outcome', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction as CredoTransaction, account as Account)).toEqual(transaction)
  })
})
