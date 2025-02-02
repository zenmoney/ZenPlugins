import { parseSinglePdfString } from '../../api'
const statements = [
  'АО "Фридом Банк Казахстан"\nБИК KSNVKZKA\nwww.bankffin.kz\nВыписка по карте Deposit Card\nза период с\n\n02.01.2025 по 01.01.2025 ИВАНОВ ИВАН ИВАНОВИЧ ИИН:121212343434\nНомер карты:**1234\nВалюта счета:KZT, USD, EUR, RUB, CNY, TRY, AED Дата:01.01.2025 Номер счётаВалютаОстаток KZ123456789012345KZTKZT19,455.00 ₸\nKZ40551B829609418USDUSD0.00 $\nKZ40551B829609225EUREUR0.00 €\nKZ78551B829609257RUBRUB0.00 ₽\nKZ87551B829585164CNYCNY0.00 ¥\nKZ15551B829585152TRYTRY0.00 ₺\nKZ32551B829585160AEDAED0.00 AED Краткое содержание операций по карте:\nДоступно на 02.01.202519,455.00₸ Платеж0.00₸\nПеревод-189,437.57₸\nПокупка-105,365.00₸\nСнятие0.00₸\nПлатеж по кредиту0.00₸\nПополнение+321,367.57₸\nДоступно на 01.01.202519,455.00₸ По курсу, установленному Банком на момент выдачи справки. ДатаСуммаВалютаОперацияДетали\n01.01.2025-600.00 ₸KZTПокупка Airba Fresh Minimarket. Продукты и супермаркет\n01.01.2025-68,726.00 ₸KZTПокупка Airba Fresh Minimarket. Продукты и супермаркет\n01.01.2025+50,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами\n01.01.2025-909.00 ₸KZTПокупка Too "Good Luck Trade". Продукты и супермаркет\n01.01.2025+3,300.00 ₸KZTПокупкаВозврат. Отмена покупки\n01.01.2025+3,300.00 ₸KZTПокупкаВозврат. Отмена покупки\n01.01.2025-650.00 ₸KZTПокупкаCosta Coffee 18706. Кафе и рестораны\n01.01.2025-6,480.00 ₸KZTПокупкаCosta Coffee 18706. Кафе и рестораны\n01.01.2025+40,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами\n01.01.2025-22,000.00 ₸KZTПокупкаIp "Simstar". Развлечения\n01.01.2025-5,000.00 ₸KZTПокупкаIp "H2o". Развлечения\n01.01.2025-1,170.00 ₸KZTПокупкаYandex.Go. Такси\n01.02.2025+25,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами\n01.02.2025-30,000.00 ₸KZTПереводVasia V.. По номеру телефона\n01.02.2025-159,437.57 ₸KZTПеревод Депозит KOPILKA. Между своими счетами\n01.02.2025+156,367.57 ₸KZTПополнение IVAN IVANOV>ALMATY KZ. С карты другого банка\n01.02.2025+40,000.00 ₸KZTПополнение IVAN IVANOV>ALMATY KZ. С карты другого банка\n01.02.2025-6,430.00 ₸KZTПокупка Ip " Btb Grupp ". Продукты и супермаркет\n01.02.2025+10,000.00 ₸KZTПополнениеИван И.. По номеру телефона'
]

it.each([
  [
    statements[0],
    {
      account: {
        balance: 19455,
        id: 'KZ123456789012345',
        instrument: 'KZT',
        savings: false,
        syncIds: ['1234'],
        title: 'Deposit Card',
        type: 'ccard'
      },
      transactions: [
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-600.00',
          amount: '-600.00',
          description: 'Airba Fresh Minimarket. Продукты и супермаркет',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-600.00 ₸KZTПокупка Airba Fresh Minimarket. Продукты и супермаркет'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-68726.00',
          amount: '-68726.00',
          description: 'Airba Fresh Minimarket. Продукты и супермаркет',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-68,726.00 ₸KZTПокупка Airba Fresh Minimarket. Продукты и супермаркет'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '+50000.00',
          amount: '+50000.00',
          description: 'KOPILKA. Между своими счетами',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025+50,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-909.00',
          amount: '-909.00',
          description: 'Too Good Luck Trade. Продукты и супермаркет',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-909.00 ₸KZTПокупка Too "Good Luck Trade". Продукты и супермаркет'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '+3300.00',
          amount: '+3300.00',
          description: '. Отмена покупки',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025+3,300.00 ₸KZTПокупкаВозврат. Отмена покупки'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '+3300.00',
          amount: '+3300.00',
          description: '. Отмена покупки',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025+3,300.00 ₸KZTПокупкаВозврат. Отмена покупки'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-650.00',
          amount: '-650.00',
          description: 'Costa Coffee 18706. Кафе и рестораны',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-650.00 ₸KZTПокупкаCosta Coffee 18706. Кафе и рестораны'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-6480.00',
          amount: '-6480.00',
          description: 'Costa Coffee 18706. Кафе и рестораны',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-6,480.00 ₸KZTПокупкаCosta Coffee 18706. Кафе и рестораны'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '+40000.00',
          amount: '+40000.00',
          description: 'KOPILKA. Между своими счетами',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025+40,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-22000.00',
          amount: '-22000.00',
          description: 'Ip Simstar. Развлечения',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-22,000.00 ₸KZTПокупкаIp "Simstar". Развлечения'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-5000.00',
          amount: '-5000.00',
          description: 'Ip H2o. Развлечения',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-5,000.00 ₸KZTПокупкаIp "H2o". Развлечения'
        },
        {
          hold: false,
          date: '2025-01-01T00:00:00.000',
          originalAmount: '-1170.00',
          amount: '-1170.00',
          description: 'Yandex.Go. Такси',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.01.2025-1,170.00 ₸KZTПокупкаYandex.Go. Такси'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '+25000.00',
          amount: '+25000.00',
          description: 'KOPILKA. Между своими счетами',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025+25,000.00 ₸KZTПополнениеKOPILKA. Между своими счетами'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '-30000.00',
          amount: '-30000.00',
          description: 'Vasia V.. По номеру телефона',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025-30,000.00 ₸KZTПереводVasia V.. По номеру телефона'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '-159437.57',
          amount: '-159437.57',
          description: 'Депозит KOPILKA. Между своими счетами',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025-159,437.57 ₸KZTПеревод Депозит KOPILKA. Между своими счетами'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '+156367.57',
          amount: '+156367.57',
          description: 'IVAN IVANOV>ALMATY KZ. С карты другого банка',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025+156,367.57 ₸KZTПополнение IVAN IVANOV>ALMATY KZ. С карты другого банка'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '+40000.00',
          amount: '+40000.00',
          description: 'IVAN IVANOV>ALMATY KZ. С карты другого банка',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025+40,000.00 ₸KZTПополнение IVAN IVANOV>ALMATY KZ. С карты другого банка'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '-6430.00',
          amount: '-6430.00',
          description: 'Ip  Btb Grupp . Продукты и супермаркет',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025-6,430.00 ₸KZTПокупка Ip " Btb Grupp ". Продукты и супермаркет'
        },
        {
          hold: false,
          date: '2025-02-01T00:00:00.000',
          originalAmount: '+10000.00',
          amount: '+10000.00',
          description: 'Иван И.. По номеру телефона',
          statementUid: '03474da2-3644-47b2-895a-2384b6c935ad',
          originString: '01.02.2025+10,000.00 ₸KZTПополнениеИван И.. По номеру телефона'
        }
      ]
    }
  ]
])('parse pdfString to raw account with transactions', (pdfString: string, result: unknown) => {
  expect(parseSinglePdfString(pdfString, '03474da2-3644-47b2-895a-2384b6c935ad')).toEqual(result)
})
