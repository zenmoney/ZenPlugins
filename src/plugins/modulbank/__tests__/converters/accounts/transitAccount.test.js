import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        accountName: 'Транзитный счёт',
        balance: 0,
        bankBic: '044525092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankCorrespondentAccount: '30101810645250000092',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2018-11-14T00:00:00',
        category: 'TransitAccount',
        currency: 'EUR',
        id: '6f4c2103-94dc-45d5-91e1-a99802a8664c',
        number: '40802978470011000923',
        status: 'New'
      },
      {
        id: '6f4c2103-94dc-45d5-91e1-a99802a8664c',
        type: 'checking',
        title: 'Транзитный счёт',
        instrument: 'EUR',
        syncID: ['40802978470011000923'],
        balance: 0
      }
    ]
  ])('converts current account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
