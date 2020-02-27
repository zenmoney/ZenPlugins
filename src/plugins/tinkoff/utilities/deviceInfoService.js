import { MD5 } from 'jshashes'

const md5 = new MD5()

export class DeviceInfoService {
  get deviceId () {
    let deviceId = ZenMoney.getData('device_id')
    if (!deviceId) {
      deviceId = md5.hex(Math.random().toString())
      ZenMoney.setData('device_id', deviceId)
    }

    return deviceId
  }

  get pinHash () {
    // this.generatePinIfRequired()

    return ZenMoney.getData('pinHash', null)
  }

  get pinTime () {
    return ZenMoney.getData('pinHashTime')
  }

  get initialized () {
    // Флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
    return ZenMoney.getData('initialized', false)
  }

  set initialized (initialized) {
    ZenMoney.setData('initialized', true)
    ZenMoney.saveData()
  }

  generatePinIfRequired () {
    if (ZenMoney.getData('pinHash')) {
      return
    }

    const pinHash = md5.hex(Math.random())
    ZenMoney.setData('pinHash', pinHash)
    ZenMoney.saveData()
  }

  setCurrentPinTime () {
    this.generatePinIfRequired()

    const dt = new Date()
    const dtOffset = dt.getTimezoneOffset() * 60 * 1000
    const pinTime = dt.getTime() - dtOffset + 3 * 60 * 1000 // по Москве
    ZenMoney.setData('pinHashTime', pinTime)
    ZenMoney.saveData()
  }

  resetPin () {
    ZenMoney.setData('pinHash', null)
    ZenMoney.setData('pinHashTime', null)
    ZenMoney.saveData()
  }
}
