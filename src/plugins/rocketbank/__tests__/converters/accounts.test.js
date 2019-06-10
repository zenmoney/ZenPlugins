import { convertAccount } from '../../converters'

const accounts = {
  'accounts': [
    [
      {
        name_in_latin: '<string[18]>',
        token: '6afa552e534043d1425e05f734386a15',
        details: 'Супер счет',
        title: 'Рублевая карта',
        bank: 'rocket',
        status: 'active',
        balance: 15.85,
        changed_tariff: false,
        current_tariff: {
          name: 'Уютный Космос',
          id: 151,
          permalink: 'rocket',
          style: 'dark',
          url: 'https://rocketbank.ru/rocket-tariffs/cozy-space-formal?app=1',
          iphone5_back: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/5/Cosmos_back.png',
          iphone4_back: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/4/Cosmos_back.png',
          iphone5_front: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/5/Cosmos.png',
          iphone4_front: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/4/Cosmos.png',
          cobrand_name: null,
          have_commission_in_mkb: false,
          valid_from: '2018-09-27',
          options: [
            {
              permalink: 'sms_notification',
              cost: 50,
              active: false,
              paid_to: null
            }
          ]
        },
        next_tariff: null,
        pan: '532130xxxxxx6616',
        month: '08',
        year: '22',
        icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/app/plastics/default',
        plastic_token: '<string[36]>',
        applepay: true,
        limits: [],
        miles_pos_percent: 1,
        balance_percent: 5.5,
        better_limits: [['На снятие',
          [['Сегодня', '200 000 ₽'],
            ['В июне', '500 000 ₽']]],
        ['На переводы по реквизитам',
          [['Сегодня', '300 000 ₽'],
            ['В июне', '600 000 ₽']]],
        ['На переводы друзьям внутри банка',
          [['Сегодня', '300 000 ₽'],
            ['В июне', '600 000 ₽']]],
        ['На переводы по номеру карты',
          [['Сегодня', '200 000 ₽'],
            ['В июне', '500 000 ₽']]],
        ['На переводы по номеру карты через сторонние сервисы',
          [['Сегодня', '200 000 ₽'],
            ['В июне', '500 000 ₽']]],
        ['На покупки по карте',
          [['Покупки сегодня', '∞'],
            ['Покупки в июне', '∞']]],
        ['Общий лимит на все операции по карте',
          [['Сегодня', '∞'],
            ['В июне', '∞']]]],
        currency: 'RUB',
        main: true,
        android_pay_works: false,
        cash_out_count: 0,
        free_cash_out_limit: 5,
        free_cash_out_limit_text: 'Неограниченно бесплатных снятий',
        unlimited_cashouts: false,
        spent: 943.75,
        operations: true,
        account_details: {
          bank_name: 'Ф Рокетбанк КИВИ Банк (АО)',
          account: '40817810360000240037',
          bic: '044525420',
          inn: '3123011520',
          kpp: '772643002',
          ks: '30101810945250000420',
          goal: 'Перечисление на собственный счет.\nНДС не облагается',
          owner: '<string[29]>',
          corr: null,
          corr_swift: null,
          benef_bank: null,
          benef_bank_address: null
        },
        change_pin: {
          check_card: {
            name: 'ALEXANDR MARCHENKO',
            image: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/app/plastics/default/iphone/pin.png',
            token: '4e53a0d3-523a-413e-baca-24a716c5d0cf',
            android_image: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/app/sexy_plastic/rocket.png',
            digits: '',
            digits_count: 16,
            text: 'Введите номер вашей карты.'
          }
        },
        reissue: {
          status: 'none',
          status_text: 'Перевыпустить карту',
          price_text: 'Выпуск новой карты займет от 3 до 7 дней. Стоимость перевыпуска 350₽.',
          enough_balance: true,
          delivery_token: null,
          title_text: 'Перевыпустить карту',
          pin: null
        },
        change_limits: true,
        extracts: true
      },
      {
        'balance': 15.85,
        'id': '6afa552e534043d1425e05f734386a15',
        'instrument': 'RUB',
        'syncID': ['6616'],
        'title': 'Рублевая карта',
        'type': 'ccard'
      }
    ],
    [
      {
        name_in_latin: '<string[18]>',
        token: '57906dc7b9157bd674f88a9a61675ecf',
        details: 'Супер счет',
        title: 'Евровый счет',
        bank: 'rocket',
        status: 'active',
        balance: 6.14,
        changed_tariff: false,
        current_tariff: {
          name: 'Уютный Космос',
          id: 151,
          permalink: 'rocket',
          style: 'dark',
          url: 'https://rocketbank.ru/open-tariffs/cozy-space-eur?app=1',
          iphone5_back: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/5/Cosmos_back.png',
          iphone4_back: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/4/Cosmos_back.png',
          iphone5_front: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/5/Cosmos.png',
          iphone4_front: 'https://s3.amazonaws.com/s3.rocketbank.ru/tariffs/open/4/Cosmos.png',
          cobrand_name: null,
          have_commission_in_mkb: false,
          valid_from: '2019-05-03',
          options: [
            {
              permalink: 'sms_notification',
              cost: 50,
              active: false,
              paid_to: null
            }
          ]
        },
        next_tariff: null,
        limits: [],
        miles_pos_percent: 1,
        balance_percent: 0.01,
        better_limits: [['На снятие',
          [['Сегодня', '200 000 ₽'],
            ['В июне', '500 000 ₽']]],
        ['На переводы друзьям внутри банка',
          [['Сегодня', '300 000 ₽'],
            ['В июне', '600 000 ₽']]],
        ['На покупки по карте',
          [['Покупки сегодня', '∞'],
            ['Покупки в июне', '∞']]],
        ['Общий лимит на все операции по карте',
          [['Сегодня', '∞'],
            ['В июне', '∞']]]],
        currency: 'EUR',
        main: false,
        android_pay_works: false,
        cash_out_count: 0,
        free_cash_out_limit: 5,
        free_cash_out_limit_text: 'Неограниченно бесплатных снятий',
        unlimited_cashouts: false,
        spent: 0,
        operations: true,
        account_details: {
          bank_name: 'Ф Рокетбанк КИВИ Банк (АО)',
          account: '40817978160000135174',
          bic: '044525420',
          inn: '3123011520',
          kpp: '772643002',
          ks: '30101810945250000420',
          goal: 'Own funds transfer Marchenko Aleksandr Valerevich. Without VAT',
          owner: '<string[30]>',
          corr: null,
          corr_swift: null,
          benef_bank: null,
          benef_bank_address: null
        },
        change_pin: {
          check_card: null
        },
        reissue: {
          status: 'none',
          status_text: 'Перевыпустить карту',
          price_text: 'Выпуск новой карты займет от 3 до 7 дней. Стоимость перевыпуска 350₽.',
          enough_balance: true,
          delivery_token: null,
          title_text: 'Перевыпустить карту',
          pin: null
        },
        change_limits: true,
        extracts: true
      },
      {
        'balance': 6.14,
        'id': '57906dc7b9157bd674f88a9a61675ecf',
        'instrument': 'EUR',
        'syncID': ['5174'],
        'title': 'Евровый счет',
        'type': 'checking'
      }
    ]
  ],

  'safeAccounts': [
    [
      {
        token: 'f46771c2549898b05c79155931d00e11',
        title: 'Евровая карта',
        bank: 'rocket',
        status: 'active',
        balance: 0,
        account_details:
        {
          bank_name: 'Ф Рокетбанк КИВИ Банк (АО)',
          account: '40817978060000065027',
          bic: '044525420',
          inn: '3123011520',
          kpp: '772643002',
          ks: '30101810945250000420',
          goal: 'Own funds transfer FIO. Without VAT',
          owner: '<string[27]>',
          corr: null,
          corr_swift: null,
          benef_bank: null,
          benef_bank_address: null
        },
        currency: 'EUR',
        url: 'https://rocketbank.ru/rocket-tariffs/account-eur?app=1',
        close_text: 'Остаток будет переведён на рублёвую карту, а счёт закрыт в течение 15 минут'
      },
      {
        'balance': 0,
        'id': 'f46771c2549898b05c79155931d00e11',
        'instrument': 'EUR',
        'syncID': ['5027'],
        'title': 'Евровая карта',
        'type': 'checking'
      }
    ]
  ]
}

describe('convertAccount', () => {
  Object.keys(accounts).forEach(type => {
    for (let i = 0; i < accounts[type].length; i++) {
      const num = accounts[type].length > 1 ? '#' + (i + 1) : ''
      it(`should convert '${type}' ${num}`, () => {
        expect(
          convertAccount(accounts[type][i][0])
        ).toEqual(
          accounts[type][i][1]
        )
      })
    }
  })
})
