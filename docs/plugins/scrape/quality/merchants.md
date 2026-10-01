# Merchant parsing quality

Applies to transaction counterparty data. Field meanings are in the [transaction contract](../transactions.md#merchant-and-comment); useful purposes follow [comments](comments.md). Tables illustrate decisions, not bank fixtures.

## MERCHANT-001 Preserve known field boundaries

The converter MUST produce `Merchant` when source fields or a confirmed format reliably identify the name, city, or country. A known name with unknown place uses `title` and null place fields. Use `NonParsedMerchant.fullTitle` only when the combined string cannot be reliably separated; use `merchant: null` when information is absent.

Parsing MUST preserve reliable structure already supplied by the bank or established by an earlier parser. A later parser MAY make it more specific using confirmed evidence, but MUST NOT merge known fields back into `fullTitle`, erase a known name/place, or discard enrichment merely because another part of the description is ambiguous. An unresolved city does not make a separately supplied merchant name unresolved. Correcting a field whose meaning was previously misidentified requires source evidence and a regression test.

Inspect all available relevant source fields together: separate counterparty fields, structured and unstructured remittance, every remittance-array item, additional information, and merchant enrichment. Assemble the most complete and structured result supported by that evidence. Selecting one preferred field MUST NOT discard complementary information from another; separate merchant identity/place from useful purpose under the [comment rules](comments.md). Completeness does not mean copying technical text, duplicating information, or guessing missing structure.

| Source evidence | Expected result |
| --- | --- |
| Separate merchant name and place fields | Preserve that boundary; parse place only at confirmed delimiters/country boundaries |
| Confirmed `SHOP_NAME / CITY / COUNTRY` layout | Separate title, city, and country |
| Confirmed `AMAZON*MARKETPLACE//SEATTLE/US` layout | Parse according to this format, preserving the merchant name |
| Consistent `MCDONALDS       MOSCOW     RU` layout with country evidence | Parse meaningful whitespace separators before normalization |
| `MCDONALDS MOSCOW RU` without a confirmed grammar | Keep `fullTitle`; do not guess word boundaries |
| A slash or repeated space occurs inside a real name | The character alone is not proof of a separator |
| Name is known, city is partly unresolved | Keep the confirmed name and unresolved city part intact |
| Bank supplies `creditorName: "ROSSMANN 138"`; confirmed description format contains `ROSSMANN 138 WARSZAWA` | Preserve `title: "ROSSMANN 138"` and extract `city: "WARSZAWA"` at the known name boundary; a single space is not a reason to downgrade to `fullTitle` |
| Bank supplies a reliable name, but the remaining description has no confirmed place meaning | Preserve that `title` with null unknown place fields; keep useful unresolved text under the comment rules |
| Bank or an earlier parser supplies separate title/city/country and MCC | Retain those fields when cleaning a service prefix or adding other details |
| A confirmed merchant/place boundary leaves punctuation inside the place, such as `GIJON/XIXON` | Keep that punctuation within the field; it is not another boundary by itself |

Apply the [observed-format generalization rule](../../../project/testing.md#bank-parsing-and-interpretation). A country-like suffix without a reasonably identifiable boundary remains ambiguous; preserve unresolved information.

## MERCHANT-002 Normalize after structural parsing

Inspect the raw string before collapsing whitespace. After extracting fields, use only `value.replace(/\s+/g, ' ').trim()` unless stronger cleanup is proven safe for the format. Do not apply a broad regex to unrelated operation classes.

Remove identified POS/ECOM prefixes, terminal IDs, and service tails only where proven technical. MUST NOT strip apparent location markers such as `Gorod`, `G`, `G.`, or `S` without evidence; they can belong to a name/place. Preserve observed counterexamples in tests.

## MERCHANT-003 Retain enrichment and counterparty identity

Preserve MCC, bank category where applicable, country, city, and coordinates when available. Do not discard known enrichment merely because the title is unparsed. Do not invent MCC or geolocation from a merchant-name guess.

For an outgoing external transfer, including external P2P, use the known recipient; for incoming money, the known sender. Check account membership before treating P2P as external. Internal transfers normally have no external merchant. A payment purpose belongs in `comment`, not in a fabricated merchant title. Preserve useful user text under the [comment rules](comments.md).

Verification: full transactions cover structured/unparsed/absent merchants, significant whitespace, misleading delimiters, short tokens, separate fields, enrichment, and P2P direction where supported. Include observed known-name/single-space and ambiguous-place cases; check that successive parsers retain structure and useful comments. Missing bank samples remain gaps under the evidence rule.
