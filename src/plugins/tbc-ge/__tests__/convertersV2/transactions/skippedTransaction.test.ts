import { convertStatementV2 } from '../../../converters'
import { depositGEL } from '../../../common-tests/accountsV2'

describe('convertTransaction', () => {
  it.each([
    [
      {
        movementDate: 1766000000000,
        depositAmount: 0,
        interestedAmount: 0,
        withdrawnDepositAmount: 0,
        balance: 0
      },
      null
    ]
  ])('convert skipped transactions', (apiTransaction, transaction) => {
    expect(convertStatementV2(apiTransaction, depositGEL)).toEqual(transaction)
  })
})
