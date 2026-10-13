# Receipt interpretation checks

Scope: conversion acceptance cases. [Receipt semantics](receipt.md) owns the rules.

Amounts below are synthetic illustrations in one currency, abbreviated as numbers; actual values are decimal strings. Tax rates illustrate arithmetic, not national requirements. Provider support requires [source-backed receipt tests](testing.md#source-evidence).

## Required use

For a new provider or substantial API migration, read all applicable checks before choosing source fields. For an existing provider, use the shared [review scope](../README.md#review-scope): affected checks/dependencies for a focused task, every applicable check for general log analysis or a full review.

Compare complete source responses with full converted receipts through [diagnostic triage](../../debugging/README.md#triage-before-implementation). Successful retrieval or schema validation alone does not prove quality.

## RECEIPT-001 Preserve source monetary meaning

Applies to: prices, totals, adjustments, tax and payments.

Requirement: preserve source meaning under [prices and adjustments](receipt.md#prices-and-adjustments) and [payments](receipt.md#payments-and-loyalty), without forcing arithmetic equality.

| Source evidence | Expected result |
| --- | --- |
| Document subtotal 100, tax 20, final 120 | Document original 100, final 120, root tax +20 |
| Document subtotal 90 already contains discount 10; tax 18 follows | Original 90, final 108, root discount -10 and tax +18; do not replay both against 90 |
| Original absent, null in source, or explicitly zero | Omit unavailable original; preserve zero; no aggregation/subtraction fallback |
| Item original 90 after discount 10 from base 100; tax 18 from base 90 | Original 90, final 108, adjustments -10/+18 with their bases; replay would wrongly produce 98 |
| Original 120 contains tax 20 and final is 120 | Keep original/final 120 and item tax +20 |
| Original unit/line values describe different stages | Preserve independently; no multiplication identity |
| Only final line amount and quantity known | Omit originals; derive final unit price only if exact and semantically established |
| Items 100, known root discount -10, document total 85 | Preserve facts; no invented -5 adjustment |
| Empty adjustments with unequal totals, or matching totals with incomplete detail | Preserve source totals; neither emptiness nor equality proves completeness |
| Item price/total 120 includes tax 20 | Item tax +20, no duplicate document tax |
| Item contribution 100, document-only tax 20, total 120 | Root tax +20 with known name/rate/base |
| Unit quote 100 precedes line tax 20; final line 120, quantity 1 | Original unit 100; final unit/line 120 and item tax +20 |
| Two distinct known taxes | Two adjustments at their actual scopes |
| Document tax 20 already contained in items, no allocation given | No duplicate root effect or invented item shares; overlapping summary is unrepresented |
| Promotion reduces line 100 to 80 | Source original 100, final 80, item discount -20 |
| Source already quotes final discounted unit 80 | Unit 80; original 100 only when reported; no invented adjustment |
| Basket coupon -20, two final lines 100/100 | Root discount -20, document 180 |
| Coupon allocated -12/-8 into final lines 108/72 | Item adjustments only, document 180; no second root coupon |
| Total savings 20 additionally printed after item allocation | No second effect; overlapping summary is unrepresented |
| 600 points reduce price by 300 from 1000 | Loyalty discount -300 with 600 points, final/card 700 |
| 600 points settle 300 of unchanged total 1000 | Points payment 300 with 600 points, card 700 |
| Monetary loyalty discount allocated to items; only global point count known | Preserve monetary shares; do not invent point allocations |
| Gift card 300 and bank card 700 | Two payments against total 1000 |
| Earned points or future cashback only | No current adjustment/payment |
| Goods 100, fee 10, additional fee tax 2 | Root surcharge +10 and tax +2 with base 10, total 112; fee attribution is unrepresented |
| Cash rounding 10.02 to 10.00 | Root rounding -0.02, cash 10.00; unchanged product prices |
| Tax category/rate without amount | No adjustment with an invented amount |
| Known zero-rated, exempt or outside-scope tax | Preserve known zero/name; no invented machine-readable category |
| Three units originally 100 each, final line 299 | Original unit 100/line 300, final 299; omit repeating final unit quotient unless a source quote exists |
| Final quote 92.99, quantity 0.54, rounded line 50.21 | Preserve all; do not replace line with 50.2146 |
| Confirmed free product | Retain actual quantity and known zero amounts |
| Card 300, explicitly deferred 700, total 1000 | Card/deferred entries; if debt is unknown, do not infer it |
| Confirmed refund | `operation: 'refund'`, source-consistent signs; no blanket absolute values |
| Sales and positive-only return lines mixed | Root operation cannot distinguish each line; retain signed lines when available |
| Multiple intermediate prices | Preserve consistent selected source snapshots; no invented history |
| Missing quantity/final line contribution | Fail; no quantity 1 or whole-receipt-total fallback |
| Separate foreign terminal amount | Keep receipt fields in the one declared currency |

Verification: [receipt validation](../../../src/common/receiptFetcher/receipt.test.ts), [decimal tests](../../../src/common/decimal.test.ts) and fixtures/tests beside the affected provider. These test locations do not imply coverage of every row.

## RECEIPT-002 Preserve identity, currency and time evidence

Applies to: full receipts and local previews.

Requirement: apply [common values](receipt.md#scope-and-common-values), [merchant identifiers](receipt.md#merchant-identifiers) and [identity/time](receipt.md#merchant-identity-and-time).

| Source evidence | Expected result |
| --- | --- |
| Explicit offset crosses UTC midnight | Preserve source calendar day/time/offset, independent of machine time zone |
| Date only, minute precision or unknown offset | No invented midnight, seconds, UTC or device offset |
| Foreign identifier with leading zeros | Preserve string and known country/scheme; no automatic INN lookup |
| Unknown scheme or missing merchant ID | Omit unknown data; no country-based scheme guess or register/receipt-number substitute |
| Sequence/order reference without document uniqueness | Omit `id`; no random value, amount/date hash or QR replacement |
| Repeated receipt versus distinct advance/supply documents | Stable identity for repeated retrieval; different document IDs for different receipts |
| Code supplies date/total only | Preview; no invented currency/products to make a full receipt |
| Unknown full-receipt currency | Fail; no application default |
| Empty or unparsed item list | Fail; no successful empty receipt or placeholder product |

Verification: [receipt validation](../../../src/common/receiptFetcher/receipt.test.ts) and source-backed date/identity cases beside the affected provider.

## RECEIPT-003 Distinguish settlement from repeated goods

Applies to: advance, supply and subsequent-payment documents.

Requirement: preserve [item stages and payment meanings](receipt.md#settlement-stages). Do not infer stages from names or item-list presence.

| Source evidence | Expected result |
| --- | --- |
| Goods fully prepaid, later supplied; both documents total 1000 | First: prepayment items/card 1000. Second: delivery items/applied prepayment 1000; no new cashless payment |
| Advance document 300, later goods document 1000 with 700 collected | Distinct documents: card 300; then applied prepayment 300/card 700. Keep source totals and lines |
| Unknown-goods advance with an actual generic advance line | Preserve that line; do not invent named goods |
| Payment after earlier supply | Postpayment stage with actual tender |
| Mixed or missing item stages, including returned advance | Keep known stages independently and preserve sale/refund meaning; omit unknown stages |
| Source explicitly reports zero deferred amount | Preserve zero on either document; do not replace it with the unpaid order remainder |

Verification: require source-backed cases for claimed provider support. Public protocol examples in [research](research.md#advance-and-later-settlement) are rationale, not captured document pairs.
