import { toZenmoneyTransaction as commonToZenmoneyTransaction } from '../../../../common/converters'
import { convertTransaction } from '../../converters'

const toReadableTransactionForAccount = account => transaction => convertTransaction(transaction, account)
const toZenmoneyTransactionForAccounts = accountsByIdLookup => transaction => commonToZenmoneyTransaction(transaction, accountsByIdLookup)

describe('convertTransaction', () => {
  const account = { id: 'account' }
  const accountsByIdLookup = [account].reduce((all, acc) => ({ ...all, [acc.id]: acc }), {})

  it('converts outcome', () => {
    const apiTransactions = [
      {
        amount: 70,
        categories: [],
        datetime: '2017-02-22T10:01:38Z',
        direction: 'out',
        group_id: 'pattern_1721',
        operation_id: '541029695812341276',
        pattern_id: '1721',
        status: 'success',
        title: 'VK.com',
        type: 'payment-shop'
      },
      {
        pattern_id: 'p2p',
        operation_id: '549866839017090007',
        title: 'Поддержка проекта «Скрытый смысл»',
        amount: 100,
        direction: 'out',
        datetime: '2017-06-04T04:47:22Z',
        status: 'success',
        type: 'outgoing-transfer',
        group_id: 'type_history_p2p_outgoing_all',
        label: ''
      },
      {
        amount: 100,
        datetime: '2017-03-11T10:04:34Z',
        direction: 'out',
        group_id: 'type_history_p2p_outgoing_all',
        operation_id: '542541865986110009',
        pattern_id: 'p2p',
        status: 'success',
        title: 'Благодарность проекту BSP',
        type: 'outgoing-transfer'
      }
    ]

    const expectedReadableTransactions = [
      {
        date: new Date('2017-02-22T10:01:38Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'VK.com',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '541029695812341276',
            account: { id: 'account' },
            invoice: null,
            sum: -70,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2017-06-04T04:47:22Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'Скрытый смысл',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '549866839017090007',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ]
      },
      {
        date: new Date('2017-03-11T10:04:34Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'BSP',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '542541865986110009',
            account: { id: 'account' },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: '541029695812341276',
        date: new Date('2017-02-22T10:01:38Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 70,
        outcomeAccount: 'account',
        payee: 'VK.com',
        mcc: null,
        comment: null
      },
      {
        id: '549866839017090007',
        date: new Date('2017-06-04T04:47:22Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 100,
        outcomeAccount: 'account',
        payee: 'Скрытый смысл',
        mcc: null,
        comment: null
      },
      {
        id: '542541865986110009',
        date: new Date('2017-03-11T10:04:34Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 100,
        outcomeAccount: 'account',
        payee: 'BSP',
        mcc: null,
        comment: null
      }
    ]

    const toReadableTransaction = toReadableTransactionForAccount(account)
    const readableTransactions = apiTransactions.map(toReadableTransaction)
    expect(readableTransactions).toEqual(expectedReadableTransactions)

    const toZenmoneyTransaction = toZenmoneyTransactionForAccounts(accountsByIdLookup)
    const zenmoneyTransactions = readableTransactions.map(toZenmoneyTransaction)
    expect(zenmoneyTransactions).toEqual(expectedZenmoneyTransactions)
  })

  it('converts outcome with mcc', () => {
    const apiTransactions = [
      {
        amount: 60,
        datetime: '2017-08-30T11:30:53Z',
        direction: 'out',
        group_id: 'mcc_8999',
        operation_id: '557364654240923932',
        status: 'success',
        title: 'PP*2649CODE',
        type: 'payment-shop'
      }
    ]

    const expectedReadableTransactions = [
      {
        comment: null,
        date: new Date('2017-08-30T11:30:53.000Z'),
        hold: false,
        merchant: {
          country: null,
          city: null,
          title: 'PP*2649CODE',
          mcc: 8999,
          location: null
        },
        movements: [
          {
            id: '557364654240923932',
            account: {
              id: 'account'
            },
            invoice: null,
            sum: -60,
            fee: 0
          }
        ]
      }
    ]

    const expectedZenmoneyTransactions = [
      {
        id: '557364654240923932',
        date: new Date('2017-08-30T11:30:53Z'),
        hold: false,
        income: 0,
        incomeAccount: 'account',
        outcome: 60,
        outcomeAccount: 'account',
        payee: 'PP*2649CODE',
        mcc: 8999,
        comment: null
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
