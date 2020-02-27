export class Constants {
  static get bankBaseUrl () {
    return 'https://api.tinkoff.ru/v1'
  }

  static get investingBaseUrl () {
    return 'https://api.tinkoff.ru/trading'
  }

  static get defaultGetParameters () {
    return {
      appVersion: '5.1.6',
      origin: 'mobile,ib5,loyalty,platform',
      platform: 'ios',
      cpswc: true,
      ccc: true
    }
  }

  static get userAgent () {
    return 'Zenmoney/iOS(13.3.1)/TCSMB/5.1.6(516002)'
  }
}
