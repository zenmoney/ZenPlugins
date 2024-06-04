import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          number: '2259A21410681',
          parentNumber: 'A144-LIAB449230',
          owner: {
            itn: '2004004072322',
            lastName: 'Nikolaev',
            firstName: 'Nikolay',
            fullName: 'Nikolay Nikolaevich Nikolaev'
          },
          actions: [],
          defaultSource: false,
          subscriptions: {
            smsNotifications: {
              displayName: 'SMS Auth Notification',
              isActive: false
            }
          },
          addData: {
            EXT_PRD: 'Depozit Basic MDL',
            ACNT_HAS_ARREST: 'NO',
            ACNT_OWNER_NAME: 'Nikolay Nikolaev',
            EXT_OPCODE: 'Unite',
            SMS_S: 'ENROLL',
            EXT_SMSPHONE: '37368501141',
            SMS_U: '0',
            DBCR_FLAG: 'D',
            SMS_T: 'UNDEFINED',
            BIC: 'undefined',
            EXT_IBAN: 'MD42ML000002259A21410681',
            IDNP: '2004004072322',
            IsReady: 'Y',
            StatusExternalCode: '00',
            StatusCategory: 'VALID'
          },
          balances: {
            available: {
              currency: 'MDL',
              value: '0.00'
            },
            cr_limit: {
              currency: 'MDL',
              value: '0.00'
            },
            interests: {
              currency: 'MDL',
              value: '0.00'
            },
            own_balance: {
              currency: 'MDL',
              value: '0.00'
            },
            overlimit: {
              currency: 'MDL',
              value: '0.00'
            },
            blocked: {
              currency: 'MDL',
              value: '0.00'
            },
            minpay: {
              currency: 'MDL',
              value: '0.00'
            },
            total_due: {
              currency: 'MDL',
              value: '0.00'
            },
            overdue: {
              currency: 'MDL',
              value: '0.00'
            }
          },
          financialInstitution: '68F368',
          parentId: '261fda0c9c1c7ceb85182191199b2a444d1f3570',
          isUserOwned: true,
          cardAccount: {
            openDate: '2019-02-04',
            isVirtualEnabled: true,
            status: 'active'
          },
          product: {
            id: 'PM_DEP_MDL_BAS_#ACC05%DEP',
            name: 'F368-PM_DEP_MDL_BAS_#ACC05%DEP',
            group: 'null'
          },
          currency: 'MDL',
          id: '22f90e405299dde694e374283c4bda05d1f59f3b',
          type: 'cardAccount'
        },
        {
          number: '402811******7304',
          parentNumber: '2259A21410681',
          owner: {
            itn: '2004004072322',
            lastName: 'Nikolaev',
            firstName: 'Nikolay',
            fullName: 'Nikolay Nikolaevich Nikolaev'
          },
          actions: [],
          defaultSource: true,
          subscriptions: {
            NOTIFICATION_SERVICE_SMS_1: {
              displayName: 'SMS_1',
              isActive: false
            },
            NOTIFICATION_SERVICE_SMS_2: {
              displayName: 'SMS_2',
              isActive: false
            },
            NOTIFICATION_SERVICE_SMS_3: {
              displayName: 'SMS_3',
              isActive: false
            },
            transactionWindow: {
              displayName: 'Card Guard',
              isActive: false
            },
            smsNotifications: {
              displayName: 'SMS Auth Notification',
              isActive: false
            },
            userBlock: {
              displayName: 'User Block',
              isActive: false
            }
          },
          addData: {
            AccountProductCode: 'PM_DEP_MDL_BAS_#ACC05%DEP',
            EXT_PRD: '2. De baza - Visa Classic',
            ACNT_CLASSIFIER_TYPE: 'DEBIT',
            ACNT_HAS_ARREST: 'NO',
            EXT_IBAN: 'MD42ML000002259A21410681',
            ACNT_OWNER_NAME: 'Nikolay Nikolaev',
            EXT_OPCODE: 'Unite',
            SMS_S: 'ENROLL_BY_ACCOUNT',
            EXT_SMSPHONE: '37368501141',
            SMS_U: 'UNDEFINED',
            DBCR_FLAG: 'D',
            SMS_T: 'UNDEFINED',
            BIC: 'undefined',
            IDNP: '2004004072322',
            IsReady: 'Y',
            StatusExternalCode: '00',
            StatusCategory: 'VALID'
          },
          balances: {
            available: {
              currency: 'MDL',
              value: '0.00'
            },
            cr_limit: {
              currency: 'MDL',
              value: '0.00'
            },
            interests: {
              currency: 'MDL',
              value: '0.00'
            },
            own_balance: {
              currency: 'MDL',
              value: '0.00'
            },
            overlimit: {
              currency: 'MDL',
              value: '0.00'
            },
            blocked: {
              currency: 'MDL',
              value: '0.00'
            },
            minpay: {
              currency: 'MDL',
              value: '0.00'
            },
            total_due: {
              currency: 'MDL',
              value: '0.00'
            },
            overdue: {
              currency: 'MDL',
              value: '0.00'
            }
          },
          cbsNumber: '2259A21410681004',
          financialInstitution: '68F368',
          parentId: '22f90e405299dde694e374283c4bda05d1f59f3b',
          isUserOwned: true,
          card: {
            isCardholderAdditional: false,
            userCanUnblock: false,
            expiryDate: '02.2023',
            paymentSystem: 'visa',
            openDate: '2019-02-04',
            accountNumber: '2259A21410681004',
            isReissueEnabled: true,
            isForeign: false,
            embossing: {
              lastName: 'Nikolaev',
              firstName: 'Nikolay'
            },
            status: 'active'
          },
          product: {
            id: 'PS_VSC_BAS',
            name: '2. De baza - Visa Classic',
            brand: 'Visa Classic',
            group: 'null'
          },
          currency: 'MDL',
          id: '127ff716a47262b2867468acd4f3d291299b373b',
          type: 'card'
        }
      ],
      [
        {
          mainProduct: {
            id: '22f90e405299dde694e374283c4bda05d1f59f3b',
            type: 'cardAccount'
          },
          products: [
            {
              id: '127ff716a47262b2867468acd4f3d291299b373b',
              type: 'card'
            }
          ],
          account: {
            id: '22f90e405299dde694e374283c4bda05d1f59f3b',
            type: 'ccard',
            title: 'Visa Classic *7304',
            syncID: [
              '2259A21410681',
              '402811******7304'
            ],
            available: 0,
            instrument: 'MDL',
            creditLimit: 0
          }
        }
      ]
    ]
  ])('converts card account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
