import { getPhoneNumber } from '../api'

describe('getPhoneNumber', () => {
  it('should return valid phone number', () => {
    expect(getPhoneNumber('+71234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('81234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('71234567890')).toEqual('+71234567890')
    expect(getPhoneNumber('1234567890')).toEqual('+71234567890')
  })
})
