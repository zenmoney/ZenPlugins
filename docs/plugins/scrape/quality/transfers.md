# Transfer classification and grouping

Applies to scrape transfers. Field meanings are in the [transaction contract](../transactions.md); use the [task route](../../../README.md#choose-a-task) for related amount, merchant, and comment rules. Tables are illustrative, not bank fixtures.

## TRANSFER-001 Classify by the financial movement

An internal transfer affects two accounts in the current scrape's `accounts` set. Both movements MUST be explicitly supported by bank data: either two actual debit/credit records matched under TRANSFER-003, or one bank record whose semantics confirms both movements and their accounts/amounts. A completed currency exchange can supply that evidence in one record. A recipient account number, account membership, submitted instruction, or local debit alone does not confirm the other internal movement. NEVER add an assumed internal movement, including for a history-skipped account.

An external transfer has a counterparty outside the current `accounts` set, including the user's own account at another bank. When real bank data identifies an incoming/outgoing external transfer, the converter MAY construct the corresponding external movement from the observed local amount/invoice and counterparty data. The local bank is not required to confirm posting at the other bank. This is a domain representation of the transfer, not a claim to have fetched the external history. Keep the external movement ID `null` when the bank supplies none.

Check account membership before constructing an external side. Do not disguise a known account from the current result as external to bypass the internal-evidence requirement. An unmatched internal candidate remains the known income/expense until its second movement is confirmed. P2P is a payment method, not proof of internal or external ownership.

| Source evidence | Representation |
| --- | --- |
| Purchase, salary, ordinary income/expense | One movement |
| Actual debit/credit records on two represented accounts match | Internal transfer; both sides by account ID |
| One record explicitly confirms both represented account movements | Internal transfer; no second history request required |
| Only a local debit/credit, with the other account in `accounts` | One income/expense; never assume the internal counterpart |
| An external transfer/P2P is identified from bank data, external posting is unavailable | Two movements: local by ID, external by data; preserve recipient/sender in merchant |
| A record has only an ambiguous label such as “transfer”, without enough meaning to identify a transfer | Preserve the known operation; investigate actual ambiguity |
| Cash withdrawal/deposit | Bank and opposite cash movements; cash reference type is `cash` |

For an external side, choose currency in this order: confirmed counterparty currency; otherwise the local movement's `invoice.instrument`; otherwise the local account's `instrument`. Use the corresponding principal amount with the opposite direction, applying [fee/currency rules](amounts-and-statuses.md). This default MUST NOT replace a known currency, relabel a local sum as a different currency, or invent an internal amount.

| Illustrative evidence, no fee | External side |
| --- | --- |
| Local `sum: -400` RUB, invoice `-5 USD`, external currency unknown | `instrument: 'USD'`, `sum: 5` |
| Local `sum: -10` RUB, no invoice, external currency unknown | `instrument: 'RUB'`, `sum: 10` |
| External currency is confirmed EUR, while local invoice is USD | Preserve EUR and its confirmed amount; the fallback does not apply |

Keep known external type/company/identifiers and nullable unknown fields. External means outside this synchronization, not necessarily another person's account.

## TRANSFER-002 Combine bank sides

When matching actual bank debit/credit records, return one internal transfer and remove its separate income/expense sides. Prefer the shared grouping pipeline. Convert each record with its known movement and stable `groupKeys`; a key does not authorize inventing a missing internal movement. An external counterpart may already be present under TRANSFER-001; grouping replaces it with the actual matched internal side.

The final internal result references both accounts by ID. Follow the [groupKeys array contract](../transactions.md#extended-transactions-and-grouping), including when extending shared-provider parsers.

## TRANSFER-003 Handle weak and ambiguous matches explicitly

Choose and order keys to maximize correct pairing using available counterpart, direction, currency, reference, and timing evidence. Prefer shared bank references: an operation ID or `endToEndId` is strong only when the two sides share the same value in observed data. Date/currency/absolute amount or similar composite keys MAY be lower-priority fallbacks. Some residual mismatch risk is acceptable; minimize and document it. Do not describe a heuristic as bank-provided proof.

A fallback pairs two existing bank movements; it MUST NOT create a missing internal side or override known contradictory evidence. Several indistinguishable candidates do not by themselves prohibit grouping: when the available source cannot supply a better key, keep the best supported fallback and its documented uncertainty. Do not require `null` merely because a collision remains possible. Use `null` when a strategy is inapplicable or would contradict known evidence.

The standard `adjustTransactions` merger supports this probabilistic approach: within a compatible group it pairs debit and credit records in date order, with input order resolving ties. This is an allowed fallback, not independent evidence of the relationship. Key selection and any bank-specific exclusions remain the plugin's responsibility; examine observed wrong matches to improve them.

| Evidence/state | Required behavior |
| --- | --- |
| Shared stable transfer reference and compatible movements | Group and verify the full result |
| Compatible debit/credit records match only a date/currency/amount fallback | Group under the best supported strategy; document the residual collision risk |
| Fallback matches but known accounts or references contradict | Reject the pairing |
| Several indistinguishable same-value candidate pairs and no better evidence is available | May use the standard date/order pairing; ambiguity alone does not require disabling the best available key |
| One internal side is missing/outside the interval/history-skipped | Keep the known income/expense; do not fetch skipped history or invent its movement |
| One bank record explicitly confirms both sides, including a skipped account | Return the internal transfer without fetching skipped history |
| Both internal movements are confirmed, but one bank movement ID is absent | Use `id: null` for that ID only |
| A shared plan includes an active account | Fetch once, omit only operations affecting exclusively skipped accounts |
| A full transfer and its one-sided duplicate are returned | Remove only the duplicate confirmed by group key, account, amount, and sign |

Fee/currency differences need the corresponding amount semantics, not raw sum equality. For nullable amounts and the common helper's optional inference, follow [AMOUNT-001](amounts-and-statuses.md#amount-001-preserve-direction-and-currency); explicitly enable and test inference with the applicable fee/currency conditions.

The default merger does not remove a one-sided duplicate beside an already complete transfer; see [compatibility](../../compatibility.md). Matching tests follow the [bank/model evidence boundary](../../../project/testing.md#bank-data-and-model-tests).

## TRANSFER-004 Verify the final financial effect

Check both signs, account references/currencies, invoice amounts, fees, hold state, and absence of duplicates after grouping. Internal transfers require actual evidence for both movements; external representations follow TRANSFER-001. Preserve external counterparty data. Internal merchant/comment behavior follows [merchant rules](merchants.md#merchant-003-retain-enrichment-and-counterparty-identity) and the permanent [grouped-comment exception](comments.md#comment-002-exclude-technical-identifiers-and-duplication).

Test raw conversion and final grouping for affected behavior: actual matched sides, missing/skipped internal sides, external transfers without remote confirmation, currency precedence, and observed fallback collisions. Mechanisms: [transactionGroupHandler](../../../../src/common/transactionGroupHandler.js), [its tests](../../../../src/common/transactionGroupHandler.test.js), and [handleGroups](../../../../src/common/handleGroups.js). These verify shared machinery, not the reliability of every bank's keys. Missing bank examples remain evidence gaps.
