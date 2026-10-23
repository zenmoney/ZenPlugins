# Fixture provenance

Source: user-authorized Chrome HAR `bank-login.har`, captured 2026-10-22 at the official `webebank.ebb-bg.com/sbpo_mbank` business client. Raw captures remain in ignored local research storage and are excluded from publication.

At the account holder's request, historical datasets have been removed. The retained financial sample contains only nine complete transaction rows:

- `transactions-rsd.html`: three rows from HAR response 216: a tax expense, a separate fee and the RSD side of a currency exchange.
- `transactions-eur.html`: six rows from authorized live response 41: two user-confirmed SEPA duplicate pairs, the matching EUR exchange debit and one older non-SEPA incoming payment with a foreign fee.

Each selected row preserves its complete original HTML, attributes, fields, text and whitespace after anonymization. The fragments also retain selected original filter inputs, the pager and period initialization script. They are explicitly **not complete history responses**: original pager totals describe the source response rather than the selected rows. API pagination/completeness tests model domain page metadata separately; they no longer retain or replay an annual financial history.

`accounts.html` preserves the complete two-account graph from HAR response 168. `authenticated-landing.html` contains only the complete logout form from HAR response 38, sufficient to verify the authenticated landing state without copying its account dashboard. Initial login and push challenge/status captures come from the public login page and HAR responses 3, 32 and 36. Empty history and period selector responses come from the authorized live run. `period-native-null.json` preserves the selector response from Bootloader session 480b10b5, where the native adapter passed a null upper cutoff.

Names, addresses, account numbers, sender company, all customer tax references, masked card numbers, client identifiers and authentication material use consistent public-safe replacements. Dates, amounts, balances, invoice references and non-auth transaction IDs in the selected cases remain real evidence. This is a minimal anonymized sample, not a synthetic dataset.

The account holder confirmed that the two SEPA pairs represent bank duplicates. Deduplication remains a narrow heuristic: exactly two booked EUR credits with identical supplied fields and the observed invoice/SEPA purpose. Legitimate identical same-invoice payments remain ambiguous. Currency exchange pairing uses the recorded date and RSD amount implied by an actual EUR debit; it never creates a missing side.

Native synchronization and subsequent mobile reauthorization were confirmed by the account holder. Pending/cancelled operations, credit/hold balance differences, credential rejection and user rejection remain evidence gaps. Model tests do not claim these unobserved bank cases.

The foreground fallback prompt for an absent login is covered by model tests, including null/blank input, background guards and hot-session reuse. The account holder subsequently confirmed successful manual login entry, mobile approval and synchronization through the native Bootloader; earlier device runs used a prefilled local login.
