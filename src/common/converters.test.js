import { formatCommentFeeLine } from './converters'

describe('formatCommentFeeLine', () => {
  it('should output nothing when there\'s no fee', () => {
    expect(formatCommentFeeLine(0, 'USD'))
      .toEqual(null)
  })
  it('should include fee/cashback when there is one', () => {
    expect(formatCommentFeeLine(-3, 'USD'))
      .toEqual('3.00 USD fee')
    expect(formatCommentFeeLine(3, 'USD'))
      .toEqual('3.00 USD cashback')
  })
})
