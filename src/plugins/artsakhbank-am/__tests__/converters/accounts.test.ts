import { AccountType } from '../../../../types/zenmoney'
import { TemporaryError } from '../../../../errors'
import { convertAccounts, parseDecimal, parseGridRecords } from '../../converters'
import { ACCOUNTS_GRID } from '../../__fixtures__/accountsPage'
import { CARDS_GRID } from '../../__fixtures__/cardsPage'

describe('счета', () => {
  it('читает счёт с картой из настоящего грида банка', () => {
    expect(convertAccounts(ACCOUNTS_GRID)).toEqual([{
      accountNumber: '22300100000001',
      account: {
        id: '22300100000001',
        type: AccountType.ccard,
        title: 'MasterCard MC STANDARD',
        instrument: 'USD',
        balance: 529.63,
        syncIds: ['22300100000001', '544906****1234']
      }
    }])
  })

  // Колонки безымянные, и перепутать местами баланс с эквивалентом в драмах
  // означало бы показать в приложении неверные деньги
  it('берёт баланс, а не эквивалент в драмах', () => {
    expect(convertAccounts(ACCOUNTS_GRID)[0].account.balance).toBe(529.63)
  })

  // Остаток счёта — единственное число, которое сходится с суммой операций из
  // выписки. Поставь сюда карточный, и ZenMoney спишет разницу корректировкой:
  // банк держит неснижаемый остаток и авторизации, а в выписке их нет
  it('в остатке даёт счёт, а в доступных средствах — карту', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID, CARDS_GRID)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBe(430.19)
  })

  // Закрытая или перевыпущенная карта приходит в гриде с пустым остатком
  it('не роняет синхронизацию из-за карты без остатка', () => {
    const blankCard = CARDS_GRID.replace("c6: '430.19'", "c6: ''")
    expect(blankCard).not.toBe(CARDS_GRID)
    const [{ account }] = convertAccounts(ACCOUNTS_GRID, blankCard)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBeUndefined()
  })

  it('обходится без доступных средств, когда страница карт не пришла', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID)
    expect(account.balance).toBe(529.63)
    expect(account.available).toBeUndefined()
  })

  it('считает счёт без карты обычным, а не карточным', () => {
    const html = "records: [{ recid: 1,c1: '22300100000002',c8: 'AMD',c3: '',c4: '100',c6: '100'}]"
    const [{ account }] = convertAccounts(html)
    expect(account.type).toBe(AccountType.checking)
    expect(account.title).toBe('22300100000002 AMD')
    expect(account.syncIds).toEqual(['22300100000002'])
  })

  it('пропускает пустую строку грида', () => {
    expect(convertAccounts("records: [{ recid: 1,c1: '',c8: ''}]")).toEqual([])
  })

  it('возвращает пусто, когда грида на странице нет', () => {
    expect(parseGridRecords('<html><body>no grid</body></html>')).toEqual([])
  })

  // Валюту счёта банк пишет теми же нестандартными кодами, что и в выписке.
  // Без нормализации счёт уехал бы в несуществующую валюту RUR, а операция
  // того же счёта — в RUB, и каждая покупка получила бы лишний курс
  it('нормализует валюту счёта так же, как в выписке', () => {
    const [{ account }] = convertAccounts("records: [{ recid: 1,c1: '22300100000003',c8: 'RUR',c4: '10'}]")
    expect(account.instrument).toBe('RUB')
  })
})

describe('числа', () => {
  it('читает дробные и разделители тысяч', () => {
    expect(parseDecimal('529.63')).toBe(529.63)
    expect(parseDecimal('1,234.50')).toBe(1234.5)
    expect(parseDecimal('0')).toBe(0)
  })

  // Молчаливый ноль ZenMoney примет за правду и подгонит счёт корректировкой,
  // а голое 'Assertion failed' пользователю ничего не объясняет
  it('на испорченном числе банка бросает понятную ошибку, а не утверждение', () => {
    expect(() => parseDecimal('—')).toThrow(TemporaryError)
    expect(() => parseDecimal('')).toThrow(TemporaryError)
    expect(() => parseDecimal(undefined)).toThrow(TemporaryError)
  })

  // Общий код репозитория узнаёт маску карты только по звёздочке: по ней
  // sanitizeSyncId и trimSyncId сопоставляют счета между синхронизациями
  it('приводит маску карты к звёздочкам', () => {
    const [{ account }] = convertAccounts(ACCOUNTS_GRID)
    expect(account.syncIds.some(id => id.includes('x'))).toBe(false)
    expect(account.syncIds).toContain('544906****1234')
  })
})
