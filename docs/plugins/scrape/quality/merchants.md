# Merchant parsing quality

Applies to transaction counterparty data. Field meanings are in the [transaction contract](../transactions.md#merchant-and-comment); useful purposes follow [comments](comments.md). Tables illustrate decisions, not bank fixtures.

## MERCHANT-001 Preserve known field boundaries

The converter MUST produce `Merchant` when source fields or the observed bank format identify the merchant name separately from any city/country. Missing place information uses null place fields and does not make a known name unparsed.

Apply the [observed-format generalization rule](../../../project/testing.md#bank-parsing-and-interpretation): observed name-only text uses `title` within the same source field, format, and operation class, including when extracted from a transaction description. Use `NonParsedMerchant.fullTitle` only when name/place boundaries remain ambiguous after inspecting relevant fields and applying supported parsing. Missing place data, an unimplemented parser, or hypothetical counterexamples do not justify `fullTitle`; record actual unresolved boundaries.

Parsing MUST preserve reliable structure supplied by the bank or an earlier parser: do not merge known fields back into `fullTitle`, erase a known name/place, or discard enrichment because another field is ambiguous. Use a known name to help parse other descriptions; the converter MUST add city, country, or other enrichment when the evidence supports it. Correcting a field whose meaning was previously misidentified requires source evidence and a regression test.

Inspect all available relevant source fields together: separate counterparty fields, structured and unstructured remittance, every remittance-array item, additional information, and merchant enrichment. Assemble the most complete and structured result supported by that evidence. Selecting one preferred field MUST NOT discard complementary information from another; separate merchant identity/place from useful purpose under the [comment rules](comments.md). Completeness does not mean copying technical text, duplicating information, or guessing missing structure.

| Source evidence | Expected result |
| --- | --- |
| Separate merchant name and place fields | Preserve that boundary; parse place only at confirmed delimiters/country boundaries |
| Observed examples establish that a field or extracted fragment contains only a name, such as `G. SHOP`, with no contrary evidence in that format/class | Use `title: "G. SHOP"` with null unknown place fields, including when the source is a transaction description |
| A real counterexample shows mixed name/place text in a previously name-only format | Refine parsing using the distinguishing evidence; use `fullTitle` for the affected ambiguous form when the boundary remains unresolved |
| Confirmed `SHOP_NAME / CITY / COUNTRY` layout | Separate title, city, and country |
| Confirmed `AMAZON*MARKETPLACE//SEATTLE/US` layout | Parse according to this format, preserving the merchant name |
| Consistent `MCDONALDS       MOSCOW     RU` layout with country evidence | Parse meaningful whitespace separators before normalization |
| Name/place boundaries in `MCDONALDS MOSCOW RU` remain unresolved after checking source fields and supported parsing | Keep `fullTitle`; do not guess word boundaries |
| A slash or repeated space occurs inside a real name | The character alone is not proof of a separator |
| Name is known and the city field is identified, but its text cannot be parsed further | Keep the confirmed name and city text intact |
| Bank supplies `creditorName: "ROSSMANN 138"`; confirmed description format contains `ROSSMANN 138 WARSZAWA` | Preserve `title: "ROSSMANN 138"` and extract `city: "WARSZAWA"` at the known name boundary; a single space is not a reason to downgrade to `fullTitle` |
| `JMP S.A. BIEDRONKA JMP S.A. BIEDRONKA 5238` follows `<legal entity> <brand> <legal entity> <outlet>`; another field supplies `BIEDRONKA 5238` | Identify the repeated `JMP S.A.` blocks and extract the brand between them: `title: "BIEDRONKA"`; unknown city/country remain null |
| Only the outlet name `BIEDRONKA 5238` is available, with no supported brand boundary | Keep `title: "BIEDRONKA 5238"`; removing digits does not establish a brand |
| Bank or an earlier parser supplies separate title/city/country and MCC | Retain those fields when cleaning a service prefix or adding other details |
| A confirmed merchant/place boundary leaves punctuation inside the place, such as `GIJON/XIXON` | Keep that punctuation within the field; it is not another boundary by itself |

## MERCHANT-002 Normalize after structural parsing

Applies to converted `merchant.title`, `merchant.fullTitle`, `merchant.city`, `merchant.country`, and transaction `comment`. These fields MUST be cleaned of text known to be technical in the observed format. Choosing `fullTitle` does not exempt the string from cleanup; cleanup alone does not establish name/place boundaries.

Inspect the raw string and parse structural boundaries before collapsing whitespace or removing separators. After parsing and selecting useful text, whitespace in merchant fields and comments MAY be normalized with `value.replace(/\s+/g, ' ').trim()`. Remove known technical padding, filler characters, POS/ECOM prefixes, terminal IDs, service tails, and their boundary markers where the format supports it. Do not apply cleanup to unrelated fields, formats, or operation classes without evidence of the same technical role.

Punctuation is not garbage merely because it appears at a boundary. Preserve meaningful initials, abbreviations, names, place punctuation, and user text. MUST NOT strip apparent location markers such as `Gorod`, `G`, `G.`, or `S` without evidence; they can belong to a name/place.

The converter SHOULD select `merchant.title` from the operation's relevant fields for the same counterparty in this order: **brand, trading name, legal entity name**. Use separately supplied names or extract them from the observed structure; do not infer a brand by trimming legal forms, outlet numbers, or other meaningful name parts. Among variants of the selected name, preserve supported brand spelling; otherwise prefer mixed case over all-uppercase or all-lowercase, ignoring punctuation when comparing readability. Select an available spelling rather than mechanically changing case.

| Source evidence (illustrative) | Expected result |
| --- | --- |
| Fields supply `ACME SERVICES S.A.` and `Acme Services, SA.` as equivalent names of the same counterparty, with no established brand spelling | Prefer `Acme Services, SA.` for its mixed case |
| The creditor is `ACME ENERGY, S.A.` and the same operation's confirmed invoice layout supplies `Acme Energy, Factura: 42` | Use `title: 'Acme Energy'` and `comment: 'Factura: 42'` |
| Source evidence identifies `IKEA`, `IBM`, or `eBay` as the brand spelling, alongside mechanically recased variants | Preserve the supported brand spelling |
| The only supported name is an all-uppercase legal name | Preserve the supplied spelling and legal form |
| `BLUE MEDIA SPÓŁKA AKCYJNA .`, with the final ` .` established as filler | Remove that filler; retain `BLUE MEDIA SPÓŁKA AKCYJNA` |
| A combined merchant/place string remains ambiguous but has a known technical suffix | Clean the suffix and keep the remaining string in `fullTitle` |
| A parsed city, country, or useful comment ends with a known filler/separator in that field's format | Remove it from that field too; preserve the useful value |
| `G. SHOP`, `CANAL+ Polska S.A.`, `GIJON/XIXON`, or an invoice reference `2026/09` | Preserve the meaningful punctuation; none justifies a general punctuation blacklist |
| A value is blank or contains only confirmed technical text | Use null for emptied city/country/comment; merchant presence follows the [nonblank-name contract](../transactions.md#merchant-and-comment) |

Cleanup applies to converted output, not to rewriting raw source records or fixtures; preserve those under [fixture rules](../../../project/fixtures.md). It does not change the separate rules for [runtime log sanitization](../../../debugging/log-sanitization.md) or [verbatim bank error messages](../../errors.md#bank-messages-and-terminal-scope).

## MERCHANT-003 Retain enrichment and counterparty identity

Within a non-null merchant, preserve MCC, bank category where applicable, country, city, and coordinates when available. Do not discard known enrichment merely because the title is unparsed. Do not invent MCC or geolocation from a merchant-name guess.

For an outgoing external transfer, including external P2P, use the known recipient; for incoming money, the known sender. Check account membership before treating P2P as external. Internal transfers normally have no external merchant. A payment purpose belongs in `comment`, not in a fabricated merchant title. Preserve useful user text under the [comment rules](comments.md).

Verification: full transactions cover the table cases, enrichment, P2P direction, and successive parsers retaining known structure and useful comments where supported. Check cleanup in each affected text field, including blank/emptied names with otherwise known enrichment. Missing bank samples remain gaps under the evidence rule.
