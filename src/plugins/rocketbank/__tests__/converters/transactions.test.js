import { convertAccountTransaction } from '../../converters'

const accounts = {
  'cardRUB': {
    id: 'cardRUB',
    title: 'Рублёвая карта',
    type: 'ccard',
    syncID: ['1234'],
    instrument: 'RUB'
  },
  'cardEUR': {
    id: 'cardEUR',
    title: 'Евровая карта',
    type: 'ccard',
    syncID: ['6789'],
    instrument: 'EUR'
  },
  'accountRUB': {
    id: 'accountRUB',
    title: 'Сейф',
    type: 'checking',
    syncID: ['0000'],
    instrument: 'RUB'
  },
  'accountRUB2': {
    id: 'accountRUB2',
    title: 'Рублевый счет',
    type: 'checking',
    syncID: ['0000'],
    instrument: 'RUB'
  }
}

const transactions = {
  // снятие наличных в банкомате
  'atm_cash_out': [
    [
      {
        exchange_details: null,
        id: 309639227,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/6e9e09a5-1d05b6d7-bab57615-05a5c492-5626603e-cef087c8',
        context_type: 'atm_cash_out',
        details: 'Банкомат Альфа-банка',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1558709850,
        sputnik: false,
        display_money: {
          amount: -500,
          currency_code: 'RUB'
        },
        money: {
          amount: -500,
          currency_code: 'RUB'
        },
        category: {
          id: 345,
          name: 'Снятие наличных',
          display_name: 'Снятие наличных',
          icon: 'cash',
          sub_icon: '345'
        },
        merchant: {
          id: 439,
          name: 'Банкомат Альфа-банка',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/439/cool_small_c7dc5508-8ad2-46a1-8e67-66d4603a5a1c.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/439/cool_big_c7dc5508-8ad2-46a1-8e67-66d4603a5a1c.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/439/iphone_small_c7dc5508-8ad2-46a1-8e67-66d4603a5a1c.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/439/iphone_big_c7dc5508-8ad2-46a1-8e67-66d4603a5a1c.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/439/android_c7dc5508-8ad2-46a1-8e67-66d4603a5a1c.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Банкомат Альфа-банка',
        'date': new Date('2019-05-24T14:57:30+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '309639227',
            'invoice': null,
            'sum': -500
          },
          {
            'account': {
              'company': null,
              'instrument': 'RUB',
              'syncIds': null,
              'type': 'cash'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 500
          }
        ]
      }
    ]
  ],

  'atm_cash_out_open': [
    [
      {
        exchange_details: null,
        id: 212148791,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/317f96e9-87271d87-6b2bbe00-721b13f3-14480ad9-b08ec893',
        context_type: 'atm_cash_out_open',
        details: 'Банкомат Открытия',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1539265628,
        sputnik: false,
        display_money: {
          amount: -300,
          currency_code: 'EUR'
        },
        money: {
          amount: -300,
          currency_code: 'EUR'
        },
        category: {
          id: 345,
          name: 'Снятие наличных',
          display_name: 'Снятие наличных',
          icon: 'cash',
          sub_icon: '345'
        },
        merchant: {
          id: 104517,
          name: 'Банкомат Открытия',
          feed_icon: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/merchants/104517/cool_small_1a780389%2Dda8d%2D4940%2D8bc1%2D924d8d20f663.png',
          icon: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/merchants/104517/cool_big_1a780389%2Dda8d%2D4940%2D8bc1%2D924d8d20f663.png',
          iphone_small: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/merchants/104517/iphone_small_1a780389%2Dda8d%2D4940%2D8bc1%2D924d8d20f663.png',
          iphone_big: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/merchants/104517/iphone_big_1a780389%2Dda8d%2D4940%2D8bc1%2D924d8d20f663.png',
          android: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/merchants/104517/android_1a780389%2Dda8d%2D4940%2D8bc1%2D924d8d20f663.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Банкомат Открытия',
        'date': new Date('2018-10-11T13:47:08+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '212148791',
            'invoice': null,
            'sum': -300
          },
          {
            'account': {
              'company': null,
              'instrument': 'EUR',
              'syncIds': null,
              'type': 'cash'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 300
          }
        ]
      }
    ]
  ],

  // входящий card2card-перевод
  'card2card_cash_in': [
    [
      {
        exchange_details: null,
        id: 316222156,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/f8b41a01-08fbdcd8-4a6bb53e-2a36c0a8-8771f003-a8e3d4de',
        context_type: 'card2card_cash_in',
        details: 'Пополнение с карты «Сбербанк ***1858»',
        has_receipt: true,
        linked_card: {
          token: 'eb90313d-b2e160ca-4d0538bf',
          bank: 'Сбербанк',
          image: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/sberbank-card.png',
          logo: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/sberbank-logo.png',
          color: '#299f2f',
          title: '',
          icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/icon/b3ac452b-d20c-4750-8481-83eb501c5f6e.png',
          feed_icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/feed_icon/252188cd-6171-40ab-92bd-f69b31472166.png',
          small2x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/small2x/94750f35-7ab0-453f-baee-bb0a39f12768.png',
          small3x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/small3x/4c3077b7-e8ad-4e9c-b2bc-2b072e380325.png',
          pan: '546938xxxxxx1858'
        },
        mimimiles: 0,
        happened_at: 1559798293,
        sputnik: false,
        display_money: {
          amount: 405,
          currency_code: 'RUB'
        },
        money: {
          amount: 405,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 177684,
          name: 'Пополнение с карты «Сбербанк ***1858»',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Пополнение с карты «Сбербанк ***1858»',
        'date': new Date('2019-06-06T08:18:13+03:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316222156',
            'invoice': null,
            'sum': 405
          },
          {
            'account': {
              'company': {
                'id': '4624'
              },
              'instrument': 'RUB',
              'syncIds': ['1858'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -405
          }
        ]
      }
    ],
    [
      {
        exchange_details: null,
        id: 316106392,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/38f29d3b-d7ea6d36-6bee5c74-bf2eec59-3f9fcbee-5e2de0ec',
        context_type: 'card2card_cash_in',
        details: 'Пополнение с карты «Росбанк ***4115»',
        has_receipt: true,
        linked_card: {
          token: 'f5f0cc2e-e63c63c2-78127858',
          bank: 'Росбанк',
          image: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/rosbank-bank.png',
          logo: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/rosbank-logo.png',
          color: '#ebebeb',
          title: '',
          icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/682/icon/0f85917d-f3b7-4963-a7c3-d6ffac506b8f.png',
          feed_icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/682/feed_icon/1917b361-6731-48e7-b085-789c6d67d6b3.png',
          small2x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/682/small2x/92a88948-f68a-4e01-b0c7-2d0c3fa44aac.png',
          small3x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/682/small3x/130330a3-e8a2-4d1e-abcc-7d8a0f21b1fe.png',
          pan: '477986xxxxxx4115'
        },
        mimimiles: 0,
        happened_at: 1559755542,
        sputnik: false,
        display_money: {
          amount: 353,
          currency_code: 'RUB'
        },
        money: {
          amount: 353,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 2961796,
          name: 'Пополнение с карты «Росбанк ***4115»',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Пополнение с карты «Росбанк ***4115»',
        'date': new Date('2019-06-05T20:25:42+03:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316106392',
            'invoice': null,
            'sum': 353
          },
          {
            'account': {
              'company': null,
              'instrument': 'RUB',
              'syncIds': ['4115'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -353
          }
        ]
      }
    ]
  ],

  // исходящий card2card-перевод
  'card2card_cash_out': [
    [
      {
        exchange_details: null,
        id: 313905327,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/9f2c15b1-3d05fad4-72d6559e-3d69a913-dcdbfc0e-f5b6350f',
        context_type: 'card2card_cash_out',
        details: 'на карту «Сбербанк ***7948»',
        has_receipt: true,
        linked_card: {
          token: 'f97c0b82-939e56d7-1e3cc965',
          bank: 'Сбербанк',
          image: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/sberbank-card.png',
          logo: 'https://s3.amazonaws.com/s3.rocketbank.ru/cards/2/sberbank-logo.png',
          color: '#299f2f',
          title: '',
          icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/icon/b3ac452b-d20c-4750-8481-83eb501c5f6e.png',
          feed_icon_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/feed_icon/252188cd-6171-40ab-92bd-f69b31472166.png',
          small2x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/small2x/94750f35-7ab0-453f-baee-bb0a39f12768.png',
          small3x_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/card_card/banks/8897/small3x/4c3077b7-e8ad-4e9c-b2bc-2b072e380325.png',
          pan: '546938xxxxxx7948'
        },
        mimimiles: 0,
        happened_at: 1559366749,
        sputnik: false,
        display_money: {
          amount: -15200,
          currency_code: 'RUB'
        },
        money: {
          amount: -15200,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 380078,
          name: 'на карту «Сбербанк ***7948»',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'на карту «Сбербанк ***7948»',
        'date': new Date('2019-06-01T08:25:49+03:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '313905327',
            'invoice': null,
            'sum': -15200
          },
          {
            'account': {
              'company': {
                'id': '4624'
              },
              'instrument': 'RUB',
              'syncIds': ['7948'],
              'type': 'ccard'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 15200
          }
        ]
      }
    ]
  ],

  // исходящий card2card-перевод
  'card2card_cash_out_other': [
    [
      {
        exchange_details: null,
        id: 315778711,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/9bc4a20e-ad40a0dc-9d4b99f1-0a9112fc-13a709b2-c93e8c25',
        context_type: 'card2card_cash_out_other',
        details: 'Перевод через Альфа-Банк',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1559722753,
        sputnik: false,
        display_money: {
          amount: -7200,
          currency_code: 'RUB'
        },
        money: {
          amount: -7200,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 10186,
          name: 'Перевод через Альфа-Банк',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/10186/cool_small_b92baed9-3932-43f4-95f4-738d2af113c5.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/10186/cool_big_b92baed9-3932-43f4-95f4-738d2af113c5.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/10186/iphone_small_b92baed9-3932-43f4-95f4-738d2af113c5.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/10186/iphone_big_b92baed9-3932-43f4-95f4-738d2af113c5.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/10186/android_b92baed9-3932-43f4-95f4-738d2af113c5.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Перевод через Альфа-Банк',
        'date': new Date('2019-06-05T08:19:13+00:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '315778711',
            'invoice': null,
            'sum': -7200
          }
        ]
      }
    ],
    [
      {
        exchange_details: null,
        id: 316939863,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/b53cd20b-edc057ac-1c3de19c-0518fba4-4e17c6cf-5ae94f5a',
        context_type: 'card2card_cash_out_other',
        details: 'Перевод через Тинькофф',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1559910008,
        sputnik: false,
        display_money: {
          amount: -18042.67,
          currency_code: 'RUB'
        },
        money: {
          amount: -18042.67,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 47259,
          name: 'Перевод через Тинькофф',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/47259/cool_small_65752606-ad99-4494-8ac2-919e23ee6118.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/47259/cool_big_65752606-ad99-4494-8ac2-919e23ee6118.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/47259/iphone_small_65752606-ad99-4494-8ac2-919e23ee6118.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/47259/iphone_big_65752606-ad99-4494-8ac2-919e23ee6118.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/47259/android_65752606-ad99-4494-8ac2-919e23ee6118.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Перевод через Тинькофф',
        'date': new Date('2019-06-07T12:20:08+00:00'),
        'hold': true,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316939863',
            'invoice': null,
            'sum': -18042.67
          }
        ]
      }

    ],

    // [TSN] Invalid transaction 319774929. Income and outcome must be non-negative
    [
      {
        exchange_details: null,
        id: 319774929,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/76cd1c34-cf40342b-137d9221-e7398a2a-22bb1e18-98b416da',
        context_type: 'card2card_cash_out_other',
        details: 'Терминал МКБ',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1560424731,
        sputnik: false,
        display_money: {
          amount: 0,
          currency_code: 'RUB'
        },
        money: {
          amount: 0,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 311390,
          name: 'Терминал МКБ',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/311390/cool_small_d435d0d0-be8e-4ea8-9534-801cef464453.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/311390/cool_big_d435d0d0-be8e-4ea8-9534-801cef464453.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/311390/iphone_small_d435d0d0-be8e-4ea8-9534-801cef464453.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/311390/iphone_big_d435d0d0-be8e-4ea8-9534-801cef464453.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/311390/android_d435d0d0-be8e-4ea8-9534-801cef464453.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      null
    ]
  ],

  // внутренний входящий перевод
  'internal_cash_in': [
    // от клиента банка
    [
      {
        exchange_details: null,
        id: 316231340,
        status: 'confirmed',
        comment: '',
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/a675fee9-c28d5bff-d5719140-697ff29b-a24e8a36-ca287f03',
        context_type: 'internal_cash_in',
        details: 'от Ивана Петрова',
        has_receipt: true,
        friend: {
          id: 50782,
          userpic_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/1569839/mini_thumb_0dae35ed-262b-45e8-be4c-7daebea21962.jpeg',
          first_name: 'Иван',
          last_name: 'Петров',
          cover_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/i2/1011/c3abe32d-5d10-4a27-87b2-8e727cc08dee.jpg'
        },
        mimimiles: 0,
        happened_at: 1559800103,
        sputnik: false,
        display_money: {
          amount: 71783,
          currency_code: 'RUB'
        },
        money: {
          amount: 71783,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 2590577,
          name: 'от Ивана Петрова',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'от Ивана Петрова',
        'date': new Date('2019-06-06T05:48:23+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316231340',
            'invoice': null,
            'sum': 71783
          }
        ]
      }
    ],
    // перевод между своими счетами
    [
      {
        exchange_details: null,
        id: 314884329,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/c940a029-91f25c76-d3dc73b4-6aaebd16-9007ed57-f3a6b62d',
        context_type: 'internal_cash_in',
        details: 'Сейф → Рублёвая карта',
        has_receipt: true,
        friend: {
          id: 3231,
          userpic_url: null,
          first_name: 'Иван',
          last_name: 'Петров',
          cover_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/636123/22ee9366-2e79-488e-8cc9-f983be230d96.jpeg'
        },
        mimimiles: 0,
        happened_at: 1559555243,
        sputnik: false,
        display_money: {
          amount: 5850,
          currency_code: 'RUB'
        },
        money: {
          amount: 5850,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 3296572,
          name: 'Сейф → Расходная',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Сейф → Рублёвая карта',
        'date': new Date('2019-06-03T09:47:23+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'accountRUB'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -5850
          },
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': 5850
          }
        ]
      }
    ],
    // валютный перевод между счетами RUB -> EUR
    [
      {
        exchange_details: {
          from_currency: 'RUB',
          to_currency: 'EUR',
          from_amount: 1.54,
          to_amount: 0.02,
          rate: 76.77
        },
        id: 211211809,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/d1cf6fb9-1e6245c5-1bbc2f61-65de95a7-f108fcba-6ebc1b0a',
        context_type: 'internal_cash_in',
        details: 'Рублёвая карта → Евровая карта',
        has_receipt: true,
        friend: {
          id: 205977,
          userpic_url: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/image/2312417/mini_thumb_296c8079%2D5be8%2D4894%2Dadc6%2D878eb97f8f5a.jpeg',
          first_name: 'Евгения',
          last_name: 'Петрова',
          cover_url: 'https://209307.selcdn.ru:443/public.rocketbank.ru/uploads/i2/1029/0d752395%2Dd63e%2D4b6a%2Daccc%2D188a9cb0702c.jpg'
        },
        mimimiles: 0,
        happened_at: 1539077450,
        sputnik: false,
        display_money: {
          amount: 0.02,
          currency_code: 'EUR'
        },
        money: {
          amount: 0.02,
          currency_code: 'EUR'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 332903,
          name: 'Рублёвая карта → Евровая карта',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Курс обмена: 76.77',
        'date': new Date('2018-10-09T09:30:50+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'EUR',
              'sum': -0.02
            },
            'sum': -1.54
          },
          {
            'account': {
              'id': 'cardEUR'
            },
            'fee': 0,
            'id': null,
            'invoice': {
              'instrument': 'RUB',
              'sum': 1.54
            },
            'sum': 0.02
          }
        ]
      }
    ],

    // перевод на счёт виртуальной карты
    [
      {
        exchange_details: null,
        id: 322842804,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/ad129334-b8092848-e2099c6e-1efd79f2-3db018b3-d497c4e4',
        context_type: 'internal_cash_in',
        details: 'Рублевый счет → Рублевый счет',
        has_receipt: true,
        friend: {
          id: 873328,
          userpic_url: null,
          first_name: 'Денис',
          last_name: 'Васечкин',
          cover_url: null
        },
        mimimiles: 0,
        happened_at: 1560963465,
        sputnik: false,
        display_money: {
          amount: 89240,
          currency_code: 'RUB'
        },
        money: {
          amount: 89240,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 615217,
          name: 'Рублевый счет → Рублевый счет',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Рублевый счет → Рублевый счет',
        'date': new Date('2019-06-19T16:57:45+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'accountRUB2'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -89240
          }
        ]
      }
    ],

    // закрытие вклада
    [
      {
        exchange_details: {
          from_currency: 'RUB',
          to_currency: 'RUB',
          from_amount: 65269.43,
          to_amount: 65188.76,
          rate: 1
        },
        id: 313852008,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/4e1447b4-4f360aa1-96bc0b0b-f9286624-9c120129-14a546ee',
        context_type: 'internal_cash_in',
        details: 'Закрытие вклада «Трехмесячный вклад»',
        has_receipt: true,
        friend: {
          id: 13770,
          userpic_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/741510/mini_thumb_a4f4b248-5800-4dcf-9cd1-6e85318cf606.jpg',
          first_name: 'Дмитрий',
          last_name: 'Васечкин',
          cover_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/127629/7f0a0167-7196-4362-8569-5e810290787c.jpg'
        },
        mimimiles: 0,
        happened_at: 1559337071,
        sputnik: false,
        display_money: {
          amount: 65188.76,
          currency_code: 'RUB'
        },
        money: {
          amount: 65188.76,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 5343937,
          name: 'Закрытие вклада «Трехмесячный вклад»',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Закрытие вклада «Трехмесячный вклад»',
        'date': new Date('2019-05-31T21:11:11+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '313852008',
            'invoice': null,
            'sum': 65188.76
          }
        ]
      }
    ]
  ],

  // внутренний исходящий перевод
  'internal_cash_out': [
    [
      {
        exchange_details: null,
        id: 316229540,
        status: 'confirmed',
        comment: 'Сам решай',
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/789637df-2c8c0cb2-e6790493-93dc73ea-8c7d0b6e-e8942273',
        context_type: 'internal_cash_out',
        details: 'Ивану Петрову',
        has_receipt: true,
        friend: {
          id: 50782,
          userpic_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/1569839/mini_thumb_0dae35ed-262b-45e8-be4c-7daebea21962.jpeg',
          first_name: 'Иван',
          last_name: 'Петров',
          cover_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/i2/1011/c3abe32d-5d10-4a27-87b2-8e727cc08dee.jpg'
        },
        mimimiles: 0,
        happened_at: 1559799762,
        sputnik: false,
        display_money: {
          amount: -71783,
          currency_code: 'RUB'
        },
        money: {
          amount: -71783,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 2513854,
          name: 'Ивану Петрову',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Ивану Петрову: Сам решай',
        'date': new Date('2019-06-06T05:42:42+00:00'),
        'hold': false,
        'merchant': {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Иван Петров'
        },
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316229540',
            'invoice': null,
            'sum': -71783
          }
        ]
      }
    ]
  ],

  'internal_cash_out_request': [
    [
      {
        exchange_details: null,
        id: 315863216,
        status: 'confirmed',
        comment: '',
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/a797d9ae-b7a29df0-d5b73dca-9672fb7c-50d7ad2c-f5065a53',
        context_type: 'internal_cash_out_request',
        details: 'Запрос от Алексея Петрова',
        has_receipt: true,
        friend: {
          id: 64141,
          userpic_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/image/1215374/mini_thumb_6464770b-bfc8-4721-9f48-2fde36df7dc5.jpg',
          first_name: 'Алексей',
          last_name: 'Петров',
          cover_url: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/i2/1005/3b36a51d-a51e-4f7c-9a1c-7c4feaa20df9.jpg'
        },
        mimimiles: 0,
        happened_at: 1559731763,
        sputnik: false,
        display_money: {
          amount: -265,
          currency_code: 'RUB'
        },
        money: {
          amount: -265,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 5691248,
          name: 'Запрос от Алексея Петрова',
          feed_icon: null,
          icon: null,
          iphone_small: null,
          iphone_big: null,
          android: null
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Запрос от Алексея Петрова',
        'date': new Date('2019-06-05T10:49:23+00:00'),
        'hold': false,
        'merchant': {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Алексей Петров'
        },
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '315863216',
            'invoice': null,
            'sum': -265
          }
        ]
      }

    ]
  ],

  // оплата в магазине
  'pos_spending': [
    [
      {
        exchange_details: null,
        id: 316733623,
        status: 'hold',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/b77a4645-566ce47a-775e2b77-edfaf4b1-44fb444f-7b07031c',
        context_type: 'pos_spending',
        details: 'Мираторг',
        has_receipt: true,
        mimimiles: 1.41,
        happened_at: 1559886526,
        sputnik: false,
        display_money: {
          amount: -141.9,
          currency_code: 'RUB'
        },
        money: {
          amount: -141.9,
          currency_code: 'RUB'
        },
        category: {
          id: 367,
          name: 'Продукты',
          display_name: 'Продукты',
          icon: 'food',
          sub_icon: '367'
        },
        merchant: {
          id: 456,
          name: 'Мираторг',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/456/cool_small_32c32422-10c8-4326-a315-73d58dce082e.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/456/cool_big_32c32422-10c8-4326-a315-73d58dce082e.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/456/iphone_small_32c32422-10c8-4326-a315-73d58dce082e.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/456/iphone_big_32c32422-10c8-4326-a315-73d58dce082e.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/456/android_32c32422-10c8-4326-a315-73d58dce082e.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': null,
        'date': new Date('2019-06-07T05:48:46+00:00'),
        'hold': true,
        'merchant': {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Мираторг'
        },
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '316733623',
            'invoice': null,
            'sum': -141.9
          }
        ]
      }
    ]
  ],

  // внесение наличных в кассе банка
  'office_cash_in': [
    [
      {
        exchange_details: null,
        id: 279189493,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/14851f0a-507cf6f8-fe029836-6465d4b7-8047e959-c424a106',
        context_type: 'office_cash_in',
        details: 'Касса Открытия',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1553248942,
        sputnik: false,
        display_money: {
          amount: 100,
          currency_code: 'USD'
        },
        money: {
          amount: 100,
          currency_code: 'USD'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 455635,
          name: 'Касса Открытия',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/455635/cool_small_1b0813ad-4287-445d-839b-89a526972802.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/455635/cool_big_1b0813ad-4287-445d-839b-89a526972802.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/455635/iphone_small_1b0813ad-4287-445d-839b-89a526972802.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/455635/iphone_big_1b0813ad-4287-445d-839b-89a526972802.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/455635/android_1b0813ad-4287-445d-839b-89a526972802.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Касса Открытия',
        'date': new Date('2019-03-22T10:02:22+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '279189493',
            'invoice': null,
            'sum': 100
          },
          {
            'account': {
              'company': null,
              'instrument': 'USD',
              'syncIds': null,
              'type': 'cash'
            },
            'fee': 0,
            'id': null,
            'invoice': null,
            'sum': -100
          }
        ]
      }
    ]
  ],

  // перевод денег организации
  'remittance': [
    [
      {
        exchange_details: null,
        id: 310356973,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/cea3472d-6e60e64b-adcbf890-a1de4fc0-abb08a3d-4840ddc1',
        context_type: 'remittance',
        details: 'Оплата ЖКХ Пригород Лесное',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1558863545,
        sputnik: false,
        display_money: {
          amount: -7500,
          currency_code: 'RUB'
        },
        money: {
          amount: -7500,
          currency_code: 'RUB'
        },
        category: {
          id: 368,
          name: 'Перевод денег',
          display_name: 'Перевод денег',
          icon: 'money_transfer',
          sub_icon: '368'
        },
        merchant: {
          id: 3442606,
          name: 'Оплата ЖКХ Пригород Лесное',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/17/b-logos_33.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/17/b-logos_33.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/17/b-logos_33.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/17/b-logos_33.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/17/b-logos_33.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Оплата ЖКХ Пригород Лесное',
        'date': new Date('2019-05-26T09:39:05+00:00'),
        'hold': false,
        'merchant': {
          'city': null,
          'country': null,
          'location': null,
          'mcc': null,
          'title': 'Оплата ЖКХ Пригород Лесное'
        },
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '310356973',
            'invoice': null,
            'sum': -7500
          }
        ]
      }
    ]
  ],

  // входящий перевод
  'transfer_cash_in': [
    [
      {
        exchange_details: null,
        id: 313431283,
        status: 'confirmed',
        comment: null,
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/bb375f5e-85a49969-5413be3b-f6ed286a-1b4cb14f-8a158843',
        context_type: 'transfer_cash_in',
        details: 'Петров Иван Сергеевич. Перевод заработной платы и иных выплат за май 2019 г. Лицевой счет 40817810060000025555',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1559292167,
        sputnik: false,
        display_money: {
          amount: 109959,
          currency_code: 'RUB'
        },
        money: {
          amount: 109959,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 6162493,
          name: 'Петров Иван Сергеевич. Перевод заработной платы и иных выплат за май 2019 г. Лицевой счет 40817810060000025555',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/39/b-logos_77.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/39/b-logos_77.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/39/b-logos_77.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/39/b-logos_77.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/bic_banks/image/39/b-logos_77.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Петров Иван Сергеевич. Перевод заработной платы и иных выплат за май 2019 г. Лицевой счет 40817810060000025555',
        'date': new Date('2019-05-31T08:42:47+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '313431283',
            'invoice': null,
            'sum': 109959
          }
        ]
      }

    ],
    [
      {
        exchange_details: null,
        id: 312603540,
        status: 'confirmed',
        comment: 'Расходная с 29.04.2019 по 28.05.2019',
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/deb78646-115b6cf1-602e86de-23488762-4d6d0ad6-7488bf5b',
        context_type: 'transfer_cash_in',
        details: 'Выплата процентов',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1559135462,
        sputnik: false,
        display_money: {
          amount: 140.65,
          currency_code: 'RUB'
        },
        money: {
          amount: 140.65,
          currency_code: 'RUB'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 333,
          name: 'Выплата процентов',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/cool_small_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/cool_big_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/iphone_small_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/iphone_big_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/android_81634caa-b5cc-405d-98b6-8be9dcf3811a.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Выплата процентов: Расходная с 29.04.2019 по 28.05.2019',
        'date': new Date('2019-05-29T13:11:02+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '312603540',
            'invoice': null,
            'sum': 140.65
          }
        ]
      }
    ],
    [
      {
        exchange_details: null,
        id: 283115062,
        status: 'confirmed',
        comment: 'Для путешествий с 01.03.2019 по 28.03.2019',
        tag_list: [],
        friend_transfer_type: null,
        receipt_url: 'https://rocketbank.ru/receipt/7dc7e159-73066864-5d40e310-2eabc84f-a4247286-120ec240',
        context_type: 'transfer_cash_in',
        details: 'Выплата процентов',
        has_receipt: true,
        mimimiles: 0,
        happened_at: 1553864083,
        sputnik: false,
        display_money: {
          amount: 0.04,
          currency_code: 'USD'
        },
        money: {
          amount: 0.04,
          currency_code: 'USD'
        },
        category: {
          id: 437,
          name: 'Доход',
          display_name: 'Доход',
          icon: 'income',
          sub_icon: '437'
        },
        merchant: {
          id: 333,
          name: 'Выплата процентов',
          feed_icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/cool_small_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          icon: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/cool_big_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          iphone_small: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/iphone_small_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          iphone_big: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/iphone_big_81634caa-b5cc-405d-98b6-8be9dcf3811a.png',
          android: 'https://ftp.rocket-cdn.ru/public.rocketbank.ru/uploads/merchants/333/android_81634caa-b5cc-405d-98b6-8be9dcf3811a.png'
        },
        location: {
          latitude: null,
          longitude: null,
          acc: null
        },
        visible: true,
        action: null
      },
      {
        'comment': 'Выплата процентов: Для путешествий с 01.03.2019 по 28.03.2019',
        'date': new Date('2019-03-29T12:54:43+00:00'),
        'hold': false,
        'merchant': null,
        'movements': [
          {
            'account': {
              'id': 'cardRUB'
            },
            'fee': 0,
            'id': '283115062',
            'invoice': null,
            'sum': 0.04
          }
        ]
      }
    ]
  ]
}

const titleAccounts = {}
function initTitleAccounts () {
  Object.keys(accounts).forEach(type => {
    const account = accounts[type]
    titleAccounts[account.title] = account
  })
}

describe('convertTransaction', () => {
  initTitleAccounts()
  Object.keys(transactions).forEach(type => {
    for (let i = 0; i < transactions[type].length; i++) {
      const num = transactions[type].length > 1 ? '#' + i : ''
      it(`should convert '${type}' ${num}`, () => {
        expect(
          convertAccountTransaction(transactions[type][i][0], accounts['cardRUB'], titleAccounts)
        ).toEqual(
          transactions[type][i][1]
        )
      })
    }
  })
})

xdescribe('convertOneTransaction', () => {
  initTitleAccounts()
  const type = 'internal_cash_in'
  const num = 4
  it(`should convert '${type}' ${num}`, () => {
    expect(
      convertAccountTransaction(transactions[type][num][0], accounts['cardRUB'], titleAccounts)
    ).toEqual(
      transactions[type][num][1]
    )
  })
})
