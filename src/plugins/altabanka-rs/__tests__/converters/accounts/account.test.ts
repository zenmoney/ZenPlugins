import { AccountInfo } from '../../../types'
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('should convert accounts', () => {
    const accounts: AccountInfo[] = [
      {
        id: 'GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8',
        balance: 6471.0,
        name: 'ACCOUNT NAME',
        currency: 'TRY',
        cardNumber: '0011',
        accountNumber: '0022'
      }
    ]

    expect(convertAccounts(accounts)).toMatchInlineSnapshot(`
      Array [
        Object {
          "available": 6471,
          "balance": 6471,
          "creditLimit": 0,
          "id": "GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8",
          "instrument": "TRY",
          "syncIds": Array [
            "GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8",
          ],
          "title": "ACCOUNT NAME",
          "type": "ccard",
        },
      ]
    `)
  })
})
