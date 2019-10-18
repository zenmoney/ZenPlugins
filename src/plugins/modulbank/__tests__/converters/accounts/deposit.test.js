import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        accountName: 'Депозит',
        balance: 150000,
        bankBic: '044525092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankCorrespondentAccount: '30101810645250000092',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2019-05-31T00:00:00',
        category: 'DepositAccount',
        currency: 'RUR',
        id: '0e6ddc6d-14be-4ad5-95d8-aa5e026f4e87',
        number: '42109810770010030923',
        status: 'New'
      },
      {
        id: '0e6ddc6d-14be-4ad5-95d8-aa5e026f4e87',
        type: 'checking',
        title: 'Депозит',
        instrument: 'RUB',
        syncID: ['42109810770010030923'],
        balance: 150000,
        savings: true
      }
    ]
  ])('converts deposit', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
