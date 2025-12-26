# ZenMoney Fortebank (Kazakhstan) Plugin

This plugin parses PDF bank statements from **Fortebank Kazakhstan** for import into ZenMoney.

## Features

*   **Multi-language Support:** Automatically detects and parses statements in **Russian (RU)**, **English (EN)**, and **Kazakh (KZ)**.
*   **Robust PDF Parsing:** Handles the specific "spaced-out" text format often found in Fortebank PDFs (e.g., "T E X T").
*   **Operation-Aware Parsing:** Intelligent extraction of transaction details based on the operation type:
    *   **Purchases:** Extracts Merchant Name, MCC, Bank, and Payment Method.
    *   **Cash Withdrawals:** Extracts Bank, ATM Code, and Location.
    *   **Transfers:** Extracts Receiver information.
    *   **Payments:** Handles utility and service payments.
*   **Merchant Enrichment:** Automatically detects City and Country from merchant descriptions (e.g., "Starbucks Almaty KZ" -> City: Almaty, Country: Kazakhstan).
*   **Multi-currency Support:** Handles transactions in KZT, USD, EUR, RUB, GBP.

## Supported Statement Format

The plugin expects standard PDF statements generated via Fortebank's Internet Banking.
The parsing logic relies on specific headers to identify table sections:
*   **EN:** `D a t e S u m D e s c r i p t i o n D e t a i l s`
*   **RU:** `Д а т а С у м м а О п и с а н и е Д е т а л и з а ц и я`
*   **KZ:** `К ү н і С о м а C и п а т т а м а с ы Т а л д а м а`

## Development

### Structure

*   `index.ts`: Entry point, orchestrates the scraping flow.
*   `parser.ts`: Core logic for text normalization, section splitting, operation detection, and regex-based parsing.
*   `converters.ts`: Maps parsed internal structures to ZenMoney `Account` and `Transaction` objects.
*   `merchant-utils.ts`: Utilities for cleaning merchant titles and detecting locations.

### Testing

Run unit and E2E tests:

```bash
yarn test fortebank-kz
```

Tests cover:
*   Parser logic (dates, amounts, descriptions).
*   Merchant cleaning and location extraction.
*   Converters (type safety).
*   End-to-End parsing of sample statements (located in `__tests__/test_data`).
