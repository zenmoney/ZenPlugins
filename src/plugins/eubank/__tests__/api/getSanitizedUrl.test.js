import { getSanitizedUrl } from '../../api'

describe('getSanitizedUrl', () => {
  it.each([
    [
      'https://my.smartbank.kz/eubn/transactions/card?account=KZ799480008A02824084&page=5&pageSize=20',
      [
        'transactions/',
        '?account=',
        '&page=',
        '&pageSize='
      ],
      'https://my.smartbank.kz/eubn/transactions/String<4>?account=String<20>&page=String<1>&pageSize=String<2>'
    ],
    [
      'https://my.smartbank.kz/eubn/accounts/deposit/get?accountNumber=KZ799480008A02824084',
      [
        'accounts/',
        '/get?accountNumber='
      ],
      'https://my.smartbank.kz/eubn/accounts/String<7>/get?accountNumber=String<20>'
    ],
    [
      'https://my.smartbank.kz/eubn/auth/login/passcode?passcode=3464543&deviceId=dsf2348g-sdfty3-aw122ytr&language=ru',
      [
        'passcode=',
        '&deviceId=',
        '&language=ru'
      ],
      'https://my.smartbank.kz/eubn/auth/login/passcode?passcode=String<7>&deviceId=String<24>&language=ru'
    ],
    [
      'https://my.smartbank.kz/eubn/auth/login/password?language=ru&login=fefdfg&password=sdftwer&deviceId=dwercdgfv234rdsdf',
      [
        'login=',
        '&password=',
        '&deviceId='
      ],
      'https://my.smartbank.kz/eubn/auth/login/password?language=ru&login=String<6>&password=String<7>&deviceId=String<17>'
    ]
  ])('sanitizes url', (url, sanitizingParameters, newUrl) => {
    expect(getSanitizedUrl(url, sanitizingParameters)).toEqual(newUrl)
  })
})
