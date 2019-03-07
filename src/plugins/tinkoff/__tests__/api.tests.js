import { getPhoneNumber } from '../api'

describe('convertAccounts', () => {
  it('should return valid accounts', () => {
    expect(getPhoneNumber('+71234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('81234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('71234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('1234567890')).toEqual('+71234567890')
  })
})
