# TBC Georgia plugin

This is a plugin for [TBC Bank](https://www.tbcbank.ge/web/ka)

## Login

### Login with password

Send POST request to `https://rmbgwauth.tbconline.ge/v1/auth/loginWithPassword`

Structure:

```json
{
    "username": "username",
    "password": "password",
    "language": "en",
    "deviceInfo": "base64string",
    "deviceData": "base64string",
    "deviceId": "31546aaaa3a20000"
}
```

`password` is in **plain text**

`deviceInfo` is base64 encoded json:

```json
{
    "appVersion": "6.66.3",
    "deviceId": "31546aaaa3a20000",
    "manufacturer": "OnePlus",
    "modelNumber": "ONEPLUS A5000",
    "os": "Android 7.1.1",
    "remembered": true,
    "rooted": false
}
```

`deviceData` is base64 encoded json:

```json
{
    "appVersion": "6.66.3",
    "deviceId": "31546aaaa3a20000",
    "isRemembered": "true",
    "isRooted": "false",
    "manufacturer": "OnePlus",
    "modelNumber": "ONEPLUS A5000",
    "operatingSystem": "Android",
    "operatingSystemVersion": "7.1.1",
    "os": "Android 7.1.1",
    "remembered": true,
    "rooted": false
}
```

Response is

```json
{
    "signatures": [
        {
            "response": null,
            "status": "CHALLENGE",
            "challenge": null,
            "regenerateChallengeCount": null,
            "authenticationAccessToken": null,
            "authenticationCode": null,
            "signer": null,
            "type": "SMS_OTP",
            "authenticationCodeRsaPublicKey": null,
            "id": null,
            "otpId": "NONE"
        }
    ],
    "signature": null,
    "validEmail": false,
    "success": false,
    "passcodeDirty": null,
    "secondPhaseRequired": true,
    "accessToken": null,
    "changePasswordRequired": false,
    "changePasswordSuggested": false,
    "userSelectionRequired": false,
    "transactionId": "xxx-transactionId-xxx",
    "linkedProfiles": null,
    "possibleChallengeRegenTypes": ["SMS_OTP"]
}
```

If `signatures` is not null - you need to enter an SMS code

After receiving the sms code - make POST request to `https://rmbgwauth.tbconline.ge/v1/auth/certifyLogin` using `transactionId` from previous step

```json
{
    "transactionId": "xxx-transactionId-xxx",
    "signature": {
        "response": "1234", //sms code
        "status": "CHALLENGE",
        "type": "SMS_OTP",
        "otpId": "NONE"
    },
    "language": "en"
}
```

You will receive a response

```json
{
    "success": true,
    "signatures": null,
    "transactionId": null,
    "accessToken": null,
    "linkedProfiles": null,
    "changePasswordRequired": false,
    "changePasswordSuggested": false,
    "userSelectionRequired": false,
    "possibleChallengeRegenTypes": null
}
```

And a lot of cookies:

-   .AspNetCore.tbc-customer-identity-rmb-cookies
-   TSxxx
-   TSxxx
-   some random string

### Get user info

Use received cookies and send GET to `https://rmbgwauth.tbconline.ge/v2/usermanagement/userinfo`

Response:

```json
{
    "parameters": {
        "corp2faPreferredCertMethod": "OTP"
    },
    "userDcuId": 17215000,
    "personId": null,
    "sessionId": "553ce000-0000-49b3-0000-08dc2f305473", //remember it
    "firstNameEn": "Name",
    "firstNameGe": "Name",
    "lastNameEn": "Surname",
    "lastNameGe": "Surname",
    "birthday": "631152000000",
    "lastLoginDate": "1708452433000",
    "email": null,
    "mobilePhoneForSms": "599555666",
    "username": "username",
    "mfaType": "2FA",
    "clientNameEn": "Name Surname",
    "clientNameGe": "სახელი გვარი",
    "clientSegment": "1",
    "externalClientId": "some numbers",
    "securityLevel": "MEDIUM",
    "resident": false,
    "isChecker": false,
    "isAdmin": false,
    "hasLinkForContextSwitch": false,
    "digitalUser": false,
    "signingRuleOperations": [],
    "showTrustedDevicePopup": true,
    "suggestExchangeRateEnabled": true,
    "preferredCertificationMethod": "OTP",
    "securityDevices": ["SMS_OTP"],
    "signingRoleCode": null,
    "operationTypes": [
        "3.46.01.00-02",
        "3.46.01.02-01",
        "3.46.01.03-01",
        ...
    ]
}
```

### Trust the device

First, you need to register a device via POST `https://rmbgwauth.tbconline.ge/v1/auth/registerDevice`

```json
{
    "deviceName": "Android ONEPLUS A5000 OnePlus OnePlus5",
    "passcode": "12345", // save it
    "deviceId": "31546aaaa3a20000",
    "passcodeType": "NUMERIC_PASSCODE"
}
```

and receive

```json
{
    "success": true,
    "registrationId": "6d400fd9db3342e000ca689e000f67ee" // save it also
}
```

After registering you need to trust it to stop entering sms codes every time

Get [Get user info](#get-user-info) and use `sessionId`

Send POST to `https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order`

```json
{
  "deviceId": "31546aaaa3a20000",
  "orderType": "Set",
  "sessionId": "553ce000-0000-49b3-0000-08dc2f305473"
}
```

Response

```json
{
  "orderId": 12345,
  "authorizationMethod": "SMS"
}
```

We need to enter an sms one last time and send it with POST to `https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order/confirm`

```json
{
  "orderId": 12345,
  "authorizationCode": "received sms code",
  "orderType": "Set"
}
```

Response:

```json
{
  "trustId": "trustId", //save it
  "deviceId": "31546aaaa3a20000"
}
```

### Easy login

After all that you can use `https://rmbgwauth.tbconline.ge/v1/auth/easyLogin` to enter with passcode that was set whe registering a device

```json
{
  "userName": "username",
  "passcode": "12345",
  "registrationId": "6d400fd9db3342e000ca689e000f67ee",
  "deviceInfo": "same as in Login with password",
  "deviceData": "same as in Login with password",
  "passcodeType": "NUMERIC_PASSCODE",
  "language": "en",
  "deviceId": "31546aaaa3a20000",
  "trustedDeviceId": "trustId" // skip this to receive an sms code
}
```
