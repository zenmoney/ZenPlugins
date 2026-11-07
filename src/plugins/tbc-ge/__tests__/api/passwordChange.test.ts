import { assertPasswordChangeNotRequired } from '../../api'
import { PasswordExpiredError } from '../../../../errors'

describe('assertPasswordChangeNotRequired', () => {
  it('throws PasswordExpiredError when a password change is required and no session was issued', () => {
    expect(() => assertPasswordChangeNotRequired({ changePasswordRequired: true }, [])).toThrow(PasswordExpiredError)
  })

  it('passes when a session was issued despite the flag', () => {
    expect(() => assertPasswordChangeNotRequired({ changePasswordRequired: true }, ['JSESSIONID=abc'])).not.toThrow()
  })

  it('passes when no password change is required', () => {
    expect(() => assertPasswordChangeNotRequired({ changePasswordRequired: false }, [])).not.toThrow()
  })
})
