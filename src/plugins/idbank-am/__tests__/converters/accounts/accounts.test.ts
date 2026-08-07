import { convertAccounts } from '../../../converters'
import { AccountType } from '../../../../../types/zenmoney'

const translations = (ru: string, en: string, am: string): unknown => ({
  Translation: [
    { lang: 'ru', value: ru },
    { lang: 'en', value: en },
    { lang: 'am', value: am }
  ]
})

const cardAccount = {
  AccountId: '12345678901200',
  AccountNumber: '12345678901200',
  AccountCategory: '19',
  AccountCategoryName: translations('Карточный счет', 'Card account', 'Քարտային հաշիվ'),
  OpenDate: '01.01.2024',
  Balance: '1,000.00',
  CodeCurrency: '840',
  IsOpen: '1',
  CloseDate: null,
  CardId: '4111********1111'
}

const bankAccount = {
  AccountId: '12345678901201',
  AccountNumber: '12345678901201',
  AccountCategory: '16',
  AccountCategoryName: translations('Банковский счет', 'Bank account', 'Բանկային հաշիվ'),
  OpenDate: '01.01.2024',
  Balance: '2,500.00',
  CodeCurrency: '840',
  IsOpen: '1',
  CloseDate: null,
  CardId: null
}

// Драмовый счёт: код валюты приходит с ведущим нулём
const dramAccount = { ...bankAccount, AccountNumber: '12345678901202', CodeCurrency: '051', Balance: '250,000.00' }

const closedAccount = { ...bankAccount, AccountNumber: '12345678901203', IsOpen: '0', CloseDate: '01.02.2026' }

const card = {
  Id: '4111********1111',
  Number: '4111********1111',
  RealNumber: '4111111111111111',
  Description: 'GOLD',
  Ctype: 'VISA',
  Currency: 'USD',
  State: 'OK',
  Balance: '1,000.00',
  Account: '12345678901200'
}

describe('convertAccounts', () => {
  it.each([
    [
      'карточный счёт с картой',
      [cardAccount],
      [card],
      [
        {
          accountNumber: '12345678901200',
          account: {
            id: '12345678901200',
            type: AccountType.ccard,
            title: 'VISA GOLD USD *1200',
            instrument: 'USD',
            balance: 1000,
            syncIds: ['12345678901200', '4111********1111'],
            archived: false
          }
        }
      ]
    ],
    [
      'счёт без карты',
      [bankAccount],
      [],
      [
        {
          accountNumber: '12345678901201',
          account: {
            id: '12345678901201',
            type: AccountType.checking,
            title: 'Bank account USD *1201',
            instrument: 'USD',
            balance: 2500,
            syncIds: ['12345678901201'],
            archived: false
          }
        }
      ]
    ],
    [
      'драмовый счёт: код валюты 051',
      [dramAccount],
      [],
      [
        {
          accountNumber: '12345678901202',
          account: {
            id: '12345678901202',
            type: AccountType.checking,
            title: 'Bank account AMD *1202',
            instrument: 'AMD',
            balance: 250000,
            syncIds: ['12345678901202'],
            archived: false
          }
        }
      ]
    ],
    [
      'закрытый счёт архивируется и не запрашивает операции',
      [closedAccount],
      [],
      [
        {
          accountNumber: null,
          account: {
            id: '12345678901203',
            type: AccountType.checking,
            title: 'Bank account USD *1203',
            instrument: 'USD',
            balance: 2500,
            syncIds: ['12345678901203'],
            archived: true
          }
        }
      ]
    ]
  ])('converts %s', (_, apiAccounts, apiCards, accounts) => {
    expect(convertAccounts(apiAccounts, apiCards)).toEqual(accounts)
  })

  it('не падает на карте, счёт которой не пришёл в списке', () => {
    const orphanCard = { ...card, Account: '99999999999999' }
    expect(convertAccounts([bankAccount], [orphanCard])).toEqual([
      expect.objectContaining({
        account: expect.objectContaining({ id: '12345678901201', syncIds: ['12345678901201'] })
      })
    ])
  })

  it('различает счета одной валюты по номеру', () => {
    const [first, second] = convertAccounts([bankAccount, dramAccount], [])
    expect(first.account.title).not.toEqual(second.account.title)
  })

  it('не оставляет дыр в названии карты без типа и описания', () => {
    const namelessCard = { ...card, Ctype: null, Description: null }
    const [{ account }] = convertAccounts([cardAccount], [namelessCard])
    expect(account.title).toEqual('USD *1200')
  })

  it('называет счёт номером, когда английского перевода категории нет', () => {
    const untranslated = { ...bankAccount, AccountCategoryName: { Translation: [{ lang: 'am', value: 'Բանկային հաշիվ' }] } }
    const [{ account }] = convertAccounts([untranslated], [])
    expect(account.title).toEqual('12345678901201 USD')
  })

  it('оставляет незнакомый код валюты как есть, а не роняет синхронизацию', () => {
    const [{ account }] = convertAccounts([{ ...bankAccount, CodeCurrency: 'XTS' }], [])
    expect(account.instrument).toEqual('XTS')
  })

  it('понимает числовые признаки счёта: иначе живой счёт уехал бы в архив', () => {
    const [{ account, accountNumber }] = convertAccounts([{ ...cardAccount, IsOpen: 1, AccountCategory: 19 }], [card])
    expect(account.archived).toBe(false)
    expect(account.type).toEqual(AccountType.ccard)
    expect(accountNumber).toEqual('12345678901200')
  })

  it('понимает баланс числом: банк уже присылает так код результата', () => {
    const [{ account }] = convertAccounts([{ ...bankAccount, Balance: 2500 }], [])
    expect(account.balance).toEqual(2500)
  })

  it('не выдаёт пропавший баланс за ноль: ZenMoney подогнал бы счёт корректировкой', () => {
    expect(() => convertAccounts([{ ...bankAccount, Balance: null }], [])).toThrow()
  })
})
