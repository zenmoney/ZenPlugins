# Simbank (Kyrgyzstan) — statement import

File-based community plugin. It imports a Simbank (КР, brand of ОАО "Дос-Кредобанк")
card statement that the user exports from the bank and selects manually. The file is
parsed **entirely on the device** — the plugin makes no network requests.

## Where to get the statement

In the **Simbank mobile app**: open the card settings and tap **"Выписка по карте"**
("Card statement"), then save the PDF. Statements come in Russian, Kyrgyz or English —
any of them works, and importing the same statement in more than one language does not
create duplicates.

## Supported file format

- `.pdf` card statement ("ВЫПИСКА ПО КАРТЕ" / "КАРТА БОЮНЧА КӨЧҮРМӨ" / "CARD STATEMENT")
  as produced by Simbank. One card / one currency per file.
- Multiple files can be selected at once — files for the same card are merged.

## How it works

1. `ZenMoney.pickDocuments` lets the user pick the statement file(s).
2. `parser-pdf.ts` extracts the PDF text (`common/pdfUtils.parsePdf`) and reads, by
   label, the masked card number, currency, end-of-period balance, the credit limit
   (`Сумма установленного лимита`) and the amount owed (`Сумма использованного лимита`),
   then the transaction table (`Дата | Детали операции | Сумма | Плата за кредит | Баланс после операции`).
   Each row's date and time sit on their own lines and the description may wrap, so
   the parser is a small line-based state machine: a `DD-MM-YYYY` + `HH:MM:SS` pair
   begins a row, and following lines accumulate as the description until the line that
   ends with the signed amount, the credit-fee dash and the running balance.
3. `converters.ts` maps each row to a ZenMoney `Transaction`:
   - the "Сумма" column is already signed (expense negative, income positive);
   - the "Плата за кредит" column is usually "-" (no fee → `fee: 0`); when it carries a
     number it's an informational credit fee that doesn't move the running balance;
   - the description becomes the merchant, except service rows (`Simbank` fees,
     `Регулярный платеж`, `Округление баланса`, `Процент на остаток`) which are kept
     as a comment with no merchant.

### Account / credit card

The account `balance` is the **own-funds** balance — the `Баланс после операции` of the
latest transaction (negative = debt to the bank). It's read from the table, not from the
header's `Остаток на конец периода` (which is the *available* balance = own funds + credit
limit), so it's language-independent. When a credit limit is set the account is a **credit
card**: `creditLimit` from `Сумма установленного лимита`, `totalAmountDue` the amount owed
(`Сумма использованного лимита`, else `max(0, −balance)`); Zenmoney then shows
available = `balance + creditLimit`. With no limit it's a plain `checking` account. The
limit is read per-statement, so if it changes or is disabled, the freshest imported
statement wins (`mergeStatements`).

### Transaction ids

The statement has no operation-reference column, so each movement id is a
**deterministic hash** (`cyrb53`) of the raw row
(`card | date-time | amount | balance | description`). The id is stable across
re-exports, which keeps deduplication working between syncs.

### Sync behaviour

Each statement file holds a single card. The plugin imports **everything in the
picked file** on every run:

- no first-run "accounts only" gate — transactions come on the very first run;
- no `fromDate` window — a manually chosen statement is imported in full. (The
  `startDate` preference is kept only because the platform requires it; it does not
  restrict what is imported.)

Re-importing the same (or an overlapping) file is safe: movements are deduplicated
by their deterministic id, and statements for the same card are merged into one
account (freshest balance wins).

## Tests

```
yarn jest simbank-kg     # tests
yarn test simbank-kg     # typecheck + lint + tests
yarn start simbank-kg    # browser dev-harness
```

Tests run on an inline, anonymized fixture (`__tests__/parseStatementText.test.ts`)
plus table-driven converter cases (`__tests__/converters.test.ts`) — no real
statement file (which contains personal data) is committed.
