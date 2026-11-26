import get from '../../../types/get'
import { convertReceipt } from '../converters'
import papaDoner from './convertReceipt-01.json'
import proStore from './convertReceipt-02.json'
import sosedi from './convertReceipt-03.json'

// Complete response from the official buyer form (24 November 2026).
// The public 25 October receipt has zero-priced choices and generic cashless payment.
// The cashier name is redacted.
test('converts the full receipt and preserves zero-priced items', () => {
  expect(convertReceipt(get(papaDoner, 'data.message'))).toEqual({
    completeness: 'full',
    id: '1B1B958F18F1B1A5071866A4',
    issuedAt: { date: '2026-10-25', time: '17:31:59' },
    currency: 'BYN',
    operation: 'unknown',
    totalAmount: '31.3',
    merchant: {
      name: 'Кафе быстрого питания "Papa Doner"',
      address: 'г. Минск, ПР. ДЗЕРЖИНСКОГО 126',
      identifiers: [{ value: '690869726', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'cash', amount: '0' }, { method: 'cashless', amount: '31.3' }],
    items: [
      { name: 'Донер Чикен 300г', quantity: '1', totalAmount: '7.9' },
      { name: 'Обычная лепешка', quantity: '1', totalAmount: '0' },
      { name: 'Донер Лесные опята 400г', quantity: '1', totalAmount: '12.5' },
      { name: 'Сырная лепешка', quantity: '1', totalAmount: '0' },
      { name: 'Курица', quantity: '1', totalAmount: '2.5' },
      { name: 'Картофель фри', quantity: '1', totalAmount: '4.9' },
      { name: 'Фанта апельсин', quantity: '1', totalAmount: '3.5' }
    ]
  })
})

// Complete response from the official buyer form (25 November 2026).
// The lookup identifier, cashier name and unique parts of the marking code are redacted.
// The iKassa copy confirms the date, amount paid and discount.
// The source lists 77.57 before a 0.34 item discount.
test('applies the reported item discount once and preserves the amount paid', () => {
  expect(convertReceipt(get(sosedi, 'data.message'))).toEqual({
    completeness: 'full',
    id: 'TESTRECEIPTMNS0000000003',
    issuedAt: { date: '2026-11-25', time: '18:06:09' },
    currency: 'BYN',
    operation: 'unknown',
    totalAmount: '77.23',
    merchant: {
      name: 'Магазин "Соседи "',
      address: 'г. Минск, ПР. ДЗЕРЖИНСКОГО 19',
      identifiers: [{ value: '101454161', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'cash', amount: '0' }, { method: 'cashless', amount: '77.23' }],
    items: [
      { name: 'П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ФАС.1КГ ПР.ЦЕХ', quantity: '0.534', totalAmount: '10.67' },
      { name: 'П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ФАС.1КГ ПР.ЦЕХ', quantity: '0.528', totalAmount: '10.55' },
      { name: 'ВИНОГРАД ТАЙФИ 1КГ', quantity: '1.344', totalAmount: '7.51' },
      { name: 'ВИНОГРАД РЕД ГЛОБ 1КГ', quantity: '0.692', totalAmount: '5.39' },
      { name: 'КОНС.РЫБН.ШПРОТЫ ЗА РОДИНУ С КЛЮЧ.160Г', quantity: '2', totalAmount: '7.7' },
      {
        name: 'СМЕТАНА ЗДРАВУШКА 19% СТ.380Г',
        quantity: '1',
        originalTotalAmount: '3.38',
        totalAmount: '3.04',
        adjustments: [{ kind: 'discount', amount: '-0.34' }]
      },
      { name: 'ГРИБЫ ШАМПИНЬОНЫ 1КГ', quantity: '0.238', totalAmount: '2.09' },
      { name: 'П/Ф ФАРШ ДОМАШНИЙ ОХЛ.ВЕС.1КГ ПР.ЦЕХ', quantity: '0.404', totalAmount: '7.67' },
      { name: 'П/Ф ФАРШ ИЗ ФИЛЕ ЦЫП.ДИЕТ.ВЕС.1КГ ПР.ЦЕХ', quantity: '0.318', totalAmount: '6.36' },
      { name: 'КУКУРУЗА ГЛОБУС СЛАДКАЯ 340Г', quantity: '1', totalAmount: '4.79' },
      { name: 'ЛИМОН 1КГ', quantity: '0.11', totalAmount: '0.77' },
      { name: 'ПРОД.СВ.ХАМОН БРАУН С/В ПОРЦ.В/У 1КГ', quantity: '0.32', totalAmount: '10.69' }
    ]
  })
})

// Complete response from the buyer form (24 November 2026).
// The cashier name and unique parts of the marking codes are redacted.
// Quantities and rounded line amounts are preserved independently.
test('converts all rows of a weighted retail receipt', () => {
  const items = [
    ['Йогурт Суперкид обогащ кальцием и витамином Д с вк', '1', '1.93'],
    ['Пакет-майка ЭКО с логотипом 1+0, размер пакета, (3', '2', '1.04'],
    ['Сырок глазир Молочная страна с ванилином 23% 45г', '1', '0.99'],
    ['Шоколад Любимая Аленка молочный с дробленым фундук', '1', '8.73'],
    ['Молоко ультрапаст Савушкин 3,1% бутылка 1л', '1', '3.06'],
    ['Шоколад Schogetten молочный с нач из йогурта со вк', '1', '7.82'],
    ['Нектар Добрый апельсиновый 1л ПЭТ', '1', '4.21'],
    ['Сок Добрый яблочный 1л ПЭТ', '1', '4.21'],
    ['Сыр п/тв Брест-Литовск гауда 45% 200г', '1', '5.2'],
    ['Колбаски По-Французски с сыром и ароматом трюфеля', '1', '10.39'],
    ['Колбаски По-Итальянски охл лоток 600г Юнимит', '1', '9.7'],
    ['Котлеты Домашние с грибами и сыром охл ТМ Петруха', '1', '7.17'],
    ['Котлеты Сливочные с сыром ТМ Петруха Мастер лоток', '1', '7.17'],
    ['Котлеты Домашние с грибами и сыром охл ТМ Петруха', '1', '7.17'],
    ['Котлеты Сливочные с сыром ТМ Петруха Мастер лоток', '1', '7.17'],
    ['Халва Ванильный аромат 240гр', '1', '4.29'],
    ['Драже MМ\'s Криспи 36г', '1', '3.79'],
    ['Сыр тв Брест Литовск выдержанный 12мес 45% 130г ку', '1', '9.09'],
    ['Сыр п/тв Брест-Литовск Маасдам  45% 200г', '1', '5.53'],
    ['Шоколад Schogetten молочный с ванильной нач и кусо', '1', '7.82'],
    ['Колбаска Гаскона с/в из м/пт сорт экстра пак мод 1', '1', '10.65'],
    ['Хек филе без кожи морож 500г', '1', '13.49'],
    ['Драже MМ\'s Криспи 36г', '1', '3.79'],
    ['Сырок глазир Молочная страна с ванилином 23% 45г', '9', '8.91'],
    ['Яйцо Kinder сюрприз  из молочного шоколада  с игру', '1', '7.89'],
    ['Йогурт Суперкид обогащ кальцием и витамином Д с вк', '1', '1.93'],
    ['Яйцо куриное Кобринские йодоселеносодерж С-2 белое', '1', '7.92'],
    ['Мясо креветки в заливке п/уп 180гр', '1', '7.45'],
    ['Мясо креветки в заливке п/уп 180гр', '1', '7.45'],
    ['Сливки ультрапаст Milkavita 33% Tetra Brik Aseptic', '1', '9.25'],
    ['Яйцо Kinder Joy с игрушкой Д Т1 20г', '1', '7.89'],
    ['Минтай филе б/к морож вес 1кг', '0.916', '18.31'],
    ['Филе индейки для запекания По-домашнему Мёд-апельс', '1.296', '48.92'],
    ['Напиток пивной Schofferhofer Watermelon Mint 2,5%', '1', '9.59'],
    ['Пиво Paulaner Weissbier светлое нефильтр 0,5л ж/б', '1', '7.99'],
    ['Пиво Paulaner Weissbier светлое нефильтр 0,5л ж/б', '1', '7.99'],
    ['Наггетсы куриные охл пол лоток мгс 600г АК Дзержин', '1', '9.99'],
    ['Соус майонезный сметанный с грибами Astoria 233г д', '1', '3.89'],
    ['Отбивная из филе из м/пт п/ф куск в пан охл пол ло', '0.596', '9.05'],
    ['Отбивная из филе из м/пт п/ф куск в пан охл пол ло', '0.562', '8.54'],
    ['Пакет-майка ЭКО с логотипом 1+0, размер пакета, (3', '1', '0.52'],
    ['Палочки из фарша рыбного в панировке обж зам п/у Т', '1', '16.05'],
    ['Пельмени Марьино с цб зам 400г', '1', '6.11'],
    ['Пельмени Марьино с цб зам 400г', '1', '6.11'],
    ['Соус томатный оливковый Barilla 400г ст/бан', '1', '9.99'],
    ['Соус томатный с базиликом Barilla 400г ст/бан', '1', '9.99'],
    ['Соус песто алла дженовезе с базиликом без чеснока', '1', '14.99'],
    ['Палочки из филе минтая VICI заморож 400г карт/уп', '1', '20.99'],
    ['Форель Санта Бремор филе-кусок сл/с в/у 200г', '1', '14.99'],
    ['Филе форели слабосоленое  вес 1кг', '0.2', '22.8'],
    ['Филе форели слабосоленое  вес 1кг', '0.27', '30.78'],
    ['Фасоль стручковая с/м вес 1 кг', '1.042', '8.33'],
    ['Карта ВПРОК (Пластиковая карта)', '1', '2']
  ].map(([name, quantity, totalAmount]) => ({ name, quantity, totalAmount }))
  expect(convertReceipt(get(proStore, 'data.message'))).toEqual({
    completeness: 'full',
    id: '484979BF5F0D340E07193731',
    issuedAt: { date: '2026-10-25', time: '19:12:46' },
    currency: 'BYN',
    operation: 'unknown',
    totalAmount: '491.02',
    merchant: {
      name: 'Гипермаркет "ProStore" Малиновка',
      address: 'г. Минск, ПР. ДЗЕРЖИНСКОГО 126',
      identifiers: [{ value: '193854962', countryCode: 'BY', scheme: 'UNP' }]
    },
    payments: [{ method: 'cash', amount: '0' }, { method: 'cashless', amount: '491.02' }],
    items
  })
})
