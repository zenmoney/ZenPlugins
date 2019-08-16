import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        authDate: '2019-08-15T11:00:00.000+0300',
        authAmount: { amount: -5000, currency: 'RUR' },
        transAmount: { amount: -5000, currency: 'RUR' },
        status: { code: 'ACCEPTED', value: 'В обработке' },
        authCode: '447688',
        place: '45 PLEKHANOVSKAYA STR',
        category: { code: 'CASH_WITHDRAWAL', value: 'Операции с наличными' },
        operationType: { code: 'ATM', value: 'Операции с наличными' },
        cardId: '8237711',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/cash_withdrawal.png',
        id: '123141261',
        digitalSign: false,
        mccCode: '6011'
      },
      {
        hold: true,
        date: new Date('2019-08-15T11:00:00.000+03:00'),
        movements: [
          {
            id: '123141261',
            account: { id: 'account' },
            invoice: null,
            sum: -5000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 5000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
