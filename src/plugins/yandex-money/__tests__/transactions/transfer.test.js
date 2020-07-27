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
        comment: 'Перевод на счет YM 4100148118398',
        merchant: {
          country: null,
          city: null,
          title: 'YM 4100148118398',
          mcc: null,
          location: null
        },
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
              syncIds: ['4100148118398'],
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
              syncIds: ['2743'],
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
        // id: '550751409179120010',
        date: new Date('2017-06-14T10:30:12Z'),
        hold: false,
        income: 100,
        incomeAccount: 'ccard#RUB#4100148118398',
        incomeBankID: null,
        outcome: 100,
        outcomeAccount: 'account',
        outcomeBankID: '550751409179120010',
        payee: 'YM 4100148118398',
        mcc: null,
        comment: 'Перевод на счет YM 4100148118398'
      },
      {
        date: new Date('2020-06-14T15:02:13.000Z'),
        hold: false,
        income: 450.82,
        incomeAccount: 'ccard#RUB#2743',
        incomeBankID: null,
        outcome: 450.82,
        outcomeAccount: 'account',
        outcomeBankID: '645418930452788631',
        comment: 'Перевод на карту 553691******2743'
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
