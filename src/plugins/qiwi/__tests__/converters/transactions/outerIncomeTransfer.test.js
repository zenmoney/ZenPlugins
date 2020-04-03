import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        txnId: 14885464332,
        personId: 79152021234,
        date: '2019-02-11T21:42:39+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'IN',
        statusText: 'Success',
        trmTxnId: '2071000630027886',
        account: 'QIWI Bank',
        sum: { amount: 1000, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 1000, currency: 643 },
        provider: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        source: {
          id: 99,
          shortName: 'Перевод на QIWI Кошелек',
          longName: 'Доставляется мгновенно',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/99_l.png',
          description: null,
          keys: 'пополнить, перевести, qiwi, кошелек, оплатить, онлайн, оплата, счет, способ, услуга,перевести',
          siteUrl: 'http://www.qiwi.com',
          extras: [
            {
              key: 'ceo_description',
              value: 'Пополнение QIWI Кошелька банковской картой без комисии, со счета мобильного телефона или через крупнейшую сеть QIWI Терминалов. Оплачивать услуги стало проще.'
            },
            {
              key: 'ceo_title',
              value: 'Пополнить QIWI Кошелек: с банковской карты, с баланса телефона, через QIWI Кошелек'
            },
            { key: 'is_spa_form_available', value: 'true' }
          ]
        },
        comment: 'Пополнение или возврат платежа по QVC\\QVP',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: false,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: true,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'QIWI Кошелек', account: 'QIWI Bank' }
      },
      {
        hold: false,
        date: new Date('2019-02-11T21:42:39+03:00'),
        movements: [
          {
            id: '14885464332',
            account: { id: 'account_643' },
            invoice: null,
            sum: 1000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -1000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение или возврат платежа по QVC\\QVP'
      }
    ],
    [
      {
        txnId: 14843237809,
        personId: 79152021234,
        date: '2019-02-05T20:18:50+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'IN',
        statusText: 'Success',
        trmTxnId: '23734915151008',
        account: '10485904',
        sum: { amount: 5000, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 5000, currency: 643 },
        provider: {
          id: 1057,
          shortName: 'QIWI Кошелек , пополнение, ЛК провайдеры',
          longName: 'QIWI Кошелек',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/99_l.png',
          description: null,
          keys: 'qiwi кошелек, wallet, перевести, qiv, qivi, киви кошелек, Мобильный кошелек, Мобильный кошелёк, кошелек, Личный Кабинет, киви, qiwi, личный кабинет qiwi, перевод между пользователями, перевод денег, kivi, электронные деньги, отправить деньги, kiwi',
          siteUrl: 'http://qiwi-in-use.livejournal.com/154487.html',
          extras: []
        },
        source: {
          id: 99,
          shortName: 'Перевод на QIWI Кошелек',
          longName: 'Доставляется мгновенно',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/99_l.png',
          description: null,
          keys: 'пополнить, перевести, qiwi, кошелек, оплатить, онлайн, оплата, счет, способ, услуга,перевести',
          siteUrl: 'http://www.qiwi.com',
          extras: [
            {
              key: 'ceo_description',
              value: 'Пополнение QIWI Кошелька банковской картой без комисии, со счета мобильного телефона или через крупнейшую сеть QIWI Терминалов. Оплачивать услуги стало проще.'
            },
            {
              key: 'ceo_title',
              value: 'Пополнить QIWI Кошелек: с банковской карты, с баланса телефона, через QIWI Кошелек'
            },
            { key: 'is_spa_form_available', value: 'true' }
          ]
        },
        comment: 'себе',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: false,
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
          title: 'QIWI Кошелек , пополнение, ЛК провайдеры',
          account: '10485904'
        }
      },
      {
        hold: false,
        date: new Date('2019-02-05T20:18:50+03:00'),
        movements: [
          {
            id: '14843237809',
            account: { id: 'account_643' },
            invoice: null,
            sum: 5000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -5000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'себе'
      }
    ],
    [
      {
        txnId: 14782489683,
        personId: 79166781234,
        date: '2019-01-28T10:31:05+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'IN',
        statusText: 'Success',
        trmTxnId: '19012810310560',
        account: '',
        sum: { amount: 268.88, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 268.88, currency: 643 },
        provider: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        source: {
          id: 99,
          shortName: 'Перевод на QIWI Кошелек',
          longName: 'Доставляется мгновенно',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/99_l.png',
          description: null,
          keys: 'пополнить, перевести, qiwi, кошелек, оплатить, онлайн, оплата, счет, способ, услуга,перевести',
          siteUrl: 'http://www.qiwi.com',
          extras: [
            {
              key: 'ceo_description',
              value: 'Пополнение QIWI Кошелька банковской картой без комисии, со счета мобильного телефона или через крупнейшую сеть QIWI Терминалов. Оплачивать услуги стало проще.'
            },
            {
              key: 'ceo_title',
              value: 'Пополнить QIWI Кошелек: с банковской карты, с баланса телефона, через QIWI Кошелек'
            },
            { key: 'is_spa_form_available', value: 'true' }
          ]
        },
        comment: 'Автоматический платеж по агентскому договору',
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: false,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'QIWI Кошелек', account: '' }
      },
      {
        hold: false,
        date: new Date('2019-01-28T10:31:05+03:00'),
        movements: [
          {
            id: '14782489683',
            account: { id: 'account_643' },
            invoice: null,
            sum: 268.88,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -268.88,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Автоматический платеж по агентскому договору'
      }
    ],
    [
      {
        txnId: 13319571944,
        personId: 79881234567,
        date: '2018-06-21T20:02:51+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'IN',
        statusText: 'Success',
        trmTxnId: '2911474611',
        account: 'Платежная система',
        sum: {
          amount: 200,
          currency: 643
        },
        commission: {
          amount: 0,
          currency: 643
        },
        total: {
          amount: 200,
          currency: 643
        },
        provider: {
          id: 26444,
          shortName: 'Рапида',
          longName: 'НКО Рапида (резиденты)',
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras: [{
            key: 'is_spa_form_available',
            value: 'true'
          }]
        },
        source: {
          id: 99,
          shortName: 'Перевод на QIWI Кошелек',
          longName: 'Доставляется мгновенно',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/99_l.png',
          description: null,
          keys: 'пополнить, перевести, qiwi, кошелек, оплатить, онлайн, оплата, счет, способ, услуга,перевести',
          siteUrl: 'http://www.qiwi.com',
          extras: [{
            key: 'ceo_description',
            value: 'Способы пополнения QIWI кошелька онлайн. Как перевести деньги на QIWI кошелек. Оплата онлайн через электронный QIWI кошелек.'
          }, {
            key: 'ceo_title',
            value: 'Пополнить QIWI кошелек - перевод и пополнение онлайн электронный QIWI кошелька'
          }, {
            key: 'is_spa_form_available',
            value: 'true'
          }]
        },
        comment: null,
        currencyRate: 1,
        paymentExtras: [],
        features: {
          chequeReady: false,
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
          title: 'Рапида',
          account: 'Платежная система'
        }
      },
      {
        hold: false,
        date: new Date('2018-06-21T20:02:51+03:00'),
        movements: [
          {
            id: '13319571944',
            account: { id: 'account_643' },
            invoice: null,
            sum: 200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -200,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод на QIWI Кошелек'
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, 'account')).toEqual(transaction)
  })
})
