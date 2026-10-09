# Transaction examples

Synthetic examples of the [account](accounts.md) and [transaction](transactions.md) contracts. The blocks share the imports/accounts below. They illustrate expected results; they are not evidence of a particular bank's source format. Recognition, fees, and grouping require the corresponding [quality rules](quality/README.md).

```ts
import { Account, AccountType, ExtendedTransaction, Transaction } from '../../../src/types/zenmoney'

const accounts: Account[] = [
  { id: 'rub-card', type: AccountType.ccard, title: 'RUB card', instrument: 'RUB', syncIds: ['SYNTHETIC-RUB'], balance: 10000 },
  { id: 'uah-card', type: AccountType.ccard, title: 'UAH card', instrument: 'UAH', syncIds: ['SYNTHETIC-UAH'], balance: 5000 },
  { id: 'eur-main', type: AccountType.checking, title: 'EUR main', instrument: 'EUR', syncIds: ['SYNTHETIC-EUR-MAIN'], balance: 1000 },
  { id: 'eur-savings', type: AccountType.checking, title: 'EUR savings', instrument: 'EUR', syncIds: ['SYNTHETIC-EUR-SAVINGS'], balance: 2000, savings: true }
]
```

## Foreign currency purchase with ambiguous merchant

The confirmed charge is 400 RUB for a 5 USD purchase. The example assumes no reliable grammar for the combined merchant string; preserve it unparsed. A known grammar would require a structured merchant instead.

```ts
const foreignPurchase: Transaction = {
  hold: true,
  date: new Date('2025-05-30T17:34:00+03:00'),
  movements: [{
    id: 'purchase-1',
    account: { id: 'rub-card' },
    invoice: { sum: -5, instrument: 'USD' },
    sum: -400,
    fee: 0
  }],
  merchant: { fullTitle: 'NL AMSTERDAM EXAMPLE TAXI', mcc: 4121, location: null },
  comment: null
}
```

## Same currency purchase with structured merchant

```ts
const grocery: Transaction = {
  hold: false,
  date: new Date('2025-06-17T08:39:22+03:00'),
  movements: [{ id: null, account: { id: 'uah-card' }, invoice: null, sum: -387.89, fee: 0 }],
  merchant: { country: 'UA', city: 'KYIV', title: 'EXAMPLE GROCERY', mcc: 5411, location: null },
  comment: null
}
```

## Unknown account amount with a known original invoice

The bank supplies a 5 USD authorization on the RUB card but has not supplied its RUB amount. The account currency is known; only its amount is unknown. `sum: null` is valid with the original invoice and must not be replaced by a guessed exchange-rate conversion.

```ts
const pendingForeignPurchase: Transaction = {
  hold: true,
  date: new Date('2025-06-17T12:00:00+03:00'),
  movements: [{ id: 'pending-1', account: { id: 'rub-card' }, invoice: { sum: -5, instrument: 'USD' }, sum: null, fee: 0 }],
  merchant: { title: 'EXAMPLE SHOP', country: null, city: null, mcc: null, location: null },
  comment: null
}
```

## Salary with useful purpose

The sender is the confirmed employer, not automatically the bank that processed the credit.

```ts
const salary: Transaction = {
  hold: false,
  date: new Date('2025-06-10T00:00:00+03:00'),
  movements: [{ id: 'salary-1', account: { id: 'rub-card' }, invoice: null, sum: 40000, fee: 0 }],
  merchant: { country: null, city: null, title: 'EXAMPLE EMPLOYER', mcc: null, location: null },
  comment: 'May salary'
}
```

## Internal transfer

Both accounts are represented above and both are in EUR. The bank supplies reliably related debit and credit records confirming both movements. No external counterparty or additional useful purpose is present.

```ts
const internalTransfer: Transaction = {
  hold: false,
  date: new Date('2025-06-30T14:32:32+03:00'),
  movements: [
    { id: 'transfer-out-1', account: { id: 'eur-main' }, invoice: null, sum: -26.7, fee: 0 },
    { id: 'transfer-in-1', account: { id: 'eur-savings' }, invoice: null, sum: 26.7, fee: 0 }
  ],
  merchant: null,
  comment: null
}
```

## External transfer with a known recipient

The bank identifies an outgoing external transfer, confirms the local debit and counterparty currency, and supplies a masked card identifier. It need not confirm credit at the other bank: the external movement represents the transfer. Unknown type/company and the unavailable external bank movement ID remain null.

```ts
const externalTransfer: Transaction = {
  hold: false,
  date: new Date('2025-06-27T04:44:32+03:00'),
  movements: [
    { id: 'external-out-1', account: { id: 'rub-card' }, invoice: null, sum: -10, fee: 0 },
    {
      id: null,
      account: { type: null, instrument: 'RUB', company: null, syncIds: ['4000********0001'] },
      invoice: null,
      sum: 10,
      fee: 0
    }
  ],
  merchant: { country: null, city: null, title: 'ALEX EXAMPLE', mcc: null, location: null },
  comment: 'Debt repayment'
}
```

## Outgoing payment with an unknown recipient account currency

The bank identifies an outgoing external transfer with a local debit of 10 RUB. The recipient is outside `accounts`, its account currency is unknown, and remote posting confirmation is unavailable. There is no invoice, so [TRANSFER-001](quality/transfers.md#transfer-001-classify-by-the-financial-movement) uses the local `sum` currency, RUB, for the external reference. This is a representation default, not a claim that the bank supplied the recipient currency. There is no fee.

```ts
const paymentWithUnknownRecipientCurrency: Transaction = {
  hold: false,
  date: new Date('2025-06-27T05:00:00+03:00'),
  movements: [
    { id: 'payment-unknown-currency', account: { id: 'rub-card' }, invoice: null, sum: -10, fee: 0 },
    { id: null, account: { type: null, instrument: 'RUB', company: null, syncIds: null }, invoice: null, sum: 10, fee: 0 }
  ],
  merchant: { country: null, city: null, title: 'ALEX EXAMPLE', mcc: null, location: null },
  comment: 'Debt repayment'
}
```

## Foreign invoice with an unknown external account currency

The bank reports an external transfer debiting 400 RUB for 5 USD, without a fee, but does not specify the external account currency or confirm remote posting. The known movement's invoice takes precedence over its RUB `sum` currency, so the external reference uses USD with the corresponding 5 USD amount.

```ts
const externalTransferWithInvoice: Transaction = {
  hold: false,
  date: new Date('2025-06-27T06:00:00+03:00'),
  movements: [
    { id: 'external-invoice-1', account: { id: 'rub-card' }, invoice: { sum: -5, instrument: 'USD' }, sum: -400, fee: 0 },
    { id: null, account: { type: null, instrument: 'USD', company: null, syncIds: null }, invoice: null, sum: 5, fee: 0 }
  ],
  merchant: { country: null, city: null, title: 'ALEX EXAMPLE', mcc: null, location: null },
  comment: 'Debt repayment'
}
```

## Transfer to a history-skipped account

Both EUR accounts remain in `accounts`, but history loading for `eur-savings` is skipped. One bank record explicitly confirms that 100 EUR was debited from `eur-main` and credited to `eur-savings` without a fee. Its verified semantics guarantees both movements, so a second history record is not required. The result is internal, even if the payment method was P2P. The missing recipient bank movement ID stays null, and direct construction preserves the useful purpose.

```ts
const transferToSkippedAccount: Transaction = {
  hold: false,
  date: new Date('2025-06-28T12:00:00+02:00'),
  movements: [
    { id: 'skipped-out-1', account: { id: 'eur-main' }, invoice: null, sum: -100, fee: 0 },
    { id: null, account: { id: 'eur-savings' }, invoice: null, sum: 100, fee: 0 }
  ],
  merchant: null,
  comment: 'Vacation savings'
}
```

## Known recipient account without confirmation of its movement

Both EUR accounts remain in `accounts`, but the available record only confirms a 100 EUR debit from `eur-main` and names `eur-savings` as the intended recipient. Its credit is not confirmed; for example, that history is skipped or no matching record is present in the requested interval. Preserve the known expense and its purpose. The known recipient account and amount are insufficient to create a second movement.

```ts
const unpairedPaymentToKnownAccount: Transaction = {
  hold: false,
  date: new Date('2025-06-28T12:00:00+02:00'),
  movements: [
    { id: 'unpaired-out-1', account: { id: 'eur-main' }, invoice: null, sum: -100, fee: 0 }
  ],
  merchant: null,
  comment: 'Vacation savings'
}
```

## Cash withdrawal with an included fee

Confirmed account debit is 502.70 EUR, of which 2.70 is a charged fee. The cash side receives 500 EUR. The account impact remains `-500 + -2.70`.

```ts
const cashWithdrawal: Transaction = {
  hold: false,
  date: new Date('2025-07-01T10:00:00+02:00'),
  movements: [
    { id: 'atm-1', account: { id: 'eur-main' }, invoice: null, sum: -500, fee: -2.70 },
    {
      id: null,
      account: { type: AccountType.cash, instrument: 'EUR', company: null, syncIds: null },
      invoice: null,
      sum: 500,
      fee: 0
    }
  ],
  merchant: null,
  comment: null
}
```

## Two bank records before grouping

The source provides separate debit and credit records with a shared stable reference for the same 100 EUR transfer. Each is converted with its own known movement. The equal-length key arrays reserve a second strategy slot without guessing a weak key. The transfer is established by matching the confirmed bank sides, not by creating a counterpart from an account number alone.

```ts
const transferSides: ExtendedTransaction[] = [
  {
    hold: false,
    date: new Date('2025-07-02T12:00:00+02:00'),
    movements: [
      { id: 'out-2', account: { id: 'eur-main' }, invoice: null, sum: -100, fee: 0 }
    ],
    merchant: null,
    comment: null,
    groupKeys: ['confirmed-transfer-2', null]
  },
  {
    hold: false,
    date: new Date('2025-07-02T12:00:00+02:00'),
    movements: [
      { id: 'in-2', account: { id: 'eur-savings' }, invoice: null, sum: 100, fee: 0 }
    ],
    merchant: null,
    comment: null,
    groupKeys: ['confirmed-transfer-2', null]
  }
]
```

After `adjustTransactions`, the result is one transaction with the `eur-main` debit and `eur-savings` credit, retaining `out-2`/`in-2`, and with no `groupKeys` or separate income/expense duplicates. Both references are by ID because both accounts belong to `accounts`. A bank-specific test must verify the full grouped result. This example uses a shared bank reference; weaker fallbacks have the collision risks described in [TRANSFER-003](quality/transfers.md#transfer-003-handle-weak-and-ambiguous-matches-explicitly). If only one internal source record is available and there is no independent confirmation of the other internal movement, return the known income/expense without inventing that movement. The confirmed skipped-account example differs because one source record guarantees both movements.
