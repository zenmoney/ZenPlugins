import { toZenmoneyTransaction as commonToZenmoneyTransaction } from '../../../../common/converters'
import { convertTransaction } from '../../converters'

const toReadableTransactionForAccount = account => transaction => convertTransaction(transaction, account)
const toZenmoneyTransactionForAccounts = accountsByIdLookup => transaction => commonToZenmoneyTransaction(transaction, accountsByIdLookup)

describe('convertTransaction', () => {
  const account = { id: 'account' }
  const accountsByIdLookup = [account].reduce((all, acc) => ({ ...all, [acc.id]: acc }), {})

  it('converts replenishment', () => {
    const apiTransactions = [
      {
        operation_id: '550751313786113004',
        title: 'Сбербанк, пополнение',
        amount: 100.00,
        direction: 'in',
        datetime: '2017-06-14T10:28:33Z',
        status: 'success',
        type: 'deposition',
        group_id: 'type_history_non_p2p_deposit'
      },
      {
        amount: 1404.94,
        datetime: '2018-04-13T06:43:14Z',
        direction: 'in',
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '576916994317014012',
        status: 'success',
        title: 'travelpayouts.ru, пополнение',
        type: 'deposition'
      },
      {
        amount: 900,
        datetime: '2018-04-11T12:56:39Z',
        direction: 'in',
        group_id: 'type_history_non_p2p_deposit',
        operation_id: '576766599818039004',
        status: 'success',
        title: 'Пополнение с банковской карты',
        type: 'deposition'
      }
    ]

    const expectedReadableTransactions = [
      {
        date: new Date('2017-06-14T10:28:33.000Z'),
        hold: false,
        comment: 'Сбербанк, пополнение',
        merchant: null,
        movements: [
          {
            id: '550751313786113004',
            account: { id: 'account' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2018-04-13T06:43:14.000Z'),
        hold: false,
        comment: 'travelpayouts.ru, пополнение',
        merchant: null,
        movements: [
          {
            id: '576916994317014012',
            account: { id: 'account' },
            invoice: null,
            sum: 1404.94,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2018-04-11T12:56:39.000Z'),
        hold: false,
        comment: 'Пополнение с банковской карты',
        merchant: null,
        movements: [
          {
            id: '576766599818039004',
            account: { id: 'account' },
            invoice: null,
            sum: 900,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: '550751313786113004',
        date: new Date('2017-06-14T10:28:33Z'),
        hold: false,
        income: 100,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Сбербанк, пополнение'
      },
      {
        id: '576916994317014012',
        date: new Date('2018-04-13T06:43:14Z'),
        hold: false,
        income: 1404.94,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'travelpayouts.ru, пополнение'
      },
      {
        id: '576766599818039004',
        date: new Date('2018-04-11T12:56:39Z'),
        hold: false,
        income: 900,
        incomeAccount: 'account',
        outcome: 0,
        outcomeAccount: 'account',
        comment: 'Пополнение с банковской карты'
      }
    ]

    const toReadableTransaction = toReadableTransactionForAccount(account)
    const readableTransactions = apiTransactions.map(toReadableTransaction)
    expect(readableTransactions).toEqual(expectedReadableTransactions)

    const toZenmoneyTransaction = toZenmoneyTransactionForAccounts(accountsByIdLookup)
    const zenmoneyTransactions = readableTransactions.map(toZenmoneyTransaction)
    expect(zenmoneyTransactions).toEqual(expectedZenmoneyTransactions)
  })
})
