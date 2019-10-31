import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        txnId: 14884077518,
        personId: 79152021234,
        date: '2019-02-11T18:38:52+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '1549899529011',
        account: '+79778279234',
        sum: { amount: 2650, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 2650, currency: 643 },
        provider: {
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
          chatAvailable: true,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'Перевод на QIWI Кошелек', account: '+79778279234' }
      },
      {
        hold: false,
        date: new Date('2019-02-11T18:38:52+03:00'),
        movements: [
          {
            id: '14884077518',
            account: { id: 'account_643' },
            invoice: null,
            sum: -2650,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '15592' },
              syncIds: ['9234']
            },
            invoice: null,
            sum: 2650,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'QIWI +79778279234',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14857388911,
        personId: 79152021234,
        date: '2019-02-07T22:05:16+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '1549566311507',
        account: '************7014',
        sum: { amount: 2500, currency: 643 },
        commission: { amount: 100, currency: 643 },
        total: { amount: 2600, currency: 643 },
        provider: {
          id: 21013,
          shortName: 'Перевод на карту Mastercard или Maestro RUS',
          longName: 'Mastercard MoneySend (Россия)',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/21013_l.png',
          description: '<p>Перевод денег на карту Mastercard или Maestro, выданную любым банком Российской Федерации.</p><p><br></p><p>Срок зачисления: <span style="font-weight: bold;">от нескольких секунд до 5 банковских дней</span>.</p><p>Ограничения: сумма переводов до <nobr>600 000</nobr> рублей в месяц.</p><p><br></p><p><a href="https://static.qiwi.com/ru/doc/oferta_card_payment.pdf">Оферта на оплату картой без регистрации</a></p><p><a href="https://static.qiwi.com/ru/doc/vmt.pdf">Оферта на оплату со счета QIWI Кошелька</a></p>',
          keys: 'mastercard; master; mc; MCMS; пополнение; мастер; перевод; переводы; денежные; cash; вывод; банк; карты; счет',
          siteUrl: 'https://www.mastercard.ru',
          extras: [
            {
              key: 'ceo_description',
              value: 'Перевод на любую карту Mastercard или Maestro выпущенную банком РФ с банковской карты, со счета мобильного телефона или через QIWI Кошелек.'
            },
            {
              key: 'ceo_title',
              value: 'Перевод на карту Mastercard или Maestro  с карты любого банка РФ'
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
        view: {
          title: 'Перевод на карту Mastercard или Maestro RUS',
          account: '************7014'
        }
      },
      {
        hold: false,
        date: new Date('2019-02-07T22:05:16+03:00'),
        movements: [
          {
            id: '14857388911',
            account: { id: 'account_643' },
            invoice: null,
            sum: -2500,
            fee: -100
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: null,
              syncIds: ['7014']
            },
            invoice: null,
            sum: 2500,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод на карту Mastercard или Maestro RUS'
      }
    ],
    [
      {
        txnId: 14781364975,
        personId: 79166781234,
        date: '2019-01-28T03:19:46+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '1548634784354',
        account: '4100192025225',
        sum: { amount: 300, currency: 643 },
        commission: { amount: 9, currency: 643 },
        total: { amount: 309, currency: 643 },
        provider: {
          id: 26476,
          shortName: 'Яндекс.Деньги',
          longName: 'ООО НКО «Яндекс.Деньги»',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/26476_l.png',
          description: '<p>Яндекс.Деньги — российский сервис электронных платежей.</p>',
          keys: 'яндекс, yandex, деньги, яндекс.деньги, yandex.money, money, Yandex , Яндекс, Деньги, Money, Яндекс.Деньги, яндекс деньги, Яндекс Деньги',
          siteUrl: 'https://money.yandex.ru/',
          extras: [
            {
              key: 'ceo_description',
              value: 'Положить деньги на Яндекс.Деньги стало проще с QIWI. Пополняйте Яндекс кошелек с банковской карты, со счета мобильного телефона или через QIWI Кошелек.'
            },
            {
              key: 'ceo_title',
              value: 'Яндекс.Деньги - пополнение кошелька с банковской карты, с баланса мобильного, через QIWI Кошелек'
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
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: true,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'Яндекс.Деньги', account: '4100192025225' }
      },
      {
        hold: false,
        date: new Date('2019-01-28T03:19:46+03:00'),
        movements: [
          {
            id: '14781364975',
            account: { id: 'account_643' },
            invoice: null,
            sum: -300,
            fee: -9
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '15420' },
              syncIds: ['5225']
            },
            invoice: null,
            sum: 300,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Яндекс.Деньги 4100192025225',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        txnId: 14364341953,
        personId: 79218829876,
        date: '2018-11-26T14:39:19+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Успешно',
        trmTxnId: '343232359',
        account: '79218829876',
        sum: { amount: 10000, currency: 643 },
        commission: { amount: 160, currency: 643 },
        total: { amount: 10160, currency: 643 },
        provider: {
          id: 466,
          shortName: 'Тинькофф Банк',
          longName: 'АО «Тинькофф Банк»',
          logoUrl: 'https://static.qiwi.com/img/providers/logoBig/466_l.png',
          description: 'Сумма переводов за 7 дней на один номер счета, карты или договора не должна превышать <nobr>600 000</nobr> рублей.',
          keys: 'банк тиньков, nbymrja, Банк Теньков, банк тенькофф, тенькоф, теньков, кредитная, кредитная карта, тиньков, тинкофф, ткс, кредиты, оплата кредита, кредит, tinkoff, tinkov, tks, вывод, вывести деньги, банки, получить деньги, вывод из системы, банк, rhtlbnyfz, nbymrja, тинькоф, тинков',
          siteUrl: 'https://www.tinkoff.ru/',
          extras: [
            {
              key: 'ceo_description',
              value: 'Переводите деньги на карту или номер счета Тинькофф Банк без комиссии через QIWI кошелек выбрав удобный способ оплаты. Пополнить счет Тинькофф Банк банковской картой Сбербанка, Альфа, ВТБ, Райфайзен и многих других, со счета мобильного телефона или наличными.'
            },
            {
              key: 'ceo_title',
              value: 'Перевод на карту Тинькофф Банк: с карты другого банка, по номеру счета, с мобильного или налчиными'
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
        view: { title: 'Тинькофф Банк', account: '79218829876' }
      },
      {
        hold: false,
        date: new Date('2018-11-26T14:39:19+03:00'),
        movements: [
          {
            id: '14364341953',
            account: { id: 'account_643' },
            invoice: null,
            sum: -10000,
            fee: -160
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '4902' },
              syncIds: null
            },
            invoice: null,
            sum: 10000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, 'account')).toEqual(transaction)
  })
})
