# Local logs database

Read for SQL-based triage and quality analysis. The optional local PostgreSQL database is named `logs`; it is not provisioned by the plugin build. Use the configured local connection, not a production endpoint. The schema described here was inspected on 2026-10-01 without reading customer records; check it again when a query stops matching the local installation.

```sh
psql -X -d logs
```

Run investigations in a read-only transaction (`BEGIN READ ONLY`, then `ROLLBACK` when done). Do not put connection credentials, raw logs, or database exports in the repository.

## Objects used by plugin investigations

| Object | Kind | Role |
| --- | --- | --- |
| `mail_inbound` | Table | Submitted logs, plugin/build, user message, and extracted problem metadata |
| `plugin_transaction` | View | Plugin-origin transaction sample with merchant/comment and extracted plugin ID |
| `plugin_connection_stats(interval, boolean)` | Function | Connection outcome aggregates; see [metrics](metrics.md) |
| `analytics_event` | Table | Source of `bank.connect` events used by the function |
| `user` | Table | Registration timestamp used for the newcomer filter |
| `transaction_data` | Table | Base transaction records behind the view |
| `suggest_log` | Table | Original merchant data used by the view when available |
| `merchant_venue` | Table | Fallback merchant interpretation used by the view |
| `connection` | Table | Connection metadata, state, scheduling, and sync timestamps |
| `plugin_user_count` | Table | Dated user-count fields; definitions/population process must be verified before use |
| `log` | Table | Contains table/object/operation records; it is not the submitted sync-log body store |

Many additional application tables exist in this database. Their presence does not mean the investigation role can select from them or that they are current/complete replicas. In the inspected role, `information_schema.tables` exposed `mail_inbound` and `plugin_transaction`; the PostgreSQL catalog listed additional objects. The stats function is `SECURITY DEFINER`, which explains why its aggregates may be available without direct access to its source tables. Do not work around missing permissions by changing role or grants.

## mail_inbound

| Columns | Meaning |
| --- | --- |
| `id`, `created` | Record identifier and received timestamp (`timestamptz`) |
| `plugin`, `plugin_build`, `company` | Extracted integration identifiers |
| `user`, `user_message` | User identifier and supplied context |
| `body` | Sync log text |
| `metadata` | Extracted generalized problem description/metadata (`jsonb`); inspect its actual shape before querying keys |
| `sender`, `subject`, `front_message_id`, `front_conversation_id` | Message provenance; may contain personal data |
| `metadata_locked_until`, `status` | Processing metadata; do not infer enum meanings without the producer's contract |

Example query, using psql substitution for an explicitly selected plugin:

```sql
\set plugin 'example'
BEGIN READ ONLY;
SELECT id, created, plugin, plugin_build, "user", user_message, metadata, body
FROM mail_inbound
WHERE plugin = :'plugin'
ORDER BY created DESC
LIMIT 50;
ROLLBACK;
```

The limit is a discovery starting point, not a complete review sample. Expand it and the interval until the relevant builds/users/operation classes are covered. Use metadata to group similar reports, then read the underlying bodies. Message count is not unique-user count or synchronization count.

## plugin_transaction

Columns are `id`, `user`, `date`, `transaction_type`, `merchant` (JSONB), `comment`, and `plugin`. The view selects plugin-origin rows from `transaction_data`; it does not represent raw output from each plugin invocation and has no plugin-build column.

The view classifies different income/outcome accounts as a transfer, otherwise a positive stored outcome as expense, otherwise income. It prefers original merchant data from `suggest_log` and can fall back to interpreted merchant/payee data. Comment and plugin identity are derived from stored transaction fields. Therefore a nonempty merchant is not necessarily proof that the plugin itself parsed it correctly.

`date` is a timestamp without time zone copied from `transaction_data.created`. Confirm the application's meaning for that field; do not assume the session's time zone or reinterpret it as a log-arrival timestamp. Joins may affect cardinality; inspect duplicate transaction IDs before treating view rows as a unique-transaction denominator.

```sql
\set plugin 'example'
BEGIN READ ONLY;
SELECT id, "user", date, transaction_type, merchant, comment
FROM plugin_transaction
WHERE plugin = :'plugin'
ORDER BY date DESC
LIMIT 50;
ROLLBACK;
```

Use the view to select examples for investigation. Verify converter behavior against raw bank data and plugin tests. It is not a complete source for amounts, fees, pending states, or the population of all sync attempts.

## Discover the complete schema

This query lists tables, views, materialized views, partitioned tables, and foreign tables, including catalog-visible objects for which direct SELECT may be unavailable:

```sql
SELECT n.nspname AS schema, c.relname AS name,
       CASE c.relkind
         WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table'
         WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view'
         WHEN 'f' THEN 'foreign table'
       END AS kind,
       has_table_privilege(c.oid, 'SELECT') AS can_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY 1, 2;
```

Inspect column types with `\d public.mail_inbound` / `\d public.plugin_transaction`. Inspect behavior with `pg_get_viewdef('public.plugin_transaction'::regclass, true)` and `pg_get_functiondef` for the exact stats function signature. Keep results local unless publishing a deliberately selected schema description.
