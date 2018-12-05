import { getSignature, parseXml } from './burlap'

describe('getSignature', () => {
  function getBytes (str) {
    return str.split('').map(c => c.charCodeAt(0))
  }

  it('returns valid signature', () => {
    expect(getSignature('2.37.3', `<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>id</string><string>8067f11d-f27a-4fec-a2a2-b44772fb412d</string><string>theme</string><string>GetLoginModeRequest theme</string><string>sendTimestamp</string><long>1530191914049</long><string>correlationId</string><string>-992585096</string><string>timeToLive</string><long>0</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.security.LoginModeMto</type><string>mode</string><string>Pass</string><string>description</string><string>Вход по паролю</string></map><string>properties</string><map><type>java.util.Hashtable</type><string>request_time_to_live</string><long>30000</long><string>request_send_timestamp</string><long>1530191912259</long></map></map>`))
      .toEqual(getBytes('\x00\x00\x03\x05\x06'))
  })

  it('returns valid signature', () => {
    expect(getSignature('2.37.3', `<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>id</string><string>2fa2f4f1-4f99-4bc4-a499-22666e55bb97</string><string>theme</string><string>Default theme</string><string>sendTimestamp</string><long>1530191913628</long><string>correlationId</string><string>-1388223371</string><string>timeToLive</string><long>0</long><string>payload</string><null></null><string>properties</string><map><type>java.util.Hashtable</type><string>request_time_to_live</string><long>30000</long><string>request_send_timestamp</string><long>1530191910664</long></map></map>`))
      .toEqual(getBytes('\x00\x00\x02I\x06'))
  })

  it('returns valid signature', () => {
    expect(getSignature('2.37.3', `<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>correlationId</string><string>-598424790</string><string>id</string><string>711462969</string><string>localCacheId</string><long>0</long><string>sendTimestamp</string><long>1530192194590</long><string>theme</string><string>Default theme</string><string>timeToLive</string><long>30000</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.ActualizeCacheTokensRequest</type></map><string>properties</string><map><type>java.util.Hashtable</type><string>PROTOVERSION</string><string>2.37.3</string><string>USER_ID</string><string>14927997</string><string>APP_VERSION</string><string>9.37.16</string><string>PLATFORM</string><string>ANDROID</string><string>DEVICE_PLATFORM</string><string>ANDROID</string><string>OS</string><string>Android OS 6.0</string><string>APPVERSION</string><string>9.37.16</string><string>DEVICE</string><string>Android SDK built for x86_64</string><string>DEVICEUSERNAME</string><string>android-build</string><string>CLIENT-TOKEN</string><string>2357418989-35085b67-1c38-4ece-b3c2-8f0d5b5420b7</string><string>DEVICE_OS</string><string>Android OS 6.0</string></map></map>`))
      .toEqual(getBytes('\x00\x00\x04\xa8\x06'))
  })

  it('returns valid signature', () => {
    expect(getSignature('2.37.3', `<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>correlationId</string><string>-292412531</string><string>id</string><string>-1388223371</string><string>localCacheId</string><long>0</long><string>sendTimestamp</string><long>1530191910664</long><string>theme</string><string>Default theme</string><string>timeToLive</string><long>30000</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.minervadirect.LogInformationAboutUserRequest</type></map><string>properties</string><map><type>java.util.Hashtable</type><string>PROTOVERSION</string><string>2.37.3</string><string>AF_MOBILE_DEVICE</string><string>{
"TIMESTAMP": "2018-06-28T13:18:07Z",
"HardwareID": "-1",
"SIM_ID": "-1",
"PhoneNumber": "-1",
"DeviceModel": "Android SDK built for x86_64",
"MultitaskingSupported": true,
"DeviceName": "generic_x86_64",
"DeviceSystemName": "Android",
"DeviceSystemVersion": "23",
"Languages": "ru",
"WiFiMacAddress": "02:00:00:00:00:00",
"ScreenSize": "480x800",
"RSA_ApplicationKey": "4F5C14BD49E4EABA74B1BBEA9DE97B2D",
"OS_ID": "e0f03722949836e7",
"SDK_VERSION": "3.6.0",
"Compromised": 1,
"Emulator": 4
}</string><string>AF_DEVICE_PRINT</string><string></string><string>DEVICE_MODEL</string><string>Android SDK built for x86_64</string><string>PLATFORM</string><string>ANDROID</string><string>OS</string><string>Android OS 6.0</string><string>CLIENT-TOKEN</string><string>2357418989-35085b67-1c38-4ece-b3c2-8f0d5b5420b7</string><string>DEVICE_MANUFACTURER</string><string>unknown</string><string>APP_VERSION</string><string>9.37.16</string><string>DEVICE_PLATFORM</string><string>ANDROID</string><string>APPVERSION</string><string>9.37.16</string><string>DEVICE</string><string>Android SDK built for x86_64</string><string>DEVICEUSERNAME</string><string>android-build</string><string>DEVICE_OS</string><string>Android OS 6.0</string></map></map>`))
      .toEqual(getBytes('\x00\x00\x07`\x06'))
  })

  it('returns valid signature', () => {
    expect(getSignature('2.73.3', `<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>correlationId</string><string>-1785672381</string><string>id</string><string>-1445416436</string><string>localCacheId</string><long>0</long><string>sendTimestamp</string><long>1530191909918</long><string>theme</string><string>Default theme</string><string>timeToLive</string><long>30000</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.security.StartSessionRequest</type><string>sessionContext</string><map><type>ru.vtb24.mobilebanking.protocol.security.SessionContextMto</type><string>certificateNumber</string><null></null><string>clientIp</string><string>fe80::5054:ff:fe12:3456%eth0</string><string>outerSessionId</string><string>VTB_TEST_APP</string><string>timeoutDuration</string><null></null><string>userAgent</string><null></null></map></map><string>properties</string><map><type>java.util.Hashtable</type><string>PROTOVERSION</string><string>2.37.3</string><string>AF_MOBILE_DEVICE</string><string>{
"TIMESTAMP": "2018-06-28T13:18:07Z",
"HardwareID": "-1",
"SIM_ID": "-1",
"PhoneNumber": "-1",
"DeviceModel": "Android SDK built for x86_64",
"MultitaskingSupported": true,
"DeviceName": "generic_x86_64",
"DeviceSystemName": "Android",
"DeviceSystemVersion": "23",
"Languages": "ru",
"WiFiMacAddress": "02:00:00:00:00:00",
"ScreenSize": "480x800",
"RSA_ApplicationKey": "4F5C14BD49E4EABA74B1BBEA9DE97B2D",
"OS_ID": "e0f03722949836e7",
"SDK_VERSION": "3.6.0",
"Compromised": 1,
"Emulator": 4
}</string><string>AF_DEVICE_PRINT</string><string></string><string>DEVICE_MODEL</string><string>Android SDK built for x86_64</string><string>DEVICE_MANUFACTURER</string><string>unknown</string><string>APP_VERSION</string><string>9.37.16</string><string>PLATFORM</string><string>ANDROID</string><string>DEVICE_PLATFORM</string><string>ANDROID</string><string>OS</string><string>Android OS 6.0</string><string>APPVERSION</string><string>9.37.16</string><string>DEVICE</string><string>Android SDK built for x86_64</string><string>DEVICEUSERNAME</string><string>android-build</string><string>DEVICE_OS</string><string>Android OS 6.0</string></map></map>`))
      .toEqual(getBytes('\x00\x00\x08j\x06'))
  })
})

describe('parseXml', () => {
  it('parses string', () => {
    expect(parseXml('<string>hello</string>')).toEqual('hello')
  })

  it('parses number', () => {
    expect(parseXml('<long>1234</long>')).toEqual(1234)
  })

  it('parses null', () => {
    expect(parseXml('<null></null>')).toEqual(null)
  })

  it('parses date', () => {
    expect(parseXml('<date>19791210T210000.000Z</date>')).toEqual(new Date('1979-12-10T21:00:00Z'))
  })

  it('parses map', () => {
    expect(parseXml('<map><type>MapType</type></map>')).toEqual({
      __type: 'MapType'
    })
    expect(parseXml('<map><type>MapType</type><string>key</string><string>value</string></map>')).toEqual({
      __type: 'MapType',
      key: 'value'
    })
    expect(parseXml('<map><type>MapType</type><string>key</string><string>value</string><string>map</string><map><type>InnerMap</type><string>innerKey</string><string>innerValue</string></map></map>')).toEqual({
      __type: 'MapType',
      key: 'value',
      map: {
        __type: 'InnerMap',
        innerKey: 'innerValue'
      }
    })
  })

  it('parses reference', () => {
    const object = parseXml('<map><type>MapType</type><string>self</string><ref>0</ref></map>')
    expect(Object.keys(object).length).toBe(2)
    expect(object.__type).toEqual('MapType')
    expect(object.self).toBe(object)
  })

  it('parses complex object', () => {
    expect(parseXml(`<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>id</string><string>2fa2f4f1-4f99-4bc4-a499-22666e55bb97</string><string>theme</string><string>Default theme</string><string>sendTimestamp</string><long>1530191913628</long><string>correlationId</string><string>-1388223371</string><string>timeToLive</string><long>0</long><string>payload</string><null></null><string>properties</string><map><type>java.util.Hashtable</type><string>request_time_to_live</string><long>30000</long><string>request_send_timestamp</string><long>1530191910664</long></map></map>`)).toEqual({
      __type: 'com.mobiletransport.messaging.DefaultMessageImpl',
      id: '2fa2f4f1-4f99-4bc4-a499-22666e55bb97',
      theme: 'Default theme',
      sendTimestamp: 1530191913628,
      correlationId: '-1388223371',
      timeToLive: 0,
      payload: null,
      properties: {
        __type: 'java.util.Hashtable',
        'request_time_to_live': 30000,
        'request_send_timestamp': 1530191910664
      }
    })

    expect(parseXml(`<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>id</string><string>af255651-d412-4ab7-96e3-844780652ab7</string><string>theme</string><string>SonMessagesRequest theme</string><string>sendTimestamp</string><long>1530191975935</long><string>correlationId</string><string>-309335901</string><string>timeToLive</string><long>0</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.son.SonMessagesResponse</type><string>messages</string><list><type></type><length>0</length></list></map><string>properties</string><map><type>java.util.Hashtable</type><string>request_time_to_live</string><long>30000</long><string>request_send_timestamp</string><long>1530191974149</long></map></map>`)).toEqual({
      __type: 'com.mobiletransport.messaging.DefaultMessageImpl',
      id: 'af255651-d412-4ab7-96e3-844780652ab7',
      theme: 'SonMessagesRequest theme',
      sendTimestamp: 1530191975935,
      correlationId: '-309335901',
      timeToLive: 0,
      payload: {
        __type: 'ru.vtb24.mobilebanking.protocol.son.SonMessagesResponse',
        messages: []
      },
      properties: {
        __type: 'java.util.Hashtable',
        'request_time_to_live': 30000,
        'request_send_timestamp': 1530191974149
      }
    })

    expect(parseXml(`<map><type>com.mobiletransport.messaging.DefaultMessageImpl</type><string>id</string><string>dbde2974-76c9-436f-890f-3bfa834d5118</string><string>theme</string><string>Default theme</string><string>sendTimestamp</string><long>1530280627107</long><string>correlationId</string><string>-1388223371</string><string>timeToLive</string><long>0</long><string>payload</string><map><type>ru.vtb24.mobilebanking.protocol.security.SessionInfoMto</type><string>sessionId</string><string>2359583739-d8544647-6204-45c2-9118-dc3432998f6c</string><string>showFirstVisitMaster</string><boolean>0</boolean><string>isRestrictedAccessEnabled</string><boolean>0</boolean><string>authorizationLevel</string><map><type>ru.vtb24.mobilebanking.protocol.security.AuthorizationLevelMto</type><string>id</string><string>ANONYMOUS</string></map><string>role</string><map><type>ru.vtb24.mobilebanking.protocol.security.TelebankRoleMto</type><string>id</string><string>UNDEFINED</string></map><string>authorization</string><null></null><string>userInfo</string><map><type>ru.vtb24.mobilebanking.protocol.UserInfoMto</type><string>id</string><string>2359583739-d8544647-6204-45c2-9118-dc3432998f6c</string><string>unc</string><null></null><string>firstName</string><null></null><string>firstNameLatin</string><null></null><string>lastName</string><null></null><string>lastNameLatin</string><null></null><string>patronymic</string><null></null><string>sex</string><null></null><string>phoneWork</string><null></null><string>phoneMobile</string><null></null><string>email</string><null></null><string>alias</string><null></null><string>teleInfo</string><boolean>0</boolean><string>birthday</string><null></null></map><string>availableAccountingSystems</string><list><type>[string</type><length>1</length><string>All</string></list><string>userSettings</string><null></null><string>sessionHistory</string><null></null><string>lastLogonInChannel</string><null></null></map><string>properties</string><map><type>java.util.Hashtable</type><string>request_time_to_live</string><long>30000</long><string>request_send_timestamp</string><long>1530280626976</long></map></map>`)).toEqual({
      __type: 'com.mobiletransport.messaging.DefaultMessageImpl',
      id: 'dbde2974-76c9-436f-890f-3bfa834d5118',
      theme: 'Default theme',
      sendTimestamp: 1530280627107,
      correlationId: '-1388223371',
      timeToLive: 0,
      payload: {
        __type: 'ru.vtb24.mobilebanking.protocol.security.SessionInfoMto',
        sessionId: '2359583739-d8544647-6204-45c2-9118-dc3432998f6c',
        showFirstVisitMaster: false,
        isRestrictedAccessEnabled: false,
        authorizationLevel: {
          __type: 'ru.vtb24.mobilebanking.protocol.security.AuthorizationLevelMto',
          id: 'ANONYMOUS'
        },
        role: {
          __type: 'ru.vtb24.mobilebanking.protocol.security.TelebankRoleMto',
          id: 'UNDEFINED'
        },
        authorization: null,
        userInfo: {
          __type: 'ru.vtb24.mobilebanking.protocol.UserInfoMto',
          id: '2359583739-d8544647-6204-45c2-9118-dc3432998f6c',
          unc: null,
          firstName: null,
          firstNameLatin: null,
          lastName: null,
          lastNameLatin: null,
          patronymic: null,
          sex: null,
          phoneWork: null,
          phoneMobile: null,
          email: null,
          alias: null,
          teleInfo: false,
          birthday: null
        },
        availableAccountingSystems: [
          'All'
        ],
        userSettings: null,
        sessionHistory: null,
        lastLogonInChannel: null
      },
      properties: {
        __type: 'java.util.Hashtable',
        'request_time_to_live': 30000,
        'request_send_timestamp': 1530280626976
      }
    })
  })
})
