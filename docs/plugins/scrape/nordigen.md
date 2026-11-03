# Nordigen integrations

Read only for plugins backed by the shared Nordigen implementation. The shared implementation is present in `develop`, not in every `master` checkout. Source paths below are branch-scoped references, not instructions to copy private implementation files into master. General rules: [transfers](quality/transfers.md), [merchants](quality/merchants.md), and [comments](quality/comments.md).

Many European banks use Nordigen (GoCardless) as an aggregator. These plugins share code in `src/plugins/nordigen/`.

## Operation dates

All Nordigen integrations MUST follow [DATE-001](quality/amounts-and-statuses.md#date-001-preserve-the-operation-date), including the shared converter, custom parsers, dates extracted from descriptions, and date-only fallbacks.

The [GoCardless transaction schema](https://docs.gocardless.com/docs/bank-account-data/output-transaction-details) defines `bookingDate`/`bookingDateTime` as posting to the account. Inspect bank-provided remittance descriptions (including arrays), `additionalInformation`, and bank-specific supplementary fields alongside the primary dates: they may carry the original card transaction/authorisation date. Apply the [date-selection rule](quality/amounts-and-statuses.md#select-the-transaction-date) before interpreting its time zone. The presence of `valueDate`/`valueDateTime`, or an earlier value than the booking date, does not by itself identify an authorisation date.

Bank-specific date extraction normally belongs in a `parseDate` [custom parser](#shared-implementation-and-custom-parsers) in the bank plugin's converter module. Extend the existing parser or add it to the plugin's `parsers` chain. It replaces the base date only when the bank's format establishes the transaction/authorisation date; ambiguous text leaves the confirmed base date intact under DATE-001. Cover the complete conversion in the relevant operation-type test file.

Nordigen exposes many banks through one API; that common interface does not establish a common processing time zone. Evaluate the evidence for each bank and source field. Apply the general rule's local fallback when the processing zone is unknown, and retain explicit or bank-confirmed zone semantics when available. A date-only field does not create an exception to that evidence order.

## Shared implementation and custom parsers

**Default approach**: Always use custom parsers in the specific plugin directory instead of modifying shared nordigen code.

**When to modify `src/plugins/nordigen/`**: Only when there's strong confidence that it's a bug or oversight in the core shared logic that affects all Nordigen banks (e.g., a field that was simply never handled, a parsing bug in date handling). **Always ask the user for explicit approval before modifying nordigen.**

**Custom parsers pattern**:

- Create `converters.ts` in the plugin directory that exports a `parsers` array; all new code uses TypeScript, including wrappers around legacy JavaScript providers
- Import and extend base parsers from nordigen
- Pass `parsers` to nordigen scrape in `index.ts`
- **Always include `parseInnerTransfer`** from nordigen — it handles transfers between user's own accounts

**Reference examples**:

- `src/plugins/revolut/converters.js` in a checkout containing the Nordigen integration — an existing legacy custom `parseInnerTransfer` wrapper, not a language template for new files

**Common customizations**:

- Handle useful purposes from `remittanceInformationUnstructuredArray` as comments (many banks use this instead of `remittanceInformationUnstructured`); do not treat the purpose as a merchant name
- Apply [text cleanup](quality/merchants.md#merchant-002-normalize-after-structural-parsing) to merchant fields and comments using evidence from the bank's format
- Custom outer transfer parsing (P2P, bank transfers with IBAN)
- Custom `parseInnerTransfer` — only when standard logic doesn't work (e.g., bank uses non-standard codes like `TRANSFER`/`EXCHANGE`)
- Verify all transfers, including P2P/Bizum, against [transfer quality](quality/transfers.md); calling a shared parser does not establish correctness

**groupKeys best practices**:

Extend strategies without losing valid fallbacks or changing their positions. Follow the [array contract](transactions.md#extended-transactions-and-grouping) and [key-selection rule](quality/transfers.md#transfer-003-handle-weak-and-ambiguous-matches-explicitly). `endToEndId` also occurs on non-transfers; bank evidence must show that it connects the two sides.

**Purpose-preservation example**:

This pure TypeScript helper illustrates comment assembly after bank-specific conversion. The caller validates the raw array and selects useful purpose lines under the comment rules; it does not infer a merchant from them. Merchant conversion must independently retain the bank's known MCC and other enrichment. Verify that output even when a legacy base parser is used; calling it is not proof that it preserved every field.

```ts
import { Transaction } from '../../../src/types/zenmoney'

export function appendRemittanceComment (
  transaction: Transaction,
  purposeLines: readonly string[]
): Transaction {
  const comments = [transaction.comment, ...purposeLines]
    .filter((value): value is string => value !== null)
    .map(value => value.replace(/\s+/g, ' ').trim())
    .filter(value => value.length > 0)
  return {
    ...transaction,
    comment: [...new Set(comments)].join('\n') || null
  }
}

// Illustrative domain output, not a bank payload or regression fixture.
// The caller has already interpreted the merchant and useful purpose.
const rental: Transaction = {
  hold: false,
  date: new Date('2026-01-05T10:00:00+01:00'),
  movements: [{ id: 'rent-1', account: { id: 'eur-main' }, invoice: null, sum: -100, fee: 0 }],
  merchant: { title: 'EXAMPLE RENTALS', country: null, city: null, mcc: 6513, location: null },
  comment: null
}

const rentalWithPurpose = appendRemittanceComment(rental, ['Rent for January'])
// comment is 'Rent for January'; merchant.title and merchant.mcc are unchanged.
```

This helper is not a complete provider parser or transfer classifier. Integrate it at the appropriate point in the bank's parser chain and verify the full final transaction. Test existing comments, several purpose lines, absent purpose, and preserved MCC/counterparty data. When both bank sides form an internal transfer, the final grouping still follows the shared transfer and comment rules.
