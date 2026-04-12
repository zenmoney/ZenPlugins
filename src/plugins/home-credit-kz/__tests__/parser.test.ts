import {
  detectLocale,
  findFirstTransactionLineIndex,
  isHomeCreditStatement,
  parseBalance,
  parseCardLast4,
  parseHeader,
  parseIban,
  parseMainAmountFromLine,
  parseStatementDate,
  parseStatementText,
  stripPdfNoise
} from '../parser'

const sampleStatement = `
Contract number:  4304110804
IBAN:  KZ38886D224304110804
Card number:  404932******8517
Statement date:  05.04.2026
Statement
from debit card for the period from 19.08.2025 to 04.04.2026
Available balance at the time of statement (05.04.2026) — 178 913,98 ₸
Client's full name:
Date of the
operation
Operation Details Amount Bonuses MCC
seller's category code
30.01.2026
18:52
YANDEX.GO
Refund
+ 460,00 ₸
4121
Limousines and Taxicabs
04.04.2026
19:02
YANDEX.GO
Purchases and spending
- 134,00 ₸ + 4,00 Б
4121
Limousines and Taxicabs
`

function headerBlock (extra = ''): string {
  return `
Contract number:  111
IBAN:  KZ001122334455667788
Card number:  404932******1234
Statement date:  01.01.2026
Statement
from debit card for the period from 01.01.2025 to 01.01.2026
Available balance at the time of statement (01.01.2026) — 10 000,00 ₸
${extra}
Date of the
operation
Operation Details Amount Bonuses MCC
seller's category code
`
}

function kzHeaderBlock (extra = ''): string {
  return `
Келісімшарт нөмірі:  111
IBAN:  KZ001122334455667788
Карточка нөмірі:  404932******1234
Үзінді көшірме күні:  01.01.2026
Үзінді көшірме
дебет картасы бойынша 01.01.2025 - 01.01.2026 аралығындағы кезең үшін
Үзінді көшірме берілген күн (01.01.2026) бойынша қолжетімді қалдық — 10 000,00 ₸
${extra}
Операция туралы мәліметтер Сома Бонустар MCC
сатушы санатының
коды
`
}

const kzSampleStatement = `
Келісімшарт нөмірі:  4304110804
IBAN:  KZ38886D224304110804
Карточка нөмірі:  404932******8517
Үзінді көшірме күні:  12.04.2026
Үзінді көшірме
дебет картасы бойынша 13.03.2026 - 12.04.2026 аралығындағы кезең үшін
Үзінді көшірме берілген күн (12.04.2026) бойынша қолжетімді қалдық — 133 360,25 ₸
Операция туралы мәліметтер Сома Бонустар MCC
сатушы санатының
коды
12.04.2026
17:12
YANDEX.GO
Сатып алулар мен шығындар
- 112,00 ₸ + 3,00 Б
4121
Limousines and Taxicabs
10.04.2026
23:59
Бонустар Кэшбек/Манибек
Теңгеге аударылған бонустар
+ 3 129,00 ₸
`

const ruSampleStatement = `
Номер договора:  4304110804
IBAN:  KZ38886D224304110804
Номер карточки:  404932******8517
Дата выписки:  12.04.2026
Выписка
по дебетовой карте за период с 13.03.2026 по 12.04.2026
Доступный остаток на момент выписки (12.04.2026) — 133 360,25 ₸
ФИО клиента:
Дата
операции
Детали операции Сумма Бонусы MCC
код категории
продавца
12.04.2026
17:12
YANDEX.GO
Покупки и траты
- 112,00 ₸ + 3,00 Б
4121
Limousines and Taxicabs
10.04.2026
23:59
Зачисление бонусов
Переведённые в тенге бонусы
+ 3 129,00 ₸
`

const ruDepositSample = `
Номер договора:  4304110804
Выписка по банковскому счету
IBAN:  KZ38886D224304110804
Простой
648 513,36
KZT
12.04.2026
13.03.2026 12.04.2026
АО «Home Credit Bank» (ДБ АО «ForteBank»), БИК INLMKZKA

13.03.2026 Капитализация по вкладу 0 417.64 0 0
`

const kzDepositSample = `
Келісімшарт нөмірі:  4304110804
Банктік шот бойынша
IBAN:  KZ38886D224304110804
Простой
648 513,36
KZT
12.04.2026
13.03.2026 12.04.2026
«Home Credit Bank» АҚ (ForteBank АҚ ЕБ), БСК INLMKZKA

13.03.2026
Депозит бойынша капиталдандыру
0 417.64 0 0
`

function ruHeaderBlock (extra = ''): string {
  return `
Номер договора:  111
IBAN:  KZ001122334455667788
Номер карточки:  404932******1234
Дата выписки:  01.01.2026
Выписка
по дебетовой карте за период с 01.01.2025 по 01.01.2026
Доступный остаток на момент выписки (01.01.2026) — 10 000,00 ₸
${extra}
Дата
операции
Детали операции Сумма Бонусы MCC
код категории
продавца
`
}

describe('home-credit-kz parser', () => {
  describe('isHomeCreditStatement', () => {
    it('returns true for typical debit statement text', () => {
      expect(isHomeCreditStatement(sampleStatement)).toBe(true)
    })

    it('returns true when bank name is present instead of card mask', () => {
      const text = sampleStatement.replace(/Card number:[^\n]+/, '') +
        '\n«Home Credit Bank» JSC (SB of JSC «ForteBank»), BIC INLMKZKA\n'
      expect(isHomeCreditStatement(text)).toBe(true)
    })

    it('returns false for unrelated text', () => {
      expect(isHomeCreditStatement('random text')).toBe(false)
    })

    it('returns false without Contract number (en) or Kelisimsharp (kz) or Nomier dogovora (ru)', () => {
      expect(isHomeCreditStatement(sampleStatement.replace(/Contract number:[^\n]+\n/, ''))).toBe(false)
      expect(isHomeCreditStatement(kzSampleStatement.replace(/Келісімшарт нөмірі:[^\n]+\n/, ''))).toBe(false)
      expect(isHomeCreditStatement(ruSampleStatement.replace(/Номер договора:[^\n]+\n/, ''))).toBe(false)
    })

    it('returns false without debit card period line', () => {
      expect(isHomeCreditStatement(sampleStatement.replace(/from debit card for the period[^\n]+\n/, ''))).toBe(false)
      expect(isHomeCreditStatement(kzSampleStatement.replace(/дебет картасы бойынша[^\n]+\n/, ''))).toBe(false)
      expect(isHomeCreditStatement(ruSampleStatement.replace(/по дебетовой карте за период с[^\n]+\n/, ''))).toBe(false)
    })

    it('returns false without KZ IBAN', () => {
      expect(isHomeCreditStatement(sampleStatement.replace(/IBAN:\s*KZ/, 'IBAN:  DE'))).toBe(false)
    })

    it('returns false without bank markers and card mask', () => {
      const t = sampleStatement
        .replace(/Card number:[^\n]+\n/, '')
        .replace(/Home Credit|INLMKZKA|ForteBank/gi, 'X')
      expect(isHomeCreditStatement(t)).toBe(false)
    })

    it('returns true for Kazakh statement header', () => {
      expect(isHomeCreditStatement(kzSampleStatement)).toBe(true)
    })

    it('returns true for Russian statement header', () => {
      expect(isHomeCreditStatement(ruSampleStatement)).toBe(true)
    })

    it('returns true for Russian deposit statement', () => {
      expect(isHomeCreditStatement(ruDepositSample)).toBe(true)
    })

    it('returns true for Kazakh deposit statement', () => {
      expect(isHomeCreditStatement(kzDepositSample)).toBe(true)
    })
  })

  describe('detectLocale', () => {
    it('detects kz from Kazakh labels', () => {
      expect(detectLocale(kzSampleStatement)).toBe('kz')
    })

    it('detects ru from Russian labels', () => {
      expect(detectLocale(ruSampleStatement)).toBe('ru')
    })

    it('detects en from English labels', () => {
      expect(detectLocale(sampleStatement)).toBe('en')
    })
  })

  describe('stripPdfNoise', () => {
    it('removes Deprecated API usage lines from pdf.js', () => {
      const dirty = 'Line1\nDeprecated API usage: PDFDocumentLoadingTask.then\nLine2'
      expect(stripPdfNoise(dirty)).toBe('Line1\nLine2')
    })
  })

  describe('parseStatementDate / parseIban / parseCardLast4 / parseBalance', () => {
    it('parseStatementDate returns ISO midnight string (en)', () => {
      expect(parseStatementDate('Statement date:  05.04.2026\n', 'en')).toBe('2026-04-05T00:00:00.000')
    })

    it('parseStatementDate parses Kazakh label (kz)', () => {
      expect(parseStatementDate('Үзінді көшірме күні:  12.04.2026\n', 'kz')).toBe('2026-04-12T00:00:00.000')
    })

    it('parseStatementDate parses Russian label (ru)', () => {
      expect(parseStatementDate('Дата выписки:  12.04.2026\n', 'ru')).toBe('2026-04-12T00:00:00.000')
    })

    it('parseIban trims spaces after label', () => {
      expect(parseIban('IBAN:  KZ38886D224304110804')).toBe('KZ38886D224304110804')
    })

    it('parseCardLast4 reads last digits (en)', () => {
      expect(parseCardLast4('Card number:  404932******8517', 'en')).toBe('8517')
    })

    it('parseCardLast4 reads Kazakh card label (kz)', () => {
      expect(parseCardLast4('Карточка нөмірі:  404932******8517', 'kz')).toBe('8517')
    })

    it('parseCardLast4 reads Russian card label (ru)', () => {
      expect(parseCardLast4('Номер карточки:  404932******8517', 'ru')).toBe('8517')
    })

    it('parseBalance reads amount with em dash (en)', () => {
      expect(parseBalance('Available balance at the time of statement (05.04.2026) — 30 986,79 ₸', 'en')).toBe(30986.79)
    })

    it('parseBalance reads amount with ASCII hyphen (en)', () => {
      expect(parseBalance('Available balance at the time of statement (05.04.2026) - 100,00 ₸', 'en')).toBe(100)
    })

    it('parseBalance reads Kazakh available balance line (kz)', () => {
      expect(parseBalance(
        'Үзінді көшірме берілген күн (12.04.2026) бойынша қолжетімді қалдық — 133 360,25 ₸',
        'kz'
      )).toBe(133360.25)
    })

    it('parseBalance reads Russian available balance line (ru)', () => {
      expect(parseBalance(
        'Доступный остаток на момент выписки (12.04.2026) — 133 360,25 ₸',
        'ru'
      )).toBe(133360.25)
    })
  })

  describe('parseHeader', () => {
    it('aggregates header fields (en)', () => {
      const h = parseHeader(sampleStatement, 'en')
      expect(h.locale).toBe('en')
      expect(h.statementKind).toBe('card')
      expect(h.iban).toBe('KZ38886D224304110804')
      expect(h.cardLast4).toBe('8517')
      expect(h.statementDateIso).toBe('2026-04-05T00:00:00.000')
      expect(h.balance).toBe(178913.98)
    })

    it('aggregates header fields (kz)', () => {
      const h = parseHeader(kzSampleStatement, 'kz')
      expect(h.locale).toBe('kz')
      expect(h.statementKind).toBe('card')
      expect(h.iban).toBe('KZ38886D224304110804')
      expect(h.cardLast4).toBe('8517')
      expect(h.statementDateIso).toBe('2026-04-12T00:00:00.000')
      expect(h.balance).toBe(133360.25)
    })

    it('aggregates header fields (ru)', () => {
      const h = parseHeader(ruSampleStatement, 'ru')
      expect(h.locale).toBe('ru')
      expect(h.statementKind).toBe('card')
      expect(h.iban).toBe('KZ38886D224304110804')
      expect(h.cardLast4).toBe('8517')
      expect(h.statementDateIso).toBe('2026-04-12T00:00:00.000')
      expect(h.balance).toBe(133360.25)
    })
  })

  describe('parseMainAmountFromLine', () => {
    it('strips bonus part from amount line', () => {
      expect(parseMainAmountFromLine('- 4 350,00 ₸ + 44,00 Б')).toBe('- 4 350,00 ₸')
    })

    it('parses positive amount without bonus', () => {
      expect(parseMainAmountFromLine('+ 692,00 ₸')).toBe('+ 692,00 ₸')
    })

    it('parses negative without spaces in integer part', () => {
      expect(parseMainAmountFromLine('- 499,00 ₸ + 5,00 Б')).toBe('- 499,00 ₸')
    })
  })

  describe('findFirstTransactionLineIndex', () => {
    it('returns index of first DD.MM.YYYY followed by HH:MM', () => {
      const lines = sampleStatement.split('\n').map((l) => l.trimEnd())
      const idx = findFirstTransactionLineIndex(lines)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(lines[idx].trim()).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
      expect(lines[idx + 1].trim()).toMatch(/^\d{2}:\d{2}$/)
    })

    it('returns -1 when no date+time pair exists', () => {
      expect(findFirstTransactionLineIndex(['foo', 'bar'])).toBe(-1)
    })
  })

  describe('parseStatementText (integration)', () => {
    it('parses Refund and Purchases from sample', () => {
      const { header, transactions } = parseStatementText(sampleStatement, 'uid-1')
      expect(header.locale).toBe('en')
      expect(header.statementKind).toBe('card')
      expect(header.iban).toBe('KZ38886D224304110804')
      expect(header.cardLast4).toBe('8517')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Refund')
      expect(transactions[0].amount).toBe('+ 460,00 ₸')
      expect(transactions[0].description).toContain('Refund')
      expect(transactions[1].operation).toBe('Purchases and spending')
      expect(transactions[1].amount).toBe('- 134,00 ₸')
    })

    it('parses Reward Cash back and Bonuses converted to Tenge', () => {
      const text = headerBlock() + `
02.04.2026
23:59
Reward Cash back/Money back
Bonuses converted to Tenge
+ 692,00 ₸
`
      const { transactions } = parseStatementText(text, 'u2')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].operation).toBe('Bonuses converted to Tenge')
      expect(transactions[0].amount).toBe('+ 692,00 ₸')
      expect(transactions[0].description).toContain('Reward Cash back')
    })

    it('parses Refills and Outgoing transfers', () => {
      const text = headerBlock() + `
31.03.2026
21:04
Transfer from "Простой Плюс"
Refills
+ 50 000,00 ₸
10.02.2026
15:01
Transfer to "Простой Плюс"
Outgoing transfers
- 500 000,00 ₸
`
      const { transactions } = parseStatementText(text, 'u3')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Refills')
      expect(transactions[0].amount).toBe('+ 50 000,00 ₸')
      expect(transactions[1].operation).toBe('Outgoing transfers')
      expect(transactions[1].amount).toBe('- 500 000,00 ₸')
    })

    it('skips bank footer line between merchant and continues on next page', () => {
      const text = headerBlock() + `
05.04.2026
01:31
TANGO KAFE
«Home Credit Bank» JSC (SB of JSC «ForteBank»), BIC INLMKZKA


Purchases and spending
- 100,00 ₸
5812
Eating Places
`
      const { transactions } = parseStatementText(text, 'u4')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].description).toContain('TANGO KAFE')
      expect(transactions[0].amount).toBe('- 100,00 ₸')
    })

    it('parses two operations on the same calendar date and time', () => {
      const text = headerBlock() + `
03.03.2026
09:44
Transfer to "Простой Плюс"
Outgoing transfers
- 500 000,00 ₸
03.03.2026
09:44
С карты другого банка
Refills
+ 700 000,00 ₸
`
      const { transactions } = parseStatementText(text, 'u5')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].amount).toBe('- 500 000,00 ₸')
      expect(transactions[1].amount).toBe('+ 700 000,00 ₸')
    })

    it('parses purchase without bonus part on amount line', () => {
      const text = headerBlock() + `
01.04.2026
18:58
VULTR BY CONSTANT
Purchases and spending
- 1 932,97 ₸
7372
Comp Programing,data
`
      const { transactions } = parseStatementText(text, 'u6')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe('- 1 932,97 ₸')
    })

    it('parses Kazakh statement: purchase and bonus conversion', () => {
      const { header, transactions } = parseStatementText(kzSampleStatement, 'kz-u1')
      expect(header.locale).toBe('kz')
      expect(header.statementKind).toBe('card')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Сатып алулар мен шығындар')
      expect(transactions[1].operation).toBe('Теңгеге аударылған бонустар')
      expect(transactions[1].description).toContain('Бонустар Кэшбек')
    })

    it('parses KZ refill and outgoing (Russian merchant lines)', () => {
      const text = kzHeaderBlock() + `
10.04.2026
09:29
Перевод с "Простой Плюс"
Толықтыру
+ 150 000,00 ₸
05.04.2026
11:10
Перевод на "Простой Плюс"
Шығыс аударымдар
- 200 000,00 ₸
`
      const { transactions } = parseStatementText(text, 'kz-u2')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Толықтыру')
      expect(transactions[1].operation).toBe('Шығыс аударымдар')
    })

    it('skips KZ bank footer between transactions', () => {
      const text = kzHeaderBlock() + `
08.04.2026
19:11
SHOP
Сатып алулар мен шығындар
- 100,00 ₸
«Home Credit Bank»  АҚ («ForteBank» АҚ ЕБ), БСК INLMKZKA


07.04.2026
20:40
Wolt
Сатып алулар мен шығындар
- 200,00 ₸
`
      const { transactions } = parseStatementText(text, 'kz-u3')
      expect(transactions).toHaveLength(2)
      expect(transactions[1].amount).toBe('- 200,00 ₸')
    })

    it('parses Russian statement: purchase and bonus conversion', () => {
      const { header, transactions } = parseStatementText(ruSampleStatement, 'ru-u1')
      expect(header.locale).toBe('ru')
      expect(header.statementKind).toBe('card')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Покупки и траты')
      expect(transactions[1].operation).toBe('Переведённые в тенге бонусы')
      expect(transactions[1].description).toContain('Зачисление бонусов')
    })

    it('parses RU refill and outgoing', () => {
      const text = ruHeaderBlock() + `
10.04.2026
09:29
Перевод с "Простой Плюс"
Пополнения
+ 150 000,00 ₸
05.04.2026
11:10
Перевод на "Простой Плюс"
Исходящие переводы
- 200 000,00 ₸
`
      const { transactions } = parseStatementText(text, 'ru-u2')
      expect(transactions).toHaveLength(2)
      expect(transactions[0].operation).toBe('Пополнения')
      expect(transactions[1].operation).toBe('Исходящие переводы')
    })

    it('skips RU bank footer between transactions', () => {
      const text = ruHeaderBlock() + `
08.04.2026
19:11
SHOP
Покупки и траты
- 100,00 ₸
AО «Home Credit Bank»  (ДБ АО «ForteBank»), БИК INLMKZKA


07.04.2026
20:40
Wolt
Покупки и траты
- 200,00 ₸
`
      const { transactions } = parseStatementText(text, 'ru-u3')
      expect(transactions).toHaveLength(2)
      expect(transactions[1].amount).toBe('- 200,00 ₸')
    })

    it('parses Russian deposit: capitalization line', () => {
      const { header, transactions } = parseStatementText(ruDepositSample, 'dep-ru')
      expect(header.statementKind).toBe('deposit')
      expect(header.locale).toBe('ru')
      expect(header.productTitle).toBe('Простой')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe('+ 417,64 ₸')
      expect(transactions[0].description).toContain('Капитализация')
    })

    it('parses Kazakh deposit: multiline capitalization', () => {
      const { header, transactions } = parseStatementText(kzDepositSample, 'dep-kz')
      expect(header.statementKind).toBe('deposit')
      expect(header.locale).toBe('kz')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe('+ 417,64 ₸')
    })
  })
})
