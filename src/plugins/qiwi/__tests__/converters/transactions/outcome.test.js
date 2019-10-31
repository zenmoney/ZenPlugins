import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        txnId: 14879835272,
        personId: 79152021234,
        date: '2019-02-11T07:09:30+03:00',
        errorCode: 0,
        error: null,
        status: 'WAITING',
        type: 'OUT',
        statusText: 'Operation in progress',
        trmTxnId: '2071000629359597',
        account: 'CHAYKHONA AYVA, карта ********3073',
        sum: { amount: 130, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 130, currency: 643 },
        provider: {
          id: 20194,
          shortName: 'Покупка',
          longName: null,
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras: [
            { key: 'favorite_payment_disabled', value: 'true' },
            { key: 'regular_payment_disabled', value: 'true' }
          ]
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'CHAYKHONA AYVA>MOSCOW                 RU',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: {
          title: 'Покупка',
          account: 'CHAYKHONA AYVA, карта ********3073'
        }
      },
      {
        hold: true,
        date: new Date('2019-02-11T07:09:30+03:00'),
        movements: [
          {
            id: '14879835272',
            account: { id: 'account_643' },
            invoice: null,
            sum: -130,
            fee: 0
          }
        ],
        merchant: {
          country: 'RU',
          city: 'MOSCOW',
          title: 'CHAYKHONA AYVA',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14863662736,
        personId: 79152021234,
        date: '2019-02-08T20:08:42+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '412747515729',
        account: '9152021004',
        sum: { amount: 700, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 700, currency: 643 },
        provider: {
          id: 1,
          shortName: 'МТС',
          longName: 'ПАО «МТС»',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/1_l.png',
          description: null,
          keys: 'mts, mtc, мтс москва, МТС (ОАО Мобильные ТелеСистемы), vnc, vnc vjcrdf',
          siteUrl: 'http://mts.ru',
          extras: [
            {
              key: 'ceo_description',
              value: 'Пополнить баланс МТС банковской картой через интернет, со счета мобильного телефона или через приложение QIWI Кошелек. Оплачивайте сотовую связь МТС без комиссии.'
            },
            {
              key: 'ceo_title',
              value: 'Пополнить счет МТС - оплата банковской картой, со счета телефона или через QIWI Кошелек'
            },
            { key: 'is_spa_form_available', value: 'true' }
          ]
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: null,
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: true,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: true,
          favoritePaymentEnabled: true,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'МТС', account: '9152021004' }
      },
      {
        hold: false,
        date: new Date('2019-02-08T20:08:42+03:00'),
        movements: [
          {
            id: '14863662736',
            account: { id: 'account_643' },
            invoice: null,
            sum: -700,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'МТС 9152021004',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14846937284,
        personId: 79152021234,
        date: '2019-02-06T13:22:07+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '2071000625484629',
        account: 'LR*MANDARINPAY, карта ********3073',
        sum: { amount: 1479, currency: 643 },
        commission: { amount: 29.58, currency: 643 },
        total: { amount: 1508.58, currency: 643 },
        provider: {
          id: 24800,
          shortName: 'Перевод на карту',
          longName: 'Пополнение банковской карты/счета стороннего Банка с QVC',
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras: [
            { key: 'favorite_payment_disabled', value: 'true' },
            { key: 'regular_payment_disabled', value: 'true' }
          ]
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'LR*MANDARINPAY>WWW.MANDARINP          RU',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: {
          title: 'Перевод на карту',
          account: 'LR*MANDARINPAY, карта ********3073'
        }
      },
      {
        hold: false,
        date: new Date('2019-02-06T13:22:07+03:00'),
        movements: [
          {
            id: '14846937284',
            account: { id: 'account_643' },
            invoice: null,
            sum: -1479,
            fee: -29.58
          }
        ],
        merchant: {
          country: 'RU',
          city: 'WWW.MANDARINP',
          title: 'LR*MANDARINPAY',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14842452321,
        personId: 79152021234,
        date: '2019-02-05T18:35:14+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '1007124732499',
        account: '****************5824',
        sum: { amount: 250, currency: 643 },
        commission: { amount: 10, currency: 643 },
        total: { amount: 260, currency: 643 },
        provider: {
          id: 1973,
          shortName: 'Штрафы ГИБДД',
          longName: 'Штрафы ГИБДД',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/1973_l.png',
          description: null,
          keys: 'гаи, гибдд, оплата штрафов, gibdd, ub,ll, inhfas, ufb, штрафы, мади, ампп, штрафы гибдд',
          siteUrl: null,
          extras: [
            { key: 'favorite_payment_disabled', value: 'true' },
            {
              key: 'ceo_description',
              value: 'Оплачивайте штрафы ГИБДД со скидкой 50% картой любого банка, со счета телефона или через QIWI Кошелек. Проверка и оплата автомобильных штрафов по номеру постановления или по ВУ/СТС.'
            },
            { key: 'regular_payment_disabled', value: 'true' },
            {
              key: 'ceo_title',
              value: 'Проверка и оплата штрафов ГИБДД онлайн по номеру постановления или ВУ/СТС'
            },
            { key: 'is_spa_form_available', value: 'true' }
          ]
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: null,
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: true,
          regularPaymentEnabled: false,
          bankDocumentAvailable: true,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'Штрафы ГИБДД', account: '****************5824' }
      },
      {
        hold: false,
        date: new Date('2019-02-05T18:35:14+03:00'),
        movements: [
          {
            id: '14842452321',
            account: { id: 'account_643' },
            invoice: null,
            sum: -250,
            fee: -10
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Штрафы ГИБДД',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14842327306,
        personId: 79152021234,
        date: '2019-02-05T18:19:14+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '14842327305',
        account: '',
        sum: { amount: 1700, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 1700, currency: 643 },
        provider: {
          id: 526498,
          shortName: 'https://alfacrm.pro',
          longName: 'ИП Волынец Вячеслав Александрович',
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: 'https://alfacrm.pro',
          extras: []
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'Платеж в Яндекс.Деньги, 25700109839548925',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'https://alfacrm.pro', account: '' }
      },
      {
        hold: false,
        date: new Date('2019-02-05T18:19:14+03:00'),
        movements: [
          {
            id: '14842327306',
            account: { id: 'account_643' },
            invoice: null,
            sum: -1700,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'https://alfacrm.pro',
          mcc: null,
          location: null
        },
        comment: 'Платеж в Яндекс.Деньги, 25700109839548925'
      }
    ],
    [
      {
        txnId: 14826584119,
        personId: 79064173619,
        date: '2019-02-03T11:54:07+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '14826584117',
        account: '',
        sum: { amount: 109.65, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 109.65, currency: 643 },
        provider: {
          id: 456663,
          shortName: 'Робокасса',
          longName: 'ООО "Бизнес Элемент"',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/456663_l.png',
          description: null,
          keys: null,
          siteUrl: 'http://www.robokassa.ru/',
          extras: []
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'Оплата счета №1549183877 магазина MySuperBet.net (http://mysuperbet.net/) (аккаунт MySuperBet.net (http://mysuperbet.net/)) на сумму 109.65 QIWI Кошелек.',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'Робокасса', account: '' }
      },
      {
        hold: false,
        date: new Date('2019-02-03T11:54:07+03:00'),
        movements: [
          {
            id: '14826584119',
            account: { id: 'account_643' },
            invoice: null,
            sum: -109.65,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Робокасса',
          mcc: null,
          location: null
        },
        comment: 'Оплата счета №1549183877 магазина MySuperBet.net (http://mysuperbet.net/) (аккаунт MySuperBet.net (http://mysuperbet.net/)) на сумму 109.65 QIWI Кошелек.'
      }
    ],
    [
      {
        txnId: 14767593222,
        personId: 79166781234,
        date: '2019-01-26T03:06:14+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '14767593220',
        account: '79166781234',
        sum: { amount: 3.5, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 3.5, currency: 643 },
        provider: {
          id: 1861,
          shortName: 'Информационные услуги',
          longName: null,
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras:
            [
              { key: 'favorite_payment_disabled', value: 'true' },
              { key: 'regular_payment_disabled', value: 'true' }
            ]
        },
        source: {
          id: 26222,
          shortName: 'Оплата с банковской карты универсальная',
          longName: 'Оплата с банковской карты',
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras: []
        },
        comment: 'Информационные услуги по платежу 1548461172340',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'Информационные услуги', account: '79166781234' }
      },
      {
        hold: false,
        date: new Date('2019-01-26T03:06:14+03:00'),
        movements: [
          {
            id: '14767593222',
            account: { id: 'account_643' },
            invoice: null,
            sum: -3.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Информационные услуги по платежу 1548461172340'
      }
    ],
    [
      {
        txnId: 14334717424,
        personId: 79218829876,
        date: '2018-11-22T13:20:20+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Успешно',
        trmTxnId: '14334717423',
        account: '',
        sum: { amount: 5000, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 5000, currency: 643 },
        provider: {
          id: 483307,
          shortName: 'ALPARI',
          longName: 'AL ACCEPT SOLUTIONS LIMITED',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/483307_l.png',
          description: null,
          keys: null,
          siteUrl: 'http://www.alpari.ru/; http://www.alpari.com/; http://www.alpari.org/',
          extras: []
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'Альпари. Пополнение счета 273863',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'ALPARI', account: '' }
      },
      {
        hold: false,
        date: new Date('2018-11-22T13:20:20+03:00'),
        movements: [
          {
            id: '14334717424',
            account: { id: 'account_643' },
            invoice: null,
            sum: -5000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'ALPARI',
          mcc: null,
          location: null
        },
        comment: 'Альпари. Пополнение счета 273863'
      }
    ],
    [
      {
        txnId: 14630639443,
        personId: 79166781234,
        date: '2019-01-05T16:18:15+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '14630639437',
        account: '',
        sum: { amount: 6.67, currency: 840 },
        commission: { amount: 0, currency: 840 },
        total: { amount: 6.67, currency: 840 },
        provider: {
          id: 271859,
          shortName: 'AliExpress',
          longName: 'AliExpress',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/271859_l.png',
          description: null,
          keys: null,
          siteUrl: 'http://www.aliexpress.com',
          extras: []
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'Order Number:2019010531007101320078964589',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'AliExpress', account: '' }
      },
      {
        hold: false,
        date: new Date('2019-01-05T16:18:15+03:00'),
        movements: [
          {
            id: '14630639443',
            account: { id: 'account_840' },
            invoice: null,
            sum: -6.67,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'AliExpress',
          mcc: null,
          location: null
        },
        comment: 'Order Number:2019010531007101320078964589'
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, 'account')).toEqual(transaction)
  })
})
