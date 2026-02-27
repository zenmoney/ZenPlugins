# BasisBank Plugin (User Flow)

## What This Plugin Uses
- BasisBank user internet-banking flow at `https://www.bankonline.ge`
- Session cookies persisted through ZenMoney cookie storage
- Card/account endpoints used by the web cabinet:
  - `GET/POST /Login.aspx`
  - `GET/POST /Balance.aspx`
  - `POST /Handlers/BToolkit.ashx?Action=GetSessionId&Type=Login|DeviceBinding`
  - `POST /Handlers/SendSms.ashx?Module=BankOnlineTransfer`
  - `POST /Handlers/CardModule.ashx?funq=checksession|getcardlist|getlasttransactionlist`

## Preferences
- `login`: internet-banking login
- `password`: internet-banking password
- `requestSmsCode` (default `true`): trigger bank SMS endpoint before OTP prompt
- `trustDevice` (default `true`): attempt trusted-device confirmation when bank requests it
- `startDate`: initial sync date

## Authentication Behavior
- Plugin restores saved cookies first.
- If session is dead, plugin performs login flow and OTP confirmation.
- If trusted-device popup flow is presented, plugin can complete it using OTP and then persist updated cookies.

## Known Limits
- Flow depends on current bank web behavior and endpoint contracts.
- If bank changes markup/hidden fields, login flow may need parser updates.
- If OTP is required and code is not entered in time, synchronization fails with OTP error.
