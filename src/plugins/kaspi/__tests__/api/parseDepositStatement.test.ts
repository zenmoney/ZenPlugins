import { parseSinglePdfString } from '../../api'

it('parses deposit transactions with compact column layout', () => {
  const statementUid = 'deposit-statement-uid'
  const statement = `
ВЫПИСКА
По Депозиту за период с 03.11.25 по 03.12.25
3 декабря 2025
Номер договора: D0000-000
Номер счета:
KZ000000000000000123
На Депозите 03.12.25:647 342,98 ₸Валюта счета:      тенге
Эффективная ставкаДата открытия:
10.03.2023
вознаграждения:15%
Дата пролонгации:
15.03.2026
ДатаСуммаОперацияДеталиНа Депозите
05.11.25+12 790,20 ₸ПополнениеС Kaspi Gold через kaspi.kz13 928,35 ₸
06.11.25-6 600,00 ₸Перевод7 328,35 ₸
01.12.25+28,35 ₸Вознаграждение1 256,70 ₸
ДатаСуммаОперацияДеталиНа Депозите
03.12.25+646 086,28 ₸ПополнениеС Kaspi Gold через kaspi.kz647 342,98 ₸
`
  expect(parseSinglePdfString(statement, statementUid)).toEqual({
    account: {
      balance: 647342.98,
      id: 'KZ000000000000000123',
      instrument: 'KZT',
      title: 'Депозит D0000-000',
      date: '2025-12-03T00:00:00.000',
      capitalization: '15%',
      endDate: '2026-03-15T00:00:00.000',
      startBalance: 0,
      startDate: '2023-03-10T00:00:00.000',
      type: 'deposit'
    },
    transactions: [
      {
        hold: false,
        date: '2025-11-05T00:00:00.000',
        originalAmount: null,
        amount: '+ 12 790,20',
        description: 'Пополнение С Kaspi Gold через kaspi.kz',
        statementUid,
        originString: '05.11.25+12 790,20 ₸ПополнениеС Kaspi Gold через kaspi.kz13 928,35 ₸'
      },
      {
        hold: false,
        date: '2025-11-06T00:00:00.000',
        originalAmount: null,
        amount: '- 6 600,00',
        description: 'Перевод',
        statementUid,
        originString: '06.11.25-6 600,00 ₸Перевод7 328,35 ₸'
      },
      {
        hold: false,
        date: '2025-12-01T00:00:00.000',
        originalAmount: null,
        amount: '+ 28,35',
        description: 'Вознаграждение',
        statementUid,
        originString: '01.12.25+28,35 ₸Вознаграждение1 256,70 ₸'
      },
      {
        hold: false,
        date: '2025-12-03T00:00:00.000',
        originalAmount: null,
        amount: '+ 646 086,28',
        description: 'Пополнение С Kaspi Gold через kaspi.kz',
        statementUid,
        originString: '03.12.25+646 086,28 ₸ПополнениеС Kaspi Gold через kaspi.kz647 342,98 ₸'
      }
    ]
  })
})

it('skips deposit prolongation service line without amount', () => {
  const statementUid = 'deposit-statement-with-service-line'
  const statement = `
ВЫПИСКА
По Депозиту за период с 05.03.26 по 05.04.26
5 апреля 2026
Номер договора: D0000-001
Номер счета:
KZ000000000000000124
На Депозите 05.04.26:165 758,41 ₸Валюта счета:      тенге
Эффективная ставкаДата открытия:
10.03.2023
вознаграждения:15%
Дата пролонгации:
17.03.2027
ДатаСуммаОперацияДеталиНа Депозите
15.03.26+763,37 ₸Вознаграждение242 337,61 ₸
15.03.26РазноеПродление депозита242 337,61 ₸
16.03.26-10 000,00 ₸Перевод232 337,61 ₸
Проценты по Kaspi
Депозиту
Перевод на карту на
kaspi.kz
ДатаСуммаОперацияДеталиНа Депозите
16.03.26+10 000,00 ₸ПополнениеС Kaspi Gold через kaspi.kz242 337,61 ₸
`

  expect(parseSinglePdfString(statement, statementUid)).toEqual({
    account: {
      balance: 165758.41,
      id: 'KZ000000000000000124',
      instrument: 'KZT',
      title: 'Депозит D0000-001',
      date: '2026-04-05T00:00:00.000',
      capitalization: '15%',
      endDate: '2027-03-17T00:00:00.000',
      startBalance: 0,
      startDate: '2023-03-10T00:00:00.000',
      type: 'deposit'
    },
    transactions: [
      {
        hold: false,
        date: '2026-03-15T00:00:00.000',
        originalAmount: null,
        amount: '+ 763,37',
        description: 'Вознаграждение',
        statementUid,
        originString: '15.03.26+763,37 ₸Вознаграждение242 337,61 ₸'
      },
      {
        hold: false,
        date: '2026-03-16T00:00:00.000',
        originalAmount: null,
        amount: '- 10 000,00',
        description: 'Перевод',
        statementUid,
        originString: '16.03.26-10 000,00 ₸Перевод232 337,61 ₸'
      },
      {
        hold: false,
        date: '2026-03-16T00:00:00.000',
        originalAmount: null,
        amount: '+ 10 000,00',
        description: 'Пополнение С Kaspi Gold через kaspi.kz',
        statementUid,
        originString: '16.03.26+10 000,00 ₸ПополнениеС Kaspi Gold через kaspi.kz242 337,61 ₸'
      }
    ]
  })
})
