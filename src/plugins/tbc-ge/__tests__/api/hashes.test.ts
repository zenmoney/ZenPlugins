import { encryptPasscode, hashPasscodeRequest, hashPassword, hashPasswordRequest, hmacRequest } from '../../utils'
import forge from 'node-forge'

test('hash password', () => {
  const hashed = hashPasswordRequest({
    loginSalt: 'F02CE63986CADE181F3622934EAC236F947677D5',
    loginHashMethod: 'SHA3-512',
    requestSalt: 'N3Q93fgePLHAg0kOCQrrKYL9k8LBMkgos6f2Iz+cXIE='
  }, 'world')
  expect(hashed).toEqual('aj9LjPFG1RB/K399xzs4/3ulNUel/yR0c69LvmcNHN0=')
})

test('hash passcode', () => {
  hashPasscodeRequest('HlOA6TdakwZWLiIj11jFt620PajpdkYY6lIrunKAi5M=', '12345')
})

test('hash password internals', () => {
  const hashed = hashPassword({ salt: 'F02CE63986CADE181F3622934EAC236F947677D5', hashMethod: 'SHA3-512' }, 'world')
  expect(hashed).toEqual('FF96E494A136253940E0DE0A794B25D8079AF0BD0DC9B0DAB5FDCBF79BCD9774D6589768A9ABF21C2C9586EAA487AE452386C7809A11DB7C536FF597DF035205')
})

test('hmac request internals', () => {
  const hmac = hmacRequest('FF96E494A136253940E0DE0A794B25D8079AF0BD0DC9B0DAB5FDCBF79BCD9774D6589768A9ABF21C2C9586EAA487AE452386C7809A11DB7C536FF597DF035205', 'N3Q93fgePLHAg0kOCQrrKYL9k8LBMkgos6f2Iz+cXIE=')
  expect(forge.util.encode64(hmac)).toEqual('aj9LjPFG1RB/K399xzs4/3ulNUel/yR0c69LvmcNHN0=')
})

test('hash passcode internals', () => {
  const salt = 'HlOA6TdakwZWLiIj11jFt620PajpdkYY6lIrunKAi5M='
  const hmacPasscode = hmacRequest('12345', salt)
  expect(forge.util.encode64(hmacPasscode)).toEqual('uNq8+86yHmAmty/PgQywP/8nSICDC3Q9ow+ZPDU/J34=')
  const randomString = forge.util.decode64('i6cTkqFvw9cUbDWw9+BVl/mHbkLntlrqOE+9lMLOoTBGEzQrQG8fIc6ox/DugALAFOFM3351GWhNh0Trs/PC5RVrQFDtYfVBGWyQF25BGNAiu21EAJQOChg+OU/AzwurAxtwfveXi2/TI5ReI+pFEIUPPnWhjqj09LFoxck2lgbtju0R7TpaiWz/LuEw2ux2WJysPG9FuhU1kPxthdYyd4H6Gm3OvG3EqVN0+N3PEZD6/BLT2tQ4s8XZvmMCzZGBWnVMRrU7f4gFxkoiILa1d2YB/PCu')
  const rawPublicKey = forge.asn1.fromDer('\x30\x82\x01\x22\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00\x03\x82\x01\x0f\x00\x30\x82\x01\x0a\x02\x82\x01\x01\x00\xcf\x3a\x33\x36\x14\xac\xf8\x26\x58\x5f\x79\x71\x50\xae\xe1\xbf\x0c\xbf\xa5\x12\x75\x3d\x0b\x63\x58\x26\x26\x5b\xaa\x7b\x21\xde\x4f\x41\x71\x9d\x25\x4f\x7c\xbd\xb7\xf5\x19\xd1\xc0\x1a\x34\x82\x93\xa8\x57\x40\x39\xbf\xd1\x9c\xcf\x6e\x29\x44\x34\x1b\x25\xe3\x86\x1d\x7a\x60\x4d\xd3\x38\xf0\xc3\x06\x30\x6a\xec\x4d\xa3\xc0\xf6\x59\xb5\xdd\x15\x74\x71\x56\x3a\x83\xe5\x7d\x15\x17\x0f\x1c\xb3\x7f\x72\xed\x66\x4f\x0f\x31\xf2\x4c\x9f\xf6\x05\x0e\x64\xe6\xc0\x78\x9c\xee\x5d\x2d\x58\x36\xab\x2f\xb4\x98\x66\xc4\x29\x61\xe4\x69\x8c\x60\x9f\x1d\xee\x4e\xfe\xfe\x92\x9d\xc5\x24\xfc\xab\x87\x4f\x28\x41\x33\x20\x0d\x90\x37\x2d\x7d\x57\x20\x2d\xac\x97\x3c\x9a\xc4\x6a\xd2\x5e\xd6\x03\xd8\xe4\x3e\x17\x68\xa6\x36\x06\x8b\xe4\x86\x04\xcb\xf2\x58\xf7\x6e\x66\x47\x52\xd3\xb5\x32\xf9\x78\x1c\xd1\x57\xe6\xb6\x85\x3f\x94\xbd\x7b\x78\xf4\xcb\xd9\x9f\x21\x2f\xd5\xbd\xbf\x72\x55\xc5\xf6\x3a\x3e\xef\x8d\x84\x67\x63\x72\x99\x54\xf1\x69\x73\x97\x9f\x5a\xc8\x80\xbd\x69\x5b\xd6\x79\x0c\xa6\x0d\x42\x6b\x44\x95\x9c\x4a\xcc\xf5\xfc\x6f\x13\xf9\x85\x02\x03\x01\x00\x01')
  const publicKey = forge.pki.publicKeyFromAsn1(rawPublicKey) as forge.pki.rsa.PublicKey
  const ourEncryptedData = encryptPasscode(hmacPasscode, randomString, publicKey)
  const appEncryptedData = forge.util.decode64('tCLBhohZmIJdIYSlRtAUOLToqHrAd4dhFnqyBVXAklpX318lBu99kebGk+yfl8Uxg05u3c3Y72B+s3k58wvDusSBXl3sWFfWjzSnoTMfo/vYlpt9Cs2ODyZ31psDidOm1YLMlqiJOXVeNYVmLFw8QVBo93IHj+5eHrrHT+Wlb2dIgYqE3TD6UCZNToSTZVouzWbUpueAMvqLGHDa9zhfHNJtgSA2x6LVRnCerE0leVThWiu1l3gicbnnv32x1ERUYeGCtkFtY+cD/zoy7TuzNMW8e2UmmZsMTcBjPSilmy0YXhh4+3z4+GKlbuvzvK3+lqZdoHhvq6E+twl0YNawEg==')
  const privateKey = forge.pki.privateKeyFromPem('-----BEGIN RSA PRIVATE KEY-----\n' +
    'MIIEpAIBAAKCAQEAzzozNhSs+CZYX3lxUK7hvwy/pRJ1PQtjWCYmW6p7Id5PQXGd\n' +
    'JU98vbf1GdHAGjSCk6hXQDm/0ZzPbilENBsl44YdemBN0zjwwwYwauxNo8D2WbXd\n' +
    'FXRxVjqD5X0VFw8cs39y7WZPDzHyTJ/2BQ5k5sB4nO5dLVg2qy+0mGbEKWHkaYxg\n' +
    'nx3uTv7+kp3FJPyrh08oQTMgDZA3LX1XIC2slzyaxGrSXtYD2OQ+F2imNgaL5IYE\n' +
    'y/JY925mR1LTtTL5eBzRV+a2hT+UvXt49MvZnyEv1b2/clXF9jo+742EZ2NymVTx\n' +
    'aXOXn1rIgL1pW9Z5DKYNQmtElZxKzPX8bxP5hQIDAQABAoIBAE4VCfLYu4wNNsNS\n' +
    'ySWzn5ATR6r1V4OW5On0BgQIKrlKQObR3nqOhtwdkpcV96JoIsNsbOPgXqymv2os\n' +
    '1mwjxpUCldzkqK5sCBwUGu5O97o6HRkUc6d/5qytA8HW7blwkkn4Pd/B6ww4r6m7\n' +
    'pEGneNGRuGC5WBab5I2APjYmksdcU9eKYvl5ZY8d0tD+cnQrdBBb/H+dXa0OCN/X\n' +
    'OLOgB11VQuufEM4/aoLt7Ce/XWsG4tpfYcoFDCKIsNoWzyawRuj2wJsDvCRRpBbb\n' +
    'hoa0Znw6a4oAua6ncrZuyX57cO+YraDtVS3AoUgAXptvhmcqwK56RnASYfvcAeFQ\n' +
    'GbtidckCgYEA5oZtthtzN1wdIvrTwqQytvDaULMvBaP4enOei62SaI+kEYzElW8b\n' +
    'gG7PyVIPsaRN4ee2O39SpIAH0rtR1ZIHwlU2rHnqq+MCg6GjBdB4GqB2sgMQxvEX\n' +
    'B9DFGSHHHRi+NgKWWJ2nq9vEuUzdiEfQKcwcKhb7CqgVAC0w+VP/BwcCgYEA5iCt\n' +
    'D3Kj/Ha8Gi4DUtxe93i+j/xiI2LGORv7Rv3ThucZeg1FCJyK1qgsTzm130A2tLbv\n' +
    'tvTEIfHzEye9I5Eq3ffb8ox0re60/J5eYCsJB6kBXlLunfzT00EpwqmVugY0o7kH\n' +
    'Oeg0LjBBavOegdyMv72oNh83ueTsjthky+r07BMCgYEA3LxoHXJXdvELLU2Eq+JS\n' +
    'dX5XbeLF6d7CtW40qIcBpIG2lt919ak4alixOpMLWAx+TwxzILGgTsgRtaWMjLaS\n' +
    'G3FBMxJitUhgRe7mjVC7ULPKNFZfIEAGz4MG2DPR13iz2j/L+vqrbRK5Yr3Jew9Y\n' +
    'sk0xwtPSerfLtCmRtYzKrM0CgYBUinSJVEhCGyyHQZge/K42o7j+FG3JKiRAHrN1\n' +
    'JRJsYMHPQMi3nSq0KRv+Dultlp2CTiJKSCk1fzkZNGQbiN0Cpme69zZ2H1eF5ngt\n' +
    'RCIRGllSWY0npRX8adf5l2tV56m26+Zns5JX1YpyzATTGD7swbPmDhnexObSo1SE\n' +
    'RVCs2QKBgQDQ4klJvaNjBxBoVzzVGKlFAzDIdrgNjf3ORO1JML7nljreYzwumt07\n' +
    'Udbw6z4GWENiaL7/28YlF0e4dSPjxlhOldTBb9J/laWs7BTRR4NLUz9T1RP0L1Cd\n' +
    'LTUVP68gKBNfFwDfdgETkDPJSh5RS6K2P4RC66D23kfWjxqrtgWfeQ==\n' +
    '-----END RSA PRIVATE KEY-----\n') as forge.pki.rsa.PrivateKey
  const appDecrypted = privateKey.decrypt(appEncryptedData, 'RSAES-PKCS1-V1_5')
  const ourDecrypted = privateKey.decrypt(ourEncryptedData, 'RSAES-PKCS1-V1_5')
  expect(ourDecrypted).toEqual(appDecrypted)
})
