import { parseBody } from '../../api'

describe('parseBody', () => {
  it.each([
    [ // GetUserLoginInfo
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAG2Q0WrCMBSG732KkPsZO9hdGsHBxlhBmewBQnPswtJzJCdaH982VbTiXfKf7w/fiV6e2iCOENkTlrKYL6QArMl5bErZeXTU8Uvx+lbIpZnpH+A9IYOZCaG3gA7iF+5ouOaAh2eGRHhXSqkyp6ag3iabDrwKVP9fizkx6++eHY9jbwrqjY22hdTLXnqfkH4ZYkWNx5tHP+g96wOs44ePnPLY7Gxg0OrJ5FraWOaOoqsAm/RnFlo9JI/gO7X7AKcKjhDu8Uk+mqpnqkPjtlF2u/zuGY4QxR6XAQAA</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            GetUserLoginInfo: {
              PasswordComplexLevel: '0',
              PasswordLength: '0',
              RescueOrFirstLogin: 'false'
            }
          },
          SenderInfo: {
            SessionInfo: {
              id: ''
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // UserGetAuthType
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAF2Pyw6CMBBF935F070C4iMmpQYTF0ajBtCtaWTURtoaCqJ/b3n4wN3MydwzM2T6EAm6Q6q5kh52ejZGII8q5vLs4YLLWBW66/SHDp7SDglA35TUQDsIkRBkDOlCnlTZVkCXmpIgHhvbyLXHA9cdYKsKWO0ECTOW5XqWqOP1bagI3SzNbF3WufYg2bKUCcjM1U3Oz7NL9LwB3S+CaOevDtFmOV8T68MbvdABCMal+S7iAujENvJ/WK38XUGs798vUH8xjzEBAAA=</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            AuthType: 'VIRTUAL_TOKEN',
            SmsRemainingTime: '90'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163074334'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // UserWithCertificates
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>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</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            Certificate: {
              AccountTransferToCard: 'false',
              AppUpdateDesirable: 'false',
              AppUpdateReason: null,
              AutoQueryLimitsEnabled: 'YES',
              AvatarVersion: null,
              BankContactInfo: {
                BankName: 'bank',
                Email: 'otpsmart@otpbank.com.ua',
                Enabled: '0',
                Phone: '+38 044 459 05 05',
                Phone2: null,
                Skype: null,
                url: 'https://www.otpbank.com.ua'
              },
              BankDay: '24-09-2020',
              BirthDate: '01-01-1990',
              BitSettings: '1336704787',
              BranchDesc: 'АТ "ОТП БАНК"',
              BranchId: '300528',
              CaUserSerialNumber: null,
              CanChangeTransportSMStoPUSH: 'true',
              CanMakePaymentFromExternalCard: 'true',
              CanWorkWithBankID: 'true',
              CanWorkWithExternalCard: 'true',
              CanWorkWithSOFToken: 'NO',
              CardRefreshStateEnabled: 'false',
              CardsGetbalanceShowAlert: 'NO',
              CertAuthorityType: null,
              CertIsBlocked: 'false',
              CertificateExist: '0',
              CurrencyBuySellEnabled: 'true',
              CurrencyConvertEnabled: 'false',
              CurrencyExchangeOrderEnabled: 'false',
              DepositOrderEnabled: 'false',
              DisabledPasswords: null,
              EarlyOtpConfirmation: 'VIRTUAL_TOKEN',
              FirstName: 'NIKOLAY',
              FormIsTotallyCompleted: 'false',
              GlobalVars: {
                DOCCRVALUEDATEVALIDPERIOD: '10',
                DOCCRVALUEDATEVALID_CUR: '30',
                DOCUMENTDATEPERIOD: '30',
                DOCUMENTDATEPERIOD_CUR: '29'
              },
              HomePhone: '--',
              InMessages: '1',
              IsCreateDocumentsWithoutSignEnabled: 'true',
              IsLegal: '0',
              IsLoyaltyProgramEnabled: 'false',
              IsMobileLiteModeEnabled: 'false',
              IsOpenDepositNonResidentEnabled: 'YES',
              IsResident: 'true',
              IsSOFTokenEnabled: 'NO',
              IsStopListCardCreditAllowed: 'true',
              KeyTransferMode: '0',
              KeyType: null,
              LastLoginDate: '24-09-2020 11:49:06',
              LastName: 'NIKOLAEV',
              LoanRequestEnabled: 'false',
              MaxPasswordLength: '255',
              MaxSessionHours: '500',
              MessageContragentRequired: 'true',
              MiddleName: 'NIKOLAEV',
              MinPasswordLength: '8',
              MobilePhone: '380-501234567',
              MoneyboxEnabled: 'false',
              MultikeysSMEEnabled: 'false',
              NeedOnlineBalance: 'YES',
              NeedShowSimplifiedAuthorizationAlert: 'false',
              NewInMessages: '0',
              NotificationDevice: '886fd6179872a4fffd5337cbf0e2dbc7',
              OtpConfirmationSkipUnsigned: 'false',
              OutMessages: '0',
              PasswordExpiresIn: null,
              PfEnabled: 'NO',
              PreferedPhone: '--',
              PrivateKeyPasswordUseBiometrics: 'false',
              QRPaymentAvailable: 'false',
              ReportEmail: 'nikolay.nikolaev@example.com',
              ServerTime: '11:50:38',
              ShowCorrCardMaskBothEnabled: 'false',
              SimplifyInternalTransfer: 'true',
              TableListPeriodInDays: '180',
              TaxId: '1234567890',
              TransferToCard: 'card',
              TransferToCardOfOtherClient: 'YES',
              TransferToForeignCurrAccAndCardEnabled: 'YES',
              TransportCert: null,
              TransportSMStoPUSH: 'true',
              UserCert: null,
              UserCertId: null,
              UserCertIdLocal: null,
              UserId: '1010110',
              UserIdentifier: '1846036',
              UserPhoneMask: '380501234567',
              VerifyPasswordAnonymity: 'NO',
              VerifyPasswordSimplicity: 'NO',
              Win32UserSettings: {
                CanCheckIdentifyCode8: 'True',
                CanEditNDS: '0',
                CanSendRejectedDocument: 'False',
                CheckChangePasswDBMonthInterval: '60',
                ComplexPasswRules: 'True',
                ComplexPasswRulesLevel: '2',
                ComplexPasswRulesLevelFiz: '0',
                FXConvAutoCalcAmount: 'True',
                FXDisableChangeUrgency: 'False',
                FxBuyNoUsedPF: 'False',
                FxCanAccDiffContr: 'False',
                FxCanChangeFeeType: 'True',
                FxCommissionType: 'False',
                FxDisableAgrRate: 'False',
                FxEqualContracts: '1',
                FxSWIFTNeedBIC: 'True',
                FxSwiftValueDate: 'False',
                NeedMsgContragent: 'True',
                ProductCodesForPensionerAndSocialAccounts: null,
                SelectOnlyOpenAccounts: 'False'
              },
              WorkPhone: '--',
              iFOBSEncoding: 'Cp1251',
              iFOBSVersion: '2.2.0.6.6',
              systemsettings: {
                MaxPswLen: '255',
                MinPswLen: '8'
              },
              usersettings: {
                CDActionRepPerPage: '20',
                CDLang: 'ru',
                CDLoginsHistPerPage: '20',
                CDOperTimeBranchId: null,
                CDRecordsPerPage: '20',
                CDTimeToLogOff: '10',
                CDUpbsRegionId: '0',
                ChangeTransportSMStoPUSH: '1',
                CreateDocumentsWithoutSign: '1',
                PushNotificationsTTL: '672',
                ShowActiveCards: '1',
                ShowActiveDeposits: '1',
                SimplifiedAuthorizationOnly: 'OFF'
              }
            }
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // UserWebSettings
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAIVUXVPiMBR991cwvK+lZdFxptYRBAfXXRCWRX1h0uTWZkmTTpLS4q/flLZIsaxvcM/HTU5ur3uTRay1Aamo4Ndt+7zTbgHHglD+dt1OKSciVd9sp2e3b7wzdwYqFlyBd9ZquXPgBOSYByL/uyuo3CavtCgxbhfdzmXv0r5oWzuBVVe4c410ovpM4HXlsKt4kx+GW/wsdHWiO0USRaDNqStdKNIxR1jTDQyQJMrTMgEj/FT/zL+DWCiqmyR7qKGLBJIjAWLquFEJFaIpUioVkgyzmEqkTT5TkFQQq8H0FmOR8GbXPVbKthyHUnD6Dkvw56C1ebH9HZrBUwfy7O+u1VAu+ZQbh0U85MhnQMoWx9WCOwkCkAvJPIsGwlcDRoHriY4tM0acCUSUNU18RvFKmSeFyKArEaxQcbeViIGbk57HJHCtvddHTrvSIAS87ovs4L3q9YI/zKcYyN7l0WGR7zy8PzlZ/LrsdX53Z+mjM9sQp6d8Z7TG26snsnxQaPkrwN1ZSO7/6Jz37FxFz87o74tzZft8FvjdPvMjlrxue+nr/cu1ax13KvqXszOJoUizjN8gY74RbGPuOUo4UfVYm7FKOYOYmYRUmAdXFzZClc58L5oitqQ6JBKliB295Sm40g9EZNw1nDI4jVcOH8hC1b7QBqDIzzoRoDvKhhkOEX+DEX2vn6MRKlRjNQ2FFlO0/ZxdM1ZO/wHyE2W3WiO8y3huPi7P7pj0/suoupulYAb+TuAkh1R+bZEYyhs/PsvXzNKT9xFfl43vqIoZ2joXTq9cFNUO+Yq2W7CHCzWfpWrL/wNe3iY+HwYAAA==</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            DepositOperations: {
              CompleteWithdrawalEnabled: 'true',
              InvolvingFundsEnabled: 'true',
              PartialWithdrawalEnabled: 'true',
              ReplenishmentEnabled: 'true',
              WithdrawalUseCards: 'true'
            },
            EncodedOfferUrl: 'L2lmb2JzQ2xpZW50T3RwL2Rvd25sb2Fkcy9QdWJsaWNfc3RhdGVtZW50X29mX2FjY291bnRfb3BlbmluZy5wZGY=',
            FxExchangeFizEnabled: 'true',
            InBankPaymentDisplay2625Account: 'false',
            IsCreateDocumentsWithoutSignEnabled: 'true',
            IsPhotoPaymentEnabled: 'true',
            OfferUrl: '/ifobsClientOtp/downloads/Public_statement_of_account_opening.pdf',
            PasswordExpiration: '14',
            PasswordExpirationPeriod: null,
            PhotoPaymentMaxAttachmentSize: '10',
            PinSetUpEnabled: 'true',
            ShowInactiveAccounts: 'false',
            ShowInactiveCards: 'true',
            ShowInactiveCredits: 'false',
            ShowInactiveDeposits: 'true',
            ShowOfferCheckBox: 'true',
            SynchronizeWebSettings: 'true'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    // [ // UserClientContragentList
    //   '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAACE3WTQU/bMBiG7/wKK3dmp2nSIBmjQtFUMdqKICSOXuKCtWCjOAz4d3BlGiDET6CiAoG2HbbrnDhuMNNOtZ/veT/HyVe8dnaUg6+sUFyKVc//gDzARCozLg5WvVMuMnmqlv1O6HtrZAnvMHUshWJkCQCcMJGxYiimstrWQFVtKgJ4prtFAeqFPT/yYB2AbgInJS1P1Hou0y+2Q03IeEu7ZmlyrogntKBHrNRP3eQ2pCgLesBEaYBG6wUV6eEwIwFCYSfGcAFcY8BUSi7ugHd9dwMuL75feVatK1ZuT9Ad/LgboSDC0KGteqLpuSYx6laO3VrhYy4/03wj53UOLvju+THTWohhs3pbSEb6yuT+262pmu1bwdTnj/M/s59PrzPwPP/9uvxj9jh/mL38MiE3Q8+qq3SCbhj14hWklZrYujlhNNwaf+rvA/O7uac/htPlP5Lj9LOs0KNB+oPBzmaSYGiBFcbTKU85zf8R3xdsYHIoBSNBjELUXABDw6wxVNuUC6Jv1awWUar0DBdlwgrO9FF9nXTRe3Mkm7fUmiM78tCdvMpoRxPD9v/yF8uR+YJpAwAA</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
    //   {
    //     Response: {
    //       Parameters: {
    //         Contragent: {
    //           Address: 'ADDRESS',
    //           BranchDesc: 'АТ "ОТП БАНК"',
    //           BranchId: '300528',
    //           ContragentId: '1846036',
    //           CountryId: '804',
    //           GlobalClientId: null,
    //           IsMain: '0',
    //           Name: 'NIKOLAY NIKOLAEV',
    //           OfficialAddress: 'ADDRESS',
    //           PassportNo: '123456',
    //           PassportSeries: 'AA',
    //           Phone: '380501234567',
    //           SName: 'NIKOLAY NIKOLAEV',
    //           TaxId: '1234567890',
    //           TypeId: '5',
    //           TypeName: 'Ôèçè÷åñêîå ëèöî-ðåçèäåíò',
    //           TypeSName: 'ÔËÐ'
    //         }
    //       },
    //       SenderInfo: {
    //         SessionInfo: {
    //           id: '163075716'
    //         }
    //       },
    //       StatusBlock: {
    //         Status: 'OK'
    //       }
    //     }
    //   }
    // ],
    // [ // GetCurrencyExchangePairs
    //   '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAMWawVOCUBDG7/4VDPdCatQL4qhplk0xEjPVjRFqmBQa0Kz/PnhKStPhO3xv9iYr7/1g2f3e8hZn8LVeGZ9xXiRZ2jft87ZpxOkyi5L0rW/ukjTKdsWZfdGxzYHbchZx8ZGlRey2DMPx4zSK85v0NasOlaGopqksRhKVs3Uv271Oz+6alhpgNUc4/ibcbIvRKlu+1zMoi/swL8/d/9yPa57oeGEeruNNedWHceNtnpeX/e2FSW37Y62NpXmaZ+v6LzcYzhyrYTme+Jj9GsfDK8c6Oa4R1n8MKng2FQK/zGXAk2AhA74eeTLgWSD0jG+9Zxmwd3cvA14EIxmwPxFKp8AXUq6nYUAGKxGWEBAQrBwjAqY/Y7XsiLgaA/O1GgTzBQQEawguEMwPrqq0EAkuDKzB1SCY7mrlQ4nyFgXTy1sUTC9vQTBfuUAwv9gDwfxiDwTztRoE84s9EMxXLhQspVz8KlMlqIRygWD+sgiC+XkMgvl5DIL56YSC6emk9hgk7hgF0+9YrXcS6QSC+a5GwXRXK2WQcDUI5tdcIJivXCCYH1womB5cyocS6zEI5kc1COZHNQjmFwIgmB/VKJge1eoVQSK4QDDf1SiYv1/tQ5uoGlp8IJjf4gPB/BYfBtbQ4sPAGlp8GFhDiw8Da2jxYWANLT4MrKHFh4E1tPgwMF+rQTB/80XNKCEgIJjvahSML4tN2+ETmtNPZhzr+B3PD0FDe5MBJAAA</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
    //   {
    //     Response: {
    //       Parameters: {
    //         CurrencyPairs: {
    //           CurrencyPair: [
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'CAD'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'CHF'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'CZK'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'HUF'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'JPY'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'PLN'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'SEK'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'UAH',
    //               ToCurrency: 'XAU'
    //             },
    //             {
    //               FromCurrency: 'CAD',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'CAD',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'CAD',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'CHF',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'CHF',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'CHF',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'CHF',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'CHF',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'CZK',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'CZK',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'CZK',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'CAD'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'CHF'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'CZK'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'JPY'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'PLN'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'SEK'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'EUR',
    //               ToCurrency: 'XAU'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'CHF'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'PLN'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'GBP',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'HUF',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'HUF',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'JPY',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'JPY',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'JPY',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'PLN',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'PLN',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'PLN',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'PLN',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'PLN',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'CHF'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'PLN'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'RUB',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'SEK',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'SEK',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'SEK',
    //               ToCurrency: 'USD'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'CAD'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'CHF'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'CZK'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'GBP'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'HUF'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'JPY'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'PLN'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'RUB'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'SEK'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'USD',
    //               ToCurrency: 'XAU'
    //             },
    //             {
    //               FromCurrency: 'XAU',
    //               ToCurrency: 'EUR'
    //             },
    //             {
    //               FromCurrency: 'XAU',
    //               ToCurrency: 'UAH'
    //             },
    //             {
    //               FromCurrency: 'XAU',
    //               ToCurrency: 'USD'
    //             }
    //           ]
    //         }
    //       },
    //       SenderInfo: {
    //         SessionInfo: {
    //           id: '163075716'
    //         }
    //       },
    //       StatusBlock: {
    //         Status: 'OK'
    //       }
    //     }
    //   }
    // ],
    [ // DealList DEBIT
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAACE+1ZzW7jNhC+5ykE3x1R/zag1cKxHayxjh3E3hQ9cq1JolaiDIqO432lPkIv22uBtsA+UUn9Uo60sQNskaDJJeLMN/Rw5uPoS+y+f4hC5R5oEsTkXUc7RR0FyCr2A3L7rrMNiB9vk66mW1rnvXfiXkGyjkkC3omiuAsgPtAJuYnFMjUkYhthUQKf72YbyLEcze6oaYBaj3AXDLNNchbGq1+LHVKLN//IsdljFlcHupeY4ggYzzqPOw9owpYPE9/TXLVaZM4pzpeGq5bPmWuIyTAmLCAb8G5wmICryqYMtHwYxhvCRHjxmDkGq5VYjYDhIMxT4eYzHGKygtIgUgD/Fqinm6d9nSeRrSr34J5vgD+HoErGSxr/AisGfg5Hpwi56r61ws95F32Kb9g0iAKWw/eMFfpDHPqDKD1MhpQMFeoivgdfTmqwYhscBl/AXwZRla6r7h/aXe7W4I3Gl/PFZMkLJ1aFa74lQGe8g95s8nE+HfysZL/H1zzh0legcyIMhsvJ9VjmRdEDzjrv/NN06qr5okwhJ0TVcNEdyvO8E2xAyNJ7PPPCUEeMIFl5X78pnb+//aP88fWvPzsFNPWcVF3yNyuWZjzE0RoHt0TxYR0nAVO2AbtTbihA+sT7sMWhgomvUFiHQILkLgLClHjN+LVRfsvSDzgPlCgmsPs9bXe5fXnkW76jCBRFFQfpc2buGwvwCHDIl5ZtIY3D8mWtE0uc1kk3TMt2en2UNyEzF8jhhlI+GHbep8EHfkmKlfwxIsmKEddBehKP0Q2/VcWqwqcVkplVHGCEGXia1dW0ro60vnS01CMRfg3kEbg0Vrgx8YVFpvGE8OEBCbsSSOvUctWapSGrWexNzlQN9fq9vlrLahbL+BDTCHyPF7F4lC9POi+GIeYkzcdNzdYMncX15M8BJmeDGe9Er5+RGIkf3daRY1qW6eimyadMAZMnSkBWwZoz4IDwOrjaZBhTKkxqvRMUCw5LRxBQCj7vccaAfCH7R/C5dGfPsvcKCGyLMmWL6hPVpo8UlckLx5vSUI/KKRUF7y6BrvKbI8bFnuVEymiNd+kdAxqlvguR2b6xoeDtWTVAqvgZPDBu5wXyC35mhDe7GuKE1znN2jD1XS6zHKuJb2SRdXuNf/KOi02UBzU4WqN+yoeeuA/pO6bdfyKRAodlc5vubHstHyPqtC3ttdcsEByynXz/L2JRk9prb8NiPorDmNyexzQfXqLZXC2cwQKYN5vz4z2Jqh9Two+JeP376TYtrvJVW5ud5QSpqZDjpUnWoDdl8gxlMpzOF+PF8cpE/++UiZhNdVUS5HwXUiSbAQrvBVAl4oegAdspPr8JhwkQWztAf5g2cl6P/kDmEfpDBrfrDw/pXWTlU7uwtUgSDR2oSRxkqAhpds98MaJEt/ZUBRIj2nb6mnWIKEFGLdxAOg/XbaQ5xtOi5KmPL3GHapfij8I28ZL7f4x62SvcAeoFHaVexs9QLy39OEK9qE9JE/QcaYJenjSR23ewNPGaKNvY+Tbd4mlidrS731TNm6r5garG+D+pGkdHxitSNbp9hKqRwd9RNbrZ5cLmMFWjH/x/Fg1pmvZiJI3Z29MkTvoONHXR/KclzXfDD5A0PVnSGI7RN3k8f9KFon5NkuZR4V6IpGnsx5ukqQsWQTyrIJ59jKRpouybpEm/2ZK/yRLULb5e+xchhu5XmBsAAA==</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            AccountDetails: [
              {
                Access: 'FULL',
                AgreementTypeId: '393',
                Balances: {
                  ActualizedTime: null,
                  Available: null,
                  HoldAmount: '0.00',
                  Ledger: '24.92',
                  Moved: null,
                  OverdraftLimit: '0.00',
                  ProjectedLedger: '0.00'
                },
                BranchDesc: 'АТ "ОТП БАНК"',
                BranchId: '300528',
                Currency: 'UAH',
                DealId: '565013',
                DealName: null,
                Deposit: {
                  AccountClass: 'false',
                  AccountClassNote: null,
                  AccruedInterestSum: '0.03',
                  AccruedInterestWithdrawed: '0.00',
                  AgreementDate: '15-11-2019',
                  AgreementNo: 'IB/108989/19',
                  Alarmed: '0',
                  AutoProlongForDepositTypeCanBeSet: 'NO',
                  CorrAccountNo: null,
                  CorrIBAN: null,
                  DealAutoProlongEnabled: 'NO',
                  DealOperation: null,
                  EndDate: null,
                  FeeAccountNo: '26207455472442',
                  FeeIBAN: 'UA893005280000026207455472442',
                  InterestAccountNo: '26207455472442',
                  InterestRate: '5.5',
                  NextAccruedInterestDate: '14-10-2020',
                  NextPaymentAmount: '0.03',
                  OpenDate: '15-11-2019',
                  Operations: {
                    Credit: 'true',
                    Debit: 'true',
                    Renew: 'false'
                  },
                  PayPercentType: '1',
                  PenaltyInterestRateMoment: null,
                  PrincipalAccountNo: '26207455472442',
                  PrincipalIBAN: 'UA893005280000026207455472442',
                  RepaymentTermType: 'M'
                },
                OwnerName: 'NIKOLAY NIKOLAEV',
                OwnerTaxId: '1234567890',
                ProductName: 'Campaign deposit with free withdrawal and replenishment option «Accessible money»',
                Status: 'ACTIVE',
                TxId: '1',
                Type: 'DEPOSIT',
                Visible: 'true'
              },
              {
                Access: 'FULL',
                AgreementTypeId: '61',
                Balances: {
                  ActualizedTime: null,
                  Available: null,
                  HoldAmount: '0.00',
                  Ledger: '0.00',
                  Moved: null,
                  OverdraftLimit: '0.00',
                  ProjectedLedger: '0.00'
                },
                BranchDesc: 'АТ "ОТП БАНК"',
                BranchId: '300528',
                Currency: 'UAH',
                DealId: '564607',
                DealName: null,
                Deposit: {
                  AccountClass: 'false',
                  AccountClassNote: null,
                  AccruedInterestSum: '0.00',
                  AccruedInterestWithdrawed: '0.00',
                  AgreementDate: '04-11-2019',
                  AgreementNo: '703/001684/19',
                  Alarmed: '0',
                  AutoProlongForDepositTypeCanBeSet: 'NO',
                  CorrAccountNo: '26200455467915',
                  CorrIBAN: 'UA253005280000026200455467915',
                  DealAutoProlongEnabled: 'NO',
                  DealOperation: null,
                  EndDate: '02-05-2020',
                  FeeAccountNo: '26200455467915',
                  FeeIBAN: 'UA253005280000026200455467915',
                  InterestAccountNo: '26200455467915',
                  InterestRate: '10.5',
                  NextAccruedInterestDate: null,
                  NextPaymentAmount: '0.00',
                  OpenDate: '04-11-2019',
                  Operations: {
                    Credit: 'false',
                    Debit: 'false',
                    Renew: 'false'
                  },
                  PayPercentType: '0',
                  PenaltyInterestRateMoment: '1.5',
                  PrincipalAccountNo: '26302455260173',
                  PrincipalIBAN: 'UA033005280000026302455260173',
                  RepaymentTermType: 'E'
                },
                OwnerName: 'NIKOLAY NIKOLAEV',
                OwnerTaxId: '1234567890',
                ProductName: 'Term deposit with interest repayment after maturity date',
                Status: 'CLOSES',
                TxId: '2',
                Type: 'DEPOSIT',
                Visible: 'true'
              },
              {
                Access: 'FULL',
                AgreementTypeId: '61',
                Balances: {
                  ActualizedTime: null,
                  Available: null,
                  HoldAmount: '0.00',
                  Ledger: '0.00',
                  Moved: null,
                  OverdraftLimit: '0.00',
                  ProjectedLedger: '0.00'
                },
                BranchDesc: 'АТ "ОТП БАНК"',
                BranchId: '300528',
                Currency: 'UAH',
                DealId: '572037',
                DealName: null,
                Deposit: {
                  AccountClass: 'false',
                  AccountClassNote: null,
                  AccruedInterestSum: '0.00',
                  AccruedInterestWithdrawed: '0.00',
                  AgreementDate: '26-11-2019',
                  AgreementNo: 'IB/110111/19',
                  Alarmed: '0',
                  AutoProlongForDepositTypeCanBeSet: 'NO',
                  CorrAccountNo: '37394455003207',
                  CorrIBAN: 'UA853005280000037394455003207',
                  DealAutoProlongEnabled: 'NO',
                  DealOperation: null,
                  EndDate: '24-02-2020',
                  FeeAccountNo: '26307455264237',
                  FeeIBAN: 'UA483005280000026307455264237',
                  InterestAccountNo: '37395455003206',
                  InterestRate: '12',
                  NextAccruedInterestDate: null,
                  NextPaymentAmount: '0.00',
                  OpenDate: '26-11-2019',
                  Operations: {
                    Credit: 'false',
                    Debit: 'false',
                    Renew: 'false'
                  },
                  PayPercentType: '0',
                  PenaltyInterestRateMoment: '1.5',
                  PrincipalAccountNo: '26307455264237',
                  PrincipalIBAN: 'UA483005280000026307455264237',
                  RepaymentTermType: 'E'
                },
                OwnerName: 'NIKOLAY NIKOLAEV',
                OwnerTaxId: '1234567890',
                ProductName: 'Term deposit with interest repayment after maturity date',
                Status: 'CLOSES',
                TxId: '3',
                Type: 'DEPOSIT',
                Visible: 'true'
              }
            ],
            CanContinue: 'false',
            FirstTxId: '1',
            LastTxId: '3',
            TxCount: '3'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // DealList CREDIT
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAFVQ3QqCMBS+9ynG7mtaVDdzQkIQBUX5AsMdY2Rn4Wb5+Kmr1LvvfH98HJ40j5K8oLLaYEyjeUgJYG6UxltM3xqVedtZtFhFNBEBv4B9GrQgAkL4FVBBtcfCdGdP2K6mY4hWbdt6GW5Wm2hNWR9g0wS/Oulquy1Nfv819Iw4HVqvhz43NfKzrOQDXLv6m9vpyrqs2SsRcjYcXjzKQftjL6USU4NOYw2ikKUFzsaUN2VNamp0XfwH+1XjFZwNr/kAKnisNlQBAAA=</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            CanContinue: 'false',
            FirstTxId: '0',
            LastTxId: '0',
            TxCount: '0'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // AccountListFull
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAACE3VV227bOBB9z1cIerd1sWUnharCcVLUiGsHjhxkHxmJibmRSIGiculv5QeSok8LbAMU6LuRrdE2rXfTvi2wwO5QdzvYwEA4M2dGhzOHpP3iMgyUc8xjwuhz1WjqqoKpx3xCT5+rF4T67CJuGKZlqC+cDXuC44jRGDsbimIfYOpjPqAnTJqpI5ZlpEchPlTrtPSu1TU6qpYmaKsZ9oFAIom3A+adFRVSjzPeA2y2zPJWgfY+4ijEAljneS8Jj4V7OfAdw9YqIwsOURUr11moj2ifUUFogp0TFMTY1uquDORe9llChUwvllmg53nS2sECkSCnAu5tFCDq4dIhKWD/FHNHb+o6cMiMKto7h3x0HOAcUNkVZp+zX7EnsL9Sat1b4ccwU5+jEzEkIRE5fM1ZoV+xwO+F6dYyZM1RoV6zc+w7EM0WtQ14IkEBeYN9l4RYKzuhrbfCdq8i7PSnk8nuyIV2SqsIjS8o5iOYqzMa7I2HvV+U7P/uIRAvYwU6l0ev7w4Od+tqKSYDWnReTodDaGdmlBRyKVQykEKAkXN0iqmQwc12R291QAt1b6227Itko62Sd1Fa2my1rU53c0vPeWfutXQJbBlm19RTgrlr/RvMMTumrrctq93pbhlWiR2xEjvY7o2cac+0WrpumZu6/FvPSjHlXhPO4YxfQdIr2GNhlfLlMLIZkMnqwRALxypiB8eec/NBUd9/uFNub37/TS2gaaTcSoB4mMmmWNZ2CQL2pQoGvrbGT0C0foLg4IKHJ9gfUDj5OBY7SMCJsRrwM3XZx//D1E5FhGmW1m4YBqQZWzCkwlnhivQJuGtyfsrMTu8DfgXd2dTbUjGFuVH7pMuOWaret9efPl1/WyyX/yrq7bf5H3/eX/+9WP7452GhKmUr58sHVblXvjeVj/PHh+v7jGFZoyi8j65CXN0+d49f7uc/l1++Kn8tHhcP889N5XbxWbl79xauiVVoOUfiOWN3/3Dam+4dHR3B+Ij3hDdsxWq3ttoVi9rmJrph1gaHuJ/r88Cb4RBVoWmMT5JgSOjZyrUItjMTIoqfaRpPmkxEx4ieNT0WNhOkRZycwwC8gAD5WGNihnkjAsUkHpgo+1KDwHPCQyTg5WlGswhkIKuWM3vy5fIM1dohW1Q9KbZWvXP/AUxhr0IhBwAA</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            AccountDetails: {
              AccProdTypeId: null,
              Access: 'FULL',
              AccountId: '1312720',
              AccountName: null,
              AccountNo: '26200455467915',
              Alarmed: '0',
              Balances: {
                ActualizedTime: null,
                Available: '0.00',
                HoldAmount: '0.00',
                Ledger: '0.00',
                Moved: '0',
                OverdraftLimit: '0.00',
                ProjectedLedger: '0.00'
              },
              Bic: 'OTPVUAUKXXX',
              BranchDesc: 'АТ "ОТП БАНК"',
              BranchId: '300528',
              CardAccountSchema: null,
              ContragentId: '1846036',
              CountryId: '804',
              Currency: 'UAH',
              CurrentAcc: {
                InterestRate: null,
                LastAccruedInterestDate: '05-05-2020',
                OpenDate: '04-11-2019'
              },
              IBAN: 'UA253005280000026200455467915',
              OpenToboId: '54394',
              OpenToboName: 'Відділення "Благовіщенське" АТ "ОТП Банк" в м. Харків',
              OwnerName: 'NIKOLAY NIKOLAEV',
              OwnerTaxId: '1234567890',
              PaymentDetails: 'Приватний переказ. Без ПДВ',
              R012: null,
              Status: 'ACTIVE',
              TxId: '1',
              Type: 'CURRENT',
              UsefulLinks: {
                Link: 'https://ru.otpbank.com.ua/privateclients/other-products/account-information.php'
              }
            },
            CanContinue: 'false',
            FirstTxId: '1',
            LastTxId: '1',
            TxCount: '1'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // GetAvatar
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAFWOzQ6CMBCE7zxF07uWaoBLgejNeNCIL9DQ1TTClrQV9O3lzyi3ncl8syPyV12RFqzTBlPK1yElgKVRGu8p7TQq07kV30Sc5lkgLuAagw6ygBBRACqwB7yZQY6GG2oGh2jVt8XbMIkSHlM2AmxJiMJL/3T7ypSPb8PoZKdjn53OiVsGxVlaWYPvV8/crpVeWjar67uB+eN/UrDf/A84cTsM+AAAAA==</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            Avatar: null,
            Type: null
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // CardList
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>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</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            AccountDetails: {
              Access: null,
              AccountName: null,
              Balances: {
                ActualizedTime: null,
                Available: '20000.00',
                HoldAmount: '0.00',
                Ledger: '20000.00',
                Moved: null,
                OverdraftLimit: '0.00',
                ProjectedLedger: '0.00'
              },
              BranchId: '300528',
              Card: {
                AccountId: '10666536',
                Alarmed: '0',
                BranchDesc: 'АТ "ОТП БАНК"',
                CanUnblock: 'true',
                CardAccount: '262061299728',
                CardId: '0C5D0B6B99D698C0A26368EB64DE01CE',
                CardName: null,
                CardNo: '436323******1365',
                CardStateId: '29',
                Contract: null,
                ContractEndDate: '01-01-2999',
                ContractId: '2124956',
                ContractNumber: '2130591',
                CreditLimit: {
                  AllDebtBalance: '0',
                  DueDate: '01-10-2020',
                  InterestRate: '36.00',
                  OutstandingAmount: '0',
                  PastDue: '0',
                  PastDueInterest: '0',
                  Penalty: '0',
                  TotalAmount: '20000',
                  UsedlAmount: '0'
                },
                CurrencyCode: '980',
                DisplayOrder: '0',
                EmbossedName: 'NIKOLAY NIKOLAEV',
                EndDate: '30-11-2022',
                EnrolledDate: '06-11-2019',
                ExtCardID: '4205137',
                FrontStatusDate: null,
                IBAN: 'UA373005280000000262061299728',
                IsExternal: 'false',
                IsPrimary: 'true',
                LegalContractNumber: '0134/980/1299728/19',
                Loyalty: {
                  MastercardRewards: {
                    Enabled: 'false',
                    EnabledSAML: 'true',
                    Points: '0',
                    SiteId: null
                  },
                  Tickets: {
                    AvailableBonus: '261.66',
                    LoyaltyProgramClientID: null,
                    LoyaltyProgramID: '21',
                    LoyaltyProgramURL: 'https://avia.tickets.ua/en/login_page?refid=3057',
                    LoyaltyProgramURLHint: 'Go to the login page of Tickets personal account.',
                    LoyaltyProgramURLText: 'For tickets',
                    loyaltyProgramName: 'Группа [10], "[141] Travel Card, [161] Travel Card 2,[321] Travel Card 3, [322] Travel Card 4"'
                  }
                },
                MainLimitName: 'Ко-бренд карта Trave',
                Options: {
                  CanAddAppleWallet: 'false',
                  CanAddGooglePay: 'false',
                  CanAddSMSInfo: 'false',
                  CanEditLimits: 'false',
                  CanGetRealCardNo: 'true',
                  CanRefreshLimits: 'false',
                  CanRefreshPINCounter: 'false',
                  CanRemoveSMSInfo: 'false',
                  CanResetPINCounter: 'false',
                  CanSetPIN: 'false',
                  CanSetSecretWord: 'false',
                  CanShowLimits: 'false',
                  CanShowPINCounter: 'false',
                  CanShowSMSInfo: 'false'
                },
                OwnFunds: null,
                OwnerIdentifyCode: '1234567890',
                PictureVersion: '1061',
                PinTryCount: '0',
                ProjectName: null,
                ResponseId: '100',
                SavingAccountNo: null,
                ShowCard: 'false',
                SoftStopList: '1',
                State: 'BLOCKED',
                SwitchStatus: 'CANUNBLOCKCARD',
                TempLimitFrom: null,
                TempLimitId: null,
                TempLimitName: null,
                TempLimitTill: null,
                Type: 'VISA Platinum'
              },
              CreditAllowed: 'true',
              Currency: 'UAH',
              DebetAllowed: 'true',
              OwnerAddress: null,
              OwnerName: 'NIKOLAY NIKOLAEV',
              Status: null,
              TxId: '1',
              Type: 'CARD'
            },
            CanContinue: 'false',
            FirstTxId: '1',
            LastTxId: '1',
            TxCount: '1'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // AvailableBalances
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAJ2R3W4CIRCF730Kwr3C2qg3I2a1TWqatM2qD0CXqSFlwcCu1rcv+2c1adJErma+mTNzAFh8F4Yc0Qft7JwmI04J2twpbfdzetJWuVMYJuNJQhdiABmGg7MBxYAQ2KBV6Nf209VpA0I9piZEqzht+sBnk1kypawRsFsFbEpZVmFpXP7VT2iIeHuJvW3Y6m4b4V16WWAZXXe69Ci1kR8Gl9JIm2OLY2F7PqBYpdkjsCbs+aryPt7zLHbpM7BL1pfTwlW2FGMez4hzYB24yKVXa8W67ezv9f+52mXZ0+v2LmP3mgJ2/XTAfv/zB4tkvBUJAgAA</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            AvailableBalance: [
              {
                Amount: '20000.00',
                CardId: null,
                Currency: 'UAH',
                Type: 'CARD'
              },
              {
                Amount: '0.00',
                CardId: null,
                Currency: 'UAH',
                Type: 'CURRENT'
              }
            ]
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // DepositDealDocuments
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAN1W3WrbMBi971OIXC+W5NixDarLmjIIG2ysfQGTaMOskYPtrNlz5WqXK7sYDFb6BsJJSUhqp0koY1ebbDd/YJWwrWzUN9b3c6TvnE8SIgfd1il4T/3A9dh+CSuoBChreE2Xvd0vnbms6Z0FZazquHRg75HXNGh7LKD2HgDkmLIm9evsjZeamSNIp0k9wG2K2aoVZOgGrpZgBoDbCHIcOmEnODz1Gu+WM2Qe++VzkZsPc9x2Innl+E6LhqLqO9wz1w/Ck269aWMC10YefOEsY4jAlZHHag6reSx0WYfaod+hBG568pyTbs3rsNBWNQKX4zxy5DU6Lbo0s9S8hPUKwvm0lUGQoukE3hnL2JETUlutlJFVVpEq6sscqygNGr7bDoWo9kUyTaL4Ko5/gmjCZ3HST8ANv13E44UCPl0NwcXncwHfQKyK+tAWa4ii0n9eONyuXEJElRHBEiJY24HI+Wg64XMOYi7KTyIej25B1BvMkvm4F4EhB9F4wgfJtUgA0eg66S+egGFfAQPBOEpuFuBj/RBiZFqmBbGVQgHWy1+/XJaxdY8A+DcEqBQLoCIFqcUKIPX/bKUmbaUhb6X5iFqpS1qpKaYpV8B4RApUixXQxGZGks1s7aDAP9jMRjETjMQnJ4N3IHM5Hc14SmUIvv3gg00yf5mDWcxBNxRDdrmKq6X6iPajJTmR1fuaaO2kwYB/56CfzHvReCRamXF+wF6m74ri2xXhP+DxcCeLwM0XFIHrZ90vsPWIxhAKAAA=</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            CanContinue: 'true',
            Document: [
              {
                Amount: '0.45',
                Date: '23-09-2020',
                Description: 'Поповнення власного рахунку. Без ПДВ',
                TxId: '1',
                Type: '2'
              },
              {
                Amount: '0.15',
                Date: '14-09-2020',
                Description: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19',
                TxId: '2',
                Type: '1'
              },
              {
                Amount: '20.02',
                Date: '02-09-2020',
                Description: 'Поповнення власного рахунку. Без ПДВ',
                TxId: '3',
                Type: '2'
              },
              {
                Amount: '0.17',
                Date: '14-08-2020',
                Description: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19',
                TxId: '4',
                Type: '1'
              },
              {
                Amount: '24.88',
                Date: '14-07-2020',
                Description: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19',
                TxId: '5',
                Type: '1'
              },
              {
                Amount: '40.00',
                Date: '09-07-2020',
                Description: 'Поповнення власного рахунку. Без ПДВ',
                TxId: '6',
                Type: '2'
              },
              {
                Amount: '10000.00',
                Date: '01-07-2020',
                Description: 'Списання з Ощадного рахунку',
                TxId: '7',
                Type: '2'
              },
              {
                Amount: '57.75',
                Date: '12-06-2020',
                Description: 'Виплата нарахованих відсотків за вкладом на вимогу, зг. договору №IB/108989/19 від 15-ЛИС-19',
                TxId: '8',
                Type: '1'
              },
              {
                Amount: '2600.00',
                Date: '09-06-2020',
                Description: 'Видача готівки з вкладного рахунку',
                TxId: '9',
                Type: '2'
              },
              {
                Amount: '0.01',
                Date: '09-06-2020',
                Description: 'Поповнення власного рахунку. Без ПДВ',
                TxId: '10',
                Type: '2'
              }
            ],
            FirstTxId: '1',
            LastTxId: '10',
            TxCount: '24'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // CardOperationByPeriodLog
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAO2Zy2rbQBSG93mKwat2IWkuGssaFAUnLtS0JSZOC10VYU+DSCwZSW6ax2vpPq8QUkIhxU5L6Lod+SLLzoTKBg+pGtBCPjr/+YU/ztzk7HzsnYAPPIr9MNiuIB1WAA86YdcPjrYrp37QDU9jDWGKKjvulnPA434YxNzdAsBp86DLo2bwPkx/jgNxWiaNAL8rqlUJtKiFqhVjLDAWFU478ZJBvHsSdo5nFcYRd/+FyJ3cTnSLiU7Li7weT8RbT3V7XtTd7/PIS4T/y/BoEhYPdsPwmHcbXsJdTDRoaxhiCJDF0st0jNzzmaQRdgY9HiTLIgjZ+HKMhYyZLLOv98JBkLhQN6ljLEfvZO8Nokj84Wfu6/rzXHoWvqd8M6h3OulNlij1u5s2q7ccH9vfl5xVbfC4E/n99NY9H92MLodXw+FvcPn94udw9HUEflz8uh1e3+rg09U3cP7lc+6F8tIJNENOrRBMiOdcbEZrjBaAmRetBhNDHWKVNOWGpcWJqhq0MpwEMgT/jhNZc9FqOIVIJUyZ3WZRXt/eXF+A/cPWu1b9rdZ+dvDmSdvCNqrZ+OnmetLOeCDMTItBWqAn7XUhmkoZStxK241LICkjtQLdCB+78UF1I5lDJAybjBbpxuojxAcFsaYJJGMeWMBAjBQcUqtrrlkhUrtmlfiVd1ilmrgmXIiYHAstcvKilWEqXbL+XytWLEZKMuUi2pIU2oDkRavBRLaNdaKU532WpUUKUUYHoXQTQq1ie8r1kGrIUjpjSuzKOGMuQERW4YOBNSFStcseiV0JIWLBA095mAxTRlGBwdWci1Y93YFKKUr9Nomx1QQN3g9jPwHNIOERjxPwyksGkZ+cAVEOtA/VsTSLTJRrszQtHRKlBwNSw7LSTPcWUzCoxkxc6IwnPRpYj6aGkdrWlBuWcIhdBEksZtobBWkSpTtLqV/pMWLM6GYx4qqp12y1HSm3/JdgOkb+i6VjzD+j/gHF3iFRgB0AAA==</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            CardOperationLog: [
              {
                AccountCurrency: 'UAH',
                BookedDate: '23-09-2020 17:17:14',
                DocumentDate: '23-09-2020 00:00:00',
                OperationAmount: '0.45',
                OperationAmountInAccountCurrency: '0.45',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '02-09-2020 09:58:54',
                DocumentDate: '02-09-2020 00:00:00',
                OperationAmount: '20.02',
                OperationAmountInAccountCurrency: '20.02',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '16-07-2020 09:30:10',
                DocumentDate: '17-07-2020 00:00:00',
                OperationAmount: '-20',
                OperationAmountInAccountCurrency: '-20',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '09-07-2020 12:47:05',
                DocumentDate: '09-07-2020 00:00:00',
                OperationAmount: '40',
                OperationAmountInAccountCurrency: '40',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '09-07-2020 12:45:38',
                DocumentDate: '10-07-2020 00:00:00',
                OperationAmount: '-20',
                OperationAmountInAccountCurrency: '-20',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '03-07-2020 13:24:55',
                DocumentDate: '06-07-2020 00:00:00',
                OperationAmount: '-20',
                OperationAmountInAccountCurrency: '-20',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '08-06-2020 20:01:35',
                DocumentDate: '09-06-2020 00:00:00',
                OperationAmount: '0.01',
                OperationAmountInAccountCurrency: '0.01',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '05-05-2020 03:05:10',
                DocumentDate: '05-05-2020 00:00:00',
                OperationAmount: '0.02',
                OperationAmountInAccountCurrency: '0.02',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '26-03-2020 01:33:54',
                DocumentDate: '26-03-2020 00:00:00',
                OperationAmount: '1992.32',
                OperationAmountInAccountCurrency: '1992.32',
                OperationCurrency: 'UAH',
                OperationDescription: 'Поповнення власного рахунку. Без ПДВ'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '01-03-2020 11:30:57',
                DocumentDate: '02-03-2020 00:00:00',
                OperationAmount: '-17',
                OperationAmountInAccountCurrency: '-17',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '01-03-2020 11:17:54',
                DocumentDate: '02-03-2020 00:00:00',
                OperationAmount: '-50',
                OperationAmountInAccountCurrency: '-50',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '22-02-2020 04:25:51',
                DocumentDate: '24-02-2020 00:00:00',
                OperationAmount: '2000',
                OperationAmountInAccountCurrency: '2000',
                OperationCurrency: 'UAH',
                OperationDescription: 'PI Deposit Interest Maturity UAH ST'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '22-02-2020 04:25:44',
                DocumentDate: '24-02-2020 00:00:00',
                OperationAmount: '47.03',
                OperationAmountInAccountCurrency: '47.03',
                OperationCurrency: 'UAH',
                OperationDescription: 'PI Deposit Interest Maturity UAH ST'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '09-02-2020 18:42:05',
                DocumentDate: '10-02-2020 00:00:00',
                OperationAmount: '-2100',
                OperationAmountInAccountCurrency: '-2100',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '09-02-2020 18:37:49',
                DocumentDate: '10-02-2020 00:00:00',
                OperationAmount: '-431',
                OperationAmountInAccountCurrency: '-431',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              },
              {
                AccountCurrency: 'UAH',
                BookedDate: '09-02-2020 18:22:59',
                DocumentDate: '10-02-2020 00:00:00',
                OperationAmount: '-264.89',
                OperationAmountInAccountCurrency: '-264.89',
                OperationCurrency: 'UAH',
                OperationDescription: 'Покупка OTP_PAY-SERV(S7291892)'
              }
            ]
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // AccountHistory
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAACE+2azW8aRxTA7/krRpwDO/u9K202AttRUSKIbKdST9UW1u2qeNfaXWLzL+VoTjnVdl3Jiu24dX3sARGQkckuBhRFlSq1sx+wHzYE26E1KVy8896bmTfvzfz8ZkF4vLVeAi9l3VA09VECT8EEkNWCVlTU7x8lNhW1qG0aSZyg8cRj8YGwLBsbmmrI4gMAhBVZLcp6Vl3TnKYrMJxhHAlQimg0hoQszeJMAnM7YNEewoopmWUjU9IKPw5GcCVi/imy9R69flFD4bmkS+uyibz2+z1RdMNc3coWRVzAgoanfCb5TVbAhs+eakFSFzTVVNSyLK5JJUMWsLDIM1rdWtDKqul0Hzx6ivyGrGakkqQWZBGmIBSwsMSfoaQZKJZRs5jQt9TlomIOZASkcS5FOcYRuWe7KH93nWlE7DuvS6ohFUyUF0/iLsgLVBAIZ0itUF6XVTOniQRH8JCh0XiBbGCWXncDgLtzkpyA+YKBfqGs62gDVcQX6a+Q74PWQJ3X0QZYlEwUCSoJ6SQBCSdsQ+nQxcBtz5oOrOO6QZ/nUsVxdlE2JaVkiCd2x65bTcv6GzSaHfu81euD83fVhmWDc9Cw39l1+9J+D16DbAbDIcdzPIbzAhYbZRgeJ7TpQiG8WCTOIF8KP6AwkhDSBArHUBC3WZSNgrhzChJvT0/A7s7xm8TA2NUE5v4kTh4YAkKKpimG5XGUjkATWI+PtxNJyc02QVI0w3K8Ez9pK+JfNpPOoe4E7a0BOp/41K5N0CW/qcp6Dp1BMZd9mn+W/gZ4f5e+Rskc6q6sKVvEwq5LejGnxSVRGzfsrtjIqi+lkhLRDgKCJhuK/VMQS5V/uv6DBLJOFFmCoohpJ5DjYwkMTx1L4IKm61ejnZFVeU0pKJJeGZHcuEV4RLQyvYIc4yCFFjJshgJTRn6js6WsVULpujYzwqpilkJJXdqSC+VraRDVDLtXNmRxdTmdW3mytPxt/sUqipoj8qCIXaHiaE4SYzhJ0SxN8ZBmx6ESIZ+YDUzW27WuhcAILmsf+tZFPwV2m+fgZH9vTsU5FT9vAhmc4HnWGXmK6cPmwLsF8MgJgMeMrw3Rx61z/yXoEbeAXr156UGv27u0L1AtiLBXv2jXGv2HqEpMgZ+bVvOy1v7L5aFfLfbBaxaSGIQ4w1GoWAT1agMgXw8Pfkveu9KRhChbNMFAnCXvdMoItFoaZ5iRiIRkBJHRiUcicriemnWRmPNxJv7BzThEqZtBNJu7NUOpCRhKjGMohZMplr7HBN1rddq1Xg1YNVQs2vWa1frg4LBr9y6qddCxwX6zkwLtqlX9aQjU1GyClMMhPkWCYnM8zvH4/8IjPRqP6F7AwfHVJZVi7kBGgk3iOFqmw5lPkzFsfYMLdRvVlq0m6H5sIkSO3UQgvh3AwfExCDYm2LWtfhfYPXDUss5a1kNw2Or27E6tATyvbs9KkmImOZk7h3+c7STdswl+B0epNwev9rYnOKVoAogjfNL0HfHpjIAAyo88ozTtrcYPb3TikQXo6ds9kDjaPj7bPj76ZX97Z07ZOWWnT9kwUKZMWWZMEUrwNEdxPMNO/SJ/A9iGrSeE7a/2+fvqn1/0RX7+tnPGQXo/38RMhtHYNeTeVKo3Yuhd3oayn4IoThLkjEM09BVQx+7ZH8PfAd0rGKJYOkiaX8bnZeKXfxn/nGWic4qDn0wJWPA7rn8A0vE/+wEmAAA=</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            CanContinue: 'false',
            ClosingBalance: '0.00',
            CreditBalance: '20518.40',
            DebitBalance: '20518.40',
            FirstTxId: '1',
            LastTxId: '7',
            OpenBalance: '0.00',
            Transaction: [
              {
                Amount: '10518.38',
                CreditAccount: {
                  AccountNo: '26207455472442',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA893005280000026207455472442',
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '26200455467915',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: 'UA253005280000026200455467915',
                  OwnerName: 'NIKOLAY NIKOLAEV',
                  TaxId: '1234567890'
                },
                DocumentNo: '2829065',
                ExecutionDate: '05-05-2020',
                OrderDate: '04-05-2020',
                PaymentDetails: 'Поповнення депозиту згідно з договором № IB/108989/19',
                Title: null,
                TransactionDate: '05-05-2020',
                TxId: '1',
                Type: 'TRANSFER_OUT'
              },
              {
                Amount: '0.02',
                CreditAccount: {
                  AccountNo: '262061299728',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: null,
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '26200455467915',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: 'UA253005280000026200455467915',
                  OwnerName: 'NIKOLAY NIKOLAEV',
                  TaxId: '1234567890'
                },
                DocumentNo: '2457549057',
                ExecutionDate: '05-05-2020',
                OrderDate: '04-05-2020',
                PaymentDetails: 'Поповнення власного рахунку. Без ПДВ',
                Title: null,
                TransactionDate: '05-05-2020',
                TxId: '2',
                Type: 'TRANSFER_OUT'
              },
              {
                Amount: '10000.00',
                CreditAccount: {
                  AccountNo: '26200455467915',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA253005280000026200455467915',
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '26302455260173',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: 'UA033005280000026302455260173',
                  OwnerName: 'АТ "ОТП Банк"',
                  TaxId: '21685166'
                },
                DocumentNo: '2457549056',
                ExecutionDate: '04-05-2020',
                OrderDate: '04-05-2020',
                PaymentDetails: 'Повернення строкового вкладу, зг. Генерального договору №703/001684/19 від 04-ЛИС-19',
                Title: null,
                TransactionDate: '02-05-2020',
                TxId: '3',
                Type: 'TRANSFER_IN'
              },
              {
                Amount: '413.75',
                CreditAccount: {
                  AccountNo: '26200455467915',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA253005280000026200455467915',
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '2638101',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: null,
                  OwnerName: 'АТ "ОТП Банк"',
                  TaxId: '21685166'
                },
                DocumentNo: '2457549052',
                ExecutionDate: '04-05-2020',
                OrderDate: '04-05-2020',
                PaymentDetails: 'Виплата нарахованих відсотків по Деп. лінії, зг. Ген. договору №703/001684/19 від 04-ЛИС-19',
                Title: null,
                TransactionDate: '02-05-2020',
                TxId: '4',
                Type: 'TRANSFER_IN'
              },
              {
                Amount: '104.65',
                CreditAccount: {
                  AccountNo: '26200455467915',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA253005280000026200455467915',
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '26003012635501',
                  BranchDesc: 'АТ "АЛЬФА-БАНК" У М.КИЄВІ',
                  BranchId: '300346',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: 'UA553003460000026003012635501',
                  OwnerName: 'ТОВ "МІНФІНМЕДІА"',
                  TaxId: '35506859'
                },
                DocumentNo: '12980',
                ExecutionDate: '27-11-2019',
                OrderDate: '27-11-2019',
                PaymentDetails: 'Пополнение счета UA253005280000026200455467915 NIKOLAY NIKOLAEV ИНН 1234567890 Бонус от МинФин, Листопад 2019',
                Title: null,
                TransactionDate: '27-11-2019',
                TxId: '5',
                Type: 'TRANSFER_IN'
              },
              {
                Amount: '10000.00',
                CreditAccount: {
                  AccountNo: '26302455260173',
                  AuxIdentify: null,
                  BeneficiaryName: 'АТ "ОТП Банк"',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA033005280000026302455260173',
                  TaxId: '21685166'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '26200455467915',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: 'UA253005280000026200455467915',
                  OwnerName: 'NIKOLAY NIKOLAEV',
                  TaxId: '1234567890'
                },
                DocumentNo: '2295848967',
                ExecutionDate: '04-11-2019',
                OrderDate: '04-11-2019',
                PaymentDetails: 'Розміщення строкового вкладу, зг. Генерального договору №703/001684/19 від 04-ЛИС-19',
                Title: null,
                TransactionDate: '04-11-2019',
                TxId: '6',
                Type: 'TRANSFER_OUT'
              },
              {
                Amount: '10000.00',
                CreditAccount: {
                  AccountNo: '26200455467915',
                  AuxIdentify: null,
                  BeneficiaryName: 'NIKOLAY NIKOLAEV',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CorrCardId: null,
                  CountryId: '804',
                  Currency: 'UAH',
                  IBAN: 'UA253005280000026200455467915',
                  TaxId: '1234567890'
                },
                Currency: 'UAH',
                DebitAccount: {
                  AccountId: null,
                  AccountName: null,
                  AccountNo: '1002004',
                  BranchDesc: 'АТ "ОТП БАНК"',
                  BranchId: '300528',
                  CardId: null,
                  CardNo: null,
                  Currency: 'UAH',
                  DebitCardIsInvalid: null,
                  IBAN: null,
                  OwnerName: 'АТ "ОТП Банк"',
                  TaxId: '21685166'
                },
                DocumentNo: '2295841323',
                ExecutionDate: '04-11-2019',
                OrderDate: '04-11-2019',
                PaymentDetails: 'Поповнення поточного рахунку',
                Title: null,
                TransactionDate: '04-11-2019',
                TxId: '7',
                Type: 'TRANSFER_IN'
              }
            ],
            TxCount: '7'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ],
    [ // AccountHistory
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header/><soapenv:Body><ns1:callServiceResponse xmlns:ns1="http://ift.webservices.ifobs.cs.com/" xmlns:ns2="http://wm.webservices.ifobs.cs.com/"><callServiceReturn>H4sIAAAAAAAAAF2RQW7DIBBF9zmF5X0NtHXSBSFSXFWKWilVkwsQM6lQnSEC3Pj4xcau7eyGx/szaOCb5lIlv2CdNrhOWUbTBLA0SuP3Or1pVObmHthjztKNWPAvcFeDDsQiSfgBUIHd4dm0xw64tk1LEq1Ct+UTXeUrtkxJFyDzBD946Wu3rUz5M3ToiNi/BzeWMTcX+ae08gI+vLrPvWnr/LHZKdKDDxnPgnLyX8erQmJh0GusQZxl5YCTKYrSsSlMjb6ND2W82F8Bt7KSWIJgNGcv2XNwprSfUhkXdjhAmtGg3cHetKC0vxNnLHqvcBrROHqGu21Nt8PJ+GV/7nvteOwBAAA=</callServiceReturn></ns1:callServiceResponse></soapenv:Body></soapenv:Envelope>',
      {
        Response: {
          Parameters: {
            CanContinue: 'false',
            ClosingBalance: '0.00',
            CreditBalance: '0.00',
            DebitBalance: '10518.40',
            FirstTxId: null,
            LastTxId: '0',
            OpenBalance: '10518.40',
            TxCount: '0'
          },
          SenderInfo: {
            SessionInfo: {
              id: '163075716'
            }
          },
          StatusBlock: {
            Status: 'OK'
          }
        }
      }
    ]
  ])('parses bank body', (body, parsedBody) => {
    expect(parseBody(body)).toEqual(parsedBody)
  })
})
