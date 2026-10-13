import fixture1 from './convertReceipt-01.html'
import fixture2 from './convertReceipt-02.html'
import fixture3 from './convertReceipt-03.html'
import fixture4 from './convertReceipt-04.html'
import fixture5 from './convertReceipt-05.html'
import fixture6 from './convertReceipt-06.html'
import fixture7 from './convertReceipt-07.html'
import fixture8 from './convertReceipt-08.html'
import fixture9 from './convertReceipt-09.html'
import fixture10 from './convertReceipt-10.html'
import fixture11 from './convertReceipt-11.html'
import fixture12 from './convertReceipt-12.html'
import fixture13 from './convertReceipt-13.html'
import fixture14 from './convertReceipt-14.html'
import fixture15 from './convertReceipt-15.html'
import fixture16 from './convertReceipt-16.html'
import fixture17 from './convertReceipt-17.html'
import fixture18 from './convertReceipt-18.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-04-15',
      time: '00:02'
    },
    currency: 'UZS',
    totalAmount: '216467',
    merchant: {
      name: 'Корзинка Integro',
      address: 'Чиланзарский р-он, ул. Бунёдкор, 52 д.',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Сыр костромской Pure Milky 45%, вес',
        quantity: '0.29',
        totalAmount: '23487.09',
        originalTotalAmount: '23487.1',
        adjustments: [
          {
            kind: 'other',
            amount: '-0.01'
          }
        ],
        originalUnitPrice: '80990'
      },
      {
        name: 'Лаваш "Yupqa Lavash" 300г',
        quantity: '1',
        unitPrice: '6390',
        totalAmount: '6390'
      },
      {
        name: '* Подгузники Pampers 5*78',
        quantity: '1',
        totalAmount: '186589.91',
        originalTotalAmount: '219390',
        adjustments: [
          {
            kind: 'discount',
            amount: '-32800'
          },
          {
            kind: 'other',
            amount: '-0.09'
          }
        ],
        originalUnitPrice: '219390',
        unitPrice: '186589.91'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '216467'
      }
    ]
  })
})

test('converts source case 02', () => {
  expect(convertReceipt(fixture2)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-04-23',
      time: '19:03'
    },
    currency: 'UZS',
    totalAmount: '1990',
    merchant: {
      name: 'Корзинка Авиасозлар',
      address: 'Яшнабадский р-он, пересечение улиц Авиасозлар и Бирлашган',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Вода Hydrolife Eco без газа 1л',
        quantity: '1',
        unitPrice: '1990',
        totalAmount: '1990'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '1990'
      },
      {
        method: 'card',
        amount: '0'
      }
    ]
  })
})

test('converts source case 03', () => {
  expect(convertReceipt(fixture3)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-04-24',
      time: '20:22'
    },
    currency: 'UZS',
    totalAmount: '24950',
    merchant: {
      name: 'Маркет',
      address: 'Чиланзарский р-он, Катта Каъни, 13/1',
      identifiers: [
        {
          value: '305645847',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Товары народного потребления в ассортиме',
        quantity: '1',
        unitPrice: '24950',
        totalAmount: '24950'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '24950'
      },
      {
        method: 'card',
        amount: '0'
      }
    ]
  })
})

test('converts source case 04', () => {
  expect(convertReceipt(fixture4)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-04-01',
      time: '19:23'
    },
    currency: 'UZS',
    totalAmount: '2150',
    merchant: {
      name: 'Аптека №14',
      address: 'город Ташкент, Яшнабадский район, массив Авиасозлар, 1- квартал д.41, кваритира 5 и 7',
      identifiers: [
        {
          value: '300544074',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Эналаприл 10мг №20Борисовский завод медп2',
        quantity: '2',
        unitPrice: '1075',
        totalAmount: '2150'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '2150'
      },
      {
        method: 'card',
        amount: '0'
      }
    ]
  })
})

test('converts source case 05', () => {
  expect(convertReceipt(fixture5)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-04-27',
      time: '08:53'
    },
    currency: 'UZS',
    totalAmount: '130550',
    merchant: {
      name: 'Аптека Oxymed №7',
      address: 'Мирзо-Улугбекский р-н, ул.Кадырова д.1/16/17',
      identifiers: [
        {
          value: '300544074',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Фенистил Нью 0,1% 20мл каплиNovartis Consumer/Швейцария1',
        quantity: '1',
        unitPrice: '48900',
        totalAmount: '48900'
      },
      {
        name: 'Кюсид Бэби 30млCoral Laboratories  Limited Ин1',
        quantity: '1',
        unitPrice: '33550',
        totalAmount: '33550'
      },
      {
        name: 'Пакет п/э |Майка| №1*1',
        quantity: '1',
        unitPrice: '300',
        totalAmount: '300'
      },
      {
        name: '923 Подгуз Huggies Elite Soft Convy размер#1 №25Кимберкли Кларк',
        quantity: '25',
        unitPrice: '1912',
        totalAmount: '47800'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '130550'
      }
    ]
  })
})

// Source item totals sum to 291999.84 while the receipt total is 291999.9; preserve both without balancing.
test('converts source case 06', () => {
  expect(convertReceipt(fixture6)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-06-13',
      time: '16:33'
    },
    currency: 'UZS',
    totalAmount: '291999.9',
    merchant: {
      name: 'Корзинка Integro',
      address: 'Чиланзарский р-он, ул. Бунёдкор, 52 д.',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Фишка "Алиса в стране чудес"',
        quantity: '3',
        totalAmount: '0',
        originalTotalAmount: '0.03',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.03'
          }
        ],
        originalUnitPrice: '0.01',
        unitPrice: '0'
      },
      {
        name: 'Соль "КФ" экстра 1кг',
        quantity: '1',
        totalAmount: '2183.65',
        originalTotalAmount: '2190',
        adjustments: [
          {
            kind: 'other',
            amount: '-6.35'
          }
        ],
        originalUnitPrice: '2190',
        unitPrice: '2183.65'
      },
      {
        name: 'Помидоры Pink Paradise ,вес',
        quantity: '1.61',
        totalAmount: '15234.6',
        originalTotalAmount: '15278.9',
        adjustments: [
          {
            kind: 'other',
            amount: '-44.3'
          }
        ],
        originalUnitPrice: '9490'
      },
      {
        name: 'Бульон Gallina Blanca куриный 90г',
        quantity: '1',
        totalAmount: '4177.85',
        originalTotalAmount: '4190',
        adjustments: [
          {
            kind: 'other',
            amount: '-12.15'
          }
        ],
        originalUnitPrice: '4190',
        unitPrice: '4177.85'
      },
      {
        name: 'Каша Heinz кашка с грушей + Омега3 200г',
        quantity: '1',
        totalAmount: '27410.3',
        originalTotalAmount: '27490',
        adjustments: [
          {
            kind: 'other',
            amount: '-79.7'
          }
        ],
        originalUnitPrice: '27490',
        unitPrice: '27410.3'
      },
      {
        name: 'Молоко BIO SUT стерил 3,2% 1кг',
        quantity: '1',
        totalAmount: '8465.39',
        originalTotalAmount: '8490',
        adjustments: [
          {
            kind: 'other',
            amount: '-24.61'
          }
        ],
        originalUnitPrice: '8490',
        unitPrice: '8465.39'
      },
      {
        name: 'Бульон "Роллтон" куриный вкус 90г',
        quantity: '1',
        totalAmount: '4476.98',
        originalTotalAmount: '4490',
        adjustments: [
          {
            kind: 'other',
            amount: '-13.02'
          }
        ],
        originalUnitPrice: '4490',
        unitPrice: '4476.98'
      },
      {
        name: 'Каша Heinz гречс молоком 4м 200г',
        quantity: '1',
        totalAmount: '27410.3',
        originalTotalAmount: '27490',
        adjustments: [
          {
            kind: 'other',
            amount: '-79.7'
          }
        ],
        originalUnitPrice: '27490',
        unitPrice: '27410.3'
      },
      {
        name: 'Напиток Fanta с/б 250мл',
        quantity: '1',
        totalAmount: '5474.08',
        originalTotalAmount: '5490',
        adjustments: [
          {
            kind: 'other',
            amount: '-15.92'
          }
        ],
        originalUnitPrice: '5490',
        unitPrice: '5474.08'
      },
      {
        name: 'Напиток Sprite с/б 250мл',
        quantity: '1',
        totalAmount: '5474.08',
        originalTotalAmount: '5490',
        adjustments: [
          {
            kind: 'other',
            amount: '-15.92'
          }
        ],
        originalUnitPrice: '5490',
        unitPrice: '5474.08'
      },
      {
        name: 'Напиток Coca Cola с/б 250мл',
        quantity: '1',
        totalAmount: '5474.08',
        originalTotalAmount: '5490',
        adjustments: [
          {
            kind: 'other',
            amount: '-15.92'
          }
        ],
        originalUnitPrice: '5490',
        unitPrice: '5474.08'
      },
      {
        name: 'Влажные салфетки Hushbuy 72шт',
        quantity: '1',
        totalAmount: '9462.49',
        originalTotalAmount: '9490',
        adjustments: [
          {
            kind: 'other',
            amount: '-27.51'
          }
        ],
        originalUnitPrice: '9490',
        unitPrice: '9462.49'
      },
      {
        name: 'Cалфетки влаж Sunlight cream 120шт',
        quantity: '1',
        totalAmount: '13949.44',
        originalTotalAmount: '13990',
        adjustments: [
          {
            kind: 'other',
            amount: '-40.56'
          }
        ],
        originalUnitPrice: '13990',
        unitPrice: '13949.44'
      },
      {
        name: 'Йогурт питKamilka с кусМалина1,2% 290г',
        quantity: '1',
        totalAmount: '5474.08',
        originalTotalAmount: '5490',
        adjustments: [
          {
            kind: 'other',
            amount: '-15.92'
          }
        ],
        originalUnitPrice: '5490',
        unitPrice: '5474.08'
      },
      {
        name: 'Подгузники Pampers 5*78',
        quantity: '1',
        totalAmount: '157033.39',
        originalTotalAmount: '184990',
        adjustments: [
          {
            kind: 'discount',
            amount: '-27500'
          },
          {
            kind: 'other',
            amount: '-456.61'
          }
        ],
        originalUnitPrice: '184990',
        unitPrice: '157033.39'
      },
      {
        name: 'Пакет с логотипом К (ПКБ ) с руч',
        quantity: '1',
        totalAmount: '299.13',
        originalTotalAmount: '300',
        adjustments: [
          {
            kind: 'other',
            amount: '-0.87'
          }
        ],
        originalUnitPrice: '300',
        unitPrice: '299.13'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '291999.9'
      }
    ]
  })
})

test('converts source case 07', () => {
  expect(convertReceipt(fixture7)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-06-16',
      time: '11:26'
    },
    currency: 'UZS',
    totalAmount: '20470',
    merchant: {
      name: 'Корзинка Oazis',
      address: 'Учтепинский р-он, пересечение ул. Фархода и Лутфий, дом 21а',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Молоч Коктейль Nesquik шоколадный 200мл',
        quantity: '1',
        unitPrice: '3490',
        totalAmount: '3490'
      },
      {
        name: 'Сэндвич Panino С колбасой 170г',
        quantity: '1',
        unitPrice: '14990',
        totalAmount: '14990'
      },
      {
        name: 'Вода Hydrolife Eco без газа 1л',
        quantity: '1',
        unitPrice: '1990',
        totalAmount: '1990'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '20470'
      }
    ]
  })
})

test('converts source case 08', () => {
  expect(convertReceipt(fixture8)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-06-30',
      time: '20:20'
    },
    currency: 'UZS',
    totalAmount: '168179.86',
    merchant: {
      name: 'Корзинка Бешкарагач',
      address: 'Учтепинский р-он, ул. Кукча Дарвоза',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Фишка "Алиса в стране чудес"',
        quantity: '1',
        totalAmount: '0',
        originalTotalAmount: '0.01',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.01'
          }
        ],
        originalUnitPrice: '0.01',
        unitPrice: '0'
      },
      {
        name: 'Хандалак, шт',
        quantity: '1',
        unitPrice: '13990',
        totalAmount: '13990'
      },
      {
        name: 'Персик гладкий жёлтый, вес',
        quantity: '0.902',
        unitPrice: '24990',
        totalAmount: '22540.98'
      },
      {
        name: 'Слива, вес',
        quantity: '0.832',
        unitPrice: '17990',
        totalAmount: '14967.68'
      },
      {
        name: 'Плит RITTER SPORT мол с кокос нач 100г',
        quantity: '1',
        unitPrice: '18990',
        totalAmount: '18990'
      },
      {
        name: "Леденец Маленький Xo'rozqand",
        quantity: '1',
        unitPrice: '3090',
        totalAmount: '3090'
      },
      {
        name: 'Пакет Крафт 30/31см шт',
        quantity: '1',
        unitPrice: '390',
        totalAmount: '390'
      },
      {
        name: 'Лепёшка "Корзинка"',
        quantity: '2',
        unitPrice: '1900',
        totalAmount: '3800'
      },
      {
        name: 'Виноград Чиллаки, вес',
        quantity: '0.88',
        unitPrice: '12990',
        totalAmount: '11431.2'
      },
      {
        name: 'Бутплср CNPL (BPA 0%)вес250мл-59/200',
        quantity: '2',
        totalAmount: '78980',
        originalTotalAmount: '88980',
        adjustments: [
          {
            kind: 'discount',
            amount: '-10000'
          }
        ],
        originalUnitPrice: '44490',
        unitPrice: '39490'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0.86'
      },
      {
        method: 'card',
        amount: '168179'
      }
    ]
  })
})

test('converts source case 09', () => {
  expect(convertReceipt(fixture9)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-09-15',
      time: '21:09'
    },
    currency: 'UZS',
    totalAmount: '126996.66',
    merchant: {
      name: 'Корзинка Учтепа',
      address: 'Учтепинский район ул.Фозилтепа, 93',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Пакет Крафт 30/31см шт',
        quantity: '1',
        unitPrice: '440',
        totalAmount: '440'
      },
      {
        name: 'Лепёшка "Корзинка"',
        quantity: '2',
        unitPrice: '2000',
        totalAmount: '4000'
      },
      {
        name: 'Напиток Coca-Cola п/б 1,5л',
        quantity: '1',
        unitPrice: '8490',
        totalAmount: '8490'
      },
      {
        name: 'Напиток Pepsi п/б 1,5л',
        quantity: '1',
        totalAmount: '8490',
        originalTotalAmount: '8990',
        adjustments: [
          {
            kind: 'discount',
            amount: '-500'
          }
        ],
        originalUnitPrice: '8990',
        unitPrice: '8490'
      },
      {
        name: 'Шоколад MGold молочный 100г',
        quantity: '1',
        unitPrice: '14990',
        totalAmount: '14990'
      },
      {
        name: 'Вафли  "Яшкино"рулетсгущм 160г',
        quantity: '1',
        unitPrice: '7490',
        totalAmount: '7490'
      },
      {
        name: 'Фруктовая пастила Markoola Абрикос 85г',
        quantity: '1',
        unitPrice: '13990',
        totalAmount: '13990'
      },
      {
        name: 'Пахлава QOR с орехами Дурум, вес',
        quantity: '0.934',
        unitPrice: '73990',
        totalAmount: '69106.66'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '126996.66'
      },
      {
        method: 'card',
        amount: '0'
      }
    ]
  })
})

test('converts source case 10', () => {
  expect(convertReceipt(fixture10)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-10-31',
      time: '18:55'
    },
    currency: 'UZS',
    totalAmount: '104500',
    merchant: {
      name: 'ООО "DARVOZA SAVDO"',
      address: 'Мухтимкули кучаси',
      identifiers: [
        {
          value: '302849293',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'VLAJSALFUNIVERSAL M 120SHT',
        quantity: '1',
        unitPrice: '12390',
        totalAmount: '12390'
      },
      {
        name: 'AS TANDIR NON LEPESHKA SHT',
        quantity: '1',
        unitPrice: '2590',
        totalAmount: '2590'
      },
      {
        name: 'AS TANDIR NON LEPESHKA SHT',
        quantity: '1',
        unitPrice: '2590',
        totalAmount: '2590'
      },
      {
        name: 'VLAJSALFUNIVERSAL M 120SHT',
        quantity: '1',
        unitPrice: '12390',
        totalAmount: '12390'
      },
      {
        name: 'NADUVNIE SHARI DETSKIE S MONETAMI VNUTRI',
        quantity: '1',
        unitPrice: '14390',
        totalAmount: '14390'
      },
      {
        name: 'SPREY ANTISEPTIK M 100ML',
        quantity: '1',
        unitPrice: '8190',
        totalAmount: '8190'
      },
      {
        name: 'BUMAJNIE GIRLYANDI HAPPY RAZNOCVETNIЕ',
        quantity: '1',
        unitPrice: '16890',
        totalAmount: '16890'
      },
      {
        name: 'NAPITOK MORS MIRATORG KLYUKVENNIY 370ML',
        quantity: '1',
        unitPrice: '15990',
        totalAmount: '15990'
      },
      {
        name: 'SOK RICH APELSIN 02 STKL',
        quantity: '1',
        unitPrice: '9390',
        totalAmount: '9390'
      },
      {
        name: 'SOK RICH YABLOKO 02L STKL',
        quantity: '1',
        unitPrice: '9390',
        totalAmount: '9390'
      },
      {
        name: 'KASSA PAKET ECO SHT',
        quantity: '1',
        unitPrice: '300',
        totalAmount: '300'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '104500'
      }
    ]
  })
})

test('converts source case 11', () => {
  expect(convertReceipt(fixture11)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-10-31',
      time: '00:45'
    },
    currency: 'UZS',
    totalAmount: '43400',
    merchant: {
      name: 'ООО "DARVOZA SAVDO"',
      address: 'Учтепа тумани 26-квартал Ширин кучаси 7А-уй',
      identifiers: [
        {
          value: '302849293',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'PECHENIE BISCOLATA STIX MILK CHOC40GR',
        quantity: '1',
        unitPrice: '7790',
        totalAmount: '7790'
      },
      {
        name: 'NAPITOK COCA COLA 250ML STKL UZB',
        quantity: '1',
        unitPrice: '5690',
        totalAmount: '5690'
      },
      {
        name: 'NAPITOK FANTA 250ML STKL UZB',
        quantity: '1',
        unitPrice: '5490',
        totalAmount: '5490'
      },
      {
        name: 'MINDAL BISYOR 40GR',
        quantity: '1',
        unitPrice: '7190',
        totalAmount: '7190'
      },
      {
        name: 'KURT M 45GR',
        quantity: '1',
        unitPrice: '3290',
        totalAmount: '3290'
      },
      {
        name: 'ANCHOUS SUXAGRUZ 36GR',
        quantity: '1',
        totalAmount: '13950',
        originalTotalAmount: '16990',
        adjustments: [
          {
            kind: 'discount',
            amount: '-3040'
          }
        ],
        originalUnitPrice: '16990',
        unitPrice: '13950'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '43400'
      }
    ]
  })
})

// No source quantity is available; do not substitute 1.
test('source case 12: missing quantity is an error', () => {
  expect(() => convertReceipt(fixture12)).toThrow('Missing item quantity')
})

test('converts source case 13', () => {
  expect(convertReceipt(fixture13)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2021-12-29',
      time: '17:10'
    },
    currency: 'UZS',
    totalAmount: '1601811',
    merchant: {
      name: 'ООО "MAGNUM RETAIL"',
      address: '100135, Республика Узбекистан, город Ташкент, проспект Бунёдкор, дом 52',
      identifiers: [
        {
          value: '307716344',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'MOL GOSHTI TRANCH MAYDA BOLAKLAR UCHUN Y/F',
        quantity: '2.728',
        totalAmount: '222469',
        unit: 'килограмм'
      },
      {
        name: 'MOL GOSHTI ROSTO SOVUTILGAN KG (VITRINA)',
        quantity: '1.482',
        totalAmount: '120858',
        unit: 'килограмм'
      },
      {
        name: 'MOL GOSHTI КOCHALKA SOVUTILGAN KG (VITRINA)',
        quantity: '1.722',
        totalAmount: '140430',
        unit: 'килограмм'
      },
      {
        name: 'MUSAFFO VANILLI YOGURT 2% 115GR STAK',
        quantity: '2',
        unitPrice: '3500',
        totalAmount: '7000',
        unit: 'штук'
      },
      {
        name: 'MUSAFFO SHAFTOLILI YOGURT 2% 115GR STAK',
        quantity: '2',
        unitPrice: '4000',
        totalAmount: '8000',
        unit: 'штук'
      },
      {
        name: 'KOROVKA IZ KORENOVKI OQ SHOKOLAD TVOROG VANIL SIROK 15% 50',
        quantity: '1',
        unitPrice: '9000',
        totalAmount: '9000',
        unit: 'штук'
      },
      {
        name: 'PROSTOKVASHINO SIROK QULUPNAY 23% 40GR FL/P',
        quantity: '1',
        unitPrice: '7800',
        totalAmount: '7800',
        unit: 'штук'
      },
      {
        name: 'KOROVKA IZ KORENOVKI TVOROG VANIL SUTLI GLAZURLI SIROK 18% 40',
        quantity: '1',
        unitPrice: '4600',
        totalAmount: '4600',
        unit: 'штук'
      },
      {
        name: "PROSTOKVASHINO SIROK QIYOM B/N QOPLANGAN IRIS KARAMEL'LI 40GR",
        quantity: '1',
        unitPrice: '7800',
        totalAmount: '7800',
        unit: 'штук'
      },
      {
        name: "SVITLOGOR'YE QAYNAT/N SUT QIYOM BN QOP/N TVOROGLI SIROK 16%",
        quantity: '1',
        unitPrice: '5900',
        totalAmount: '5900',
        unit: 'штук'
      },
      {
        name: "SVITLOGOR'YE VANILIN TVOROGLI SIROK 23% 30GR FL/P",
        quantity: '1',
        unitPrice: '5200',
        totalAmount: '5200',
        unit: 'штук'
      },
      {
        name: 'VERANDA MOLDOVA YASHIL NOXATI КALIT 430ML SH/B',
        quantity: '1',
        unitPrice: '13700',
        totalAmount: '13700',
        unit: 'штук'
      },
      {
        name: "MUSA MOL GO'SHTLI MUZLATILGAN CHUCHVARA 1000GR P/P",
        quantity: '1',
        unitPrice: '44500',
        totalAmount: '44500',
        unit: 'штук'
      },
      {
        name: 'PROSTOKVASHINO SIROK QUYULTIRILGAN SUT 23% 40GR FL/P',
        quantity: '1',
        unitPrice: '7800',
        totalAmount: '7800',
        unit: 'штук'
      },
      {
        name: 'COCA COLA CLASSIC GAZLANGAN ICHIMLIK 1,5L PET',
        quantity: '1',
        unitPrice: '8400',
        totalAmount: '8400',
        unit: 'штук'
      },
      {
        name: "KHRUTKA NONUSHTASI, JO'XORI DONLARIDAN 700GR P/P",
        quantity: '1',
        unitPrice: '24500',
        totalAmount: '24500',
        unit: 'штук'
      },
      {
        name: 'NESQUIK,BANAN VA SUTLI KOKTEYL 2% 200ML TBA',
        quantity: '1',
        unitPrice: '3600',
        totalAmount: '3600',
        unit: 'штук'
      },
      {
        name: "TAKUMI YERGA ULANGAN VA O'CHIRGICHLI UZAYTIRGICH KONT ELEKTR 5M",
        quantity: '1',
        unitPrice: '68600',
        totalAmount: '68600',
        unit: 'штук'
      },
      {
        name: 'TUXUM 1NAV 12 DONA KONT',
        quantity: '1',
        unitPrice: '17200',
        totalAmount: '17200',
        unit: 'штук'
      },
      {
        name: 'TSIPLYONOK 1 NAV TOVUQ TUXUMI 10DONA LOT',
        quantity: '1',
        unitPrice: '13500',
        totalAmount: '13500',
        unit: 'штук'
      },
      {
        name: 'MATTI MYUSLI BANAN VA SHOKOLAD 250GR D/P',
        quantity: '1',
        unitPrice: '15500',
        totalAmount: '15500',
        unit: 'штук'
      },
      {
        name: "MATTI MYUSLI YONG'OQLI MIKS 250GR D/P",
        quantity: '1',
        unitPrice: '15500',
        totalAmount: '15500',
        unit: 'штук'
      },
      {
        name: "FRUTONYANYA GURUCHLI BO'TQA QOVOQ O'RIK 5OY 200GR D/P",
        quantity: '1',
        unitPrice: '16400',
        totalAmount: '16400',
        unit: 'штук'
      },
      {
        name: '"og\'ib ketayotgan tort" o\'yin to\'plami quti',
        quantity: '1',
        unitPrice: '83900',
        totalAmount: '83900',
        unit: 'штук'
      },
      {
        name: "O'yinchoq baliq ovi 20 dona quti",
        quantity: '1',
        unitPrice: '65700',
        totalAmount: '65700',
        unit: 'штук'
      },
      {
        name: 'SAVUSHKIN TVOROGLI QAYMOQLI PISHLOQ 50% 250GR PL',
        quantity: '1',
        unitPrice: '17800',
        totalAmount: '17800',
        unit: 'штук'
      },
      {
        name: 'KASER PISHLOQ GAUDA YARIM QATTIQ 45% KG',
        quantity: '0.446',
        totalAmount: '30418',
        unit: 'килограмм'
      },
      {
        name: "FRUTONYANYA BO'TQA SULILI SHAFTOLI SUTLI 5OY 200GR D/P",
        quantity: '1',
        unitPrice: '16400',
        totalAmount: '16400',
        unit: 'штук'
      },
      {
        name: "RUKKOLA KO'KAT O'ZBEKISTON DN",
        quantity: '5',
        unitPrice: '1500',
        totalAmount: '7500',
        unit: 'штук'
      },
      {
        name: 'KAMILKA QAYMOQ 45% 400GR STAK',
        quantity: '1',
        unitPrice: '22000',
        totalAmount: '22000',
        unit: 'штук'
      },
      {
        name: 'BARNI BISKVIT QAYNATILGAN SUTLI AYIQCHA 150GR FL/P',
        quantity: '2',
        unitPrice: '11200',
        totalAmount: '22400',
        unit: 'штук'
      },
      {
        name: 'MILKY WAY MINIS KONFETLAR KG',
        quantity: '0.268',
        unitPrice: '92000',
        totalAmount: '24656',
        unit: 'килограмм'
      },
      {
        name: 'KAMILKA TVOROG 300GR KONT',
        quantity: '1',
        unitPrice: '12300',
        totalAmount: '12300',
        unit: 'штук'
      },
      {
        name: "RIZAMAT UZUM O'ZBEKISTON KG",
        quantity: '1.826',
        unitPrice: '35500',
        totalAmount: '64823',
        unit: 'килограмм'
      },
      {
        name: 'BANAN KG',
        quantity: '2.46',
        unitPrice: '14500',
        totalAmount: '35670',
        unit: 'килограмм'
      },
      {
        name: 'BANAN KG',
        quantity: '0.768',
        unitPrice: '14500',
        totalAmount: '11136',
        unit: 'килограмм'
      },
      {
        name: "KASHNICH KO'KAT O'ZBEKISTON KG",
        quantity: '0.102',
        totalAmount: '1189',
        unit: 'килограмм'
      },
      {
        name: "UKROP KO'KAT O'ZBEKISTON KG",
        quantity: '0.086',
        totalAmount: '598',
        unit: 'килограмм'
      },
      {
        name: 'GARNIER TERI TOZALIGI KOMIRLI GEL 200ML FL',
        quantity: '1',
        unitPrice: '69600',
        totalAmount: '69600',
        unit: 'штук'
      },
      {
        name: 'Pullik paket Magnum 10 kg',
        quantity: '1',
        unitPrice: '300',
        totalAmount: '300',
        unit: 'штук'
      },
      {
        name: 'BOSHPIYOZ KG',
        quantity: '4.876',
        unitPrice: '4500',
        totalAmount: '21942',
        unit: 'килограмм'
      },
      {
        name: 'OQ KARTOSHKA KG',
        quantity: '5.156',
        totalAmount: '45889',
        unit: 'килограмм'
      },
      {
        name: 'OQ KARTOSHKA KG',
        quantity: '5.014',
        totalAmount: '44625',
        unit: 'килограмм'
      },
      {
        name: 'BANAN KG',
        quantity: '1.458',
        unitPrice: '14500',
        totalAmount: '21141',
        unit: 'килограмм'
      },
      {
        name: 'YUVILGAN SABZI KG',
        quantity: '2.478',
        unitPrice: '4500',
        totalAmount: '11151',
        unit: 'килограмм'
      },
      {
        name: 'CAPELLA SHAMPINIONLAR MARINADLANGAN 1Л SH/B',
        quantity: '1',
        unitPrice: '36700',
        totalAmount: '36700',
        unit: 'штук'
      },
      {
        name: 'MARINELLE DELIKATES BODRINGLAR 9-12SM 2L SH/I',
        quantity: '1',
        unitPrice: '23900',
        totalAmount: '23900',
        unit: 'штук'
      },
      {
        name: 'MARINELLE ASSORTI PIKANTNOE 2L SH/I',
        quantity: '1',
        unitPrice: '23900',
        totalAmount: '23900',
        unit: 'штук'
      },
      {
        name: 'MARINELLE SARIMSOQPIYOZ-SHIVITLI DELIKATES BODRING 3-6SM 720ML',
        quantity: '1',
        unitPrice: '13400',
        totalAmount: '13400',
        unit: 'штук'
      },
      {
        name: 'PEPSI COLA ICHIMLIGI 2L PET',
        quantity: '1',
        unitPrice: '12600',
        totalAmount: '12600',
        unit: 'штук'
      },
      {
        name: 'DYUSHES NOK XITOY KG',
        quantity: '1.334',
        unitPrice: '35500',
        totalAmount: '47357',
        unit: 'килограмм'
      },
      {
        name: "APEL'SIN TURKIYA KG",
        quantity: '1.372',
        totalAmount: '24559',
        unit: 'килограмм'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '1601811'
      }
    ]
  })
})

// No source quantity is available; do not substitute 1.
test('source case 14: missing quantity is an error', () => {
  expect(() => convertReceipt(fixture14)).toThrow('Missing item quantity')
})

test('converts source case 15', () => {
  expect(convertReceipt(fixture15)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2022-01-07',
      time: '16:29'
    },
    currency: 'UZS',
    totalAmount: '0',
    merchant: {
      name: 'ООО "ANGLESEY FOOD"',
      address: 'Чиланзарский р-он, Чиланзар 6, пересечение проспекта Бунёдкора и Чопон ата',
      identifiers: [
        {
          value: '202099756',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Печенье "Коровка" с молоком 375г',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '11990',
        adjustments: [
          {
            kind: 'discount',
            amount: '-2000'
          },
          {
            kind: 'other',
            amount: '-9990'
          }
        ],
        originalUnitPrice: '11990',
        unitPrice: '0'
      },
      {
        name: 'Вафли  "Яшкино"рулетсгущм 160г',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '7490',
        adjustments: [
          {
            kind: 'other',
            amount: '-7490'
          }
        ],
        originalUnitPrice: '7490',
        unitPrice: '0'
      },
      {
        name: 'Шампунь Fructis SOS Восс волос 250мл',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '20990',
        adjustments: [
          {
            kind: 'other',
            amount: '-20990'
          }
        ],
        originalUnitPrice: '20990',
        unitPrice: '0'
      },
      {
        name: 'Макароны Makfa Вермишель 400г',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '8490',
        adjustments: [
          {
            kind: 'other',
            amount: '-8490'
          }
        ],
        originalUnitPrice: '8490',
        unitPrice: '0'
      },
      {
        name: 'Яйца Golden Plus 10шт в упаковке',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '16990',
        adjustments: [
          {
            kind: 'other',
            amount: '-16990'
          }
        ],
        originalUnitPrice: '16990',
        unitPrice: '0'
      },
      {
        name: 'Куры AF Крыло, вес',
        quantity: '0.964',
        totalAmount: '0',
        unit: 'грамм',
        originalTotalAmount: '26982.36',
        adjustments: [
          {
            kind: 'other',
            amount: '-26982.36'
          }
        ],
        originalUnitPrice: '27990',
        unitPrice: '0'
      },
      {
        name: 'Г Фарш жирный, вес',
        quantity: '0.98',
        totalAmount: '0',
        unit: 'грамм',
        originalTotalAmount: '58790.2',
        adjustments: [
          {
            kind: 'other',
            amount: '-58790.2'
          }
        ],
        originalUnitPrice: '59990',
        unitPrice: '0'
      },
      {
        name: 'Зелень Укроп, пучок',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '1290',
        adjustments: [
          {
            kind: 'other',
            amount: '-1290'
          }
        ],
        originalUnitPrice: '1290',
        unitPrice: '0'
      },
      {
        name: 'Мука Dani Nan пшенич в/сорт упак 3кг',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '29490',
        adjustments: [
          {
            kind: 'other',
            amount: '-29490'
          }
        ],
        originalUnitPrice: '29490',
        unitPrice: '0'
      },
      {
        name: 'Масло IDEAL микс подсололивког 1л',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '40990',
        adjustments: [
          {
            kind: 'other',
            amount: '-40990'
          }
        ],
        originalUnitPrice: '40990',
        unitPrice: '0'
      },
      {
        name: 'Дрожжи DrOetker 7г',
        quantity: '2',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '8980',
        adjustments: [
          {
            kind: 'other',
            amount: '-8980'
          }
        ],
        originalUnitPrice: '4490',
        unitPrice: '0'
      },
      {
        name: 'Слтесто "Муза" нежир д/нац изд-й 500г',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '13490',
        adjustments: [
          {
            kind: 'other',
            amount: '-13490'
          }
        ],
        originalUnitPrice: '13490',
        unitPrice: '0'
      },
      {
        name: 'Листья винограда солёные 10шт',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '1390',
        adjustments: [
          {
            kind: 'other',
            amount: '-1390'
          }
        ],
        originalUnitPrice: '1390',
        unitPrice: '0'
      },
      {
        name: 'Пакет с логотипом Био-полиэтилен до 7кг',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '500',
        adjustments: [
          {
            kind: 'other',
            amount: '-500'
          }
        ],
        originalUnitPrice: '500',
        unitPrice: '0'
      },
      {
        name: 'Пакет с логотипом Био-поэлитилен до 4кг',
        quantity: '1',
        totalAmount: '0',
        unit: 'штук',
        originalTotalAmount: '300',
        adjustments: [
          {
            kind: 'other',
            amount: '-300'
          }
        ],
        originalUnitPrice: '300',
        unitPrice: '0'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '0'
      }
    ]
  })
})

// No source quantity is available; do not substitute 1.
test('source case 16: missing quantity is an error', () => {
  expect(() => convertReceipt(fixture16)).toThrow('Missing item quantity')
})

// No source quantity is available; do not substitute 1.
test('source case 17: missing quantity is an error', () => {
  expect(() => convertReceipt(fixture17)).toThrow('Missing item quantity')
})

test('converts source case 18', () => {
  expect(convertReceipt(fixture18)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-04-02',
      time: '14:28'
    },
    currency: 'UZS',
    totalAmount: '243000',
    merchant: {
      name: 'MCHJ ZENIT TEHNOLOGII',
      address: "Toshkent sh., Yakkasaroy tum., Shuta Rustaveli ko'ch., 122-uy, 41-xonadon",
      identifiers: [
        {
          value: '309376127',
          countryCode: 'UZ'
        }
      ]
    },
    items: [
      {
        name: 'Подгузники Pampers Active Baby Dry размер 6, 24 шт (184680)',
        quantity: '1',
        unitPrice: '97000',
        totalAmount: '97000'
      },
      {
        name: 'Масло подсолнечное Олейна, 2 л (26807)',
        quantity: '1',
        unitPrice: '43000',
        totalAmount: '43000'
      },
      {
        name: 'Подгузники Pampers Active Baby Dry размер 5, 28 шт (184677)',
        quantity: '1',
        unitPrice: '103000',
        totalAmount: '103000'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'cash',
        amount: '0'
      },
      {
        method: 'card',
        amount: '243000'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})
