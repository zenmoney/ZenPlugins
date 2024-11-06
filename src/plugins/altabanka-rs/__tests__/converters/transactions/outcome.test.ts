import { convertTransaction } from '../../../converters'
import { AccountInfo, AccountTransaction } from '../../../types'

describe('convertTransaction', () => {
  it('should convert basic transaction', () => {
    const accountTransaction: AccountTransaction = {
      date: new Date('2022-12-23T00:01:48.0000000+03:00'),
      address: 'Harcama - AVKAN ECZANESI ANTALYA TR  (POS - ****9753)',
      amount: -40.36,
      currency: 'TRY',
      id: 'transaction_123',
      description: 'Description'
    }

    const account: AccountInfo = {
      id: 'B7C94FAC',
      currency: 'RUB',
      cardNumber: '0011',
      accountNumber: '0022',
      name: 'Name',
      balance: 100
    }

    expect(convertTransaction(accountTransaction, account))
      .toMatchInlineSnapshot(`
      Object {
        "comment": "Description",
        "date": 2022-12-22T21:01:48.000Z,
        "hold": false,
        "merchant": Object {
          "fullTitle": "Harcama - AVKAN ECZANESI ANTALYA TR  (POS - ****9753)",
          "location": null,
          "mcc": null,
        },
        "movements": Array [
          Object {
            "account": Object {
              "id": "B7C94FAC",
            },
            "fee": 0,
            "id": "transaction_123",
            "invoice": Object {
              "instrument": "TRY",
              "sum": -40.36,
            },
            "sum": -40.36,
          },
        ],
      }
    `)
  })

  it('should convert transaction with card in another currency', () => {
    const account: AccountInfo = {
      id: 'B7C94FAC',
      currency: 'RUB',
      cardNumber: '0011',
      accountNumber: '0022',
      name: 'Name',
      balance: 100
    }

    const cardTransaction: AccountTransaction = {
      date: new Date('2022-12-23T00:01:49.0000000+03:00'),
      address: 'Address',
      amount: -2,
      currency: 'USD',
      id: 'transaction_123',
      description: 'Description'
    }

    expect(convertTransaction(cardTransaction, account)).toMatchInlineSnapshot(`
      Object {
        "comment": "Description",
        "date": 2022-12-22T21:01:49.000Z,
        "hold": false,
        "merchant": Object {
          "fullTitle": "Address",
          "location": null,
          "mcc": null,
        },
        "movements": Array [
          Object {
            "account": Object {
              "id": "B7C94FAC",
            },
            "fee": 0,
            "id": "transaction_123",
            "invoice": Object {
              "instrument": "USD",
              "sum": -2,
            },
            "sum": -2,
          },
        ],
      }
    `)
  })
})
