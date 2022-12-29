import { AccountInfo } from '../../../api'
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('should convert accounts', () => {
    const accounts: AccountInfo[] = [{
      id: 'GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8',
      iban: 'TR950000000000000000000001',
      available: 6471.0,
      balance: 6471.0,
      name: 'ACCOUNT NAME',
      currency: 'TRY'
    }]

    expect(convertAccounts(accounts)).toMatchInlineSnapshot(`
      Array [
        Object {
          "available": 6471,
          "balance": 6471,
          "creditLimit": 0,
          "id": "GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8",
          "instrument": "TRY",
          "syncIds": Array [
            "TR950000000000000000000001",
          ],
          "title": "ACCOUNT NAME",
          "type": "ccard",
        },
      ]
    `)
  })
})
