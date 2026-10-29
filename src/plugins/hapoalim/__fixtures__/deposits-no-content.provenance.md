# Empty deposit inventory

Source: Android Zenmoney log screenshot `Screenshot_20261029_022954_Zenmoney.jpg`,
2026-10-29. The installed plugin revision and application build are not recorded
in the screenshot. The owner confirmed that both deposits had been paid out to
their checking accounts.

The logged deposit-list GET returned HTTP 204 and `body: undefined`, followed by
`unexpected deposits response`. The response summary exposes the content type;
other raw headers are unavailable. The fixture preserves the logged URL and its
existing masks. The undefined body is represented by an absent JSON property,
not an invented null body.

This response establishes an empty inventory, not the identity, closing balance,
or repayment movement of an individual deposit. Synthetic multi-account tests
using this response are orchestration models, not additional bank captures.
