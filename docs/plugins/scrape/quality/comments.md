# Comment quality

Applies to transaction comments. Merchant/purpose boundaries follow [merchant rules](merchants.md). Determine whether text adds useful information; neither the existence of a source field nor the operation class alone determines whether to retain it.

## COMMENT-001 Keep useful human meaning

Preserve a user-entered purpose, meaningful payment description, recipient detail not already in merchant, or an invoice/reference number useful to the user. The limited exception for grouped internal transfers is defined in COMMENT-002 below. Do not move a purpose into `merchant.title` merely because the bank calls the field a payee/description.

| Source meaning | Result |
| --- | --- |
| `Зачисление зарплаты`, with no equivalent information elsewhere | Preserve the useful purpose |
| `Birthday gift`, `Rent for January`, meaningful invoice number | Preserve as comment |
| `Наличными`, `Операция по карте`, generic operation label | Omit when it adds no useful information |
| Recipient name already in merchant | Do not repeat it; retain an independent purpose if present |
| Useful purpose plus known technical suffix | Remove only the confirmed technical part |
| A useful purchase detail or cash-deposit purpose follows a confirmed card/date/ATM service block | Remove the technical block and retain the useful trailing text; its position does not make it technical |
| A confirmed cash-deposit layout uses `/` to separate an ATM service block from the purpose `AHORROS2026` | Keep `comment: 'AHORROS2026'`; remove the service block and its `/` separator |
| One source field identifies the merchant and another supplies an independent purpose | Preserve both in their respective output fields; parsing the merchant does not consume the purpose |
| Unknown text format | Preserve useful unresolved text; do not suppress an entire class speculatively |

Interpret the observed bank format reasonably, preserving useful meaning. A known technical block can be removed without inventing hypothetical exceptions; an operation code alone does not make all comments boilerplate. Refine the rule when a real counterexample arrives and retain its full source record in a test.

Assess every available relevant description field and array item by meaning. A generic sender label may duplicate the merchant while a later item contains the useful purpose; taking only the first or last item is not a general rule. Preserve complementary human meaning without copying technical sections or repeating merchant data. A human-looking suffix in saved application data may have been added after import; use real bank source data to establish its API field and parsing boundary under the [fixture evidence rules](../../../project/testing.md#bank-data-and-model-tests).

## COMMENT-002 Exclude technical identifiers and duplication

Comments MUST NOT duplicate merchant fields or expose meaningless internal bank details: transaction/entry IDs, internal end-to-end references, technical account numbers, or strings such as `TRASPASO 0310-00018593-87 Z2SY47HXXNNAEW3DF`. A user-facing invoice/reference number is different from an internal database key; decide by its purpose and observed presentation.

When removing a confirmed technical block, remove its known boundary markers as well. For example, the separator before `AHORROS2026` is not part of the purpose. Limit this cleanup to the verified format; preserve punctuation belonging to the useful text, such as the slash in an invoice reference `2026/09`.

Use `null` when nothing useful remains. For internal transfers between the user's accounts, `comment: null` is the default when no additional useful purpose is supplied. Comment preservation depends on how the transfer is assembled:

| Assembly path | Useful user purpose |
| --- | --- |
| Converter directly constructs a confirmed two-movement transfer | MUST preserve the purpose |
| Confirmed internal transfer is assembled from separate records through `groupKeys` | SHOULD preserve the purpose, but the final grouped transfer MAY have `comment: null`; loss here is an improvement opportunity, not a blocking correctness defect |
| A record remains an unpaired income/expense after grouping | MUST preserve the purpose under COMMENT-001; having supplied `groupKeys` does not by itself grant the grouped-transfer exception |

Prefer retaining useful comments on the input sides so the grouping handler can carry them forward. `groupKeys` does not require clearing comments. This exception concerns only comments, not evidence for the transfer, its amounts, currencies, account references, or external counterparty.

Verification: assert the complete transaction for useful purpose, generic label, technical reference, duplicated merchant, useful purpose plus recipient, and internal transfer with/without meaningful user text. Cover direct construction, successful grouping, and an unpaired record separately; for grouping, document the chosen permitted comment result. Adding a merchant must not unconditionally reset an existing useful comment.
