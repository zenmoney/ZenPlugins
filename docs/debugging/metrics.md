# Plugin metrics and interpretation

Read when prioritizing issues or reporting quality. Define the measured population before naming a metric. The local [database](local-database.md) contains different sources for submitted reports, connection events, and stored transactions; their denominators are not interchangeable.

## Connection outcomes

`public.plugin_connection_stats` has two overloads (definitions inspected on 2026-10-22):

| Arguments | Selected event window |
| --- | --- |
| `grouping_interval interval, only_registered boolean` | From `now() - grouping_interval`, with no upper bound |
| `date_from timestamptz, only_registered boolean, date_to timestamptz DEFAULT NULL` | `[date_from, date_to)`; `NULL` means no upper bound |

Always cast an interval argument explicitly: an untyped string can collide with the date overload. For a rolling period:

```sql
SELECT plugin, "count", success_rate
FROM public.plugin_connection_stats('1 month'::interval, true);
```

For exact dates, specify the time zone and exclusive end explicitly:

```sql
SELECT plugin, "count", success_rate
FROM public.plugin_connection_stats(
  '2026-09-01 00:00:00+03'::timestamptz,
  true,
  '2026-10-01 00:00:00+03'::timestamptz
);
```

Both overloads return `TABLE(plugin text, count bigint, success_rate double precision)`. The interval overload delegates to the date overload. It reads `analytics_event` with `type = 'bank.connect'` and keeps the latest event in the selected window for each plugin/user pair. An event with `data.result = 'connected'` is successful; other selected results are unsuccessful.

| Output/argument | Exact interpretation |
| --- | --- |
| `plugin` | `data.bank` from the event |
| `count` | Number of selected latest plugin/user outcomes, not number of logs, attempts, or all active connections |
| `success_rate` | Successful selected outcomes divided by selected outcomes, in percent, rounded to two decimals |
| `only_registered = true` | Restrict to users with `user.created > date_from` and, when provided, `user.created < date_to`; registration uses a strict lower bound, unlike events |
| `only_registered = false` | Include users regardless of registration date, still requiring an event inside the interval |

This is a connection outcome metric, not the success rate of every background scrape. Latest-event selection means several retries by one user contribute one outcome. Users without a connection event in the period contribute nothing. A newcomer is a newly registered Zenmoney user under this filter, not necessarily a user's first attempt at this particular bank.

For prioritization, normally look at newcomer counts first as a signal of current demand, then low success rate as another urgency signal. Compare the same interval/cohort, report the count with the percentage, and inspect representative logs before assigning a cause. Existing users may be reconnecting old integrations; use the all-user view when that is the affected population.

## Submitted reports

`mail_inbound` measures received messages. Group by plugin/build/problem metadata to identify clusters, then distinguish message count and distinct affected users. One user can send several logs; successful users may send none. Report-submission volume cannot establish a failure rate without a separate known attempt denominator.

Do not classify all records as crashes based on presence in this table. Read `user_message`, metadata, and body; expected input errors, incomplete data, and conversion quality issues require different diagnoses.

## Converter quality

Use `plugin_transaction` to find representative merchants/comments and operation classes. Specify the selection interval, plugin, transaction classes, count of unique transactions/users, and whether the merchant came from original or fallback data where that can be established. The view has no build field and does not expose all raw movement data.

A percentage of nonempty merchants measures field presence, not correctness. Validate it through [scrape quality assessment](../plugins/scrape/quality/README.md#development-and-review-procedure).

For a fix, compare before/after conversion on the same selected fixtures and report changed rule IDs. An apparent improvement caused only by a different sample, later server enrichment, or more aggressive dropping is not evidence of converter quality.

## Runtime and performance

Request `ms` in network logs measures helper-side elapsed time for that request and response read. Bootloader checkpoints and sessions help compare stages locally. Neither produces a repository-wide production latency distribution by itself. If collecting a new metric, document the event producer, units, boundaries, missing-data behavior, aggregation, and cohort before interpreting it.

`ZenMoney.logEvent` is a runtime facility; its existence alone does not establish that an arbitrary event is stored in the local schema or has a stable analytics contract.
