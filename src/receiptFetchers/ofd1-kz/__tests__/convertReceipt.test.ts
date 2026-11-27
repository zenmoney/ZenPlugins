import magnumReceipt from './convertReceipt-06.html'
import fixture1 from './convertReceipt-01.html'
import fixture2 from './convertReceipt-02.html'
import fixture3 from './convertReceipt-03.html'
import fixture4 from './convertReceipt-04.html'
import fixture5 from './convertReceipt-05.html'
import { convertReceipt } from '../converters'
import cheerio from 'cheerio'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1, 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-09',
      time: '15:38:06'
    },
    currency: 'KZT',
    totalAmount: '6579',
    merchant: {
      name: 'ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СКИФ ТРЕЙД"',
      identifiers: [
        {
          value: '020340002288',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'МОРОЖЕНОЕ ALGIDA 82ГР MAGNUM KARADUT BOGURTLEN',
        quantity: '1',
        unitPrice: '496',
        totalAmount: '496'
      },
      {
        name: 'СОК НЕКТАР СОЛНЕЧНЫЙ 0,2л ЯБЛОКО-ПЕРСИК',
        quantity: '1',
        unitPrice: '210',
        totalAmount: '210'
      },
      {
        name: 'ПАКЕТ SMALL SKIF МАЙКА',
        quantity: '1',
        unitPrice: '10',
        totalAmount: '10'
      },
      {
        name: 'ВЫП.ЛЕПЕШКА УЗБЕКСКАЯ 390ГР',
        quantity: '1',
        unitPrice: '279',
        totalAmount: '279'
      },
      {
        name: 'ЛАВАШ ГРУЗ.ТАНД.450 - АХМЕТОВА',
        quantity: '1',
        unitPrice: '355',
        totalAmount: '355'
      },
      {
        name: 'НАБОР КОНФЕТ STORCK 400ГР MERCI АССОРТИ',
        quantity: '1',
        unitPrice: '5229',
        totalAmount: '5229'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '6579'
      }
    ]
  })
})

// Source item totals sum to 9473.14 while the receipt total is 9472; do not invent a balancing adjustment.
test('converts source case 02', () => {
  expect(convertReceipt(fixture2, 'https://ofd1.kz/t/?i=475145263436&f=010101809975&s=9472.0&t=20230130T192336')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-01-30',
      time: '19:23:36'
    },
    currency: 'KZT',
    totalAmount: '9472',
    merchant: {
      name: 'ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СКИФ ТРЕЙД"',
      identifiers: [
        {
          value: '020340002288',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'КАРТОФЕЛЬ 1СОРТ КАЗАХСТАН',
        quantity: '3.796',
        unitPrice: '182',
        totalAmount: '690.87'
      },
      {
        name: 'КРУПА ГРЕЧНЕВАЯ 900ГР АЛТЫН ХАНЫМ',
        quantity: '2',
        unitPrice: '870',
        totalAmount: '1740'
      },
      {
        name: 'ГОРОШЕК BONDUELLE 425гр НЕЖНЫЙ',
        quantity: '1',
        unitPrice: '695',
        totalAmount: '695'
      },
      {
        name: 'ТВОРОГ МОЛОЧНЫЙ БИДОНЧИК 500гр 9  ПАКЕТ',
        quantity: '2',
        unitPrice: '774',
        totalAmount: '1548'
      },
      {
        name: 'СМЕТАНА МОЛОЧНЫЙ БИДОНЧИК 400гр 20  ВЕДРО',
        quantity: '1',
        unitPrice: '699',
        totalAmount: '699'
      },
      {
        name: 'СЫР БЕЛОРУССИЯ ЩУЧИНСКИЙ 45  ГОЛЛАНДСКИЙ ЛЮКС ВЕС',
        quantity: '0.31',
        unitPrice: '3800',
        totalAmount: '1178'
      },
      {
        name: 'СЫР ПЛАВЛЕНЫЙ PRESIDENT 300гр СЛИВОЧНЫЙ СЛАЙС',
        quantity: '1',
        unitPrice: '1815',
        totalAmount: '1815'
      },
      {
        name: 'БАНАН ЭКВАДОР',
        quantity: '1.226',
        unitPrice: '895',
        totalAmount: '1097.27'
      },
      {
        name: 'ПАКЕТ SMALL SKIF МАЙКА',
        quantity: '1',
        unitPrice: '10',
        totalAmount: '10'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '9472'
      }
    ]
  })
})

// Source item totals sum to 8164.76 while the receipt total is 8165.
// Keep the two explicit rounding rows without inventing a balancing adjustment.
test('converts source case 03', () => {
  expect(convertReceipt(fixture3, 'https://ofd1.kz/t/?i=645905994217&f=010101909368&s=8165.0&t=20230602T194550')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-06-02',
      time: '19:45:50'
    },
    currency: 'KZT',
    totalAmount: '8165',
    adjustments: [
      { kind: 'rounding', name: 'Коррекция округления (наценка)', amount: '0.16' },
      { kind: 'rounding', name: 'Коррекция округления (наценка)', amount: '0.4' }
    ],
    merchant: {
      name: 'ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СКИФ ТРЕЙД"',
      identifiers: [
        {
          value: '020340002288',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'ПАКЕТ SMALL SKIF МАЙКА',
        quantity: '2',
        unitPrice: '10',
        totalAmount: '20'
      },
      {
        name: 'ВОДА A`SU 8л НЕГАЗИРОВАННАЯ',
        quantity: '1',
        unitPrice: '705',
        totalAmount: '705'
      },
      {
        name: 'ЭНЕРГЕТИЧЕСКИЙ НАПИТОК DIZZY ENERGY 0,33л COLA С Б',
        quantity: '2',
        unitPrice: '385',
        totalAmount: '770'
      },
      {
        name: 'ЛИМОНАД БУРАТИНО 2л',
        quantity: '1',
        unitPrice: '475',
        totalAmount: '475'
      },
      {
        name: 'ПРЯНИК КЛАССИЧЕСКИЙ',
        quantity: '0.636',
        unitPrice: '1690',
        totalAmount: '1074.84'
      },
      {
        name: 'СУШ.ЧАЙНЫЕ 350 - ТРАПЕЗА сушки',
        quantity: '1',
        unitPrice: '810',
        totalAmount: '810'
      },
      {
        name: 'ВАФЛИ БАЯН СУЛУ НАСТРОЕШКИ ВЕС',
        quantity: '0.36',
        unitPrice: '1735',
        totalAmount: '624.6'
      },
      {
        name: 'МОЛОКО LACTEL 1л УЛЬТРАПАСТЕРИЗОВАННОЕ 2,5  ТВА',
        quantity: '1',
        unitPrice: '725',
        totalAmount: '725'
      },
      {
        name: 'КУРТ ФЕРМА ОРДА 80гр СОЛЕНЫЙ',
        quantity: '1',
        unitPrice: '600',
        totalAmount: '600'
      },
      {
        name: 'ПЕЧЕНЬЕ PECHENKA ЮБИЛЕЙНОЕ САХАРНОЕ ВЕС',
        quantity: '0.412',
        unitPrice: '1860',
        totalAmount: '766.32'
      },
      {
        name: 'НАПИТОК COCA-COLA 1л ГАЗИРОВАННЫЙ',
        quantity: '2',
        unitPrice: '419',
        totalAmount: '838'
      },
      {
        name: 'ВОДА МИНЕРАЛЬНАЯ САРЫ-АГАШ 1л ГАЗИРОВАННАЯ',
        quantity: '4',
        unitPrice: '189',
        totalAmount: '756'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '8165'
      }
    ]
  })
})

test('converts source case 04', () => {
  expect(convertReceipt(fixture4, 'https://ofd1.kz/t/?i=852693226785&f=010102928966&s=5891.00&t=20240406T110019')).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2024-04-06',
      time: '11:00:19'
    },
    currency: 'KZT',
    totalAmount: '5891',
    merchant: {
      name: 'ТОВАРИЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "БЕККЕР КОММЕРЦ"',
      identifiers: [
        {
          value: '110740013861',
          countryCode: 'KZ',
          scheme: 'IIN/BIN'
        }
      ]
    },
    items: [
      {
        name: 'Пакеты Беккер большие',
        quantity: '1',
        unitPrice: '10',
        totalAmount: '10'
      },
      {
        name: 'Блины фаршированные творогом',
        quantity: '0.144',
        unitPrice: '4097.22',
        totalAmount: '590'
      },
      {
        name: 'Хачапури с брынзой',
        quantity: '0.162',
        unitPrice: '3444.44',
        totalAmount: '558'
      },
      {
        name: 'Докторская Колбаса в полиамидке',
        quantity: '0.358',
        unitPrice: '4885.47',
        totalAmount: '1749'
      },
      {
        name: 'Мясо по-тайски',
        quantity: '0.598',
        unitPrice: '4989.97',
        totalAmount: '2984'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '5891'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null, 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806')).toThrow()
})

// Captured 2026-10-25 from the site's documented fragment fallback:
// GET https://ofd1.kz/t?i=3193862841&f=600404766365&s=1081.0&t=20260911T172200&fragment=1&captcha_skip=1
// Header: X-Requested-With: XMLHttpRequest. Only the two CSRF values are redacted.
test('converts the current Ozon receipt fragment without the legacy page wrapper', () => {
  expect(convertReceipt(fixture5, 'https://ofd1.kz/t?i=3193862841&f=600404766365&s=1081.0&t=20260911T172200')).toEqual({
    completeness: 'full',
    issuedAt: { date: '2026-09-11', time: '17:22:00' },
    currency: 'KZT',
    totalAmount: '1081',
    operation: 'unknown',
    merchant: {
      name: 'Товарищество с ограниченной ответственностью "ОЗОН Маркетплейс Казахстан"',
      identifiers: [{ value: '211040009534', countryCode: 'KZ', scheme: 'IIN/BIN' }]
    },
    items: [{
      name: 'Ароматизатор для автомобиля Новая машина, вонючка пахучка в машину, освежитель воздуха для автомобиля, автопарфюм',
      quantity: '1',
      unitPrice: '1081',
      totalAmount: '1081'
    }],
    payments: [{ method: 'card', amount: '1081' }]
  })
})

// A malformed goods row must fail the entire receipt rather than silently drop that product.
test('[model] rejects a malformed goods row after valid items', () => {
  const $ = cheerio.load(fixture1)
  $('.ticket_body > ol > li').last().find('.ready_ticket__item').empty()
  expect(() => convertReceipt($.html(), 'https://ofd1.kz/t/?i=1009359893420&f=010101710160&s=6579.0&t=20230509T153806')).toThrow('Invalid receipt item amounts')
})

// mail_inbound 237932, ofd1-kz build 9, complete receipt fragment with both CSRF tokens redacted.
test('preserves every item around the bilingual rounding discount', () => {
  expect(convertReceipt(magnumReceipt, 'https://ofd1.kz/t?i=548915464443&f=010101303229&s=4548.0&t=20261127T112155')).toEqual({
    completeness: 'full',
    currency: 'KZT',
    operation: 'unknown',
    totalAmount: '4548',
    issuedAt: { date: '2026-11-27', time: '11:21:55' },
    merchant: {
      name: 'ФИЛИАЛ №53 ТОВАРИЩЕСТВА С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "MAGNUM CASH&CARRY" "РЕАЛИСТ" В ГОРОДЕ АЛМАТЫ',
      identifiers: [{ value: '210441002425', countryCode: 'KZ', scheme: 'IIN/BIN' }]
    },
    items: [
      { name: '2152911009448 ПОМЕЛО КГ', unitPrice: '799', quantity: '0.944', totalAmount: '754.26' },
      { name: '4870247053260 MAGNUM ПАКЕТІ АҚЫЛЫ ЛОГО', unitPrice: '25', quantity: '2', totalAmount: '50' },
      { name: '2129011044600 АҚ ҚЫРЫҚҚАБАТ (САЛМАҚ БОЙЫНША)', unitPrice: '160', quantity: '4.46', totalAmount: '713.6' },
      { name: '2136153006786 АЛМА ГОЛДЕН ҚАЗАҚСТАН КГ', unitPrice: '599', quantity: '0.678', totalAmount: '406.12' },
      { name: '2152903006905 АЛМҰРТ ОРМАН СҰЛУЫ КГ', unitPrice: '649', quantity: '0.69', totalAmount: '447.81' },
      { name: '2111733004208 ПИЯЗ ҚАЗАҚСТАН (САЛМАҚ БОЙЫНША)', unitPrice: '122', quantity: '0.42', totalAmount: '51.24' },
      { name: '2110455003261 АНАР ӨЗБЕКСТАН КГ', unitPrice: '1199', quantity: '0.326', totalAmount: '390.87' },
      { name: '2110442008422 Жуылмаған  асханалық сәбіз Қазақстан (салмақ бойынша)', unitPrice: '205', quantity: '0.842', totalAmount: '172.61' },
      { name: '2119248004461 МАНДАРИН БАЛДЫ ҚЫТАЙ КГ', unitPrice: '799', quantity: '0.446', totalAmount: '356.35' },
      { name: '2149583011749 Картоп Қазақстан кг', unitPrice: '227', quantity: '1.174', totalAmount: '266.5' },
      { name: '4870036001205 РАХАТ ҚАЗАҚСТАНДЫҚ ШОКОЛАДЫ 100ГР КНВРТ', unitPrice: '939', quantity: '1', totalAmount: '939' }
    ],
    adjustments: [{ kind: 'rounding', name: 'ROUND (Жеңілдік /скидка)', amount: '-0.36' }],
    payments: [{ method: 'card', amount: '4548' }]
  })
})
