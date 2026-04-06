import { parseSinglePdfString, prepareCardStatementText } from '../../api'

describe('parseSinglePdfString', () => {
  it('keeps only transaction details in parsed card statement descriptions', () => {
    const pdfText = `
Фридом Банк Казахстан
Выписка по карте Deposit Card
Номер карты:**1234
Номер счётаВалютаОстаток
KZ000000000000000001 KZT 19,498.00

Дата Сумма Валюта Операция Детали
05.04.2026 -7,560.00 ₸ KZT Сумма в обработке SENSILYO COFFEE HOUSE ALMATY KZ
04.04.2026 +500,000.00 ₸ KZT Пополнение Перевод с карты на карту
05.04.2026 +20,000.00 ₸ KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору № KZ00000B000000002KZT от 02.03.2026. Вкладчик: Иван Иванов
05.03.2026 -100.00 ₸ KZT Перевод Между своими счетами
    `.trim()

    const parsed = parseSinglePdfString(prepareCardStatementText(pdfText), 'statement-uid')

    expect(parsed.transactions).toEqual([
      expect.objectContaining({
        originalAmount: '-7560.00 KZT',
        description: 'SENSILYO COFFEE HOUSE ALMATY KZ',
        originString: '05.04.2026 -7,560.00 ₸ KZT Сумма в обработке SENSILYO COFFEE HOUSE ALMATY KZ'
      }),
      expect.objectContaining({
        originalAmount: '+500000.00 KZT',
        description: 'Перевод с карты на карту',
        originString: '04.04.2026 +500,000.00 ₸ KZT Пополнение Перевод с карты на карту'
      }),
      expect.objectContaining({
        originalAmount: '+20000.00 KZT',
        description: 'Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору № KZ00000B000000002KZT от 02.03.2026. Вкладчик: Иван Иванов',
        originString: '05.04.2026 +20,000.00 ₸ KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору № KZ00000B000000002KZT от 02.03.2026. Вкладчик: Иван Иванов'
      }),
      expect.objectContaining({
        originalAmount: '-100.00 KZT',
        description: 'Между своими счетами',
        originString: '05.03.2026 -100.00 ₸ KZT Перевод Между своими счетами'
      })
    ])
  })

  it('splits and normalizes card rows where amount is placed after details', () => {
    const pdfText = `
Фридом Банк Казахстан
Выписка по карте Deposit Card
Номер карты:**1234
Номер счётаВалютаОстаток
KZ000000000000000001 KZT 19,455.00

Дата Сумма Валюта Операция Детали
30.03.2026 -1,500.00 ₸ KZT Покупка SMART POINT ALMATY Almaty KZ 30.03.2026 KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору No +15,000.00 ₸ KZ00000B000000002KZT от 01.02.2026. Вкладчик: Иван Иванов
05.03.2026 -100.00 ₸ KZT Перевод Между своими счетами 05.03.2026 KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Прием вклада по договору KZ00000B000000002KZT в сумме -225,000.00 ₸ 225000 KZT. Вкладчик:Иван Иванов.
    `.trim()

    const parsed = parseSinglePdfString(prepareCardStatementText(pdfText), 'statement-uid')

    expect(parsed.transactions).toEqual([
      expect.objectContaining({
        originalAmount: '-1500.00 KZT',
        description: 'SMART POINT ALMATY Almaty KZ',
        originString: '30.03.2026 -1,500.00 ₸ KZT Покупка SMART POINT ALMATY Almaty KZ'
      }),
      expect.objectContaining({
        originalAmount: '+15000.00 KZT',
        description: 'Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору № KZ00000B000000002KZT от 01.02.2026. Вкладчик: Иван Иванов',
        originString: '30.03.2026 +15,000.00 ₸ KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Выплата вклада по Договору № KZ00000B000000002KZT от 01.02.2026. Вкладчик: Иван Иванов'
      }),
      expect.objectContaining({
        originalAmount: '-100.00 KZT',
        description: 'Между своими счетами',
        originString: '05.03.2026 -100.00 ₸ KZT Перевод Между своими счетами'
      }),
      expect.objectContaining({
        originalAmount: '-225000.00 KZT',
        description: 'Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Прием вклада по договору KZ00000B000000002KZT в сумме 225000 KZT. Вкладчик:Иван Иванов.',
        originString: '05.03.2026 -225,000.00 ₸ KZT Другое Плательщик:Иван Иванов Получатель:Иван Иванов Назначение: Прием вклада по договору KZ00000B000000002KZT в сумме 225000 KZT. Вкладчик:Иван Иванов.'
      })
    ])
  })
})
