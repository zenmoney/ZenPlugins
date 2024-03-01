import { convertTransaction } from '../../../converters'
import { depositGEL } from '../../../common-tests/accounts'

describe('convertTransaction', () => {
  it.each([
    [
      {
        movementDate: 1665172800000,
        depositAmount: 0,
        interestedAmount: 0,
        withdrawnDepositAmount: 0,
        balance: 0
      },
      null
    ]
  ])('convert inner In transactions', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, depositGEL)).toEqual(transaction)
  })
})
