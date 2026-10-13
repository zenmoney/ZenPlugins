# Portable receipt semantics

Scope: the version 1 `Receipt`/`ReceiptPreview` contract. [TypeScript](../../../src/types/receiptFetcher.ts) owns field shapes; [quality rules](quality.md) own acceptance cases and [research](research.md) records model rationale. Read only the sections affected by a conversion change.

## Scope and common values

`Receipt` is a retrieved document with a nonempty item list, known quantities, final item amounts, currency and issue date. An empty or unparsed item list MUST fail validation; do not invent a product or return a partial receipt as full. `ReceiptPreview` contains only locally available code data and may omit currency, date and total. Plugin/build metadata and lookup input stay outside both values.

All monetary fields use the one known ISO receipt currency. Never default it from the application or transaction, copy foreign terminal/settlement amounts into it, or guess an exchange rate.

Money, quantities, point counts and percentages MUST be finite base-10 decimal strings without exponents, locale grouping or binary floating-point artifacts. Use explicit safe conversion and exact arithmetic/scaling; there is no universal two-decimal limit. Point counts are not money. Omit unknown optional values rather than using null, empty strings or guesses; retain explicit zero.

Display text uses `name`; item names are required, adjustment/payment names optional. Classification comes from `kind`, `reason` or `method`, not equal names. `operation` is source-established `sale`, `refund` or `unknown`. Do not assume sale or blindly take absolute values of signed lines; sign normalization needs source-backed tests. Fiscal correction metadata is outside this model.

## Prices and adjustments

`receipt.totalAmount` is the authoritative final document amount, independent of its breakdown. It need not equal newly collected money or the amount still payable. `items[].totalAmount` is the final contribution at item scope, including effects allocated to that item; unallocated document effects remain separate.

`unitPrice` is a confirmed final source quote at item scope, or an exact derivation from final line amount and quantity. A quote before an item discount/tax belongs to `originalUnitPrice`. Preserve the source quantity unit when known; an unexplained numeric unit code does not establish a physical unit. Normalize a quote per 100 g or another base quantity only when that meaning is established and arithmetic is exact.

Do not require `unitPrice * quantity == totalAmount`: a final quote of 92.99 for quantity 0.54 can produce a rounded source total of 50.21. If no quote exists, omit a repeating quotient rather than rounding it; three units totaling 299 have no finite exact unit price. A confirmed free item keeps its actual quantity and zero amount. A negative row alone does not establish a discount.

### Original values

Item `originalUnitPrice` and `originalTotalAmount` preserve independent source-established snapshots. They may already include adjustments, need not describe the same stage, and need not multiply to each other. Choose source fields consistently and document their meaning. Do not infer savings, reconstruct originals from percentages/adjustments, or invent a crossed-out price. Exact unit normalization is allowed when the source stage and quantity basis are known.

`receipt.originalTotalAmount` preserves a reported document subtotal/intermediate amount. It is independent of item sums and tax bases. Never derive it by aggregating items or subtracting adjustments; omit it when unavailable and preserve explicit zero.

### Adjustment scope

`ReceiptAdjustment.amount` is a signed effect already reflected in its containing total: a sale discount reduces it, a surcharge/added tax increases it, and rounding can have either sign. `percent` uses percentage units (`10` means 10%); `baseAmount` preserves a known source base. Neither implies calculation order or replaces the required monetary amount.

- `item.adjustments` explains effects inside that item's final amount, including a separate discount row explicitly attached to the product.
- `receipt.adjustments` explains effects outside final item contributions but already inside the document total, such as an unallocated basket coupon.
- Preserve source allocations; never invent shares or repeat allocated effects as document adjustments. A printed total savings summary is not another deduction.
- Both arrays may be incomplete. Absence/emptiness does not prove no effects; array order is not a calculation program.

### Reconciliation is optional evidence, not validation of the DTO

`completeness: 'full'` means a retrieved receipt, not complete tax, discount, original-price or payment detail. Independently established completeness and disjoint scope permit these checks:

```text
receipt.totalAmount = sum(items.totalAmount) + sum(receipt.adjustments.amount)
receipt.totalAmount = sum(payments.amount)
```

A mismatch alone neither invalidates source totals nor permits balancing discounts, tax, rounding, products or debt. Matching sums do not prove completeness: omitted effects may cancel. Known conversion errors and missed source lines still fail.

Original values are not universal pre-adjustment bases. For example, original 90 can already contain a discount of 10 from base 100, followed by tax 18 from base 90 and final 108. Both adjustments are explanatory; replaying them against 90 would incorrectly produce 98. This applies at item and document scope.

### Taxes are adjustments

Use `kind: 'tax'` with the same adjustment fields: source name, signed amount, optional percentage and taxable base. The amount MUST be known; a rate/category alone or a guessed national rate cannot supply it. Preserve known zero and consume final values without adding tax again.

Apply [adjustment scope](#adjustment-scope): tax included in a final item belongs to that item; tax beyond item contributions belongs to the document. A document tax summary already contained in items cannot be repeated as a root adjustment, even when no item allocation is available.

A unit price can exclude tax applied only at document scope. Tax inclusion at original/intermediate stages and calculation order are not encoded; do not infer a shared tax basis between original and final prices.

## Merchant identifiers

`merchant.identifiers` preserves source strings with optional known country/scheme, for example INN, BIN, UEN or GST. These are examples, not a closed enum. Preserve leading zeros and letters. Multiple identifiers or no identifiers are valid; manifest country preference does not establish jurisdiction.

Register, terminal and receipt numbers are not merchant identifiers. Equal bare values across schemes do not prove the same merchant. A Russian INN lookup requires confirmed RU/INN metadata, not the first identifier in a list.

## Payments and loyalty

`payments` describes known receipt-level settlement contributions in receipt currency: actual payments, applied prepayment and explicitly deferred amounts. Entries are never item-level allocations. Use applied cash after change, exclude failed attempts, and do not duplicate a wallet payment and its underlying card.

| Method | Source meaning |
| --- | --- |
| `card` | Confirmed card payment, including credit cards |
| `cashless` | Other cashless method or unknown specific cashless method; generic cashless evidence does not prove a card or transfer |
| `cash` | Applied cash |
| `prepayment` | Previously collected money applied now |
| `loyaltyPoints` | Points settling an unchanged purchase total |
| `giftCard` | Gift-card redemption |
| `deferred` | Amount payable later, established at issuance |
| `other` | Another/unclassified reported method, with an optional source name |

Wallet branding alone does not establish a method. Missing payment data does not justify an `other` entry, zero contribution or an inferred balance. Preserve explicit zero, including a zero deferred amount. Never infer debt by subtracting incomplete payments from the total. Deferred amounts are not collected money, later repayments or current account debt.

If points reduce the purchase price, use a discount with `reason: 'loyalty'`; if they settle an unchanged price, use a `loyaltyPoints` payment. Never use both for the same redemption. `loyalty.points` records the actual point quantity and `programName` the known program; the containing `amount` is its monetary equivalent. Membership discounts need no redeemed points. A point count alone cannot create a monetary entry.

Buying a gift card is a purchased item; redeeming it is a payment. Merchant stored credit is not automatically deferred debt. Earned points, balances and future cashback are outside this model.

### Settlement stages

Optional item `settlementStage` means `prepayment` before supply, `delivery` at supply, or `postpayment` when an earlier supply is subsequently paid for. Preserve each known item stage independently; omit unknown stages. Country, item names/list presence and payment method cannot establish a stage. Stage is independent of sale/refund and does not encode every national full/partial subtype or an entire order balance.

When collecting an advance, use its actual tender; `method: 'prepayment'` is reserved for later application of prior money. Prepayment documents can contain a full goods breakdown. A document may mix stages; do not propagate the first item's stage or add a receipt-level purpose flag. Later repayment uses its actual method on its own receipt.

Keep each source document's totals and lines. An advance's deferred amount is not the unpaid remainder of the whole order; do not rewrite its total to the order value, invent goods or represent applied prepayment as a discount. [Quality cases](quality.md#receipt-003-distinguish-settlement-from-repeated-goods) cover full and partial advance pairs.

## Merchant, identity, and time

`merchant.name` is the source seller/outlet display name, not necessarily its legal name. Preserve source address text without guessing postal components.

Optional `id` is a stable source document identity unique at least within the provider connection, possibly a verified composite. A printed sequence number may not be unique; an order ID can cover several receipts. Omit unusable identity rather than generating a random ID, amount/date hash or QR payload. Lookup keys do not establish document identity. Advance and supply receipts remain distinct documents even for the same purchase.

`issuedAt.date` is the source calendar date (`YYYY-MM-DD`). Optional `time` retains its precision: `HH:mm`, `HH:mm:ss` or fractional seconds; never invent midnight. `utcOffsetMinutes` is east of UTC and requires a time. Zero means UTC, absence means unknown. Never shift the receipt day into the device time zone. Preview dates use these same rules.

## Example

Synthetic EUR purchase: two coffees originally cost 10 each (line 20), then a promotion reduces their final unit price to 9 and line total to 18. The item adjustment is -2. An unallocated loyalty discount worth 3 for 60 points is a receipt adjustment of -3. The final receipt and card payment are 15. Item and receipt effects explain different scopes; neither is applied twice.
