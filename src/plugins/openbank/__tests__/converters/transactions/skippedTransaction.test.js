import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    {
      transDate: '2019-08-26T14:00:00.000+0300',
      authDate: '2019-08-26T00:00:00.000+0300',
      authAmount: { amount: -57800, currency: 'RUR' },
      transAmount: { amount: -57800, currency: 'RUR' },
      status: { code: 'PROCESSED', value: 'Проведена' },
      place: ' Погашение ссудной задолженности',
      category: { code: 'OTHER', value: 'Другое' },
      operationType: { code: 'KOM', value: 'Комиссия' },
      cardId: '7836422',
      categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/commission.png',
      id: '6332274689/6332277761/1',
      digitalSign: false
    }
  ])('skips specific transaction', (apiTransaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toBeNull()
  })
})
