import { convertStatementV2 } from '../../../converters'
import { DepositStatementV2 } from '../../../models'
import { Account, AccountType } from '../../../../../types/zenmoney'

const depositAccount: Account = {
  id: '822946793',
  type: AccountType.deposit,
  title: 'Family vacation',
  instrument: 'USD',
  syncIds: ['GE69TB7092836615000033'],
  balance: 10000,
  startDate: new Date('2025-12-18T00:00:00.000+04:00'),
  startBalance: 10000,
  capitalization: true,
  percent: 2.25,
  endDateOffsetInterval: 'month',
  endDateOffset: 3,
  payoffInterval: 'month',
  payoffStep: 1
}

it.each([
  [
    'regular deposit',
    {
      movementDate: 1766001600000,
      depositAmount: 1000,
      interestedAmount: 0,
      withdrawnDepositAmount: 0,
      balance: 11000
    },
    {
      hold: false,
      date: new Date(1766001600000),
      movements: [
        {
          id: Buffer.from('822946793:1000:1766001600000').toString('base64'),
          account: {
            id: '822946793'
          },
          sum: 1000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: null
    }
  ],
  [
    'interest payout',
    {
      movementDate: 1766088000000,
      depositAmount: 0,
      interestedAmount: 54.88,
      withdrawnDepositAmount: 0,
      balance: 10054.88
    },
    {
      hold: false,
      date: new Date(1766088000000),
      movements: [
        {
          id: Buffer.from('822946793:54.88:1766088000000').toString('base64'),
          account: {
            id: '822946793'
          },
          sum: 54.88,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Deposit interest'
    }
  ],
  [
    'withdrawal',
    {
      movementDate: 1766174400000,
      depositAmount: 0,
      interestedAmount: 0,
      withdrawnDepositAmount: 500,
      balance: 9554.88
    },
    {
      hold: false,
      date: new Date(1766174400000),
      movements: [
        {
          id: Buffer.from('822946793:-500:1766174400000').toString('base64'),
          account: {
            id: '822946793'
          },
          sum: -500,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Deposit withdrawal'
    }
  ]
])('converts %s statement', (testName: string, statement: DepositStatementV2, expectedTransaction: unknown) => {
  expect(convertStatementV2(statement, depositAccount)).toEqual(expectedTransaction)
})
