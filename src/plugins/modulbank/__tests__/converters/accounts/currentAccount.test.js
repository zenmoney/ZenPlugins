import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        accountName: 'Расчётный счёт',
        balance: 100,
        bankBic: '044525092',
        bankCorrespondentAccount: '30101810645250000092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2018-08-31T00:00:00',
        category: 'CheckingAccount',
        currency: 'RUR',
        id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
        number: '408029745770013057848',
        status: 'New'
      },
      {
        id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
        type: 'checking',
        title: 'Расчётный счёт',
        instrument: 'RUB',
        syncID: ['408029745770013057848'],
        balance: 100
      }
    ]
  ])('converts current account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
