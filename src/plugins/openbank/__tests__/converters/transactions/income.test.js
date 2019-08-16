import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [

      {
        transDate: '2019-08-15T14:00:00.000+0300',
        authDate: '2019-08-15T11:08:27.000+0300',
        authAmount: { amount: 36800, currency: 'RUR' },
        transAmount: { amount: 36800, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Перечисление аванса за август 2019 г.  Сумма 36800-00 Без налога (НДС)',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        cardId: '3804612',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6281243660/6281243662/1',
        digitalSign: false
      },
      {
        hold: false,
        date: new Date('2019-08-15T11:08:27.000+03:00'),
        movements: [
          {
            id: '6281243660/6281243662/1',
            account: { id: 'account' },
            invoice: null,
            sum: 36800,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перечисление аванса за август 2019 г.  Сумма 36800-00 Без налога (НДС)'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
