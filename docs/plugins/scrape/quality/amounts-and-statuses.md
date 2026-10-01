# Amounts, dates, statuses, and identifiers

Applies to transaction conversion. Field meanings: [transaction contract](../transactions.md). Monetary examples are synthetic and use signed values.

## AMOUNT-001 Preserve direction and currency

`sum` MUST be in the movement account's currency, positive for incoming funds and negative for outgoing funds. Fill `invoice` when the original operation currency differs; its sign follows that movement's direction. Use `invoice: null` for the same currency. Preserve crypto/metal instruments where supported.

Do not use exchange rates or current balances to guess a missing historical amount. A known zero is not missing data. Reject NaN/Infinity and malformed required numbers. `sum: null` is allowed when the amount in the known account currency is unavailable and `invoice` supplies the confirmed original-operation amount and currency, different from that account currency. `sum: null` with `invoice: null` is invalid. This nullable representation must not hide a changed bank response; verify its downstream handling and report adapter defects separately from the domain rule.

The legacy transfer adapter has a known failure for an incoming movement with `sum: null`; see [compatibility limitations](../../compatibility.md). This is not permission to guess the amount or drop the operation.

| Case | Required result |
| --- | --- |
| 100 USD purchase debits 4,150 UAH | `sum: -4150`, invoice `-100 USD` |
| Refund credits the same currencies | Positive credited sum/invoice with correct fee semantics |
| Different-currency transfer | Each side in its own currency; preserve confirmed invoice values |
| Missing fetched account currency | Fail validation; do not substitute the operation currency |
| Confirmed transfer with an unknown external account currency | Apply the explicit [TRANSFER-001 currency default](transfers.md#transfer-001-classify-by-the-financial-movement); this does not relax validation of the known account's currency or amount |
| Missing account-currency amount but known original invoice in another currency | `sum: null` with that signed `invoice`; do not calculate an exchange rate |
| Both account-currency amount and original invoice are unknown | Fail validation; `sum: null, invoice: null` is invalid |

## AMOUNT-002 Count commission exactly once

`fee` is signed commission in account currency, separate from the principal `sum`. Charged fees are negative, including fees deducted from incoming money. Total account impact is `sum + fee` when both are known.

| Source evidence | Output |
| --- | --- |
| Debit total -502.70 includes a confirmed 2.70 account-currency fee | `sum: -500`, `fee: -2.70` |
| Debit principal -500 and fee -2.70 supplied separately, without another imported fee entry | Keep `sum: -500`, `fee: -2.70` |
| Total -95.50 EUR, invoice -100 USD, confirmed included fee 2 EUR | `sum: -93.50`, `fee: -2`, invoice remains -100 USD |
| Net incoming 98 from principal 100 with a 2 fee | `sum: 100`, `fee: -2`, account impact 98 |
| Fee already imported as its own bank transaction | Do not also attach the same fee to the principal movement |
| Informational fee that does not affect this account's balance | Do not invent an additional balance change |
| Fee amount/currency or inclusion in total is unclear | Do not subtract it on a guess; retain the confirmed operation and investigate unresolved required semantics |
| A valid booked amount accompanies `COMISION 52`, but the fee's scale and meaning are unconfirmed | Do not infer `52` or `0.52` as a fee; preserve the booked amount and useful unresolved commission text without splitting out a guessed fee |

Before extracting a fee, establish its format, scale, currency, and inclusion in the amount from real bank data. One sufficiently informative record can support that interpretation; no arbitrary minimum sample count is required. Generalize the observed format reasonably, but do not guess unresolved monetary semantics or invent a fee format. Until the meaning is established, do not populate `fee` with a guessed charge or adjust the booked amount. Preserve useful unresolved commission text under the [comment rules](comments.md). This concerns optional fee detail accompanying a valid operation; a malformed required amount still fails validation under AMOUNT-001.

Use `principal = signedTotal - signedFee`; subtracting the unsigned fee again would double the charge. If an intermediate invoice is in account currency, adjust its principal consistently before normalizing same-currency invoice to `null`. A different-currency invoice remains unchanged unless the bank provides the corresponding fee breakdown.

Required tests include fee inclusion/exclusion, a separately returned fee record, incoming fee, and cross-currency operation where supported. Preserve the raw account effect in assertions.

## STATUS-001 Preserve lifecycle states

Map explicit pending to `hold: true`, settled to `false`, and unknown to `null`. Do not treat every unrecognized status as pending or successful. Determine whether a reversal/refund is a real posted financial movement or only a canceled authorization before deciding to emit or omit it.

The plugin MUST return the complete current statement with accurate `hold` values. The application interprets that statement and reconciles disappeared holds; this is not plugin responsibility. Do not carry an absent hold forward from a cache or invent deletion/refund movements. A separately posted refund or reversal remains a real operation. Missing pages or failed requests must fail the scrape under the completeness rules.

Test the accurate mapping of observed pending, settled, and genuinely unknown statuses, including posted refunds/reversals and canceled authorizations where supported. Plugin tests verify the returned statement, not application reconciliation. Overlapping endpoints or repeated runs MUST NOT create duplicate financial effects. An unknown unconvertible state is a reportable validation failure, not a skipped transaction.

## DATE-001 Preserve the operation date

Return valid `Date` values with the bank's confirmed time-zone semantics. When initiation/hold and settlement dates describe the same operation and both are available, retain the initiation date. If only booking/settlement date exists, use the available documented date rather than inventing an earlier one.

Do not parse date-only data in the developer machine's implicit time zone without verifying the service's meaning. Test day/month boundaries and offset transitions where relevant; freeze the clock or supply fixed dates. API interval boundaries and manual statement-import behavior belong to the [scrape contract](../contract.md#dates-and-repeated-runs).

## ID-001 Keep movement identities stable

Use a stable bank operation identifier when available. Do not use session IDs, array positions, import time, or a changing settlement attribute as identity. IDs must distinguish separate same-looking operations and remain stable across repeats and overlapping history windows.

When no bank ID exists, `null` is valid. An existing statement importer may use a deterministic composite/hash; this requires stable input fields and explicit collision/duplicate analysis. Equal amount/date/description is not sufficient proof that two rows are duplicates. When one bank record yields several movements or operations, preserve distinguishing source evidence rather than assigning identical IDs blindly.

Verification: repeat conversions, reordered input, overlapping sources, two legitimate equal-valued operations, and pending/settled records where supported. Cover identity together with the full monetary result.
