# Account contract

Applies to scrape output. Exact declarations: [zenmoney.ts](../../../src/types/zenmoney.ts). Implementation choices follow [account quality](quality/accounts.md). Examples here are synthetic.

## Account kinds

| Type | Meaning | Shape |
| --- | --- | --- |
| `ccard` | Debit or credit card account | `AccountOrCard` |
| `checking` | Current/payment account | `AccountOrCard` |
| `investment` | Brokerage/investment account | `AccountOrCard` |
| `deposit` | Term deposit with contractual conditions | `DepositOrLoan` |
| `loan` | Loan/credit/mortgage with contractual conditions | `DepositOrLoan` |
| `cash` | Cash counterparty for cash transfers | Reference by data; not a bank-fetched `Account` union member |

A savings account need not be a term deposit: regular savings products can use an appropriate regular account type with `savings: true`. A card is not necessarily another independent balance; determine its relationship to the underlying account before conversion.

## Common fields and balances

| Field | Meaning |
| --- | --- |
| `id` | Unique within the result and stable across runs; movement references use it |
| `type` | One of the supported kinds above |
| `title` | Human-readable account name, following the plugin's language policy for authored text |
| `instrument` | Account currency/asset code, e.g. `EUR`, `BTC`, `XAU`; do not silently substitute a valuation currency |
| `syncIds` | Stable account matching identifiers across runs; selection and collision rules are in account quality |
| `balance` | Current own-funds position, accounting for holds/reservations; negative when the user owes the bank; `null` when unknown |
| `archived` | Optional closed/inactive state |

On regular accounts `balance` is optional; on deposits/loans the field is required but nullable. `0` is a known zero, not an unknown value. All numeric values must be finite.

Regular accounts also allow:

| Field | Meaning |
| --- | --- |
| `savings` | Savings classification |
| `available` | Available funds under the domain relation `available = balance + creditLimit`; nullable/optional |
| `creditLimit` | Credit facility in account currency; nullable/optional |
| `totalAmountDue` | Full amount due for the statement period, not the minimum required payment; nullable/optional |
| `gracePeriodEndDate` | End of the interest-free payment period; nullable/optional |

A credit card with 3,000 debt has `balance: -3000`; an overpayment is positive. If balance is -3,000 and limit is 10,000, domain available funds are 7,000. Use the current position that best reflects funds available to the user, including confirmed holds, rather than a booked balance that ignores those reservations. For a debit account with booked balance 1,000, a hold of 100, and available funds of 900, return `balance: 900`.

Verify whether the bank's available amount includes credit and holds. When that meaning is confirmed and the credit limit is known, derive the own-funds position as `balance = available - creditLimit`; do not put the whole credit facility into `balance` or subtract a hold twice. If balance and limit are known, `available` is optional. If only available is known and its own-funds component cannot be determined, do not invent balance or credit limit. Loan principal and contractual deposit fields retain their definitions below.

## Deposit and loan fields

| Field | Meaning |
| --- | --- |
| `startDate` | Opening/contract date |
| `startBalance` | Initial deposit or original loan principal, positive |
| `capitalization` | Deposit: interest capitalization; loan: annuity repayment |
| `percent` | Annual rate expressed as a percentage, nullable |
| `endDateOffsetInterval` | `day`, `month`, or `year` |
| `endDateOffset` | Number of those calendar units after `startDate` |
| `payoffInterval` | `month` or `null` |
| `payoffStep` | Number of payment intervals between repayments |

Loan balance is remaining debt with a negative sign. End date is computed from the start date and offset; do not approximate calendar months as a fixed number of days. Required non-null fields cannot be filled with guessed dates, principal, or repayment terms. Investigate missing data and the appropriate supported account representation.

## Account references

`AccountReferenceById` is `{ id }` and MUST resolve to an account in this scrape's `accounts` array.

`AccountReferenceByData` describes a side not identified by a fetched account: `{ type, instrument, company, syncIds }`. Use `type: 'cash'` for cash; use `null` when another account's type is unknown. `instrument` is required. `company` is a known `{ id }` or `null`; existing integrations generally use `null`. `syncIds` is known matching data or `null`, and may contain a masked card, IBAN, or partial card digits where the bank supplies them. Partial counterparty data is not sufficient for inventing a fetched account or proving its ownership.

External means outside the represented synchronization account set, not necessarily owned by another person. Internal-movement evidence, permitted external representations, and unknown external currency defaults follow [transfer rules](quality/transfers.md). A reference to a represented account never justifies inventing an internal movement.
