import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }
  it.each([
    [
      {
        id: 'e3c4bd18114b61014109986bf48531c4566bec90',
        operationTime: '2020-03-27T02:31:52.000+0000',
        operationType: 'fee',
        totalAmount: {
          currency: 'UAH',
          value: '-7.00'
        },
        effectiveFrom: '2020-03-27',
        processedOn: '2020-03-27',
        location: {
          merchant: '028:Комісія за послугу СМС інформування'
        },
        description: 'Комісія за послугу СМС інформування',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {
          totalFee: {
            currency: 'UAH',
            value: '-7.00'
          },
          fee: {
            currency: 'UAH',
            value: '-7.00'
          },
          custom: {
            currency: 'UAH',
            value: '-7.00'
          }
        }
      },
      {
        hold: false,
        date: new Date('2020-03-27T02:31:52.000+0000'),
        movements: [
          {
            id: 'e3c4bd18114b61014109986bf48531c4566bec90',
            account: { id: 'account' },
            invoice: null,
            sum: -7.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комісія за послугу СМС інформування'
      }
    ],
    [
      {
        id: 'a935ab62aac40bae696741aec99008a5400ec476',
        rrn: '030722361741',
        operationTime: '2020-03-07T09:33:46.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '-280.00'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-280.00'
        },
        authCode: '541738',
        effectiveFrom: '2020-03-10',
        processedOn: '2020-03-10',
        location: {
          city: 'KIYEV',
          country: 'UKR',
          merchant: 'Family'
        },
        description: 'Операції розрахунку в торгово сервісній мережі Family KIYEV UKRAINE',
        merchantCategory: 'health_and_beauty',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-03-07T09:33:46.000+0000'),
        movements: [
          {
            id: 'a935ab62aac40bae696741aec99008a5400ec476',
            account: { id: 'account' },
            invoice: null,
            sum: -280.00,
            fee: 0
          }
        ],
        merchant: {
          title: 'Family',
          mcc: null,
          location: null,
          city: 'KIYEV',
          country: 'UKR'
        },
        comment: null
      }
    ],
    [
      {
        id: 'e0ecb531d5335f088d4419425ffb79bf1bc4ca3b',
        rrn: '030322383856',
        operationTime: '2020-03-03T16:08:42.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '-136.75'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-136.75'
        },
        authCode: '541737',
        effectiveFrom: '2020-03-04',
        processedOn: '2020-03-04',
        location: {
          city: 'KIYEV',
          country: 'UKR',
          merchant: 'TOVKRAINAPIVADanchenka'
        },
        description: 'Операції розрахунку в торгово сервісній мережі TOVKRAINAPIVADanchenka KIYEV UKRAINE',
        merchantCategory: 'miscellaneous_food',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-03-03T16:08:42.000+0000'),
        movements: [
          {
            id: 'e0ecb531d5335f088d4419425ffb79bf1bc4ca3b',
            account: { id: 'account' },
            invoice: null,
            sum: -136.75,
            fee: 0
          }
        ],
        merchant: {
          title: 'TOVKRAINAPIVADanchenka',
          mcc: null,
          location: null,
          city: 'KIYEV',
          country: 'UKR'
        },
        comment: null
      }
    ],
    [
      {
        id: '80f003e6b30df3c99cf83d6a3ff08f7c10539f68',
        rrn: '030222300140',
        operationTime: '2020-03-02T12:13:41.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '-74.01'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-74.01'
        },
        authCode: '541736',
        effectiveFrom: '2020-03-03',
        processedOn: '2020-03-03',
        location: {
          city: 'KIYEV',
          country: 'UKR',
          merchant: 'Umjasnika'
        },
        description: 'Операції розрахунку в торгово сервісній мережі Umjasnika KIYEV UKRAINE',
        merchantCategory: 'miscellaneous_food',
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-03-02T12:13:41.000+0000'),
        movements: [
          {
            id: '80f003e6b30df3c99cf83d6a3ff08f7c10539f68',
            account: { id: 'account' },
            invoice: null,
            sum: -74.01,
            fee: 0
          }
        ],
        merchant: {
          title: 'Umjasnika',
          mcc: null,
          location: null,
          city: 'KIYEV',
          country: 'UKR'
        },
        comment: null
      }
    ],
    [
      {
        id: '73c276eae2bb3fff7f44ad371c11ee93ad6a8fc5',
        rrn: '030222305411',
        operationTime: '2020-03-02T11:36:35.000+0000',
        transAmount: {
          currency: 'UAH',
          value: '-115.80'
        },
        totalAmount: {
          currency: 'UAH',
          value: '-115.80'
        },
        authCode: '541734',
        effectiveFrom: '2020-03-03',
        processedOn: '2020-03-03',
        location: {
          city: 'KIYEV',
          country: 'UKR',
          merchant: 'Silpo'
        },
        description: 'Операції розрахунку в торгово сервісній мережі Silpo KIYEV UKRAINE',
        merchantCategory: 'miscellaneous_food',
        merchantData: {
          name: 'Silpo',
          icon: 'silpo.png'
        },
        isDisputeAvailable: false,
        isDataComplete: true,
        isOnline: false,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        contractId: '655ea2e2f1391c362794acbe75fe96f3c2fd88c9',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        status: 'success',
        allowReversal: false,
        transAmountDetails: [],
        allowRest: false,
        fees: {}
      },
      {
        hold: false,
        date: new Date('2020-03-02T11:36:35.000+0000'),
        movements: [
          {
            id: '73c276eae2bb3fff7f44ad371c11ee93ad6a8fc5',
            account: { id: 'account' },
            invoice: null,
            sum: -115.80,
            fee: 0
          }
        ],
        merchant: {
          title: 'Silpo',
          mcc: null,
          location: null,
          city: 'KIYEV',
          country: 'UKR'
        },
        comment: null
      }
    ],
    [
      {
        id: '5e0de402030a66b870ba45f7603920c65e7632c3',
        rrn: '020608078260',
        operationTime: '2020-07-24T08:18:57.000+0000',
        transAmount: { currency: 'UAH', value: '-247.00' },
        totalAmount: { currency: 'UAH', value: '-247.00' },
        authCode: '767645',
        processedOn: '2020-07-24',
        location: { city: 'KYIV', country: 'UKR' },
        description: 'Retail UKR KYIV',
        merchantCategory: 'health_and_beauty',
        isDisputeAvailable: false,
        isTokenPay: true,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        contractId: '1823328e51421823b0b694760c7b10068cc4808e',
        isAuth: true,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        status: 'waiting',
        allowReversal: false,
        fees: {},
        transAmountDetails: [],
        allowRest: false
      },
      {
        hold: true,
        date: new Date('2020-07-24T08:18:57.000+0000'),
        movements: [
          {
            id: '5e0de402030a66b870ba45f7603920c65e7632c3',
            account: { id: 'account' },
            invoice: null,
            sum: -247,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Retail UKR KYIV'
      }
    ],
    [
      {
        id: 'bb42cfcf938da0759ad36505058967ea769f01c6',
        rrn: '020614119654',
        operationTime: '2020-07-24T11:38:03.000+0000',
        transAmount: { currency: 'UAH', value: '-34.70' },
        totalAmount: { currency: 'UAH', value: '-34.70' },
        authCode: '576231',
        effectiveFrom: '2020-07-27',
        processedOn: '2020-07-27',
        location:
          {
            city: 'CHERNIGIV',
            country: 'UKR',
            merchant: 'SHOP ATB PR1158'
          },
        description: 'Операції розрахунку в торгово сервісній мережі SHOP ATB PR1158 CHERNIGIV UKRAINE',
        merchantCategory: 'miscellaneous_food',
        merchantData: { name: 'ATB-Market', icon: 'atb.png' },
        isDisputeAvailable: false,
        contractId: '29f96377b355e7bb3e4609f8f4e862d4a361f8b0',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isContactless: true,
        isTokenPay: true,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-24T11:38:03.000+0000'),
        movements: [
          {
            id: 'bb42cfcf938da0759ad36505058967ea769f01c6',
            account: { id: 'account' },
            invoice: null,
            sum: -34.70,
            fee: 0
          }
        ],
        merchant: {
          title: 'SHOP ATB PR1158',
          mcc: null,
          location: null,
          city: 'CHERNIGIV',
          country: 'UKR'
        },
        comment: null
      }
    ],
    [
      {
        id: 'e05b29bbfdc38db85020886b82573d7823e54d92',
        rrn: '020187662221',
        operationTime: '2020-07-19T12:19:48.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: { currency: 'UAH', value: '-331.05' },
        totalAmount: { currency: 'UAH', value: '-331.05' },
        authCode: '576230',
        effectiveFrom: '2020-07-20',
        processedOn: '2020-07-20',
        description: 'Операції розрахунку в торгово сервісній мережі CHERNIGIV KYIV UKRAINE',
        merchantCategory: 'utilities',
        isDisputeAvailable: false,
        contractId: '29f96377b355e7bb3e4609f8f4e862d4a361f8b0',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: true,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'SBON_INVOICE_chernihiv_oblteplokomunenergo',
            name: 'Чернігівоблтеплокомуненерго (опалення, гаряча вода)',
            allowTemplate: false,
            allowPeriodic: false,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            invoice: { id: '12373269', name: 'Квитанція: 12373269' },
            active: true,
            shortFields:
              {
                BILLER_NAME: 'Чернігівоблтеплокомуненерго (опалення, гаряча вода)',
                INVOICE_NAME: 'Квитанція: 12373269',
                INVOICE_ID: '12373269',
                PAYMENT_CODE: 'chernihiv_oblteplokomunenergo'
              }
          },
        fees: {},
        allowRest: true,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-19T12:19:48.000+0000'),
        movements: [
          {
            id: 'e05b29bbfdc38db85020886b82573d7823e54d92',
            account: { id: 'account' },
            invoice: null,
            sum: -331.05,
            fee: 0
          }
        ],
        merchant: {
          title: 'Чернігівоблтеплокомуненерго (опалення, гаряча вода)',
          mcc: null,
          location: null,
          city: 'CHERNIGIV',
          country: 'UKRAINE'
        },
        comment: null
      }
    ],
    [
      {
        id: 'f7812469f2c74965fedeec27e7a582a82438319e',
        rrn: '071587739130',
        operationTime: '2020-07-15T08:45:51.000+0000',
        transAmount: { currency: 'RUB', value: '-71.00' },
        totalAmount: { currency: 'UAH', value: '-27.66' },
        authCode: '576216',
        effectiveFrom: '2020-07-16',
        processedOn: '2020-07-16',
        location: { city: 'Moscow ', country: 'RUS', merchant: 'Free-Kassa' },
        description: 'Операції розрахунку в торгово сервісній мережі Free-Kassa Moscow RUSSIAN FEDERATION',
        merchantCategory: 'finance',
        isDisputeAvailable: false,
        contractId: '29f96377b355e7bb3e4609f8f4e862d4a361f8b0',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees:
          {
            totalFee: { currency: 'UAH', value: '-0.27' },
            fee: { currency: 'UAH', value: '-0.27' },
            custom: { currency: 'UAH', value: '-0.27' }
          },
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-15T08:45:51.000+0000'),
        movements: [
          {
            id: 'f7812469f2c74965fedeec27e7a582a82438319e',
            account: { id: 'account' },
            invoice: {
              instrument: 'RUB',
              sum: -71.00
            },
            sum: -27.39,
            fee: -0.27
          }
        ],
        merchant: {
          title: 'Free-Kassa',
          mcc: null,
          location: null,
          city: 'Moscow',
          country: 'RUS'
        },
        comment: null
      }
    ],
    [
      {
        id: '8522582c170dd4860a49489a484703247dc3933c',
        rrn: '019587630244',
        operationTime: '2020-07-13T15:48:24.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: { currency: 'UAH', value: '-200.00' },
        totalAmount: { currency: 'UAH', value: '-204.00' },
        authCode: '369997',
        effectiveFrom: '2020-07-13',
        processedOn: '2020-07-13',
        description: 'Операції розрахунку в торгово сервісній мережі MBK-PORTMONE KYIV UKRAINE',
        merchantCategory: 'telecommunication',
        isDisputeAvailable: false,
        contractId: 'd39416d186d1af632033568ac4482e6ab7e9dc02',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: true,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'PAYMENT_MOBILE',
            name: 'Payment for Mobile',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '38' }
          },
        fees:
          {
            totalFee: { currency: 'UAH', value: '-4.00' },
            surcharge: { currency: 'UAH', value: '-4.00' }
          },
        template:
          {
            id: '59108310',
            name: 'Мобільний зв\'язок',
            serviceActive: true,
            allowRest: false,
            serviceId: 'PAYMENT_MOBILE'
          },
        allowRest: true,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-13T15:48:24.000+0000'),
        movements: [
          {
            id: '8522582c170dd4860a49489a484703247dc3933c',
            account: { id: 'account' },
            invoice: null,
            sum: -200,
            fee: -4
          }
        ],
        merchant: {
          title: 'MBK-PORTMONE',
          mcc: null,
          location: null,
          city: 'KYIV',
          country: 'UKRAINE'
        },
        comment: null
      }
    ],
    [
      {
        id: 'fb8c26f1bf0226e1b44c0e25bead5a4cbd338dfd',
        operationTime: '2020-08-30T13:37:47.000+0000',
        operationType: 'fee',
        totalAmount: { currency: 'UAH', value: '-5.00' },
        location:
          {
            city: 'KRASNOKUTSK',
            country: 'UKR',
            merchant: 'ATM8424 KH SHOP UNIVE'
          },
        description: 'Balance Inquiry Fee Other UKR KRASNOKUTSK ATM8424 KH SHOP UNIVE',
        isDisputeAvailable: false,
        isReversal: false,
        isReversed: false,
        contractId: 'a3050079537e6527a580cdee39f1ebc40fe65bbd',
        isAuth: true,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'waiting',
        allowReversal: false,
        fees:
          {
            totalFee: { currency: 'UAH', value: '-5.00' },
            fee: { currency: 'UAH', value: '-5.00' },
            custom: { currency: 'UAH', value: '-5.00' }
          },
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: true,
        date: new Date('2020-08-30T13:37:47.000+00:00'),
        movements: [
          {
            id: 'fb8c26f1bf0226e1b44c0e25bead5a4cbd338dfd',
            account: { id: 'account' },
            invoice: null,
            sum: -5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Balance Inquiry Fee Other UKR KRASNOKUTSK ATM8424 KH SHOP UNIVE'
      }
    ],
    [
      {
        id: 'b187cdd531b3d8bedb04eb672683cf765c92d65d',
        rrn: '118663210238',
        operationTime: '2021-07-05T05:09:59.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: { currency: 'UAH', value: '-50.00' },
        totalAmount: { currency: 'UAH', value: '-52.00' },
        authCode: '655364',
        processedOn: '2021-07-05',
        description: 'Retail Oplata mobilnogo zviazku KYIV UKRAINE',
        merchantCategory: 'telecommunication',
        isDisputeAvailable: false,
        contractId: '01931e02449df2eb726492b0eb129240b0ae6813',
        isAuth: true,
        isReversal: false,
        isReversed: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: true,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        isOnline: true,
        status: 'waiting',
        allowReversal: false,
        service:
          {
            id: 'PAYMENT_MOBILE',
            name: 'Payment for Mobile',
            allowTemplate: true,
            allowPeriodic: true,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '38', CUSTOM_IDT_2: '0501234567' }
          },
        allowRest: true,
        transAmountDetails: [],
        fees:
          {
            totalFee: { currency: 'UAH', value: '-2.00' },
            surcharge: { currency: 'UAH', value: '-2.00' }
          }
      },
      {
        hold: true,
        date: new Date('2021-07-05T08:09:59+03:00'),
        movements:
          [
            {
              id: 'b187cdd531b3d8bedb04eb672683cf765c92d65d',
              account: { id: 'account' },
              invoice: null,
              sum: -50,
              fee: -2
            }
          ],
        merchant: null,
        comment: 'Retail Oplata mobilnogo zviazku KYIV UKRAINE'
      }

    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
