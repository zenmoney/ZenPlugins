import { convertTransaction } from '../../../converters'
import { Account } from '../../../../../types/zenmoney'
import { AccountTransaction, CardTransaction } from '../../../api'

describe('convertTransaction', () => {
  it('should convert basic transaction', () => {
    const accountTransaction: AccountTransaction = {
      date: new Date('2022-12-23T00:01:48.0000000+03:00'),
      description: 'Harcama - AVKAN ECZANESI ANTALYA TR  (POS - ****9753)',
      amount: -40.36,
      remainingBalance: 20044.62,
      currency: 'TRY',
      usageType: 'Outcome',
      id: 'transaction_123'
    }

    const account = { id: 'B7C94FAC', instrument: 'RUB' }

    expect(convertTransaction(accountTransaction, account as Account))
      .toMatchInlineSnapshot(`
      Object {
        "comment": null,
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
            "invoice": null,
            "sum": -40.36,
          },
        ],
      }
    `)
  })

  it('should convert transaction with card in another currency', () => {
    const accountTransaction: AccountTransaction = {
      date: new Date('2022-12-23T00:01:48.0000000+03:00'),
      description: 'Harcama - AVKAN ECZANESI ANTALYA TR  (POS - ****9753)',
      amount: -40.36,
      remainingBalance: 20044.62,
      currency: 'TRY',
      usageType: 'Outcome',
      id: 'transaction_123'
    }

    const account: Pick<Account, 'id' | 'instrument'> = {
      id: 'B7C94FAC',
      instrument: 'RUB'
    }

    const cardTransaction: CardTransaction = {
      date: new Date('2022-12-23T00:01:49.0000000+03:00'),
      name: 'Card Name',
      amount: -2,
      currency: 'USD',
      description: 'Card Description',
      usageType: 'Outcome'
    }

    expect(
      convertTransaction(
        accountTransaction,
        account as Account,
        cardTransaction
      )
    ).toMatchInlineSnapshot(`
      Object {
        "comment": "Card Description",
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
              "instrument": "USD",
              "sum": -2,
            },
            "sum": -40.36,
          },
        ],
      }
    `)
  })
})
