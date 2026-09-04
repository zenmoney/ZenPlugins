import { AccountOrCard, AccountType } from '../../../../types/zenmoney'
import { TemporaryError } from '../../../../errors'
import { adjustTransactions } from '../../../../common/transactionGroupHandler'
import { convertTransactions, parseInstrument, parseStatement } from '../../converters'
import { STATEMENT_XML } from '../../__fixtures__/statement'

const account: AccountOrCard = {
  id: '22300100000001',
  type: AccountType.ccard,
  title: 'MasterCard MC STANDARD',
  instrument: 'USD',
  syncIds: ['22300100000001'],
  balance: 529.63
}

function convert (): ReturnType<typeof convertTransactions> {
  return convertTransactions(parseStatement(new TextEncoder().encode(STATEMENT_XML).buffer as ArrayBuffer), account)
}

describe('выписка', () => {
  it('берёт из файла только операции, без итогов по дню', () => {
    expect(convert()).toHaveLength(7)
  })

  it('читает списание в валюте счёта без лишней суммы в валюте операции', () => {
    expect(convert()[0]).toEqual({
      hold: false,
      date: new Date(2026, 7, 13),
      movements: [{ id: null, account: { id: account.id }, invoice: null, sum: -54.66, fee: 0 }],
      merchant: null,
      comment: 'Annual fee by pl.cards'
    })
  })

  // Колонка суммы — в валюте операции, а по счёту прошла другая сумма.
  // Перепутать их значило бы записать 10 000 долларов вместо 115
  it('пополнение в рублях кладёт в счёт доллары, а рубли — в валюту операции', () => {
    const [, income] = convert()
    expect(income.movements[0].sum).toBe(115.33)
    expect(income.movements[0].invoice).toEqual({ sum: 10000, instrument: 'RUB' })
  })

  it('разбирает продавца из описания карточной операции', () => {
    const purchase = convert()[2]
    expect(purchase.merchant).toEqual({
      country: 'TUR', city: 'ISTANBUL', title: 'CARREFOURSA', mcc: null, location: null
    })
    expect(purchase.movements[0].sum).toBe(-13.87)
    expect(purchase.movements[0].invoice).toEqual({ sum: -650.95, instrument: 'TRY' })
    expect(purchase.comment).toBeNull()
  })

  // Банк повторяет в строке комиссии сумму исходной покупки, хотя списал свою.
  // Без проверки курса те же 16 798.50 лир записались бы в расход дважды
  it('не приписывает комиссии сумму исходной покупки', () => {
    const commission = convert()[3]
    expect(commission.comment).toBe('Commission')
    expect(commission.merchant).toEqual(expect.objectContaining({ title: 'MESRUTIYET CA' }))
    expect(commission.movements[0].sum).toBe(-8.28)
    expect(commission.movements[0].invoice).toBeNull()
  })

  // У пары евро-доллар курс печатается в обратную сторону: 60 * 1.19 = 71.46,
  // а не 71.46 * 1.19. Односторонняя проверка отбросила бы верную сумму
  it('принимает курс, записанный в обратную сторону', () => {
    const euro = convert()[5]
    expect(euro.movements[0].sum).toBe(-71.46)
    expect(euro.movements[0].invoice).toEqual({ sum: -60, instrument: 'EUR' })
    expect(euro.comment).toBeNull()
  })

  // Ссылка бывает и без цифр — 'PDGOUQZN' у Discord оставался комментарием
  it('не тащит ссылку операции в комментарий, даже без цифр', () => {
    const purchase = convert()[6]
    expect(purchase.merchant).toEqual(expect.objectContaining({ title: 'ANTHROPIC', country: 'USA' }))
    expect(purchase.comment).toBeNull()
    expect(purchase.movements[0].invoice).toBeNull()
  })

  it('срезает ссылку без цифр', () => {
    const rows = [['21.08.2026', '2.99', 'USD', null, null, '-2.99', null, null, null, null,
      null, null, null, 'PDGOUQZN\\USA\\SAN FRANCISCO\\DISCORD* SUPP']]
    const [discord] = convertTransactions(rows, account)
    expect(discord.comment).toBeNull()
    expect(discord.merchant).toEqual(expect.objectContaining({ title: 'DISCORD* SUPP' }))
  })

  it('читает операцию, у которой банк не проставил ссылку', () => {
    const uber = convert()[4]
    expect(uber.merchant).toEqual({
      country: 'NLD', city: 'help.uber.com', title: 'UBER *TRIP HE', mcc: null, location: null
    })
    expect(uber.comment).toBeNull()
  })

  // Пустой файл — это не «ноль операций», а страница ошибки или форма входа
  // вместо выписки. Молча вернуть пустоту значит зачесть синхронизацию
  // успешной и больше никогда не запросить пропущенные дни
  it('не принимает за выписку файл без английского листа', () => {
    expect(() => parseStatement(new TextEncoder().encode('<Workbook/>').buffer as ArrayBuffer))
      .toThrow(TemporaryError)
  })

  it('спотыкается на мусоре вместо файла понятной ошибкой', () => {
    expect(() => parseStatement(new TextEncoder().encode('<html>Error 500</html>').buffer as ArrayBuffer))
      .toThrow(TemporaryError)
  })

  // А вот настоящая выписка за период без операций — это законный ноль
  it('возвращает пустой список для выписки без единой операции', () => {
    const empty = STATEMENT_XML.replace(/<Row[\s\S]*?<\/Row>/g, '')
    expect(convertTransactions(parseStatement(new TextEncoder().encode(empty).buffer as ArrayBuffer), account))
      .toEqual([])
  })
})

describe('валюты банка', () => {
  // Ни RUR, ни TLY не являются кодами ISO: без подмены ZenMoney заведёт
  // под них отдельные валюты, и остатки перестанут сходиться
  it('приводит нестандартные коды банка к общепринятым', () => {
    expect(parseInstrument('RUR')).toBe('RUB')
    expect(parseInstrument('TLY')).toBe('TRY')
    expect(parseInstrument('USD')).toBe('USD')
  })
})

// Банк не даёт времени. Привязка к поясу банка сдвигала календарный день:
// в выписке 20.08, а у пользователя западнее показывалось 19.08
describe('календарный день', () => {
  it('совпадает с выпиской в поясе устройства, каким бы он ни был', () => {
    const [first] = convert()
    expect([first.date.getFullYear(), first.date.getMonth(), first.date.getDate()]).toEqual([2026, 7, 13])
  })
})

// Перевод между своими счетами банк показывает двумя строками — по одной
// в выписке каждого счёта. Своего номера операции у него нет, поэтому пара
// узнаётся по дню, валюте и сумме, как в alfabank-ua, apelsin-uz и bgpb
describe('перевод между своими счетами', () => {
  const other: AccountOrCard = { ...account, id: '22300100000002', title: 'второй счёт' }
  const row = (details: string, credit: string | null, debit: string | null): unknown[] =>
    ['26.08.2026', '100.00', 'USD', credit, null, debit, null, null, null, null, null, null, null, details]

  it('сходится в одну операцию с двумя движениями', () => {
    const merged = adjustTransactions({
      transactions: [
        ...convertTransactions([row('PERECHISLENIE SO SVOEGO ScETA 22300100000002', null, '-100.00')], account),
        ...convertTransactions([row('POPOLNENIE SVOEGO ScETA 22300100000001', '+100.00', null)], other)
      ]
    })
    expect(merged).toHaveLength(1)
    expect(merged[0].movements.map(m => m.sum)).toEqual([-100, 100])
    expect(merged[0].movements.map(m => (m.account as { id: string }).id))
      .toEqual([account.id, other.id])
  })

  it('сходится и при переводе между счетами в разных валютах', () => {
    const rubAccount: AccountOrCard = { ...other, instrument: 'RUB' }
    const usdIncome = ['26.08.2026', '10,000.00', 'RUR', '+115.33', null, null, null, '86.71', null, null,
      null, null, null, 'POPOLNENIE SVOEGO ScETA 22300100000001']
    const rubOutcome = ['26.08.2026', '10,000.00', 'RUR', null, null, '-10,000.00', null, null, null, null,
      null, null, null, 'PERECHISLENIE SO SVOEGO ScETA 22300100000002']

    const merged = adjustTransactions({
      transactions: [
        ...convertTransactions([rubOutcome], rubAccount),
        ...convertTransactions([usdIncome], account)
      ]
    })

    expect(merged).toHaveLength(1)
    expect(merged[0].movements.map(m => [m.sum, (m.account as { id: string }).id]))
      .toEqual([[-10000, rubAccount.id], [115.33, account.id]])
  })

  // Иначе две несвязанные операции одного дня на одном счёте слиплись бы
  it('не сливает списание и зачисление одного счёта', () => {
    const merged = adjustTransactions({
      transactions: convertTransactions([
        row('PERECHISLENIE SO SVOEGO ScETA 1', null, '-100.00'),
        row('POPOLNENIE SVOEGO ScETA 1', '+100.00', null)
      ], account)
    })
    expect(merged).toHaveLength(2)
  })

  it('не сливает две покупки на одну сумму в разных счетах', () => {
    const merged = adjustTransactions({
      transactions: [
        ...convertTransactions([row('Purchase A', null, '-100.00')], account),
        ...convertTransactions([row('Purchase B', null, '-100.00')], other)
      ]
    })
    expect(merged).toHaveLength(2)
  })
})
