import { convertTransaction } from '../../../converters'

const accounts = {
  'accountId': {
    id: 'accountId',
    title: 'Счет Black RUB',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  }
}
const transactions = [
  // p2p-anybank: исходящий перевод с Тинькова в другой банк по номеру телефона
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '674170633',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'p2p-anybank',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          pointerType: 'Телефон',
          maskedFIO: 'Петров П.',
          pointer: '+79811123456',
          workflowType: 'SberTransfer',
          pointerLinkId: '36746161',
          message: 'Сбер',
          maskedPAN: '************2045'
        },
        cardNumber: '521324******1234',
        templateId: '109304409',
        templateIsFavorite: false
      },
      id: '4736587157',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      message: 'Сбер',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Петров П.',
      debitingTime: {
        milliseconds: 1558472400000
      },
      cashback: 0,
      brand: {
        name: 'Сбербанк',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/sberbank.png',
        id: '11242',
        roundedLogo: false,
        link: 'http://www.sberbank.ru/',
        baseColor: '309c0b',
        logoFile: 'sberbank.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11
      },
      operationTime: {
        milliseconds: 1558513203000
      },
      subcategory: 'Петров П.',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1022338546',
      merchant: {
        name: 'Сбербанк'
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******1234',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 11
      }
    },
    {
      'hold': false,
      'date': new Date('2019-05-22T11:20:03+03:00'),
      'merchant': {
        'title': 'Петров П.',
        'city': null,
        'country': null,
        'location': null,
        'mcc': null
      },
      'movements': [
        {
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p674170633',
          'invoice': null,
          'sum': -11
        },
        {
          'account': {
            'company': {
              'id': '4624'
            },
            'instrument': 'RUB',
            'syncIds': [
              '2045'
            ],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 11
        }
      ],
      'comment': 'Сбер'
    }
  ],

  // p2p-anybank
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5038543426',
        paymentId: '657036814',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'p2p-anybank',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          pointerType: 'Телефон',
          maskedFIO: 'Наталья Л.',
          pointer: '+79039123456',
          workflowType: 'SberTransfer',
          pointerLinkId: '33129324',
          maskedPAN: '************4996'
        },
        cardNumber: '553691******8627',
        templateId: '105230377',
        templateIsFavorite: false
      },
      id: '4630209694',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Наталья Л.',
      debitingTime: {
        milliseconds: 1557090000000
      },
      cashback: 0,
      brand: {
        name: 'Сбербанк',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/sberbank.png',
        id: '11242',
        roundedLogo: false,
        link: 'http://www.sberbank.ru/',
        baseColor: '309c0b',
        logoFile: 'sberbank.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1388
      },
      operationTime: {
        milliseconds: 1557163234000
      },
      subcategory: 'Наталья Л.',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1053494779',
      merchant: {
        name: 'Сбербанк'
      },
      card: '29191825',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******8627',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1388
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-06T20:20:34+03:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'Наталья Л.'
      },
      'movements': [{
        '_cardPresent': true,
        'account': {
          'id': 'accountId'
        },
        'fee': 0,
        'id': 'p657036814',
        'invoice': null,
        'sum': -1388
      }, {
        'account': {
          'company': {
            'id': '4624'
          },
          'instrument': 'RUB',
          'syncIds': ['4996'],
          'type': 'ccard'
        },
        'fee': 0,
        'id': null,
        'invoice': null,
        'sum': 1388
      }
      ]
    }

  ],

  // p2p-anybank: исходящий перевод внутри Тинькова по номеру телефона
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '674167280',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'p2p-anybank',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          pointerType: 'Телефон',
          maskedFIO: 'Иванов И.',
          pointer: '+79811123456',
          workflowType: 'TinkoffInner',
          pointerLinkId: '36745367',
          message: 'Тиньк'
        },
        cardNumber: '521324******6765',
        templateId: '109303574',
        templateIsFavorite: false
      },
      id: '4736581078',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      message: 'Тиньк',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Иванов И.',
      debitingTime: {
        milliseconds: 1558472400000
      },
      cashback: 0,
      brand: {
        name: 'Тинькофф Банк',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/brands/tinkoff.png',
        id: '11256',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tinkoff.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10
      },
      operationTime: {
        milliseconds: 1558513047000
      },
      subcategory: 'Иванов И.',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1022338546',
      merchant: {
        name: 'Тинькофф Банк'
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 10
      }
    },
    {
      'comment': 'Тиньк',
      'date': new Date('2019-05-22T11:17:27+03:00'),
      'hold': false,
      'merchant': {
        'title': 'Иванов И.',
        'city': null,
        'country': null,
        'location': null,
        'mcc': null
      },
      'movements': [{
        '_cardPresent': true,
        'account': {
          'id': 'accountId'
        },
        'fee': 0,
        'id': 'p674167280',
        'invoice': null,
        'sum': -10
      }]
    }
  ],

  // transfer-legal: исходящий перевод юр. лицу по шаблону
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: 'accountId',
        paymentId: '668557566',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'transfer-legal',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankName: 'ФИЛИАЛ ЦЕНТРАЛЬНЫЙ ПАО БАНКА "ФК ОТКРЫТИЕ"',
          bankAcnt: '40701810700000001234',
          nds: 'НДС не облагается',
          kpp: '997950001',
          addressee: 'АО "ОТКРЫТИЕ БРОКЕР"',
          comment: 'Перевод средств в портфель ФР МБ',
          inn: '7710170659',
          bankBik: '044525297'
        },
        cardNumber: '553691******9105',
        templateId: '97311574',
        templateIsFavorite: true
      },
      id: '4704116157',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Открытие брокер',
      debitingTime: {
        milliseconds: 1558040400000
      },
      cashback: 0,
      brand: {
        name: 'Юридическому лицу',
        id: 'transfer-legal',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 4361.77
      },
      operationTime: {
        milliseconds: 1558078252000
      },
      subcategory: 'Открытие брокер',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1045680694',
      merchant: {
        name: 'Юридическому лицу'
      },
      card: '46145996',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******9105',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 4361.77
      }
    },
    {
      'date': new Date('2019-05-17T10:30:52+03:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'АО "ОТКРЫТИЕ БРОКЕР"'
      },
      'movements': [{
        '_cardPresent': true,
        'account': {
          'id': 'accountId'
        },
        'fee': 0,
        'id': 'p668557566',
        'invoice': null,
        'sum': -4361.77
      }
      ],
      'comment': null
    }
  ],

  // transfer-bank: исходящий межбанк
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5005653521',
        paymentId: '666599740',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'transfer-bank',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankBik: '043469743',
          bankAcnt: '40817810050120444444',
          comment: 'Погашение задолженности ФИО по кредитному договору # 1'
        },
        cardNumber: '437773******3511',
        templateId: '54065341',
        templateIsFavorite: true
      },
      id: '4691264950',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Ипотека (совком)',
      debitingTime: {
        milliseconds: 1557867600000
      },
      cashback: 0,
      brand: {
        name: 'Перевод физическому лицу',
        id: 'transfer-bank',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15880
      },
      operationTime: {
        milliseconds: 1557930499000
      },
      subcategory: 'Ипотека (совком)',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1012234196',
      merchant: {
        name: 'Перевод физическому лицу'
      },
      card: '12783017',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '437773******3511',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 15880
      }
    },
    {
      'date': new Date('2019-05-15T17:28:19+03:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': null,
        'title': 'Ипотека (совком)'
      },
      'movements': [{
        '_cardPresent': true,
        'account': {
          'id': 'accountId'
        },
        'fee': 0,
        'id': 'p666599740',
        'invoice': null,
        'sum': -15880
      }],
      'comment': null
    }
  ],

  // transfer-inner: перевод между своими счетами
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5102929949',
        paymentId: '666610823',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'transfer-inner',
        hasPaymentOrder: false,
        comment: '',
        fieldsValues: {
          bankContract: '5107046558'
        },
        cardNumber: '553691******0444',
        templateId: '72645209',
        templateIsFavorite: false
      },
      id: '4691285179',
      offers: [],
      operationPaymentType: 'TEMPLATE',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Перевод Расчетная карта. ТПС 3.0 GEL',
      debitingTime: {
        milliseconds: 1557867600000
      },
      cashback: 0,
      brand: {
        name: 'Перевод между своими счетами',
        baseTextColor: '333333',
        logo: 'https://static.tinkoff.ru/providers/logotypes/brands/tcs.png',
        id: 'tcs',
        roundedLogo: false,
        baseColor: 'ffdd2d',
        logoFile: 'tcs.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 5000
      },
      operationTime: {
        milliseconds: 1557930974000
      },
      subcategory: 'Перевод Расчетная карта. ТПС 3.0 GEL',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 1,
      category: {
        id: '39',
        name: 'Переводы/иб'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1046312206',
      merchant: {
        name: 'Перевод между своими счетами'
      },
      card: '46777248',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '0001',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******0444',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 5000
      }
    },
    {
      'comment': null,
      'date': new Date('2019-05-15T17:36:14+03:00'),
      'hold': false,
      'merchant': null,
      'movements': [
        {
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p666610823',
          'invoice': null,
          'sum': -5000
        }
        // вторую часть перевода сюда не нужно, она объединится сама
      ]
    }
  ],

  // c2c-out: исходящий card2card на карту
  [
    {
      isDispute: false,
      hasStatement: false,
      isSuspicious: false,
      payment: {
        sourceIsQr: false,
        bankAccountId: '5087704408',
        paymentId: '663354633',
        paymentType: 'Transfer',
        feeAmount: {
          currency: {
            code: 643,
            name: 'RUB',
            strCode: '643'
          },
          value: 0
        },
        providerId: 'c2c-out',
        hasPaymentOrder: false,
        comment: '',
        regularPaymentId: '7E8C1F005E630357E0535C7ED90A483A',
        fieldsValues: {
          dstCardMask: '',
          dstCardId: '0',
          recipientName: '',
          uid: 'RT.07804829',
          bankCard: '546962******0852',
          embName: ''
        },
        cardNumber: '553691******8848',
        templateId: '68410512',
        templateIsFavorite: true
      },
      id: '4672372848',
      offers: [],
      operationPaymentType: 'REGULAR',
      status: 'OK',
      idSourceType: 'Prime',
      type: 'Debit',
      subgroup: {
        id: 'F1',
        name: 'Переводы'
      },
      locations: [],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      description: 'Васе карманные 1000 по понедельникам',
      debitingTime: {
        milliseconds: 1557694800000
      },
      cashback: 0,
      brand: {
        name: 'Перевод на карту',
        id: 'c2c-out',
        roundedLogo: false
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1250
      },
      operationTime: {
        milliseconds: 1557732334000
      },
      subcategory: 'Васе карманные 1000 по понедельникам',
      spendingCategory: {
        id: '57',
        name: 'Переводы',
        icon: '39',
        parentId: '8'
      },
      isHce: false,
      mcc: 6012,
      partnerType: 'card2card',
      category: {
        id: '7',
        name: 'Финан. услуги'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: 'accountId',
      ucid: '1044977710',
      merchant: {
        name: 'Перевод на карту'
      },
      card: '43766807',
      loyaltyPayment: [],
      group: 'TRANSFER',
      mccString: '6012',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '553691******8848',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1250
      }
    },
    {
      'date': new Date('2019-05-13T10:25:34+03:00'),
      'hold': false,
      'merchant': {
        'city': null,
        'country': null,
        'location': null,
        'mcc': 6012,
        'title': '546962******0852'
      },
      'movements': [
        {
          '_cardPresent': true,
          'account': {
            'id': 'accountId'
          },
          'fee': 0,
          'id': 'p663354633',
          'invoice': null,
          'sum': -1250
        },
        {
          'account': {
            'company': null,
            'instrument': 'RUB',
            'syncIds': [
              '0852'
            ],
            'type': 'ccard'
          },
          'fee': 0,
          'id': null,
          'invoice': null,
          'sum': 1250
        }
      ],
      'comment': 'Васе карманные 1000 по понедельникам'
    }

  ]
]

describe('convertTransaction', () => {
  for (let i = 0; i < transactions.length; i++) {
    it('should convert transaction #' + i, () => {
      expect(
        convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
      ).toEqual(
        transactions[i][1]
      )
    })
  }
})

xdescribe('convertOneTransaction', () => {
  const i = 1
  it('should convert transaction ' + i, () => {
    expect(
      convertTransaction(transactions[i][0], accounts[transactions[i][0].account])
    ).toEqual(
      transactions[i][1]
    )
  })
})
