import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        accountName: 'Карточный счёт',
        balance: 100,
        bankBic: '044525092',
        bankCorrespondentAccount: '30101810645250000092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2018-08-31T00:00:00',
        category: 'CardAccount',
        currency: 'EUR',
        id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
        number: '408029745770013057348'
      },
      {
        id: '1435fd90-e2df-4ce6-bc0d-1df46a96dd32',
        type: 'ccard',
        title: 'Карточный счёт',
        instrument: 'EUR',
        syncID: ['408029745770013057348'],
        balance: 100
      }
    ],
    [
      {
        accountName: 'Карточный счёт',
        balance: 0,
        bankBic: '044525092',
        bankCorrespondentAccount: '30101810645250000092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2018-12-04T00:00:00',
        category: 'CheckingAccount',
        currency: 'RUR',
        id: 'e5d5124e-4748-4141-a36e-a9ac03a1b875',
        number: '40702810370014305002',
        status: 'New'
      },
      {
        id: 'e5d5124e-4748-4141-a36e-a9ac03a1b875',
        type: 'ccard',
        title: 'Карточный счёт',
        instrument: 'RUB',
        syncID: ['40702810370014305002'],
        balance: 0
      }
    ],
    [
      {
        accountName: 'Карта',
        balance: 70,
        bankBic: '044525092',
        bankInn: '2204000595',
        bankKpp: '771543001',
        bankCorrespondentAccount: '30101810645250000092',
        bankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        beginDate: '2017-08-31T00:00:00',
        category: 'CheckingAccount',
        currency: 'RUR',
        id: 'bb13a694-e6d9-4c64-b170-a7e003d175b7',
        number: '40802810470014287234',
        status: 'New'
      },
      {
        id: 'bb13a694-e6d9-4c64-b170-a7e003d175b7',
        type: 'ccard',
        title: 'Карта',
        instrument: 'RUB',
        syncID: ['40802810470014287234'],
        balance: 70
      }
    ]
  ])('converts card account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
