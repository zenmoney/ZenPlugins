import { toZenmoneyTransaction as commonToZenmoneyTransaction } from '../../../../common/converters'
import { convertTransaction } from '../../converters'

const toReadableTransactionForAccount = account => transaction => convertTransaction(transaction, account)
const toZenmoneyTransactionForAccounts = accountsByIdLookup => transaction => commonToZenmoneyTransaction(transaction, accountsByIdLookup)

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'RUB'
  }
  const accountsByIdLookup = [account].reduce((all, acc) => ({ ...all, [acc.id]: acc }), {})

  it('converts transfer to Yandex Money wallet', () => {
    const apiTransactions = [
      {
        pattern_id: 'p2p',
        operation_id: '550751409179120010',
        title: 'Перевод на счет 4100148118398',
        amount: 100.00,
        direction: 'out',
        datetime: '2017-06-14T10:30:12Z',
        status: 'success',
        type: 'outgoing-transfer',
        group_id: 'type_history_p2p_outgoing_all'
      },
      {
        pattern_id: '4601',
        group_id: 'pattern_4601',
        operation_id: '645418930452788631',
        title: 'Перевод на карту 553691******2743',
        amount: 450.82,
        direction: 'out',
        datetime: '2020-06-14T15:02:13Z',
        status: 'success',
        type: 'payment-shop',
        // categories: [ [length]: 0 ],
        showcase_format: 'json',
        spendingCategories: [{ name: 'TransferWithdraw', sum: 450.82 }],
        amount_currency: 'RUB',
        is_sbp_operation: false
      }
    ]

    const expectedReadableTransactions = [
      {
        date: new Date('2017-06-14T10:30:12.000Z'),
        hold: false,
        // comment: null,
        comment: 'Перевод на счет 4100148118398',
        merchant: null,
        movements: [
          {
            id: '550751409179120010',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: '4100148118398',
              company: null
            },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2020-06-14T15:02:13.000Z'),
        hold: false,
        comment: 'Перевод на карту 553691******2743',
        // comment: 'Снятие наличных в банкомате: VB24 D. 15, LIT. G, PR',
        merchant: null,
        movements: [
          {
            id: '645418930452788631',
            account: { id: 'account' },
            invoice: null,
            sum: -450.82,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: '2743',
              company: null
            },
            invoice: null,
            sum: 450.82,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: '550751409179120010',
        date: new Date('2017-06-14T10:30:12Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 100,
        outcomeAccount: 'account',
        payee: 'YM 4100148118398',
        mcc: null,
        comment: null
      },
      {
        date: new Date('2018-12-27T18:19:39.000Z'),
        hold: false,
        income: 10000,
        incomeAccount: 'cash#RUB',
        incomeBankID: null,
        outcome: 10000,
        outcomeAccount: 'account',
        outcomeBankID: '599249979205221162',
        comment: 'Снятие наличных в банкомате: VB24 D. 15, LIT. G, PR'
      }

    ]

    const toReadableTransaction = toReadableTransactionForAccount(account)
    const readableTransactions = apiTransactions.map(toReadableTransaction)
    expect(readableTransactions).toEqual(expectedReadableTransactions)

    const toZenmoneyTransaction = toZenmoneyTransactionForAccounts(accountsByIdLookup)
    const zenmoneyTransactions = readableTransactions.map(toZenmoneyTransaction)
    expect(zenmoneyTransactions).toEqual(expectedZenmoneyTransactions)
  })

  it('skips in_progress transactions', () => {
    expect(convertTransaction({
      pattern_id: 'p2p',
      group_id: 'type_history_p2p_outgoing_all',
      operation_id: '607535685291020110',
      title: 'Перевод на счет 410012481246213',
      amount: 3500,
      direction: 'out',
      datetime: '2019-04-02T15:54:50Z',
      status: 'in_progress',
      type: 'outgoing-transfer',
      spendingCategories: [{ name: 'TransferWithdraw', sum: 3500 }],
      amount_currency: 'RUB'
    }, account)).toBeNull()
  })

  it('skips transactions with amount = 0', () => {
    expect(convertTransaction({
      group_id: 'type_history_non_p2p_deposit',
      operation_id: '639014474966232004',
      title: 'Корректировка: списание бонусов',
      amount: 0,
      direction: 'in',
      datetime: '2020-04-01T00:01:14Z',
      status: 'success',
      type: 'deposition',
      spendingCategories: [{ name: 'Deposition', sum: 0 }],
      amount_currency: 'RUB',
      is_sbp_operation: false
    }, account)).toBeNull()
  })
})
