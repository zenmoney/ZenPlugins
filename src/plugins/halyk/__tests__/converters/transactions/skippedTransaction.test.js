/* eslint-disable no-irregular-whitespace */
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        amount: '0,00',
        currency: 'KZT',
        date: '26.05.2024',
        description: 'Разблокировка арестованных/заблокированных сумм Выставление К2',
        expense: '0,00',
        fee: '0,00',
        income: '0,00'
      },
      null
    ]
  ])('skips specific transactions', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'KZT' })).toEqual(transaction)
  })
})
