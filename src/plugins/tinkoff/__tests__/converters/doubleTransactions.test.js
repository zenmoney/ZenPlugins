import { convertTransactions, getDoubledHoldTransactionsId } from '../../converters'

const accounts = [
  { id: '8101550435' },
  { id: '5021424493' },
  { id: '5021424485' },
  { id: '5000430875' }
]
const apiTransactions = [
  {
    hasStatement: true,
    isSuspicious: false,
    id: '1165931124',
    offers: [],
    status: 'OK',
    idSourceType: 'Online',
    type: 'Debit',
    locations: [{
      latitude: 59.9395237,
      longitude: 30.3120206
    }
    ],
    loyaltyBonus: [],
    cashbackAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 0
    },
    authMessage: 'Операция утверждена.',
    description: 'Перекресток',
    cashback: 0,
    brand: {
      name: 'Перекресток',
      baseTextColor: 'ffffff',
      logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
      id: '4',
      roundedLogo: false,
      link: 'http://www.perekrestok.ru',
      baseColor: '005221',
      logoFile: 'perekrestok.png'
    },
    amount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    },
    operationTime: {
      milliseconds: 1555441116000
    },
    spendingCategory: {
      id: '25',
      name: 'Супермаркеты',
      icon: '10',
      parentId: '3'
    },
    isHce: false,
    mcc: 5411,
    category: {
      id: '10',
      name: 'Супермаркеты'
    },
    additionalInfo: [],
    virtualPaymentType: 0,
    account: '5000430875',
    ucid: '1022338546',
    merchant: {
      name: 'Перекресток',
      region: {
        country: 'RUS',
        city: 'SANKT-PETERBU'
      }
    },
    card: '2535796',
    loyaltyPayment: [],
    group: 'PAY',
    mccString: '5411',
    cardPresent: true,
    isExternalCard: false,
    cardNumber: '521324******6765',
    accountAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    }
  },
  {
    isDispute: true,
    hasStatement: true,
    isSuspicious: false,
    id: '4526773660',
    offers: [],
    status: 'OK',
    idSourceType: 'Prime',
    type: 'Debit',
    subgroup: {
      id: 'A1',
      name: ''
    },
    locations: [{
      latitude: 59.9395237,
      longitude: 30.3120206
    }
    ],
    loyaltyBonus:
      [{
        amount: {
          value: 10,
          loyaltyProgramId: 'Cashback',
          loyalty: 'Tinkoff Black',
          name: 'Tinkoff Black',
          loyaltySteps: 1,
          loyaltyPointsId: 3,
          loyaltyPointsName: 'Rubles',
          loyaltyImagine: true,
          partialCompensation: false
        },
        loyaltyType: 'Cobrand',
        status: 'A'
      }
      ],
    cashbackAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 0
    },
    description: 'Перекресток',
    debitingTime: {
      milliseconds: 1555707600000
    },
    cashback: 0,
    brand: {
      name: 'Перекресток',
      baseTextColor: 'ffffff',
      logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
      id: '4',
      roundedLogo: false,
      link: 'http://www.perekrestok.ru',
      baseColor: '005221',
      logoFile: 'perekrestok.png'
    },
    amount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    },
    operationTime: {
      milliseconds: 1555441116000
    },
    spendingCategory: {
      id: '25',
      name: 'Супермаркеты',
      icon: '10',
      parentId: '3'
    },
    isHce: false,
    mcc: 5411,
    category: {
      id: '10',
      name: 'Супермаркеты'
    },
    additionalInfo: [],
    compensation: 'default',
    virtualPaymentType: 0,
    account: '5000430875',
    ucid: '1022338546',
    merchant: {
      name: 'Перекресток',
      region: {
        country: 'RUS',
        city: 'SANKT-PETERBU',
        address: '15 , LIT.  CHKALOVSKIJ STR',
        zip: '197110'
      }
    },
    card: '2535796',
    loyaltyPayment: [],
    group: 'PAY',
    mccString: '5411',
    cardPresent: true,
    isExternalCard: false,
    cardNumber: '521324******6765',
    accountAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    }
  },
  {
    hasStatement: true,
    isSuspicious: false,
    id: '1165931124',
    offers: [],
    status: 'OK',
    idSourceType: 'Online',
    type: 'Debit',
    locations: [{
      latitude: 59.9395237,
      longitude: 30.3120206
    }
    ],
    loyaltyBonus: [],
    cashbackAmount: {
      currency: {
        code: 840,
        name: 'USD',
        strCode: '840'
      },
      value: 0
    },
    authMessage: 'Операция утверждена.',
    description: 'Перекресток',
    cashback: 0,
    brand: {
      name: 'Перекресток',
      baseTextColor: 'ffffff',
      logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
      id: '4',
      roundedLogo: false,
      link: 'http://www.perekrestok.ru',
      baseColor: '005221',
      logoFile: 'perekrestok.png'
    },
    amount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    },
    operationTime: {
      milliseconds: 1555441116000
    },
    spendingCategory: {
      id: '25',
      name: 'Супермаркеты',
      icon: '10',
      parentId: '3'
    },
    isHce: false,
    mcc: 5411,
    category: {
      id: '10',
      name: 'Супермаркеты'
    },
    additionalInfo: [],
    virtualPaymentType: 0,
    account: '5021424485',
    ucid: '1022338546',
    merchant: {
      name: 'Перекресток',
      region: {
        country: 'RUS',
        city: 'SANKT-PETERBU'
      }
    },
    card: '2535796',
    loyaltyPayment: [],
    group: 'PAY',
    mccString: '5411',
    cardPresent: true,
    isExternalCard: false,
    cardNumber: '521324******6765',
    accountAmount: {
      currency: {
        code: 840,
        name: 'USD',
        strCode: '840'
      },
      value: 1041.89
    }
  },
  {
    hasStatement: true,
    isSuspicious: false,
    id: '1165931124',
    offers: [],
    status: 'OK',
    idSourceType: 'Online',
    type: 'Debit',
    locations: [{
      latitude: 59.9395237,
      longitude: 30.3120206
    }
    ],
    loyaltyBonus: [],
    cashbackAmount: {
      currency: {
        code: 978,
        name: 'EUR',
        strCode: '978'
      },
      value: 0
    },
    authMessage: 'Операция утверждена.',
    description: 'Перекресток',
    cashback: 0,
    brand: {
      name: 'Перекресток',
      baseTextColor: 'ffffff',
      logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
      id: '4',
      roundedLogo: false,
      link: 'http://www.perekrestok.ru',
      baseColor: '005221',
      logoFile: 'perekrestok.png'
    },
    amount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    },
    operationTime: {
      milliseconds: 1555441116000
    },
    spendingCategory: {
      id: '25',
      name: 'Супермаркеты',
      icon: '10',
      parentId: '3'
    },
    isHce: false,
    mcc: 5411,
    category: {
      id: '10',
      name: 'Супермаркеты'
    },
    additionalInfo: [],
    virtualPaymentType: 0,
    account: '5021424493',
    ucid: '1022338546',
    merchant: {
      name: 'Перекресток',
      region: {
        country: 'RUS',
        city: 'SANKT-PETERBU'
      }
    },
    card: '2535796',
    loyaltyPayment: [],
    group: 'PAY',
    mccString: '5411',
    cardPresent: true,
    isExternalCard: false,
    cardNumber: '521324******6765',
    accountAmount: {
      currency: {
        code: 978,
        name: 'EUR',
        strCode: '978'
      },
      value: 1041.89
    }
  },
  {
    hasStatement: false,
    isSuspicious: false,
    id: '1165931124',
    offers: [],
    status: 'OK',
    idSourceType: 'Online',
    type: 'Debit',
    locations: [{
      latitude: 59.9395237,
      longitude: 30.3120206
    }
    ],
    loyaltyBonus: [],
    cashbackAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 0
    },
    authMessage: 'Операция утверждена.',
    description: 'Перекресток',
    cashback: 0,
    brand: {
      name: 'Перекресток',
      baseTextColor: 'ffffff',
      logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
      id: '4',
      roundedLogo: false,
      link: 'http://www.perekrestok.ru',
      baseColor: '005221',
      logoFile: 'perekrestok.png'
    },
    amount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    },
    operationTime: {
      milliseconds: 1555441116000
    },
    spendingCategory: {
      id: '25',
      name: 'Супермаркеты',
      icon: '10',
      parentId: '3'
    },
    isHce: false,
    mcc: 5411,
    category: {
      id: '10',
      name: 'Супермаркеты'
    },
    additionalInfo: [],
    virtualPaymentType: 0,
    account: '8101550435',
    ucid: '1022338546',
    merchant: {
      name: 'Перекресток',
      region: {
        country: 'RUS',
        city: 'SANKT-PETERBU'
      }
    },
    card: '2535796',
    loyaltyPayment: [],
    group: 'PAY',
    mccString: '5411',
    cardPresent: true,
    isExternalCard: false,
    cardNumber: '521324******6765',
    accountAmount: {
      currency: {
        code: 643,
        name: 'RUB',
        strCode: '643'
      },
      value: 1041.89
    }
  }
]
// ошибочные холды (из-за проблем с дублями в выписке банка)
let doubledHoldTransactionsId = {}

doubledHoldTransactionsId = getDoubledHoldTransactionsId(apiTransactions)

describe('getDoubledHoldTransactionsId', () => {
  it('should return one invalid transaction id', () => {
    expect(doubledHoldTransactionsId).toEqual({ '1165931124': 4 })
  })
})

describe('convertTransactions', () => {
  it('should return one valid transaction without fake doubles', () => {
    const transactions = convertTransactions(apiTransactions, accounts, doubledHoldTransactionsId)
    expect(transactions).toEqual({
      '4526773660': {
        'created': 1555441116000,
        'date': '2019-04-16',
        'hold': false,
        'id': '4526773660',
        'income': 0,
        'incomeAccount': '5000430875',
        'latitude': 59.9395237,
        'longitude': 30.3120206,
        'mcc': 5411,
        'outcome': 1041.89,
        'outcomeAccount': '5000430875',
        'payee': 'Перекресток',
        'time': '21:59:36'
      } }
    )
  })
})
