import { parseDepositPdfString } from '../../api'
import { AccountType } from '../../../../types/zenmoney'

describe('parseDepositPdfString', () => {
  it('parses deposit statement with USD amounts', () => {
    const statementText = `
Выписка по депозиту "KOPILKA" за период с 01.11.2025 по 01.12.2025

ИВАНОВ ИВАН ИВАНОВИЧ
ИИН: 000000000000
Номер счета: KZ123456789012345USD
Валюта счета: USD
Эффективная ставка: 1 %
Дата открытия: 08.03.2025
Дата завершения: 01.03.2026
Срок депозита: 12 месяцев

Краткое содержание операций по депозиту:
Остаток на начало периода: 2 025.88 $
Поступления за период: 4.68 $
Расходы за период: 0.00 $
Остаток на конец месяца: 2 087.25 $
Текущий остаток: 2 008.54 $

Дата Описание операции Сумма Эквивалент в KZT
03.11.2025 Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 31.10.25. Вкладчик Иван Иванов 1,71 $ 598,19 т
01.12.2025 Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов 1,71 $ 665,85 т
`

    expect(parseDepositPdfString(statementText, 'statement-id')).toEqual({
      account: {
        balance: 2087.25,
        capitalization: true,
        endDateOffset: 1,
        endDateOffsetInterval: 'year',
        id: 'KZ123456789012345USD',
        instrument: 'USD',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 1,
        startBalance: 2025.88,
        startDate: new Date('2025-03-08T00:00:00.000'),
        syncIds: [
          'KZ123456789012345USD'
        ],
        title: 'KOPILKA',
        type: AccountType.deposit
      },
      transactions: [
        {
          amount: '1.71',
          date: '2025-11-03T00:00:00.000',
          description: 'Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 31.10.25. Вкладчик Иван Иванов',
          hold: false,
          originString: '03.11.2025 Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 31.10.25. Вкладчик Иван Иванов 1,71 $ 598,19 т',
          originalAmount: '1.71 USD',
          statementUid: 'statement-id'
        },
        {
          amount: '1.71',
          date: '2025-12-01T00:00:00.000',
          description: 'Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов',
          hold: false,
          originString: '01.12.2025 Выплата процентов по вкладу № KZ123456789012345USD от 08.03.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов 1,71 $ 665,85 т',
          originalAmount: '1.71 USD',
          statementUid: 'statement-id'
        }
      ]
    })
  })

  it('parses deposit statement with spaced thousands and KZT', () => {
    const statementText = `
Выписка по депозиту "KOPILKA" за период с 01.11.2025 по 01.12.2025

Номер счета: KZ987654312KZT
Валюта счета: KZT
Эффективная ставка: 1 %
Дата открытия: 01.02.2025
Дата завершения: 01.02.2026
Остаток на конец месяца: 100 000,00 ₸
Текущий остаток: 100 000,00 ₸

Дата Описание операции Сумма Эквивалент в KZT
29.11.2025 Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -6 000,00 ₸ -6 000,00 т
29.11.2025 Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -20 000,00 ₸ -20 000,00 т
01.12.2025 Выплата процентов по вкладу № KZ987654312KZT от 01.02.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов 1 194,55 ₸ 1 194,55 т
`

    expect(parseDepositPdfString(statementText, 'statement-id-kzt')).toEqual({
      account: expect.objectContaining({
        id: 'KZ987654312KZT',
        instrument: 'KZT',
        balance: 100000
      }),
      transactions: [
        {
          amount: '-6000.00',
          date: '2025-11-29T00:00:00.000',
          description: 'Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов',
          hold: false,
          originString: '29.11.2025 Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -6 000,00 ₸ -6 000,00 т',
          originalAmount: '-6000.00 KZT',
          statementUid: 'statement-id-kzt'
        },
        {
          amount: '-20000.00',
          date: '2025-11-29T00:00:00.000',
          description: 'Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов',
          hold: false,
          originString: '29.11.2025 Выплата вклада по Договору № KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -20 000,00 ₸ -20 000,00 т',
          originalAmount: '-20000.00 KZT',
          statementUid: 'statement-id-kzt'
        },
        {
          amount: '1194.55',
          date: '2025-12-01T00:00:00.000',
          description: 'Выплата процентов по вкладу № KZ987654312KZT от 01.02.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов',
          hold: false,
          originString: '01.12.2025 Выплата процентов по вкладу № KZ987654312KZT от 01.02.2025 за период с 01-го по 30.11.25. Вкладчик Иван Иванов 1 194,55 ₸ 1 194,55 т',
          originalAmount: '1194.55 KZT',
          statementUid: 'statement-id-kzt'
        }
      ]
    })
  })

  it('parses deposit rows with trailing header fragments', () => {
    const statementText = `
Выписка по депозиту "KOPILKA" за период с 01.11.2025 по 01.12.2025
Номер счета: KZ987654312KZT
Валюта счета: KZT
Эффективная ставка: 1 %
Дата открытия: 01.02.2025
Дата завершения: 01.02.2026
Остаток на конец месяца: 5 802,93 ₸
Текущий остаток: 5 802,93 ₸

Дата Описание операции Сумма Эквивалент в KZT
23.11.2025 Выплата вклада по Договору No KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -65 500,00 ₸ -65 500,00 ₸ Подлинность справки можете проверить просканировав QR-код или перейдите по ссылке: https://bankffin.kz/ru/check-receipt Дата Описание операции Сумма Эквивалент в KZT
`

    const parsed = parseDepositPdfString(statementText, 'statement-id-fragment')
    expect(parsed.transactions).toEqual([
      {
        amount: '-65500.00',
        date: '2025-11-23T00:00:00.000',
        description: 'Выплата вклада по Договору No KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов',
        hold: false,
        originString: '23.11.2025 Выплата вклада по Договору No KZ987654312KZT от 01.02.2025. Вкладчик: Иван Иванов -65 500,00 ₸ -65 500,00 ₸',
        originalAmount: '-65500.00 KZT',
        statementUid: 'statement-id-fragment'
      }
    ])
  })
})
