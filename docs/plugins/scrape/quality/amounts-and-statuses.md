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

Applies to all scrape integrations, including shared providers, custom parsers, dates extracted from descriptions, and date-only fallbacks.

Converters MUST return valid `Date` values. Prefer the date when the transaction took place (**transaction date**); for a card payment, this includes the original **authorisation date/time** associated with the hold for that same operation. This date takes precedence over the booking/posting or settlement date. Preserve the supplied time of the selected event when available.

### Select the transaction date

During development and data-quality review, inspect the available date fields, supplementary fields, and transaction descriptions even when a primary date field is populated. Converters MUST extract and use a transaction/authorisation date from those sources when bank evidence clearly establishes its meaning for the current operation. A text field can be a better source than a dedicated date field that describes later processing.

The interpretation MUST follow the observed bank format and context, such as a confirmed label or documented field meaning. A date-shaped substring, its position in the text, or an earlier value alone is not proof of a transaction date. Do not select the earliest of all available dates indiscriminately. Keep the source evidence and interpretation with the relevant tests or existing integration notes.

| Source evidence | Required selection |
| --- | --- |
| A description or supplementary field contains the confirmed transaction/authorisation date and time; the primary field describes booking or settlement | Extract and use the transaction/authorisation date and time, even though the primary field is valid and populated. |
| Only the confirmed transaction/authorisation day is supplied in the description, while booking or settlement supplies a full timestamp | Use the transaction/authorisation day at midnight under the time-zone rules below. Greater timestamp precision does not override the event's meaning. |
| Two sources describe the same transaction event, and one supplies a confirmed time as well as the day | Use the more precise source for that event, preserving its supplied time. |
| Text contains a date with unclear meaning, or several dates without evidence identifying the transaction date | Keep the confirmed primary date and record the ambiguity for investigation. Do not replace it with an unconfirmed text date. |
| Text refers to another event, such as an invoice due date or the original purchase referenced by a refund | Keep the date of the current operation; the other event's date is not its transaction date. |
| Only a booking/settlement date is available | Use the available documented date rather than inventing an earlier one. |

Apply the time-zone rules to the selected event's source. Converters MUST NOT borrow a missing time or zone from a booking/settlement timestamp without bank evidence that it applies to the selected transaction date. In particular, an explicit settlement offset alone does not establish the zone of a transaction date extracted from text.

### Interpret the selected date's time zone

Choose the time-zone interpretation from the source evidence in this order. The ISO strings below are illustrative examples, not bank fixtures.

| Source evidence | Required interpretation |
| --- | --- |
| An explicit zone or UTC offset, including `Z`, such as `2026-01-01T15:30:00+02:00` | Use the supplied zone/offset to construct the `Date`; preserve the resulting instant. MUST NOT strip or replace the zone with the runtime or bank default. |
| No zone in the value, but bank evidence confirms the processing zone for this field | Interpret the supplied date and time in that zone. For a date without a time, use midnight in that zone. Apply its rules for the operation date, including offset changes where applicable. |
| A date and time without a zone, with the processing zone unknown, such as `2026-01-01T15:30:00` | Preserve both date and time in the synchronization runtime's local zone: `new Date('2026-01-01T15:30:00')`. |
| A date without a time, with the processing zone unknown, such as `2026-01-01` | Construct local midnight: `new Date('2026-01-01T00:00:00')`. |

When the processing zone is unknown, local interpretation is the explicit fallback; it does not establish the bank's actual zone. Converters MUST NOT append `Z`, attach a guessed offset, or use `new Date('2026-01-01')`, whose date-only ISO parsing would silently assign UTC. A confirmed UTC zone still uses UTC under the evidence rules above.

A processing zone MUST be supported by data or documentation from the specific bank for the relevant source field. Record that evidence in existing integration notes or alongside the relevant tests. A bank's country, merchant location, or use of a shared API alone does not establish its processing zone. An offset observed for one operation does not by itself establish a fixed offset for all dates or other banks.

Verification: for date-selection changes, cover the supported cases above with complete raw input and full expected conversion under [scrape testing](../testing.md#complete-input-and-output-in-each-case), including a text-sourced transaction date differing from the primary processing date, day-only transaction data, and ambiguous or unrelated text dates where observed. Follow the [source-evidence requirements](../../../project/fixtures.md#observed-evidence); illustrative examples do not establish bank behavior.

Use fixed dates or freeze the clock. For supported cases, run conversion in multiple runtime time zones: unknown-zone values MUST retain their local calendar components and supplied time, while values with an explicit or confirmed zone MUST retain the same instant. Cover day/month boundaries and offset transitions where relevant. API interval boundaries and manual statement-import behavior belong to the [scrape contract](../contract.md#dates-and-repeated-runs).

## ID-001 Keep movement identities stable

Use a stable bank operation identifier when available. Do not use session IDs, array positions, import time, or a changing settlement attribute as identity. IDs must distinguish separate same-looking operations and remain stable across repeats and overlapping history windows.

When no bank ID exists, `null` is valid. An existing statement importer may use a deterministic composite/hash; this requires stable input fields and explicit collision/duplicate analysis. Equal amount/date/description is not sufficient proof that two rows are duplicates. When one bank record yields several movements or operations, preserve distinguishing source evidence rather than assigning identical IDs blindly.

Verification: repeat conversions, reordered input, overlapping sources, two legitimate equal-valued operations, and pending/settled records where supported. Cover identity together with the full monetary result.
