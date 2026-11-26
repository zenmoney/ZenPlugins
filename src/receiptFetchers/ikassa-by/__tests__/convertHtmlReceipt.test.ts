import cloudReceipt from './convertHtmlReceipt-03.html'
import papaDoner from './convertHtmlReceipt-01.html'
import proStore from './convertHtmlReceipt-02.html'
import sosediDiscount from './convertHtmlReceipt-04.html'
import { convertReceipt } from '../converters'

// Complete sectioned HTML response captured on 2026-10-25.
// Independently retrieved through ch.info-center.by, with matching quantities and totals.
// https://receipts.ikassa.by/render/1B1B958F18F1B1A5071866A4
test('converts the entire Papa Doner receipt, including free choices', () => {
  expect(convertReceipt(papaDoner)).toEqual({
    completeness: 'full',
    id: '1B1B958F18F1B1A5071866A4',
    issuedAt: { date: '2026-10-25', time: '17:31:59' },
    currency: 'BYN',
    operation: 'unknown',
    totalAmount: '31.3',
    merchant: {
      name: 'Общество с ограниченной ответственностью "ГЛОБАЛ РИТЕЙЛ" Кафе быстрого питания "Papa Doner", Минск, Дзержинского, 126',
      address: 'г. Минск ПР. ДЗЕРЖИНСКОГО, 126',
      identifiers: [{ value: '690869726', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'card', amount: '31.3' }],
    items: [
      { name: 'Донер Чикен 300г', quantity: '1', totalAmount: '7.9', unitPrice: '7.9' },
      { name: 'Обычная лепешка', quantity: '1', totalAmount: '0', unitPrice: '0' },
      { name: 'Донер Лесные опята 400г', quantity: '1', totalAmount: '12.5', unitPrice: '12.5' },
      { name: 'Сырная лепешка', quantity: '1', totalAmount: '0', unitPrice: '0' },
      { name: 'Курица', quantity: '1', totalAmount: '2.5', unitPrice: '2.5' },
      { name: 'Картофель фри', quantity: '1', totalAmount: '4.9', unitPrice: '4.9' },
      { name: 'Фанта апельсин', quantity: '1', totalAmount: '3.5', unitPrice: '3.5' }
    ]
  })
})

// Complete flat HTML from zenmoney_plugin_log_2026-11-22-18-31-55.log (HTTP response id 0).
// The cashier surname and the bank and loyalty card suffixes are redacted.
// Unit prices match the earlier iKassa capture. Quantities, item amounts and the
// total also match the independent fiscal lookup. Discount, refund and prepayment
// layouts still need source examples.
// https://receipts.ikassa.by/render/484979BF5F0D340E07193731
test('converts all ProStore items with rounded weighted totals and skips the card slip and parking coupon', () => {
  expect(convertReceipt(proStore)).toEqual({
    completeness: 'full',
    id: '484979BF5F0D340E07193731',
    issuedAt: { date: '2026-10-25', time: '19:12:46' },
    currency: 'BYN',
    operation: 'unknown',
    originalTotalAmount: '491.02',
    totalAmount: '491.02',
    merchant: {
      name: 'Общество с ограниченной ответственностью "Торговый дом Простор" Гипермаркет "ProStore" Малиновка',
      address: 'г. Минск ПР. ДЗЕРЖИНСКОГО, 126',
      identifiers: [{ value: '193854962', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'card', amount: '491.02' }],
    items: [
      { name: '[M] Йогурт Суперкид обогащ кальцием и витамином Д с вк', quantity: '1', totalAmount: '1.93', unitPrice: '1.93' },
      { name: 'Пакет-майка ЭКО с логотипом 1+0, размер пакета, (3', quantity: '2', totalAmount: '1.04', unitPrice: '0.52' },
      { name: 'Сырок глазир Молочная страна с ванилином 23% 45г', quantity: '1', totalAmount: '0.99', unitPrice: '0.99' },
      { name: 'Шоколад Любимая Аленка молочный с дробленым фундук', quantity: '1', totalAmount: '8.73', unitPrice: '8.73' },
      { name: '[M] Молоко ультрапаст Савушкин 3,1% бутылка 1л', quantity: '1', totalAmount: '3.06', unitPrice: '3.06' },
      { name: 'Шоколад Schogetten молочный с нач из йогурта со вк', quantity: '1', totalAmount: '7.82', unitPrice: '7.82' },
      { name: 'Нектар Добрый апельсиновый 1л ПЭТ', quantity: '1', totalAmount: '4.21', unitPrice: '4.21' },
      { name: 'Сок Добрый яблочный 1л ПЭТ', quantity: '1', totalAmount: '4.21', unitPrice: '4.21' },
      { name: '[M] Сыр п/тв Брест-Литовск гауда 45% 200г', quantity: '1', totalAmount: '5.2', unitPrice: '5.2' },
      { name: 'Колбаски По-Французски с сыром и ароматом трюфеля', quantity: '1', totalAmount: '10.39', unitPrice: '10.39' },
      { name: 'Колбаски По-Итальянски охл лоток 600г Юнимит', quantity: '1', totalAmount: '9.7', unitPrice: '9.7' },
      { name: 'Котлеты Домашние с грибами и сыром охл ТМ Петруха', quantity: '1', totalAmount: '7.17', unitPrice: '7.17' },
      { name: 'Котлеты Сливочные с сыром ТМ Петруха Мастер лоток', quantity: '1', totalAmount: '7.17', unitPrice: '7.17' },
      { name: 'Котлеты Домашние с грибами и сыром охл ТМ Петруха', quantity: '1', totalAmount: '7.17', unitPrice: '7.17' },
      { name: 'Котлеты Сливочные с сыром ТМ Петруха Мастер лоток', quantity: '1', totalAmount: '7.17', unitPrice: '7.17' },
      { name: 'Халва Ванильный аромат 240гр', quantity: '1', totalAmount: '4.29', unitPrice: '4.29' },
      { name: "Драже MМ's Криспи 36г", quantity: '1', totalAmount: '3.79', unitPrice: '3.79' },
      { name: '[M] Сыр тв Брест Литовск выдержанный 12мес 45% 130г ку', quantity: '1', totalAmount: '9.09', unitPrice: '9.09' },
      { name: '[M] Сыр п/тв Брест-Литовск Маасдам 45% 200г', quantity: '1', totalAmount: '5.53', unitPrice: '5.53' },
      { name: 'Шоколад Schogetten молочный с ванильной нач и кусо', quantity: '1', totalAmount: '7.82', unitPrice: '7.82' },
      { name: 'Колбаска Гаскона с/в из м/пт сорт экстра пак мод 1', quantity: '1', totalAmount: '10.65', unitPrice: '10.65' },
      { name: 'Хек филе без кожи морож 500г', quantity: '1', totalAmount: '13.49', unitPrice: '13.49' },
      { name: "Драже MМ's Криспи 36г", quantity: '1', totalAmount: '3.79', unitPrice: '3.79' },
      { name: 'Сырок глазир Молочная страна с ванилином 23% 45г', quantity: '9', totalAmount: '8.91', unitPrice: '0.99' },
      { name: 'Яйцо Kinder сюрприз  из молочного шоколада  с игру', quantity: '1', totalAmount: '7.89', unitPrice: '7.89' },
      { name: '[M] Йогурт Суперкид обогащ кальцием и витамином Д с вк', quantity: '1', totalAmount: '1.93', unitPrice: '1.93' },
      { name: 'Яйцо куриное Кобринские йодоселеносодерж С-2 белое', quantity: '1', totalAmount: '7.92', unitPrice: '7.92' },
      { name: 'Мясо креветки в заливке п/уп 180гр', quantity: '1', totalAmount: '7.45', unitPrice: '7.45' },
      { name: 'Мясо креветки в заливке п/уп 180гр', quantity: '1', totalAmount: '7.45', unitPrice: '7.45' },
      { name: '[M] Сливки ультрапаст Milkavita 33% Tetra Brik Aseptic', quantity: '1', totalAmount: '9.25', unitPrice: '9.25' },
      { name: 'Яйцо Kinder Joy с игрушкой Д Т1 20г', quantity: '1', totalAmount: '7.89', unitPrice: '7.89' },
      { name: 'Минтай филе б/к морож вес 1кг', quantity: '0.916', totalAmount: '18.31', unitPrice: '19.99' },
      { name: 'Филе индейки для запекания По-домашнему Мёд-апельс', quantity: '1.296', totalAmount: '48.92', unitPrice: '37.75' },
      { name: 'Напиток пивной Schofferhofer Watermelon Mint 2,5%', quantity: '1', totalAmount: '9.59', unitPrice: '9.59' },
      { name: 'Пиво Paulaner Weissbier светлое нефильтр 0,5л ж/б', quantity: '1', totalAmount: '7.99', unitPrice: '7.99' },
      { name: 'Пиво Paulaner Weissbier светлое нефильтр 0,5л ж/б', quantity: '1', totalAmount: '7.99', unitPrice: '7.99' },
      { name: 'Наггетсы куриные охл пол лоток мгс 600г АК Дзержин', quantity: '1', totalAmount: '9.99', unitPrice: '9.99' },
      { name: 'Соус майонезный сметанный с грибами Astoria 233г д', quantity: '1', totalAmount: '3.89', unitPrice: '3.89' },
      { name: 'Отбивная из филе из м/пт п/ф куск в пан охл пол ло', quantity: '0.596', totalAmount: '9.05', unitPrice: '15.19' },
      { name: 'Отбивная из филе из м/пт п/ф куск в пан охл пол ло', quantity: '0.562', totalAmount: '8.54', unitPrice: '15.19' },
      { name: 'Пакет-майка ЭКО с логотипом 1+0, размер пакета, (3', quantity: '1', totalAmount: '0.52', unitPrice: '0.52' },
      { name: 'Палочки из фарша рыбного в панировке обж зам п/у Т', quantity: '1', totalAmount: '16.05', unitPrice: '16.05' },
      { name: 'Пельмени Марьино с цб зам 400г', quantity: '1', totalAmount: '6.11', unitPrice: '6.11' },
      { name: 'Пельмени Марьино с цб зам 400г', quantity: '1', totalAmount: '6.11', unitPrice: '6.11' },
      { name: 'Соус томатный оливковый Barilla 400г ст/бан', quantity: '1', totalAmount: '9.99', unitPrice: '9.99' },
      { name: 'Соус томатный с базиликом Barilla 400г ст/бан', quantity: '1', totalAmount: '9.99', unitPrice: '9.99' },
      { name: 'Соус песто алла дженовезе с базиликом без чеснока', quantity: '1', totalAmount: '14.99', unitPrice: '14.99' },
      { name: 'Палочки из филе минтая VICI заморож 400г карт/уп', quantity: '1', totalAmount: '20.99', unitPrice: '20.99' },
      { name: 'Форель Санта Бремор филе-кусок сл/с в/у 200г', quantity: '1', totalAmount: '14.99', unitPrice: '14.99' },
      { name: 'Филе форели слабосоленое  вес 1кг', quantity: '0.2', totalAmount: '22.8', unitPrice: '114' },
      { name: 'Филе форели слабосоленое  вес 1кг', quantity: '0.27', totalAmount: '30.78', unitPrice: '114' },
      { name: 'Фасоль стручковая с/м вес 1 кг', quantity: '1.042', totalAmount: '8.33', unitPrice: '7.99' },
      { name: 'Карта ВПРОК (Пластиковая карта)', quantity: '1', totalAmount: '2', unitPrice: '2' }
    ]
  })
})

// Flat iKassa HTML from a Zenmoney plugin diagnostic log (HTTP response id 0).
test('applies the Sosedi item discount once and retains the printed receipt totals', () => {
  expect(convertReceipt(sosediDiscount)).toEqual({
    completeness: 'full',
    id: '0123456789ABCDEF01234567',
    issuedAt: { date: '2026-11-12', time: '10:20:30' },
    currency: 'BYN',
    operation: 'unknown',
    originalTotalAmount: '77.23',
    totalAmount: '77.23',
    merchant: {
      name: 'Общество с ограниченной ответственностью "Либретик" Магазин "Соседи "',
      address: 'г. Минск ПР. ТЕСТОВЫЙ, 42',
      identifiers: [{ value: '101454161', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'card', amount: '77.23' }],
    items: [
      { name: '22312100000001 П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ФАС.1КГ ПР.ЦЕХ', quantity: '0.534', totalAmount: '10.67', unitPrice: '19.99' },
      { name: '22312100000001 П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ФАС.1КГ ПР.ЦЕХ', quantity: '0.528', totalAmount: '10.55', unitPrice: '19.99' },
      { name: '22382200000001 ВИНОГРАД ТАЙФИ 1КГ', quantity: '1.344', totalAmount: '7.51', unitPrice: '5.59' },
      { name: '22382200000001 ВИНОГРАД РЕД ГЛОБ 1КГ', quantity: '0.692', totalAmount: '5.39', unitPrice: '7.79' },
      { name: 'КОНС.РЫБН.ШПРОТЫ ЗА РОДИНУ С КЛЮЧ.160Г', quantity: '2', totalAmount: '7.7', unitPrice: '3.85' },
      {
        name: '[M] СМЕТАНА ЗДРАВУШКА 19% СТ.380Г',
        quantity: '1',
        originalUnitPrice: '3.38',
        originalTotalAmount: '3.38',
        unitPrice: '3.04',
        totalAmount: '3.04',
        adjustments: [{ kind: 'discount', amount: '-0.34' }]
      },
      { name: 'ГРИБЫ ШАМПИНЬОНЫ 1КГ', quantity: '0.238', totalAmount: '2.09', unitPrice: '8.79' },
      { name: '22312100000001 П/Ф ФАРШ ДОМАШНИЙ ОХЛ.ВЕС.1КГ ПР.ЦЕХ', quantity: '0.404', totalAmount: '7.67', unitPrice: '18.99' },
      { name: '22312100000001 П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ВЕС.1КГ ПР.ЦЕХ', quantity: '0.318', totalAmount: '6.36', unitPrice: '19.99' },
      { name: 'КУКУРУЗА ГЛОБУС СЛАДКАЯ 340Г', quantity: '1', totalAmount: '4.79', unitPrice: '4.79' },
      { name: '22383600000001 ЛИМОН 1КГ', quantity: '0.11', totalAmount: '0.77', unitPrice: '6.99' },
      { name: 'ПРОД.СВ.ХАМОН БРАУН С/В ПОРЦ.В/ У 1КГ', quantity: '0.32', totalAmount: '10.69', unitPrice: '33.41' }
    ]
  })
})

// Model malformed input/layout invariants; these mutations are not provider samples.
test('[model] an unparsed numeric row cannot become part of the next product name', () => {
  expect(() => convertReceipt(papaDoner.replace('7.90 *1.000  7.90', '7.90 *unknown 7.90'))).toThrow('Unsupported receipt item line')
})

test('[model] a changed item container fails instead of skipping its products', () => {
  expect(() => convertReceipt(papaDoner.replace('<div id="receiptBody">', '<div id="receiptBody"><section>'))).toThrow('Unexpected receipt body structure')
})

test('[model] invalid source calendar dates remain failures', () => {
  expect(() => convertReceipt(papaDoner.replace('25.10.2026', '31.02.2026'))).toThrow('Invalid receipt calendar date')
})

// Complete public cloud-host receipt, captured 2026-11-05; receipts.csv row 1489.
// The cashier surname is redacted.
test('converts the cloud-host document without changing its identity', () => {
  expect(convertReceipt(cloudReceipt)).toEqual({
    completeness: 'full',
    id: '150B5F7DDEA9F05207196D2D',
    currency: 'BYN',
    operation: 'unknown',
    issuedAt: { date: '2026-10-23', time: '07:43:28' },
    totalAmount: '0.92',
    merchant: { name: 'Общество с ограниченной ответственностью "Либретик" магазин "Соседи"', address: 'г. Минск ПР. ДЗЕРЖИНСКОГО, 11', identifiers: [{ value: '101454161', countryCode: 'BY', scheme: 'UNP' }] },
    items: [{ name: 'СЫРОК ГЛ.МОЛОЧНАЯ СТРАНА 18% КАРТОШ.45Г', quantity: '1', unitPrice: '0.92', totalAmount: '0.92' }],
    payments: [{ method: 'card', amount: '0.92' }]
  })
})
