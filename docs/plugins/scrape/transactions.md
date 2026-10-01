# Transaction contract

Applies to scrape output. Exact shapes: [zenmoney.ts](../../../src/types/zenmoney.ts). Use the [task route](../../README.md#choose-a-task) for the quality rules affected by the change.

## Transaction

| Field | Meaning |
| --- | --- |
| `hold` | `true` pending, `false` settled, `null` unknown |
| `date` | Valid operation `Date`; preserve the original operation date when settlement also provides it |
| `movements` | Exactly one movement for income/expense, exactly two for a transfer |
| `merchant` | Structured merchant/counterparty, unparsed merchant, or `null` |
| `comment` | Useful additional human-readable information or `null` |

Do not conflate the transaction with an individual bank record: a transfer can be described by separate records that must be grouped. Do not use settlement as proof of a new independent purchase. Dates and lifecycle behavior are specified in [amounts and statuses](quality/amounts-and-statuses.md).

## Movement

| Field | Meaning |
| --- | --- |
| `id` | Stable operation identifier for this account movement; `null` if unavailable |
| `account` | Reference by ID or by data, under the [account contract](accounts.md#account-references) |
| `sum` | Signed amount in this account's currency; rare unknown amount may be `null` under the rules below |
| `invoice` | Signed original-operation amount and currency when different from the account currency; otherwise `null` |
| `fee` | Signed commission in account currency, separate from `sum`; normally `0` if absent |

Incoming funds are positive, outgoing funds negative. A charged fee is negative even when deducted from incoming money. When both values are known, account impact is `sum + fee`. Each transfer side is expressed in its own account currency; different-currency sums do not have to be numerically equal.

`sum: null` is a representation of genuinely unavailable account-currency data, not a default for parsing failure. It requires a non-null `invoice` containing the known original-operation amount and currency, different from the known account currency. Never return `sum: null` together with `invoice: null`, or convert missing/invalid numbers to zero. `invoice` and `fee` cannot carry NaN/Infinity. See [amounts and statuses](quality/amounts-and-statuses.md) for the rules and downstream verification.

## Merchant and comment

`Merchant` contains `title`, nullable `city`, `country`, `mcc`, `location`, and optional bank `category`. `title` is the store/service name, the recipient of an outgoing P2P transfer, or the sender of an incoming payment when available. A known name with unknown place is still a structured merchant with null place fields.

`NonParsedMerchant` contains `fullTitle`, nullable `mcc` and `location`, and optional `category`. Use it only when field boundaries cannot be reliably identified. `location` has `latitude` and `longitude`. MCC is numeric; bank category is a string fallback when no MCC is supplied. Do not derive MCC from a name.

Country representations documented by the domain include alpha-2, alpha-3, numeric strings, and names. Preserve confirmed country information; do not guess a country from a weak suffix match. Parsing rules live in [merchant quality](quality/merchants.md).

`merchant: null` means no known merchant or no external counterparty in an internal transfer. External transfers/P2P retain the known counterparty under [transfer classification](quality/transfers.md#transfer-001-classify-by-the-financial-movement). Comment selection and the grouped-internal-transfer exception follow [comment quality](quality/comments.md).

## Extended transactions and grouping

`ExtendedTransaction` adds optional `groupKeys: Array<string | null>` for intermediate grouping. Convert bank sides under [transfer quality](quality/transfers.md) and call [adjustTransactions](../../../src/common/transactionGroupHandler.js) before returning the result; it removes grouping keys.

All non-empty `groupKeys` arrays in one scrape MUST have the same length and consistent strategy positions; earlier positions are tried first. Use `null` for an inapplicable strategy. Key selection and collision handling follow [TRANSFER-003](quality/transfers.md#transfer-003-handle-weak-and-ambiguous-matches-explicitly).

Illustrative full outputs are in [examples](examples.md). Existing grouping behavior is covered by [group handler tests](../../../src/common/transactionGroupHandler.test.js) and [group traversal tests](../../../src/common/handleGroups.test.js).
