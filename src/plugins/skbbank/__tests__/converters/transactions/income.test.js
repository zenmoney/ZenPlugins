import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  xit.each([
    []
  ])('should convert income', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
