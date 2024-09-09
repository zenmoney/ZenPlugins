import { convertToZenMoneyAccount } from '../../../converters'
import { Account } from '../../../models'
import { AccountType } from '../../../../../types/zenmoney'

describe('convertToZenMoneyAccount', () => {
  it.each([
    [
      {
        id: 'GE29TB7903145061700002USD',
        currency: 'USD',
        number: 'GE29TB7903145061700002',
        balance: 1234.56
      },
      {
        id: 'GE29TB7903145061700002USD',
        type: AccountType.checking,
        title: 'BoG Business USD',
        instrument: 'USD',
        syncIds: ['GE29TB7903145061700002USD'],
        balance: 1234.56
      }
    ],
    [
      {
        id: 'GE61TB7903145061700001GEL',
        number: 'GE61TB7903145061700001',
        currency: 'GEL',
        balance: 3456.78
      },
      {
        id: 'GE61TB7903145061700001GEL',
        type: AccountType.checking,
        title: 'BoG Business GEL',
        instrument: 'GEL',
        syncIds: ['GE61TB7903145061700001GEL'],
        balance: 3456.78
      }
    ]
  ])('converts account', (apiAccount, expectedAccount) => {
    expect(convertToZenMoneyAccount(apiAccount as Account)).toEqual(expectedAccount)
  })
})
