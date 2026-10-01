# Plugin metrics and interpretation

Read when prioritizing issues or reporting quality. Define the measured population before naming a metric. The local [database](local-database.md) contains different sources for submitted reports, connection events, and stored transactions; their denominators are not interchangeable.

## Connection outcomes

```sql
SELECT plugin, "count", success_rate
FROM plugin_connection_stats('1 month'::interval, true);
```

The inspected function reads `analytics_event` with `type = 'bank.connect'` and `date >= now() - grouping_interval`. It keeps the latest event in the interval for each plugin/user pair. An event with `data.result = 'connected'` is successful; other selected results are unsuccessful.

| Output/argument | Exact interpretation |
| --- | --- |
| `plugin` | `data.bank` from the event |
| `count` | Number of selected latest plugin/user outcomes, not number of logs, attempts, or all active connections |
| `success_rate` | Successful selected outcomes divided by selected outcomes, in percent, rounded to two decimals |
| `only_registered = true` | Restrict events to users whose `user.created` is later than the interval start |
| `only_registered = false` | Include users regardless of registration date, still requiring an event inside the interval |

This is a connection outcome metric, not the success rate of every background scrape. Latest-event selection means several retries by one user contribute one outcome. Users without a connection event in the period contribute nothing. A newcomer is a newly registered Zenmoney user under this filter, not necessarily a user's first attempt at this particular bank.

For prioritization, normally look at newcomer counts first as a signal of current demand, then low success rate as another urgency signal. Compare the same interval/cohort, report the count with the percentage, and inspect representative logs before assigning a cause. Existing users may be reconnecting old integrations; use the all-user view when that is the affected population.

## Submitted reports

`mail_inbound` measures received messages. Group by plugin/build/problem metadata to identify clusters, then distinguish message count and distinct affected users. One user can send several logs; successful users may send none. Report-submission volume cannot establish a failure rate without a separate known attempt denominator.

Do not classify all records as crashes based on presence in this table. Read `user_message`, metadata, and body; expected input errors, incomplete data, and conversion quality issues require different diagnoses.

## Converter quality

Use `plugin_transaction` to find representative merchants/comments and operation classes. Specify the selection interval, plugin, transaction classes, count of unique transactions/users, and whether the merchant came from original or fallback data where that can be established. The view has no build field and does not expose all raw movement data.

A percentage of nonempty merchants measures field presence, not correctness. Verify against raw evidence and full expected converter output. Track coverage of purchases, income, internal/external transfers, cash, foreign currency, fees, holds, and refunds when supported. Mark absent classes as unsampled rather than passing them.

For a fix, compare before/after conversion on the same selected fixtures and report changed rule IDs. An apparent improvement caused only by a different sample, later server enrichment, or more aggressive dropping is not evidence of converter quality.

## Runtime and performance

Request `ms` in network logs measures helper-side elapsed time for that request and response read. Bootloader checkpoints and sessions help compare stages locally. Neither produces a repository-wide production latency distribution by itself. If collecting a new metric, document the event producer, units, boundaries, missing-data behavior, aggregation, and cohort before interpreting it.

`ZenMoney.logEvent` is a runtime facility; its existence alone does not establish that an arbitrary event is stored in the local schema or has a stable analytics contract.
