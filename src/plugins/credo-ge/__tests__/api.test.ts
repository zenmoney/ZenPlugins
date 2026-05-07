import { login } from '../api'
import { Preferences, Auth } from '../models'

describe('login', () => {
  it('should handle undefined accessToken gracefully', async () => {
    const preferences: Preferences = { login: 'user', password: 'pwd' }
    const auth: Auth = { accessToken: '' } // This mimics ZenMoney.getData('auth') returning {}

    // We expect it to NOT throw TypeError and instead proceed to authInitiate
    // which will fail because we are not in ZenMoney environment or no network,
    // but the point is it shouldn't fail at parseJwt.

    try {
      await login(preferences, auth)
    } catch (e: any) {
      // It will likely fail at fetchJson inside authInitiate
      expect(e.message).not.toContain("Cannot read properties of undefined (reading 'split')")
    }
  })

  it('should handle missing accessToken gracefully', async () => {
    const preferences: Preferences = { login: 'user', password: 'pwd' }
    const auth: Auth = { accessToken: undefined as any }

    try {
      await login(preferences, auth)
    } catch (e: any) {
      expect(e.message).not.toContain("Cannot read properties of undefined (reading 'split')")
    }
  })
})
