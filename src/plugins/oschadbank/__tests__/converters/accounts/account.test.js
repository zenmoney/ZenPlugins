import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          number: '6706********8396',
          parentNumber: 'UA513226690000026201000990172',
          owner: {
            lastName: 'NIKOLAEV',
            firstName: 'NIKOLAY',
            itn: '380501234567',
            fullName: 'NIKOLAY NIKOLAEV'
          },
          actions: [],
          defaultSource: true,
          subscriptions: {
            NOTIFICATION_SERVICE_EMAIL: {
              displayName: 'EMAIL',
              isActive: false
            },
            NOTIFICATION_SERVICE_SMS: {
              displayName: 'SMS',
              isActive: true
            },
            transactionWindow: {
              displayName: 'Card Guard',
              isActive: false
            },
            statementSubscription: {
              displayName: 'Email Statemet',
              isActive: false
            },
            smsNotifications: {
              displayName: 'SMS Notification',
              isActive: true
            },
            userBlock: {
              displayName: 'User block',
              isActive: false
            }
          },
          addData: {
            AccountProductCode: 'SOC_SOCPOL_UAH',
            EDRPOU: '09322277',
            PRDGR: 'D',
            CARD_SMSPHONE_N: '380501234567',
            PLASTIC_WO_CVC: 'N',
            IS_CARD: 'Y',
            PRDN: 'Мій рахунок (основна)',
            SWIFT: 'COSB UA UK KIE',
            HAS_VIRTUAL: 'N',
            HI_DEP_PCNT: 'N',
            IS_VIRTUAL: 'N',
            P2P_BY_PHONE: 'N',
            IS_READY: 'Y',
            MFO: '322669',
            CAN_RENEWAL: 'N',
            MAIN: 'Y',
            ACCPRD: 'SOC_SOCPOL_UAH',
            CL_INN: '1234567890',
            FILIA: 'Головне управління по м. Києву та Київській області',
            IsReady: 'Y',
            StatusExternalCode: '00',
            StatusCategory: 'VALID'
          },
          balances: {
            available: {
              currency: 'UAH',
              value: '6.41'
            },
            cr_limit: {
              currency: 'UAH',
              value: '0.00'
            },
            interests: {
              currency: 'UAH',
              value: '0.00'
            },
            overlimit: {
              currency: 'UAH',
              value: '0.00'
            },
            blocked: {
              currency: 'UAH',
              value: '0.00'
            },
            minpay: {
              currency: 'UAH',
              value: '0.00'
            },
            total_due: {
              currency: 'UAH',
              value: '0.00'
            },
            overdue: {
              currency: 'UAH',
              value: '0.00'
            },
            virtual: {
              currency: 'UAH',
              value: '0.00'
            }
          },
          cbsNumber: '26201000990172_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'c7f7c74119487a3708a9af7fb0ca3ec34a083555',
          isUserOwned: true,
          card: {
            expiryDate: '03.2022',
            paymentSystem: 'mastercard',
            openDate: '2019-03-18',
            accountNumber: '26201000990172_0001',
            embossing: {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY'
            },
            isVirtual: false,
            isApplePayTokenizationEnabled: false,
            isReissueEnabled: true,
            isWaitingPinSet: false,
            isForeign: false,
            userCanUnblock: false,
            isCardholderAdditional: false,
            status: 'active'
          },
          product: {
            id: 'SOC_SOCPOL_UAH_MAESTRO',
            name: '090-Social Cirrus/Maestro Card',
            brand: 'Maestro Card',
            group: 'null'
          },
          currency: 'UAH',
          id: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
          type: 'card'
        },
        {
          number: 'UA513226690000026201000990172',
          owner: {
            lastName: 'NIKOLAEV',
            firstName: 'NIKOLAY',
            itn: '380501234567',
            fullName: 'NIKOLAY NIKOLAEV'
          },
          actions: [],
          defaultSource: false,
          subscriptions: {
            NOTIFICATION_SERVICE_EMAIL: {
              displayName: 'EMAIL',
              isActive: false
            },
            NOTIFICATION_SERVICE_SMS: {
              displayName: 'SMS',
              isActive: true
            },
            statementSubscription: {
              displayName: 'Email Statemet',
              isActive: false
            }
          },
          addData: {
            EDRPOU: '09322277',
            IS_READY: 'Y',
            IS_CARD: 'N',
            MFO: '322669',
            SWIFT: 'COSB UA UK KIE',
            CL_INN: '1234567890',
            FILIA: 'Головне управління по м. Києву та Київській області',
            IsReady: 'Y',
            StatusExternalCode: '00',
            StatusCategory: 'VALID'
          },
          balances: {
            available: {
              currency: 'UAH',
              value: '6.41'
            },
            cr_limit: {
              currency: 'UAH',
              value: '0.00'
            },
            interests: {
              currency: 'UAH',
              value: '0.00'
            },
            overlimit: {
              currency: 'UAH',
              value: '0.00'
            },
            blocked: {
              currency: 'UAH',
              value: '0.00'
            },
            minpay: {
              currency: 'UAH',
              value: '0.00'
            },
            total_due: {
              currency: 'UAH',
              value: '0.00'
            },
            overdue: {
              currency: 'UAH',
              value: '0.00'
            },
            virtual: {
              currency: 'UAH',
              value: '0.00'
            }
          },
          cbsNumber: '26201000990172',
          bic: '322669',
          financialInstitution: '0090',
          isUserOwned: true,
          cardAccount: {
            isVirtualEnabled: true,
            openDate: '2019-03-18',
            accountNumber: '26201000990172',
            status: 'active'
          },
          product: {
            id: 'SOC_SOCPOL_UAH',
            name: '090-Social SOCPOL Product',
            group: 'null'
          },
          currency: 'UAH',
          name: 'Мій рахунок (UAH)',
          id: 'c7f7c74119487a3708a9af7fb0ca3ec34a083555',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: 'c7f7c74119487a3708a9af7fb0ca3ec34a083555'
          },
          account: {
            id: 'c7f7c74119487a3708a9af7fb0ca3ec34a083555',
            type: 'ccard',
            title: '*8396',
            instrument: 'UAH',
            syncID: [
              'UA513226690000026201000990172',
              '6706********8396'
            ],
            balance: 6.41
          }
        }
      ]
    ],
    [
      [
        {
          number: '5167********3604',
          parentNumber: 'UA193524570000026202963916836',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: true,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'STND_UAH_8',
              EDRPOU: '02766367',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій комфорт (основна)',
              SWIFT: 'COSB UA UK KHE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              ATTR_C1: '+380*******80',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'Y',
              IS_READY: 'Y',
              MFO: '352457',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'STND_UAH_8',
              CL_INN: '1234567890',
              FILIA: 'Херсонське обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '7410.49' },
              cr_limit: { currency: 'UAH', value: '40000.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '2030.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26202963916836_0001',
          bic: '352457',
          financialInstitution: '0210',
          parentId: '7cd3a02e0f0b6fb322b5c3168cf67f8c46f6f9bd',
          isUserOwned: true,
          card:
            {
              expiryDate: '04.2023',
              paymentSystem: 'mastercard',
              openDate: '2018-04-16',
              accountNumber: '26202963916836_0001',
              isApplePayTokenizationEnabled: true,
              isVirtual: false,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'active'
            },
          product:
            {
              id: 'STND_UAH_8_MWORLDDEBMC',
              name: '210-MC World Debit MyCard',
              brand: 'Debit Other Embossed Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          name: '5167 8020 0373 3604 462',
          id: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46',
          type: 'card'
        },
        {
          number: '5319********0961',
          parentNumber: 'UA193524570000026202963916836',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'STND_UAH_8',
              EDRPOU: '02766367',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Віртуальна картка (додаткова)',
              SWIFT: 'COSB UA UK KHE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              _BALANCE_AVAILABLE_AMOUNT: '0.00',
              IS_VIRTUAL: 'Y',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '352457',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'STND_UAH_8',
              CL_INN: '1234567890',
              FILIA: 'Херсонське обласне управління',
              _AVAILABLE_AMOUNT: '0.00',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '11.31' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26202963916836_0002',
          bic: '352457',
          financialInstitution: '0210',
          parentId: '7cd3a02e0f0b6fb322b5c3168cf67f8c46f6f9bd',
          isUserOwned: true,
          card:
            {
              expiryDate: '04.2023',
              paymentSystem: 'mastercard',
              primaryCardId: 'f852ab83ee5dcf7c8f2d727e4b255dfc44893b46',
              openDate: '2020-02-14',
              accountNumber: '26202963916836_0002',
              isApplePayTokenizationEnabled: false,
              isVirtual: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'MVIRTWB_DOP',
              name: '210-MC Virtual WB DOP',
              brand: 'Standard Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          name: '5319 6500 0145 0961 902',
          id: '8c031c5f45e59800ce953bb3c8bc95f9130686e1',
          type: 'card'
        },
        {
          number: 'UA193524570000026202963916836',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '02766367',
              ATTR_S8: '0.00',
              ATTR_S5: '-30 565.50',
              ATTR_S6: '2 030.00',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '352457',
              SWIFT: 'COSB UA UK KHE',
              CL_INN: '1234567890',
              ATTR_S4: '-178.80',
              FILIA: 'Херсонське обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '7410.49' },
              cr_limit: { currency: 'UAH', value: '40000.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '2030.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26202963916836',
          bic: '352457',
          financialInstitution: '0210',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2018-04-16',
              accountNumber: '26202963916836',
              status: 'active'
            },
          product:
            {
              id: 'STND_UAH_8',
              name: '210- STANDARD Long UAH 8',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій комфорт (UAH)',
          id: '7cd3a02e0f0b6fb322b5c3168cf67f8c46f6f9bd',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '7cd3a02e0f0b6fb322b5c3168cf67f8c46f6f9bd'
          },
          account: {
            id: '7cd3a02e0f0b6fb322b5c3168cf67f8c46f6f9bd',
            type: 'ccard',
            title: '*3604',
            instrument: 'UAH',
            syncID: [
              'UA193524570000026202963916836',
              '5167********3604',
              '5319********0961'
            ],
            available: 7410.49,
            creditLimit: 40000.00
          }
        }
      ]
    ],
    [
      [
        {
          number: '5167********7810',
          parentNumber: 'UA523226690000026209504071458',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          isUserOwned: true,
          card:
            {
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              expiryDate: '03.2024',
              paymentSystem: 'mastercard',
              openDate: '2019-03-13',
              accountNumber: '26209504071458_0001',
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isCardholderAdditional: false,
              isForeign: false,
              userCanUnblock: false,
              status: 'active'
            },
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'STND_UAH_18',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій комфорт (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'STND_UAH_18',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '2.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209504071458_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa',
          product:
            {
              id: 'STND_UAH_18_MDUKKPP',
              name: '090-MC Debit PayPass KievCard standard 120',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Муниципальная карта',
          id: '37ba4493c6f86118070d4fa68ded4ca93d680bc5',
          type: 'card'
        },
        {
          number: 'UA523226690000026209504071458',
          parentNumber: '090-LIABPR-496440090',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          isUserOwned: true,
          cardAccount:
            {
              openDate: '2019-03-12',
              accountNumber: '26209504071458',
              isVirtualEnabled: true,
              status: 'active'
            },
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '2.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209504071458',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '8df527b04532237c3ec3cd17f4907f4960a2f2b4',
          product:
            {
              id: 'STND_UAH_18',
              name: '090- STANDARD KK UAH',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій комфорт (UAH)',
          id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa'
          },
          account: {
            id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa',
            type: 'ccard',
            title: '*7810',
            instrument: 'UAH',
            syncID: [
              'UA523226690000026209504071458',
              '5167********7810'
            ],
            balance: 2
          }
        }
      ]
    ],
    [
      [
        {
          number: '5234********4867',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0001',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2019',
              paymentSystem: 'mastercard',
              openDate: '2017-08-17',
              accountNumber: '26009131776697_0001',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          name: '5234********4867',
          id: 'e418543fb0bd16e12c9d04d094dc416fbc184f70',
          type: 'card'
        },
        {
          number: '5234********0633',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0002',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2019',
              paymentSystem: 'mastercard',
              openDate: '2018-09-03',
              accountNumber: '26009131776697_0002',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          id: 'be6e25784c1c401689791f968f8c8056f5a6eb2a',
          type: 'card'
        },
        {
          number: '5234********0440',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0003',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2020',
              paymentSystem: 'mastercard',
              openDate: '2019-05-02',
              accountNumber: '26009131776697_0003',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          id: 'fd30c10938ab0e5d3d98bacfd3b07818992cd97e',
          type: 'card'
        },
        {
          number: '5574********2268',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'Y',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0004',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2022',
              paymentSystem: 'mastercard',
              openDate: '2020-08-25',
              accountNumber: '26009131776697_0004',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              name: '030-MC Business Debit PayPass UAH UR',
              brand: 'Commercial Debit Mastercard Card',
              group: 'null'
            },
          id: 'fdaa7f379f62fa6a952e5020b38702b11c4110cb',
          type: 'card'
        },
        {
          number: '5574********3500',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: true,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '305482',
              CAN_RENEWAL: 'Y',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0005',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2022',
              paymentSystem: 'mastercard',
              openDate: '2020-09-17',
              accountNumber: '26009131776697_0005',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'active'
            },
          currency: 'UAH',
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              name: '030-MC Business Debit PayPass UAH UR',
              brand: 'Commercial Debit Mastercard Card',
              group: 'null'
            },
          id: '942f12095b9be2dc91baef550e79712566fa3c7b',
          type: 'card'
        }
      ],
      [
        {
          mainProduct: {
            id: '83ad72dc95466cd3daed1b57589a849403778959'
          },
          account: {
            id: '83ad72dc95466cd3daed1b57589a849403778959',
            type: 'ccard',
            title: '*3500',
            instrument: 'UAH',
            syncID: [
              'UA123054820000026009131776697',
              '5574********3500',
              '5574********2268',
              '5234********0440',
              '5234********0633',
              '5234********4867'
            ],
            balance: null
          }
        }
      ]
    ],
    [
      [
        {
          number: 'UA523226690000026209504071458',
          parentNumber: '090-LIABPR-496440090',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          isUserOwned: true,
          cardAccount:
            {
              openDate: '2019-03-12',
              accountNumber: '26209504071458',
              isVirtualEnabled: true,
              status: 'active'
            },
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '2.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209504071458',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '8df527b04532237c3ec3cd17f4907f4960a2f2b4',
          product:
            {
              id: 'STND_UAH_18',
              name: '090- STANDARD KK UAH',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій комфорт (UAH)',
          id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa'
          },
          account: {
            id: '78c6f709dd64efc64c8a5362d3982ab124d5d1fa',
            type: 'ccard',
            title: '*1458',
            instrument: 'UAH',
            syncID: [
              'UA523226690000026209504071458'
            ],
            balance: 2
          }
        }
      ]
    ],
    [
      [
        {
          number: '6706********4842',
          parentNumber: 'UA443020760000026204696532584',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SOC_SOCPOL_UAH',
              EDRPOU: '09302607',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK VIN',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '302076',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SOC_SOCPOL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26204696532584_0001',
          bic: '302076',
          financialInstitution: '0010',
          parentId: '28f57ae7a61f1cf07d75aa3e9ebd4ec2aeff214e',
          isUserOwned: true,
          card:
            {
              expiryDate: '09.2019',
              paymentSystem: 'mastercard',
              openDate: '2015-09-07',
              accountNumber: '26204696532584_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              isVirtual: false,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'SOC_SOCPOL_UAH_MAESTRO',
              name: '010-Social Cirrus/Maestro Card',
              brand: 'Maestro Card',
              group: 'null'
            },
          id: 'e9a3ee3abc6a06c1a6c53a97d424b5069ae3f902',
          type: 'card'
        },
        {
          number: '5167********9037',
          parentNumber: 'UA063020760000026200511314814',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SAL_PACK_1',
              EDRPOU: '09302607',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Зарплатний (основна)',
              SWIFT: 'COSB UA UK VIN',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              ATTR_C1: '+380*******07',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'Y',
              IS_READY: 'N',
              MFO: '302076',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SAL_PACK_1',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26200511314814_0001',
          bic: '302076',
          financialInstitution: '0010',
          parentId: '7f487369bab430bb8eddcb91ddf7faf75f7a0640',
          isUserOwned: true,
          card:
            {
              expiryDate: '01.2020',
              paymentSystem: 'mastercard',
              openDate: '2017-01-12',
              accountNumber: '26200511314814_0001',
              productionStatus: 'produced',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'SAL_PACK_1_MGOLDDEBPP_0',
              name: '010-MC Gold Debit PayPass UAH 0',
              brand: 'Gold Debit Mastercard Card',
              group: 'null'
            },
          id: '7c9c1eba9c87c12dac4eb02d621539f47017d169',
          type: 'card'
        },
        {
          number: '5167********1951',
          parentNumber: 'UA043020760000026209501314814',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: true,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SOC_UAH_MIGRANT',
              EDRPOU: '09302607',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK VIN',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '302076',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SOC_UAH_MIGRANT',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '3224.50' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209501314814_0001',
          bic: '302076',
          financialInstitution: '0010',
          parentId: 'd23f3968217ec3f8cb96b8e69bd3493468f2f8b4',
          isUserOwned: true,
          card:
            {
              expiryDate: '07.2021',
              paymentSystem: 'mastercard',
              openDate: '2018-07-02',
              accountNumber: '26209501314814_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              status: 'active'
            },
          currency: 'UAH',
          product:
            {
              id: 'SOC_UAH_MIGRANT_MSTNDDEB',
              name: '010-Socia migrantl Standart Debit card',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          id: '1120e7a2874a07c9ab04212213db1169bcea4f42',
          type: 'card'
        },
        {
          number: '5167********6831',
          parentNumber: 'UA123020760000026202503314563',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: false },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_SOC_MIGRANT',
              EDRPOU: '09302607',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK VIN',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '302076',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_SOC_MIGRANT',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances: {},
          cbsNumber: '26202503314563_0002',
          bic: '302076',
          financialInstitution: '0010',
          parentId: '1325f25073e2841029930ecfc0721b5de8a45d94',
          isUserOwned: true,
          card:
            {
              expiryDate: '07.2021',
              paymentSystem: 'mastercard',
              openDate: '2018-07-03',
              accountNumber: '26202503314563_0002',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'active'
            },
          currency: 'UAH',
          product:
            {
              id: 'PENS_SOC_MIGRANT_MSTNDDEB_DOP',
              name: '010-MC Stand Debit Migrant DOP 201',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          id: 'cb673f1734899e4b5c5edd6b4e093ef9ae0cd482',
          type: 'card'
        },
        {
          number: 'UA443020760000026204696532584',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions: {},
          addData:
            {
              EDRPOU: '09302607',
              IS_READY: 'N',
              IS_CARD: 'N',
              MFO: '302076',
              SWIFT: 'COSB UA UK VIN',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'C',
              StatusExternalCode: '15',
              StatusCategory: 'DECLINE'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26204696532584',
          bic: '302076',
          financialInstitution: '0010',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              closeDate: '2020-06-25',
              openDate: '2015-09-07',
              accountNumber: '26204696532584',
              status: 'closed'
            },
          currency: 'UAH',
          product:
            {
              id: 'SOC_SOCPOL_UAH',
              name: '010-Social SOCPOL Product',
              group: 'null'
            },
          name: 'Мій рахунок (UAH)',
          id: '28f57ae7a61f1cf07d75aa3e9ebd4ec2aeff214e',
          type: 'cardAccount'
        },
        {
          number: 'UA063020760000026200511314814',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions: {},
          addData:
            {
              EDRPOU: '09302607',
              IS_READY: 'N',
              IS_CARD: 'N',
              MFO: '302076',
              SWIFT: 'COSB UA UK VIN',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'C',
              StatusExternalCode: '15',
              StatusCategory: 'DECLINE'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26200511314814',
          bic: '302076',
          financialInstitution: '0010',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              closeDate: '2020-07-20',
              openDate: '2017-01-12',
              accountNumber: '26200511314814',
              status: 'closed'
            },
          currency: 'UAH',
          product: { id: 'SAL_PACK_1', name: '010-SALARY PACK_1', group: 'null' },
          name: 'Зарплатний (UAH)',
          id: '7f487369bab430bb8eddcb91ddf7faf75f7a0640',
          type: 'cardAccount'
        },
        {
          number: 'UA043020760000026209501314814',
          parentNumber: '010-LIABPR-687921360',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09302607',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '302076',
              SWIFT: 'COSB UA UK VIN',
              CL_INN: '1234567890',
              FILIA: 'Вінницьке обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '3224.50' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209501314814',
          bic: '302076',
          financialInstitution: '0010',
          parentId: '750d2643b376d27ac42c220b3586dceafcf16397',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2018-07-02',
              accountNumber: '26209501314814',
              status: 'active'
            },
          currency: 'UAH',
          product:
            {
              id: 'SOC_UAH_MIGRANT',
              name: '010-Social MIGRANT Product',
              group: 'null'
            },
          name: 'Мій рахунок (UAH)',
          id: 'd23f3968217ec3f8cb96b8e69bd3493468f2f8b4',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '28f57ae7a61f1cf07d75aa3e9ebd4ec2aeff214e'
          },
          account: {
            id: '28f57ae7a61f1cf07d75aa3e9ebd4ec2aeff214e',
            type: 'ccard',
            title: '*4842',
            instrument: 'UAH',
            syncID: [
              'UA443020760000026204696532584',
              '6706********4842'
            ],
            balance: 0
          }
        },
        {
          mainProduct: {
            id: '7f487369bab430bb8eddcb91ddf7faf75f7a0640'
          },
          account: {
            id: '7f487369bab430bb8eddcb91ddf7faf75f7a0640',
            type: 'ccard',
            title: '*9037',
            instrument: 'UAH',
            syncID: [
              'UA063020760000026200511314814',
              '5167********9037'
            ],
            balance: 0
          }
        },
        {
          mainProduct: {
            id: 'd23f3968217ec3f8cb96b8e69bd3493468f2f8b4'
          },
          account: {
            id: 'd23f3968217ec3f8cb96b8e69bd3493468f2f8b4',
            type: 'ccard',
            title: '*1951',
            instrument: 'UAH',
            syncID: [
              'UA043020760000026209501314814',
              '5167********1951'
            ],
            balance: 3224.5
          }
        },
        {
          mainProduct: {
            id: '1325f25073e2841029930ecfc0721b5de8a45d94'
          },
          account: {
            id: '1325f25073e2841029930ecfc0721b5de8a45d94',
            type: 'ccard',
            title: '*6831',
            instrument: 'UAH',
            syncID: [
              'UA123020760000026202503314563',
              '5167********6831'
            ],
            balance: null
          }
        }
      ]
    ],
    [
      [
        {
          number: '5104********5141',
          parentNumber: 'UA613226690000026209520464005',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARS_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26209520464005_0003',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '4469fa8a5a01e69a0d327728626840da9f09de41',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              expiryDate: '03.2014',
              paymentSystem: 'mastercard',
              openDate: '2013-03-18',
              accountNumber: '26209520464005_0003',
              productionStatus: 'produced',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_MELCTR_DOP',
              name: '090-MC Electronic ARSENAL DOP',
              brand: 'Mastercard Electronic Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '4419cb4df92590d60a28ef597bee8baa6f0edd0e',
          type: 'card'
        },
        {
          number: '5167********7172',
          parentNumber: '0090-26206757864426',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SAL_BUDG_UAH_2_5',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Зарплатний (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SAL_BUDG_UAH_2_5',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '21.93' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26206757864426_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '3a1fdbd51b7b616e305c9eb0eb73b48c44bbdd08',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '11.2015',
              paymentSystem: 'mastercard',
              openDate: '2013-11-19',
              accountNumber: '26206757864426_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'SAL_BUDG_UAH_2_5_MSTNDDEB_0',
              name: '090-MC Standart Debit budg 0',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: 'f002df917b9e0847477d75dd981a5ee716604e55',
          type: 'card'
        },
        {
          number: '5167********5003',
          parentNumber: 'UA613226690000026209520464005',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26209520464005_0005',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '4469fa8a5a01e69a0d327728626840da9f09de41',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              expiryDate: '03.2015',
              paymentSystem: 'mastercard',
              openDate: '2014-03-07',
              accountNumber: '26209520464005_0005',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_MSTNDDEB_DOP',
              name: '090-MC Standart Debit Arsenal DOP',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: 'ea6c294a9ce22cd027313f72b7daed15344d1d7b',
          type: 'card'
        },
        {
          number: '5167********5927',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'PENS_ARSL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '1307.49' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '04.2015',
              paymentSystem: 'mastercard',
              openDate: '2014-04-30',
              accountNumber: '26209510011714_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_MSTNDDEB',
              name: '090-MC Standart Debit Arsenal 0',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '880367ad02c1a385a1bc066eea8504c5c33efdb5',
          type: 'card'
        },
        {
          number: '5167********0967',
          parentNumber: 'UA613226690000026209520464005',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26209520464005_0006',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '4469fa8a5a01e69a0d327728626840da9f09de41',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              expiryDate: '02.2016',
              paymentSystem: 'mastercard',
              openDate: '2015-03-10',
              accountNumber: '26209520464005_0006',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_MSTNDDEB_DOP',
              name: '090-MC Standart Debit Arsenal DOP',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '19101fe768cefc058b0c93350d3124c032c548c0',
          type: 'card'
        },
        {
          number: '5167********3534',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '1307.49' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0002',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '04.2020',
              paymentSystem: 'mastercard',
              openDate: '2015-04-24',
              accountNumber: '26209510011714_0002',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_27_MSTNDDEB',
              name: '090-MC Standart Debit Arsenal 0',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '40173ac031fc0957c9530b503398d93804e8f2b7',
          type: 'card'
        },
        {
          number: '4524********8826',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Віртуальна картка (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              _BALANCE_AVAILABLE_AMOUNT: '0.00',
              IS_VIRTUAL: 'Y',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              _AVAILABLE_AMOUNT: '0.00',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '-10.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: true,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '04.2016',
              paymentSystem: 'visa',
              primaryCardId: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
              openDate: '2016-02-15',
              accountNumber: '26209510011714',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'VVIRTWB_DOP',
              name: '090-VISA Virtual WB DOP',
              brand: 'Visa Classic',
              group: 'null'
            },
          currency: 'UAH',
          id: 'd553da6e8894d068797052d334e6525cadebab93',
          type: 'card'
        },
        {
          number: '5167********7343',
          parentNumber: 'UA613226690000026209520464005',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26209520464005_0007',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '4469fa8a5a01e69a0d327728626840da9f09de41',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              expiryDate: '02.2017',
              paymentSystem: 'mastercard',
              openDate: '2016-04-29',
              accountNumber: '26209520464005_0007',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_27_MSTNDDEB_DOP',
              name: '090-MC Standart Debit Arsenal DOP',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '5bdbd0c83f1189ffea1b3e5af86af9a9373376f1',
          type: 'card'
        },
        {
          number: '4524********8021',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Віртуальна картка (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              _BALANCE_AVAILABLE_AMOUNT: '0.00',
              IS_VIRTUAL: 'Y',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              _AVAILABLE_AMOUNT: '0.00',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '-13.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0003',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: true,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '04.2017',
              paymentSystem: 'visa',
              primaryCardId: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
              openDate: '2016-05-05',
              accountNumber: '26209510011714_0003',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'VVIRTWB_DOP',
              name: '090-VISA Virtual WB DOP',
              brand: 'Visa Classic',
              group: 'null'
            },
          currency: 'UAH',
          id: '994321b2e606c070295a4c885395ce1066592529',
          type: 'card'
        },
        {
          number: '5167********3541',
          parentNumber: 'UA233226690000026200520011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SOC_SOCPOL_UAH',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SOC_SOCPOL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26200520011714_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'd0c0490ec7f2c0469b432444a3e98678b786f7aa',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '06.2019',
              paymentSystem: 'mastercard',
              openDate: '2016-06-14',
              accountNumber: '26200520011714_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'SOC_SOCPOL_UAH_MDUKK',
              name: '090-Social MC Standart Debit KievCard',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '648a9419be94ab9b69b92ca4eae6975f4f096001',
          type: 'card'
        },
        {
          number: '4524********1497',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Віртуальна картка (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              _BALANCE_AVAILABLE_AMOUNT: '0.00',
              IS_VIRTUAL: 'Y',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              _AVAILABLE_AMOUNT: '0.00',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '957.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0004',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: true,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '04.2020',
              paymentSystem: 'visa',
              primaryCardId: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
              openDate: '2017-05-23',
              accountNumber: '26209510011714_0004',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'VVIRTWB_DOP',
              name: '090-VISA Virtual WB DOP',
              brand: 'Visa Classic',
              group: 'null'
            },
          currency: 'UAH',
          id: '773b571d8ceb74a9c55a8ccbf640e1dad0c6d5f4',
          type: 'card'
        },
        {
          number: '5167********6367',
          parentNumber: 'UA753226690000026202000634589',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: true },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'STND_UAH_8',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій комфорт (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'STND_UAH_8',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26202000634589_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '568b9402e6d6283a9af9b839d12a8da24a6c5338',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '09.2020',
              paymentSystem: 'mastercard',
              openDate: '2017-09-11',
              accountNumber: '26202000634589_0001',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'closed'
            },
          product:
            {
              id: 'STND_UAH_8_MSTNDDEBMC_120',
              name: '090-MC Standart Debit standard Long 120 MC',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '5bc1b3e73101f5ac959ba9c1f27dbf1cc8c646ad',
          type: 'card'
        },
        {
          number: '5167********1286',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: true,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              ATTR_C1: '+380*******23',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'Y',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '1307.49' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0005',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '03.2021',
              paymentSystem: 'mastercard',
              openDate: '2018-03-07',
              accountNumber: '26209510011714_0005',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'active'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_27_MGOLDDEBPP',
              name: '090-MC Gold Debit PayPass UAH Arsenal 0',
              brand: 'Gold Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
          type: 'card'
        },
        {
          number: '5167********2090',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'Y',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'Y',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '1307.49' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0006',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '03.2021',
              paymentSystem: 'mastercard',
              primaryCardId: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
              openDate: '2018-09-20',
              accountNumber: '26209510011714_0006',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'active'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_27_MWORLDEBPP_DOP',
              name: '090-MC World Debit PayPass Arsenal DOP',
              brand: 'Debit Other Embossed Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '959e8fa9f10185f6cf6c64ed6615b72e4a9175ed',
          type: 'card'
        },
        {
          number: '5167********4167',
          parentNumber: 'UA813226690000026208500011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'ECONOM_USD_7',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'ECONOM_USD_7',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'USD', value: '8.87' },
              cr_limit: { currency: 'USD', value: '0.00' },
              interests: { currency: 'USD', value: '0.00' },
              overlimit: { currency: 'USD', value: '0.00' },
              blocked: { currency: 'USD', value: '0.00' },
              minpay: { currency: 'USD', value: '0.00' },
              total_due: { currency: 'USD', value: '0.00' },
              overdue: { currency: 'USD', value: '0.00' },
              virtual: { currency: 'USD', value: '0.00' }
            },
          cbsNumber: '26208500011714_0001',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '15c11262b7dad049addc99996315103de04d5e5b',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '10.2023',
              paymentSystem: 'mastercard',
              openDate: '2018-10-04',
              accountNumber: '26208500011714_0001',
              embossing:
                {
                  company: 'USD',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              status: 'active'
            },
          product:
            {
              id: 'ECONOM_USD_7_MSTNDDEB',
              name: '090-MC Standart Debit econom 7',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'USD',
          id: 'ecc07e5d003d308c2c49c2712252c7c8a1216303',
          type: 'card'
        },
        {
          number: '5246********1316',
          parentNumber: 'UA813226690000026208500011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'ECONOM_USD_7',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'ECONOM_USD_7',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'USD', value: '8.87' },
              cr_limit: { currency: 'USD', value: '0.00' },
              interests: { currency: 'USD', value: '0.00' },
              overlimit: { currency: 'USD', value: '0.00' },
              blocked: { currency: 'USD', value: '0.00' },
              minpay: { currency: 'USD', value: '0.00' },
              total_due: { currency: 'USD', value: '0.00' },
              overdue: { currency: 'USD', value: '0.00' },
              virtual: { currency: 'USD', value: '0.00' }
            },
          cbsNumber: '26208500011714_0002',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '15c11262b7dad049addc99996315103de04d5e5b',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '10.2021',
              paymentSystem: 'mastercard',
              primaryCardId: 'ecc07e5d003d308c2c49c2712252c7c8a1216303',
              openDate: '2018-10-05',
              accountNumber: '26208500011714_0002',
              embossing:
                {
                  company: 'USD',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              status: 'active'
            },
          product:
            {
              id: 'ECONOM_USD_7_MWORLDPP_DOP',
              name: '090-MC World PayPass MRS USD econom DOP 400',
              brand: 'Mastercard World Card',
              group: 'null'
            },
          currency: 'USD',
          id: 'd524597dc2db37295faf3d8410d053b215f83ee0',
          type: 'card'
        },
        {
          number: '5167********8587',
          parentNumber: 'UA813226690000026208500011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'ECONOM_USD_7',
              EDRPOU: '09322277',
              PRDGR: 'C',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'ECONOM_USD_7',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'USD', value: '8.87' },
              cr_limit: { currency: 'USD', value: '0.00' },
              interests: { currency: 'USD', value: '0.00' },
              overlimit: { currency: 'USD', value: '0.00' },
              blocked: { currency: 'USD', value: '0.00' },
              minpay: { currency: 'USD', value: '0.00' },
              total_due: { currency: 'USD', value: '0.00' },
              overdue: { currency: 'USD', value: '0.00' },
              virtual: { currency: 'USD', value: '0.00' }
            },
          cbsNumber: '26208500011714_0003',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '15c11262b7dad049addc99996315103de04d5e5b',
          isUserOwned: false,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              expiryDate: '10.2023',
              paymentSystem: 'mastercard',
              primaryCardId: 'ecc07e5d003d308c2c49c2712252c7c8a1216303',
              openDate: '2018-11-22',
              accountNumber: '26208500011714_0003',
              embossing:
                {
                  company: 'USD',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              status: 'active'
            },
          product:
            {
              id: 'ECONOM_USD_7_MSTNDDEB_DOP',
              name: '090-MC Standart Debit econom DOP 7',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'USD',
          id: '835be7deeb5e56b12fe12e76d1f011d16c24a8b4',
          type: 'card'
        },
        {
          number: '5167********3699',
          parentNumber: 'UA233226690000026200520011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: false },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'SOC_SOCPOL_UAH',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Мій рахунок (основна)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'SOC_SOCPOL_UAH',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26200520011714_0002',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'd0c0490ec7f2c0469b432444a3e98678b786f7aa',
          isUserOwned: true,
          card:
            {
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '06.2024',
              paymentSystem: 'mastercard',
              openDate: '2019-06-05',
              accountNumber: '26200520011714_0002',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'active'
            },
          product:
            {
              id: 'SOC_SOCPOL_UAH_MDUKKPP',
              name: '090-Social MC Debit PayPass KievCard UAH',
              brand: 'Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          name: '5167 **** **** 3699',
          id: '32f5d54f1cd84e470b90f1de316840cd8d759a85',
          type: 'card'
        },
        {
          number: '4524********5094',
          parentNumber: 'UA213226690000026209510011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'PENS_ARSL_UAH_27',
              EDRPOU: '09322277',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'Віртуальна картка (додаткова)',
              SWIFT: 'COSB UA UK KIE',
              HAS_VIRTUAL: 'Y',
              HI_DEP_PCNT: 'N',
              _BALANCE_AVAILABLE_AMOUNT: '0.00',
              IS_VIRTUAL: 'Y',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '322669',
              CAN_RENEWAL: 'N',
              MAIN: 'N',
              ACCPRD: 'PENS_ARSL_UAH_27',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              _AVAILABLE_AMOUNT: '0.00',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '-20.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714_0007',
          bic: '322669',
          financialInstitution: '0090',
          parentId: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          isUserOwned: true,
          card:
            {
              isVirtual: true,
              isApplePayTokenizationEnabled: false,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: false,
              expiryDate: '03.2021',
              paymentSystem: 'visa',
              primaryCardId: '188aee5ee2a9b22af2286f9770cdeaac4d27595b',
              openDate: '2020-05-04',
              accountNumber: '26209510011714_0007',
              embossing: { lastName: 'NIKOLAEV', firstName: 'NIKOLAY' },
              status: 'active'
            },
          product:
            {
              id: 'VVIRTWB_DOP',
              name: '090-VISA Virtual WB DOP',
              brand: 'Visa Classic',
              group: 'null'
            },
          currency: 'UAH',
          id: 'bad76208f655f5765274fdbe2055e0872202427d',
          type: 'card'
        },
        {
          number: '0090-26206757864426',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions: {},
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'N',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'C',
              StatusExternalCode: '15',
              StatusCategory: 'DECLINE'
            },
          balances:
            {
              available: { currency: 'UAH', value: '21.93' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26206757864426',
          bic: '322669',
          financialInstitution: '0090',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              closeDate: '2014-08-05',
              openDate: '2013-11-19',
              accountNumber: '26206757864426',
              status: 'closed'
            },
          product:
            {
              id: 'SAL_BUDG_UAH_2_5',
              name: '090-# ZP BUDG_24_4_0',
              group: 'null'
            },
          currency: 'UAH',
          id: '3a1fdbd51b7b616e305c9eb0eb73b48c44bbdd08',
          type: 'cardAccount'
        },
        {
          number: 'UA213226690000026209510011714',
          parentNumber: '090-LIABPR-511083200',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '1307.49' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26209510011714',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'ec4380a67a7591c39054a112a8d7b8d01ebe8c64',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2014-04-30',
              accountNumber: '26209510011714',
              status: 'active'
            },
          product:
            {
              id: 'PENS_ARSL_UAH_27',
              name: '090- PENS ARSENAL Long 27',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій рахунок (UAH)',
          id: '99aea355b665ce2492e21a45f2b9cc7a06189504',
          type: 'cardAccount'
        },
        {
          number: 'UA233226690000026200520011714',
          parentNumber: '090-LIABPR-511083200',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26200520011714',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'ec4380a67a7591c39054a112a8d7b8d01ebe8c64',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2016-06-03',
              accountNumber: '26200520011714',
              status: 'active'
            },
          product:
            {
              id: 'SOC_SOCPOL_UAH',
              name: '090-Social SOCPOL Product',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій рахунок (UAH)',
          id: 'd0c0490ec7f2c0469b432444a3e98678b786f7aa',
          type: 'cardAccount'
        },
        {
          number: 'UA753226690000026202000634589',
          parentNumber: '090-LIABPR-511083200',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'UAH', value: '0.00' },
              cr_limit: { currency: 'UAH', value: '0.00' },
              interests: { currency: 'UAH', value: '0.00' },
              overlimit: { currency: 'UAH', value: '0.00' },
              blocked: { currency: 'UAH', value: '0.00' },
              minpay: { currency: 'UAH', value: '0.00' },
              total_due: { currency: 'UAH', value: '0.00' },
              overdue: { currency: 'UAH', value: '0.00' },
              virtual: { currency: 'UAH', value: '0.00' }
            },
          cbsNumber: '26202000634589',
          bic: '322669',
          financialInstitution: '0090',
          parentId: 'ec4380a67a7591c39054a112a8d7b8d01ebe8c64',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2017-09-11',
              accountNumber: '26202000634589',
              status: 'active'
            },
          product:
            {
              id: 'STND_UAH_8',
              name: '090- STANDARD Long UAH 8',
              group: 'null'
            },
          currency: 'UAH',
          name: 'Мій комфорт (UAH)',
          id: '568b9402e6d6283a9af9b839d12a8da24a6c5338',
          type: 'cardAccount'
        },
        {
          number: 'UA813226690000026208500011714',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              statementSubscription: { displayName: 'Email Statemet', isActive: false }
            },
          addData:
            {
              EDRPOU: '09322277',
              IS_READY: 'Y',
              IS_CARD: 'N',
              MFO: '322669',
              SWIFT: 'COSB UA UK KIE',
              CL_INN: '1234567890',
              FILIA: 'Головне управління по м. Києву та Київській області',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances:
            {
              available: { currency: 'USD', value: '8.87' },
              cr_limit: { currency: 'USD', value: '0.00' },
              interests: { currency: 'USD', value: '0.00' },
              overlimit: { currency: 'USD', value: '0.00' },
              blocked: { currency: 'USD', value: '0.00' },
              minpay: { currency: 'USD', value: '0.00' },
              total_due: { currency: 'USD', value: '0.00' },
              overdue: { currency: 'USD', value: '0.00' },
              virtual: { currency: 'USD', value: '0.00' }
            },
          cbsNumber: '26208500011714',
          bic: '322669',
          financialInstitution: '0090',
          isUserOwned: true,
          cardAccount:
            {
              isVirtualEnabled: true,
              openDate: '2018-10-04',
              accountNumber: '26208500011714',
              status: 'active'
            },
          product:
            {
              id: 'ECONOM_USD_7',
              name: '090- ECONOM Long USD 7',
              group: 'null'
            },
          currency: 'USD',
          name: 'Мій рахунок (USD)',
          id: '15c11262b7dad049addc99996315103de04d5e5b',
          type: 'cardAccount'
        }
      ],
      [
        {
          mainProduct: {
            id: '4469fa8a5a01e69a0d327728626840da9f09de41'
          },
          account: {
            id: '4469fa8a5a01e69a0d327728626840da9f09de41',
            type: 'ccard',
            title: '*7343',
            instrument: 'UAH',
            syncID: [
              'UA613226690000026209520464005',
              '5167********7343',
              '5167********0967',
              '5167********5003',
              '5104********5141'
            ],
            balance: null
          }
        },
        {
          mainProduct: {
            id: '3a1fdbd51b7b616e305c9eb0eb73b48c44bbdd08'
          },
          account: {
            id: '3a1fdbd51b7b616e305c9eb0eb73b48c44bbdd08',
            type: 'ccard',
            title: '*7172',
            instrument: 'UAH',
            syncID: [
              '0090-26206757864426',
              '5167********7172'
            ],
            balance: 21.93
          }
        },
        {
          mainProduct: {
            id: '99aea355b665ce2492e21a45f2b9cc7a06189504'
          },
          account: {
            id: '99aea355b665ce2492e21a45f2b9cc7a06189504',
            type: 'ccard',
            title: '*5927',
            instrument: 'UAH',
            syncID: [
              'UA213226690000026209510011714',
              '5167********5927',
              '5167********3534',
              '4524********8826',
              '4524********8021',
              '4524********1497',
              '5167********1286',
              '5167********2090',
              '4524********5094'
            ],
            balance: 1307.49
          }
        },
        {
          mainProduct: {
            id: 'd0c0490ec7f2c0469b432444a3e98678b786f7aa'
          },
          account: {
            id: 'd0c0490ec7f2c0469b432444a3e98678b786f7aa',
            type: 'ccard',
            title: '*3541',
            instrument: 'UAH',
            syncID: [
              'UA233226690000026200520011714',
              '5167********3541',
              '5167********3699'
            ],
            balance: 0
          }
        },
        {
          mainProduct: {
            id: '568b9402e6d6283a9af9b839d12a8da24a6c5338'
          },
          account: {
            id: '568b9402e6d6283a9af9b839d12a8da24a6c5338',
            type: 'ccard',
            title: '*6367',
            instrument: 'UAH',
            syncID: [
              'UA753226690000026202000634589',
              '5167********6367'
            ],
            balance: 0
          }
        },
        {
          mainProduct: {
            id: '15c11262b7dad049addc99996315103de04d5e5b'
          },
          account: {
            id: '15c11262b7dad049addc99996315103de04d5e5b',
            type: 'ccard',
            title: '*4167',
            instrument: 'USD',
            syncID: [
              'UA813226690000026208500011714',
              '5167********4167',
              '5246********1316',
              '5167********8587'
            ],
            balance: 8.87
          }
        }
      ]
    ],
    [
      [
        {
          number: '5234********4867',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0001',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2019',
              paymentSystem: 'mastercard',
              openDate: '2017-08-17',
              accountNumber: '26009131776697_0001',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          currency: 'UAH',
          name: '5234********4867',
          id: 'e418543fb0bd16e12c9d04d094dc416fbc184f70',
          type: 'card'
        },
        {
          number: '5234********0633',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0002',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2019',
              paymentSystem: 'mastercard',
              openDate: '2018-09-03',
              accountNumber: '26009131776697_0002',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          currency: 'UAH',
          id: 'be6e25784c1c401689791f968f8c8056f5a6eb2a',
          type: 'card'
        },
        {
          number: '5234********0440',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCORPPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'N',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0003',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2020',
              paymentSystem: 'mastercard',
              openDate: '2019-05-02',
              accountNumber: '26009131776697_0003',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCORPPP',
              name: '030-MC Corporate PayPass UR',
              brand: 'Mastercard Corporate Card',
              group: 'null'
            },
          currency: 'UAH',
          id: 'fd30c10938ab0e5d3d98bacfd3b07818992cd97e',
          type: 'card'
        },
        {
          number: '5574********2268',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: false,
          subscriptions:
            {
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: false },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'N',
              MFO: '305482',
              CAN_RENEWAL: 'Y',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'C',
              StatusExternalCode: '14',
              StatusCategory: 'INVALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0004',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2022',
              paymentSystem: 'mastercard',
              openDate: '2020-08-25',
              accountNumber: '26009131776697_0004',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'closed'
            },
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              name: '030-MC Business Debit PayPass UAH UR',
              brand: 'Commercial Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: 'fdaa7f379f62fa6a952e5020b38702b11c4110cb',
          type: 'card'
        },
        {
          number: '5574********3500',
          parentNumber: 'UA123054820000026009131776697',
          owner:
            {
              lastName: 'NIKOLAEV',
              firstName: 'NIKOLAY',
              itn: '380501234567',
              fullName: 'NIKOLAY NIKOLAEV'
            },
          actions: [],
          defaultSource: true,
          subscriptions:
            {
              NOTIFICATION_SERVICE_EMAIL: { displayName: 'EMAIL', isActive: false },
              NOTIFICATION_SERVICE_SMS: { displayName: 'SMS', isActive: true },
              transactionWindow: { displayName: 'Card Guard', isActive: false },
              statementSubscription: { displayName: 'Email Statemet', isActive: false },
              smsNotifications: { displayName: 'SMS Notification', isActive: true },
              userBlock: { displayName: 'User block', isActive: false }
            },
          addData:
            {
              AccountProductCode: 'CORP_2605_UR_UAH_1',
              EDRPOU: '09305480',
              PRDGR: 'D',
              CARD_SMSPHONE_N: '380501234567',
              PLASTIC_WO_CVC: 'N',
              IS_CARD: 'Y',
              PRDN: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              SWIFT: 'COSB UA UK DNI',
              HAS_VIRTUAL: 'N',
              HI_DEP_PCNT: 'N',
              IS_VIRTUAL: 'N',
              P2P_BY_PHONE: 'N',
              IS_READY: 'Y',
              MFO: '305482',
              CAN_RENEWAL: 'Y',
              MAIN: 'Y',
              ACCPRD: 'CORP_2605_UR_UAH_1',
              CL_INN: '1234567890',
              FILIA: 'Дніпропетровське обласне управління',
              IsReady: 'Y',
              StatusExternalCode: '00',
              StatusCategory: 'VALID'
            },
          balances: {},
          cbsNumber: '26009131776697_0005',
          bic: '305482',
          financialInstitution: '0030',
          parentId: '83ad72dc95466cd3daed1b57589a849403778959',
          isUserOwned: true,
          card:
            {
              expiryDate: '08.2022',
              paymentSystem: 'mastercard',
              openDate: '2020-09-17',
              accountNumber: '26009131776697_0005',
              embossing:
                {
                  company: 'FOPNIKOLAEV',
                  lastName: 'NIKOLAEV',
                  firstName: 'NIKOLAY'
                },
              isVirtual: false,
              isApplePayTokenizationEnabled: true,
              isReissueEnabled: true,
              isWaitingPinSet: false,
              isForeign: false,
              userCanUnblock: false,
              isCardholderAdditional: true,
              status: 'active'
            },
          product:
            {
              id: 'CORP_2605_UR_UAH_1_MCBDEBPP',
              name: '030-MC Business Debit PayPass UAH UR',
              brand: 'Commercial Debit Mastercard Card',
              group: 'null'
            },
          currency: 'UAH',
          id: '942f12095b9be2dc91baef550e79712566fa3c7b',
          type: 'card'
        }
      ],
      [
        {
          mainProduct: {
            id: '83ad72dc95466cd3daed1b57589a849403778959'
          },
          account: {
            id: '83ad72dc95466cd3daed1b57589a849403778959',
            type: 'ccard',
            title: '*3500',
            instrument: 'UAH',
            syncID: [
              'UA123054820000026009131776697',
              '5574********3500',
              '5574********2268',
              '5234********0440',
              '5234********0633',
              '5234********4867'
            ],
            balance: null
          }
        }
      ]
    ]
  ])('converts accounts', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
