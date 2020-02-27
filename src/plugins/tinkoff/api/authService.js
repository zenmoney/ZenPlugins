import { AuthSession } from '../models/authSession'
import { DeviceInfoService } from '../utilities/deviceInfoService'
import { login as legacyLogin } from '../legacyApi'

export class AuthService {
  async getSession (preferences, isInBackground) {
    // TODO: Переписать legacy
    const deviceInfoService = new DeviceInfoService()
    const pinHash = deviceInfoService.pinHash
    const auth = await legacyLogin(preferences, isInBackground, { pinHash: pinHash })

    return new AuthSession(auth.sessionid)
  }
}
