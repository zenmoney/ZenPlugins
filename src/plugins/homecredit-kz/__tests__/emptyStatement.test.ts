import { parseStatementText } from '../parser'

it('accepts a card statement explicitly reporting no operations', () => {
  // mail_inbound 205801, build 24: complete PDF text; personal identifiers replaced for master.
  const text = `


Номер договора:  4601000001
IBAN:  KZ00886D224601000001
Номер карточки:  404932******1234
ФИО клиента:  ИВАН ИВАНОВИЧ ИВАНОВ
ИИН клиента:  900101300000
Дата выписки:  08.11.2026
Выписка
по дебетовой карте за период с 08.11.2026 по 08.11.2026
Доступный остаток на момент выписки (08.11.2026) — 6 620,85 ₸
Дата
операции
Детали операции Cумма Бонусы MCC
код категории
продавца
В этот период не было ни одной банковской операции.
Чтобы увидеть детальную историю операций — оплатите что-нибудь или выберите другой
период
AО «Home Credit Bank»  (ДБ АО «ForteBank»), БИК INLMKZKA`
  expect(parseStatementText(text, 'statement')).toEqual({
    header: {
      iban: 'KZ00886D224601000001',
      cardLast4: '1234',
      statementDateIso: '2026-11-08T00:00:00.000',
      balance: 6620.85,
      locale: 'ru',
      statementKind: 'card'
    },
    transactions: []
  })
})
