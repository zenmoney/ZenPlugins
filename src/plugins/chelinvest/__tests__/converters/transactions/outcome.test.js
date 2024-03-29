import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 207279788,
        balanceBefore: '9859.51',
        date: '2021-06-20T14:31:28Z',
        createdAt: '2021-06-20T14:31:28Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '9626.86',
        amount: '-232.65',
        canRepeat: false,
        account: { id: 206329, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo: {},
        categoryId: 164966,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" (Расчеты) Оплата услуг по Системе Переводов банка - InvestPay. Платеж №1391382328 47422810290000002015 -232.65',
        cardOrAccount:
          {
            id: 206329,
            number: '40817810200880004220',
            title: 'Картсчет 0004220 (RUB)',
            displayTitle: 'Картсчет 0004220 (RUB)',
            currencyId: 16,
            currencyIsoCode: 'rur',
            reservedBalance: '0.0',
            arestedBalance: '0.0',
            closeDate: null,
            hidden: false,
            withdraw: true,
            refund: true,
            productType: null,
            dogovType: 5,
            cashback: false,
            closed: false,
            balance: '21626.86',
            ownAmount: '21626.86',
            creditAmount: 0,
            totalAmount: '21626.86',
            creditAvail: '-0.0',
            loanAmount: '-0.0',
            cards:
              [
                {
                  id: 313253,
                  accountId: 206329,
                  balance: '21626.86',
                  minimalBalance: '0.0',
                  currencyId: 16,
                  currencyIsoCode: 'rur',
                  cardholder: 'EXPRESS CARD',
                  number: '546844******2612',
                  authLimit: '78000000000000232318',
                  title: 'MasterCard Virtual 3 RUR',
                  displayTitle: 'MasterCard Virtual 3 RUR',
                  state: 'active',
                  issueAt: '2019-10-03',
                  expirationAt: '2022-10-31',
                  expiresIn: 488,
                  unaffordable: false,
                  lastOperationDate: '2021-06-25T04:28:24Z',
                  firstOperationDate: '2019-10-24T05:58:05Z',
                  blockedByDate: false,
                  hidden: false,
                  blankImageUrl: '/assets/cardblanks/mc_virtual.jpg',
                  imageUrl: '/assets/cardtypes/MC_VIRTUAL.png',
                  iconUrl: '/assets/cardicons/MC_VIRTUAL.png',
                  keychain: null,
                  svId: 636368,
                  isIbs: true,
                  cardType: { keyword: 'MC_VIRTUAL' },
                  canReissue: true,
                  canBlock: true,
                  isExpiring: false,
                  canTokenized: true,
                  canP2p: true
                },
                {
                  id: 313254,
                  accountId: 206329,
                  balance: '0.0',
                  minimalBalance: '0.0',
                  currencyId: 16,
                  currencyIsoCode: 'rur',
                  cardholder: null,
                  number: '40817***4220',
                  authLimit: null,
                  title: 'Свободные средства',
                  displayTitle: 'Средства не на карте',
                  state: 'pseudo',
                  issueAt: '2019-10-24',
                  expirationAt: null,
                  expiresIn: null,
                  unaffordable: false,
                  lastOperationDate: '2021-06-25T04:28:24Z',
                  firstOperationDate: '2019-10-24T05:58:05Z',
                  blockedByDate: false,
                  hidden: false,
                  blankImageUrl: '/assets/cardtypesblanks/X_AVAILABLE_FUNDS.jpg',
                  imageUrl: '/assets/cardtypes/X_AVAILABLE_FUNDS.png',
                  iconUrl: '/assets/cardicons/X_AVAILABLE_FUNDS.png',
                  keychain: null,
                  isIbs: false,
                  cardType: { keyword: 'X_AVAILABLE_FUNDS' },
                  canReissue: false,
                  canBlock: false,
                  isExpiring: true,
                  canTokenized: false,
                  canP2p: false
                }
              ]
          },
        cardOrAccountId: 'account_206329',
        event:
          {
            orderNumber: 1150008235,
            operationDate: '2021-06-20T14:31:28Z',
            orderDate: '2021-06-20',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" (Расчеты)',
            description: 'Оплата услуг по Системе Переводов банка - InvestPay. Платеж №1391382328',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|523124890',
            documentNumber: 600277,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-06-20T14:31:28Z',
            amount: '232.65',
            currencyIsoCode: 'rur',
            account: 'Платежи в Город',
            srcInn: '744718948971',
            srcKpp: '0',
            srcName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            srcAccount: '40817810200880004220',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAddress: 'Г. ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779',
            destinationInn: '7421000200',
            destinationKpp: '745101001',
            destinationName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" (Расчеты)',
            destinationAccount: '47422810290000002015',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-06-20T14:31:28+00:00'),
        hold: false,
        movements: [
          {
            id: '207279788',
            account: { id: '206329' },
            invoice: null,
            sum: -232.65,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Платеж №1391382328'
      }
    ],
    [
      {
        id: 196166394,
        balanceBefore: '1275.94',
        date: '2021-05-21T02:40:02Z',
        createdAt: '2021-05-21T02:40:02Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '0.0',
        amount: '-1275.94',
        card:
          {
            id: 405774,
            title: 'MC Virtual - 3 года - Руб',
            displayTitle: 'MC Virtual - 3 года - Руб',
            state: 'active',
            displayIcon: 'assets/cardicons/MC_VIRTUAL.png'
          },
        canRepeat: false,
        account: { id: 281832, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo:
          {
            address: 'Chelyabinsk, GOROD74 APP.',
            longitude: null,
            latitude: null
          },
        categoryId: 2015662,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" ПЛАТЕЖ по карте *5791. Место совершения транзакции: Chelyabinsk, GOROD74 APP. Дата: 20.05.21 16:48:52. 30232810090002001107 -1275.94',
        cardOrAccount:
          {
            id: 405774,
            accountId: 281832,
            balance: '0.0',
            minimalBalance: '0.0',
            currencyId: 16,
            currencyIsoCode: 'rur',
            cardholder: 'NIKOLAY NIKOLAEV',
            number: '546844******5791',
            authLimit: '78000000000000683975',
            title: 'MC Virtual - 3 года - Руб',
            displayTitle: 'MC Virtual - 3 года - Руб',
            state: 'active',
            issueAt: '2021-05-19',
            expirationAt: '2024-05-31',
            expiresIn: 1066,
            unaffordable: false,
            lastOperationDate: '2021-06-20T23:42:31Z',
            firstOperationDate: '2021-05-20T11:09:20Z',
            blockedByDate: false,
            hidden: false,
            blankImageUrl: '/assets/cardblanks/mc_virtual.jpg',
            imageUrl: '/assets/cardtypes/MC_VIRTUAL.png',
            iconUrl: '/assets/cardicons/MC_VIRTUAL.png',
            keychain: null,
            svId: 755461,
            isIbs: true,
            cardType: { keyword: 'MC_VIRTUAL' },
            canReissue: true,
            canBlock: true,
            isExpiring: false,
            canTokenized: false,
            canP2p: true
          },
        cardOrAccountId: 'card_405774',
        event:
          {
            orderNumber: 1107054106,
            operationDate: '2021-05-21T02:40:02Z',
            orderDate: '2021-05-21',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            description: 'ПЛАТЕЖ по карте *5791. Место совершения транзакции: Chelyabinsk, GOROD74 APP. Дата: 20.05.21 16:48:52.',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|517455939',
            documentNumber: 807,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-05-21T02:40:02Z',
            amount: '1275.94',
            currencyIsoCode: 'rur',
            account: '30232810090002001107',
            srcInn: null,
            srcKpp: '0',
            srcName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            srcAccount: '40817810100880023990',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAddress: 'Г. ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779',
            destinationInn: '7421000200',
            destinationKpp: '745101001',
            destinationName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            destinationAccount: '30232810090002001107',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-05-20T16:48:52+00:00'),
        hold: false,
        movements: [
          {
            id: '196166394',
            account: { id: '206329' },
            invoice: null,
            sum: -1275.94,
            fee: 0
          }
        ],
        merchant: {
          city: 'Chelyabinsk',
          country: null,
          title: 'GOROD74 APP',
          location: null,
          mcc: null
        },
        comment: null
      }
    ],
    [
      {
        id: 207301196,
        balanceBefore: '12820.83',
        date: '2021-06-21T00:44:17Z',
        createdAt: '2021-06-21T00:44:17Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '4820.83',
        amount: '-8000.0',
        card:
          {
            id: 106787,
            title: 'Visa Classic - Зарплатная - 5 лет - 0% - руб.',
            displayTitle: 'Visa Classic - Зарплатная - 5 лет - 0% - руб.',
            state: 'active',
            displayIcon: 'assets/cardicons/VISA_CLASSIC.png'
          },
        canRepeat: false,
        account: { id: 69917, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo: { address: 'MOSCOW, P2P VISA.', longitude: null, latitude: null },
        categoryId: 541671,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" ПЛАТЕЖ по карте *6621. Место совершения транзакции: MOSCOW, P2P VISA. Дата: 19.06.21 17:44:56. 30232810090000001345 -8000.0',
        cardOrAccount:
          {
            id: 106787,
            accountId: 69917,
            balance: '13626.75',
            minimalBalance: '0.0',
            currencyId: 16,
            currencyIsoCode: 'rur',
            cardholder: 'NIKOLAY NIKOLAEV',
            number: '406149******6621',
            authLimit: '78000000000000535626',
            title: 'Visa Classic - Зарплатная - 5 лет - 0% - руб.',
            displayTitle: 'Visa Classic - Зарплатная - 5 лет - 0% - руб.',
            state: 'active',
            issueAt: '2016-07-06',
            expirationAt: '2021-07-31',
            expiresIn: 29,
            unaffordable: false,
            lastOperationDate: '2021-07-01T08:40:04Z',
            firstOperationDate: '2016-08-09T07:20:47Z',
            blockedByDate: false,
            hidden: false,
            blankImageUrl: '/assets/cardblanks/visa_classic.jpg',
            imageUrl: '/assets/cardtypes/VISA_CLASSIC.png',
            iconUrl: '/assets/cardicons/VISA_CLASSIC.png',
            keychain: null,
            svId: 352876,
            isIbs: true,
            cardType: { keyword: 'VISA_CLASSIC' },
            canReissue: true,
            canBlock: true,
            isExpiring: false,
            canTokenized: false,
            canP2p: true
          },
        cardOrAccountId: 'card_106787',
        event:
          {
            orderNumber: 1150103292,
            operationDate: '2021-06-21T00:44:17Z',
            orderDate: '2021-06-21',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            description: 'ПЛАТЕЖ по карте *6621. Место совершения транзакции: MOSCOW, P2P VISA. Дата: 19.06.21 17:44:56.',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|523177121',
            documentNumber: 38,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-06-21T00:44:17Z',
            amount: '8000.0',
            currencyIsoCode: 'rur',
            account: '30232810090000001345',
            srcInn: '743001117869',
            srcKpp: '0',
            srcName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            srcAccount: '40817810700211227354',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAddress: 'Г. ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779',
            destinationInn: '7421000200',
            destinationKpp: '745101001',
            destinationName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            destinationAccount: '30232810090000001345',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-06-19T17:44:56+00:00'),
        hold: false,
        movements: [
          {
            id: '207301196',
            account: { id: '206329' },
            invoice: null,
            sum: -8000.0,
            fee: 0
          }
        ],
        merchant: {
          city: 'MOSCOW',
          country: null,
          title: 'P2P VISA',
          location: null,
          mcc: null
        },
        comment: null
      }
    ],
    [
      {
        id: 294548455,
        balanceBefore: '220.0',
        date: '2021-10-29T03:22:25Z',
        createdAt: '2021-10-29T03:22:25Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '10.03',
        amount: '-209.97',
        brand: 'aliexpress',
        mcid: '49033',
        card:
          {
            id: 354474,
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            displayIcon: 'assets/cardicons/MC_MAESTRO.png'
          },
        canRepeat: false,
        account: { id: 240987, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo:
          {
            address: 'СИНГАПУР, Singapore, YM *aliexpres, YM *aliexpress.',
            longitude: null,
            latitude: null
          },
        categoryId: 1733814,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" ПЛАТЕЖ по карте *8519. Место совершения транзакции: СИНГАПУР, Singapore, YM *aliexpres, YM *aliexpress. Дата: 27.10.21 11:48:40. 30232810890000001545 -209.97',
        cardOrAccount:
          {
            id: 354474,
            accountId: 240987,
            balance: '0.01',
            minimalBalance: '0.0',
            currencyId: 16,
            currencyIsoCode: 'rur',
            cardholder: 'TIMUR NIGMATZIANOV',
            number: '677384******8519',
            authLimit: '78000000000000601911',
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            issueAt: '2020-07-14',
            expirationAt: '2025-07-31',
            expiresIn: 1350,
            unaffordable: false,
            lastOperationDate: '2021-11-15T06:16:03Z',
            firstOperationDate: '2020-08-10T06:56:07Z',
            blockedByDate: false,
            hidden: false,
            blankImageUrl: '/assets/cardblanks/mir_maestro.jpg',
            imageUrl: '/assets/cardimage/mir_maestro.png',
            iconUrl: '/assets/cardicons/MC_MAESTRO.png',
            keychain: null,
            svId: 683839,
            isIbs: true,
            cardType: { keyword: 'MC_MAESTRO' },
            canReissue: true,
            canBlock: true,
            isExpiring: false,
            canTokenized: true,
            canTokenizedMir: true,
            canP2p: true
          },
        cardOrAccountId: 'card_354474',
        event:
          {
            orderNumber: 1450780342,
            operationDate: '2021-10-29T03:22:25Z',
            orderDate: '2021-10-30',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            description: 'ПЛАТЕЖ по карте *8519. Место совершения транзакции: СИНГАПУР, Singapore, YM *aliexpres, YM *aliexpress. Дата: 27.10.21 11:48:40.',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|547018035',
            documentNumber: 561,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-10-29T03:22:25Z',
            amount: '209.97',
            currencyIsoCode: 'rur',
            account: '30232810890000001545',
            srcInn: '744719589676',
            srcKpp: '0',
            srcName: 'НИГМАТЗЯНОВ ТИМУР РАШИДОВИЧ',
            srcAccount: '40817810300880010554',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAddress: 'Г. ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779',
            destinationInn: '7421000200',
            destinationKpp: '745101001',
            destinationName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            destinationAccount: '30232810890000001545',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-10-27T11:48:40.000Z'),
        hold: false,
        movements: [
          {
            account: { id: '206329' },
            fee: 0,
            id: '294548455',
            invoice: null,
            sum: -209.97
          }
        ],
        merchant: {
          city: 'СИНГАПУР, Singapore, YM *aliexpres',
          country: null,
          location: null,
          mcc: null,
          title: 'YM *aliexpress'
        },
        comment: null
      }
    ],
    [
      {
        id: 302327495,
        balanceBefore: '6026.62',
        date: '2021-11-13T01:43:29Z',
        createdAt: '2021-11-13T01:43:29Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '4026.72',
        amount: '-1999.9',
        brand: '',
        mcid: '49031',
        card:
          {
            id: 354474,
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            displayIcon: 'assets/cardicons/MC_MAESTRO.png'
          },
        canRepeat: false,
        account: { id: 240987, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo:
          {
            address: 'Gorod Sankt-P, GPNBONUS.',
            longitude: null,
            latitude: null
          },
        categoryId: 1733812,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" ПЛАТЕЖ по карте *8519. Место совершения транзакции: Gorod Sankt-P, GPNBONUS. Дата: 10.11.21 19:06:12. 30232810890000001545 -1999.9',
        cardOrAccount:
          {
            id: 354474,
            accountId: 240987,
            balance: '0.01',
            minimalBalance: '0.0',
            currencyId: 16,
            currencyIsoCode: 'rur',
            cardholder: 'TIMUR NIGMATZIANOV',
            number: '677384******8519',
            authLimit: '78000000000000601911',
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            issueAt: '2020-07-14',
            expirationAt: '2025-07-31',
            expiresIn: 1350,
            unaffordable: false,
            lastOperationDate: '2021-11-15T06:16:03Z',
            firstOperationDate: '2020-08-10T06:56:07Z',
            blockedByDate: false,
            hidden: false,
            blankImageUrl: '/assets/cardblanks/mir_maestro.jpg',
            imageUrl: '/assets/cardimage/mir_maestro.png',
            iconUrl: '/assets/cardicons/MC_MAESTRO.png',
            keychain: null,
            svId: 683839,
            isIbs: true,
            cardType: { keyword: 'MC_MAESTRO' },
            canReissue: true,
            canBlock: true,
            isExpiring: false,
            canTokenized: true,
            canTokenizedMir: true,
            canP2p: true
          },
        cardOrAccountId: 'card_354474',
        event:
          {
            orderNumber: 1481423497,
            operationDate: '2021-11-13T01:43:29Z',
            orderDate: '2021-11-15',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            description: 'ПЛАТЕЖ по карте *8519. Место совершения транзакции: Gorod Sankt-P GPNBONUS. Дата: 10.11.21 19:06:12.',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|549628477',
            documentNumber: 32,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-11-13T01:43:29Z',
            amount: '1999.9',
            currencyIsoCode: 'rur',
            account: '30232810890000001545',
            srcInn: '744719589676',
            srcKpp: '0',
            srcName: 'НИГМАТЗЯНОВ ТИМУР РАШИДОВИЧ',
            srcAccount: '40817810300880010554',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAddress: 'Г. ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779',
            destinationInn: '7421000200',
            destinationKpp: '745101001',
            destinationName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            destinationAccount: '30232810890000001545',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-11-10T19:06:12.000Z'),
        hold: false,
        movements: [
          {
            account: { id: '206329' },
            fee: 0,
            id: '302327495',
            invoice: null,
            sum: -1999.9
          }
        ],
        merchant: {
          fullTitle: 'Gorod Sankt-P GPNBONUS.',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '206329', instrument: 'RUB' })).toEqual(transaction)
  })
})
