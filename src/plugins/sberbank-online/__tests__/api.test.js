import { filterTransactions, getErrorMessage } from '../api'

describe('getErrorMessage', () => {
  it('returns error text if found', () => {
    expect(getErrorMessage({
      status: {
        code: '1',
        errors: {
          error: {
            text: 'Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин'
          }
        }
      },
      loginCompleted: 'false'
    }, 2)).toEqual('Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин')

    expect(getErrorMessage({
      status: {
        code: '4'
      },
      cards: {
        status: {
          code: '4',
          errors: {
            error: {
              text: 'Информация по картам из АБС временно недоступна. Повторите операцию позже.'
            }
          }
        }
      },
      accounts: {
        status: {
          code: '0'
        }
      }
    }, 3)).toEqual('Информация по картам из АБС временно недоступна. Повторите операцию позже.')
  })

  it('returns null if maxDepth is less than needed', () => {
    expect(getErrorMessage({
      status: {
        code: '1',
        errors: {
          error: {
            text: 'Неверный логин или пароль. Следующая неверная попытка заблокирует вход в Сбербанк Онлайн на 1ч 00 мин'
          }
        }
      },
      loginCompleted: 'false'
    }, 1)).toBeNull()

    expect(getErrorMessage({
      status: {
        code: '4'
      },
      cards: {
        status: {
          code: '4',
          errors: {
            error: {
              text: 'Информация по картам из АБС временно недоступна. Повторите операцию позже.'
            }
          }
        }
      },
      accounts: {
        status: {
          code: '0'
        }
      }
    }, 2)).toBeNull()
  })
})

describe('filterTransactions', () => {
  it('filters hold if settlement is present', () => {
    expect(filterTransactions([
      {
        id: '12025283019',
        ufsId: null,
        state: 'FINANCIAL',
        date: '01.02.2019T13:36:52',
        from: '6762 80** **** **44 81',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '5000.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12002906945',
        ufsId: null,
        state: 'FINANCIAL',
        date: '30.01.2019T09:23:59',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Тинькофф Банк',
        description: 'Прочие списания',
        operationAmount: { amount: '-2500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardOtherOut',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } }
      },
      {
        id: '12002906939',
        ufsId: null,
        state: 'FINANCIAL',
        date: '30.01.2019T02:50:25',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'OZON.ru',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-1390.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/dbcf613f-9b21-4e1b-9d9a-bfc84f00741d.png' } }
      },
      {
        id: '11940587992',
        ufsId: null,
        state: 'FINANCIAL',
        date: '29.01.2019T18:56:54',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Пятерочка',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-11.31', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/878dcf21-62a4-4e50-9507-09f4bf89e8e0.png' } }
      },
      {
        id: '11940587966',
        ufsId: null,
        state: 'FINANCIAL',
        date: '29.01.2019T18:42:37',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'MKS N4',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-52.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '11886972745',
        ufsId: null,
        state: 'FINANCIAL',
        date: '27.01.2019T16:26:10',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Пятерочка',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-582.15', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/878dcf21-62a4-4e50-9507-09f4bf89e8e0.png' } }
      },
      {
        id: '11886972739',
        ufsId: null,
        state: 'AUTHORIZATION',
        date: '27.01.2019T13:28:00',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'OZON.ru',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-1390.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/dbcf613f-9b21-4e1b-9d9a-bfc84f00741d.png' } }
      }
    ])).toEqual([
      {
        id: '12025283019',
        ufsId: null,
        state: 'FINANCIAL',
        date: '01.02.2019T13:36:52',
        from: '6762 80** **** **44 81',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '5000.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12002906945',
        ufsId: null,
        state: 'FINANCIAL',
        date: '30.01.2019T09:23:59',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Тинькофф Банк',
        description: 'Прочие списания',
        operationAmount: { amount: '-2500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardOtherOut',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } }
      },
      {
        id: '12002906939',
        ufsId: null,
        state: 'FINANCIAL',
        date: '30.01.2019T02:50:25',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'OZON.ru',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-1390.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/dbcf613f-9b21-4e1b-9d9a-bfc84f00741d.png' } }
      },
      {
        id: '11940587992',
        ufsId: null,
        state: 'FINANCIAL',
        date: '29.01.2019T18:56:54',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Пятерочка',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-11.31', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/878dcf21-62a4-4e50-9507-09f4bf89e8e0.png' } }
      },
      {
        id: '11940587966',
        ufsId: null,
        state: 'FINANCIAL',
        date: '29.01.2019T18:42:37',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'MKS N4',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-52.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '11886972745',
        ufsId: null,
        state: 'FINANCIAL',
        date: '27.01.2019T16:26:10',
        from: 'Зарплатная 5469 60** **** 1239',
        to: 'Пятерочка',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-582.15', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/878dcf21-62a4-4e50-9507-09f4bf89e8e0.png' } }
      }
    ])
  })

  it('filters duplicate for executed instruction', () => {
    expect(filterTransactions([
      {
        id: '12087175649',
        ufsId: null,
        state: 'FINANCIAL',
        date: '04.02.2019T11:45:39',
        from: '2202 20** **** 1100',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12087175617',
        ufsId: null,
        state: 'FINANCIAL',
        date: '04.02.2019T10:05:59',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'YANDEX.MONEY.FASILITATOR',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '12081077506',
        ufsId: null,
        state: 'EXECUTED',
        date: '04.02.2019T10:05:27',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100004178309',
        description: 'Оплата услуг Интернет-магазинов',
        operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExternalProviderPayment',
        imageId: { staticImage: { url: null } }
      }
    ])).toEqual([
      {
        id: '12087175649',
        ufsId: null,
        state: 'FINANCIAL',
        date: '04.02.2019T11:45:39',
        from: '2202 20** **** 1100',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12081077506',
        ufsId: null,
        state: 'EXECUTED',
        date: '04.02.2019T10:05:27',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100004178309',
        description: 'Оплата услуг Интернет-магазинов',
        operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExternalProviderPayment',
        imageId: { staticImage: { url: null } }
      }
    ])
  })

  it('filters hold duplicate for executed instruction', () => {
    expect(filterTransactions([
      {
        id: '12156435571',
        ufsId: null,
        state: 'AUTHORIZATION',
        date: '06.02.2019T17:13:55',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'Sberbank platezh',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-50.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '12155327084',
        ufsId: null,
        state: 'EXECUTED',
        date: '06.02.2019T17:13:28',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100001170215',
        description: 'Оплата услуг Интернет-магазинов',
        operationAmount: { amount: '-50.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExternalProviderPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '12153415614',
        ufsId: null,
        state: 'AUTHORIZATION',
        date: '06.02.2019T15:50:51',
        from: '2202 20** **** 2309',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12131667052',
        ufsId: null,
        state: 'FINANCIAL',
        date: '05.02.2019T17:24:25',
        from: '6762 80** **** **23 44',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '1800.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12087175649',
        ufsId: null,
        state: 'FINANCIAL',
        date: '04.02.2019T11:45:39',
        from: '2202 20** **** 1911',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      }
    ])).toEqual([
      {
        id: '12155327084',
        ufsId: null,
        state: 'EXECUTED',
        date: '06.02.2019T17:13:28',
        from: 'MasterCard Mass 5469 75** **** 9222',
        to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100001170215',
        description: 'Оплата услуг Интернет-магазинов',
        operationAmount: { amount: '-50.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExternalProviderPayment',
        imageId: { staticImage: { url: null } }
      },
      {
        id: '12153415614',
        ufsId: null,
        state: 'AUTHORIZATION',
        date: '06.02.2019T15:50:51',
        from: '2202 20** **** 2309',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12131667052',
        ufsId: null,
        state: 'FINANCIAL',
        date: '05.02.2019T17:24:25',
        from: '6762 80** **** **23 44',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '1800.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      },
      {
        id: '12087175649',
        ufsId: null,
        state: 'FINANCIAL',
        date: '04.02.2019T11:45:39',
        from: '2202 20** **** 1911',
        to: 'Сбербанк Онлайн',
        description: 'Входящий перевод',
        operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferIn',
        imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } }
      }
    ])
  })
})
