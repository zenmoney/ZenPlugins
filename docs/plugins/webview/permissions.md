# WebView permissions

[`installPermissions` and `geoPermission`](../../../src/common/webview/permissions/index.ts) install page-level overrides on the new WebView API on Android and iOS. Like Playwright's [permissions and geolocation](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-geolocation), permission state and API values are separate: a `granted` query does not create a media stream or grant an OS permission.

- Install before `goto`. Installation also applies to the current document. Specify exact HTTP(S) origins; overrides apply only to the top document, leaving frames and workers native.
- `force` immediately uses configured states. `fallback` first tries the native operation and calls the plugin's `fallbackWhen` on unavailable APIs, denied state or errors. `prompt` alone does not trigger fallback, and missing `permissions.query` does not establish that another API is broken.
- Simultaneous decisions for one permission share a pending callback. An accepted decision activates that permission for the current document; rejected/failed decisions may be retried. Navigation and BFCache restoration retry the native path. Native revocation is reflected before activation, but does not revoke an active override.
- Configured queries return a readonly `name`/`state` facade with `onchange` and EventTarget events. Only basic `{ name }` descriptors are overridden. Additional descriptor fields, including camera `panTiltZoom` and MIDI `sysex`, are passed through unchanged.
- `geoPermission` requires a plugin callback and supports `granted` or `denied`; `prompt` is valid only without this adapter. Its callback runs in the plugin, receiving origin, operation and normalized options. No coordinates are supplied by the utility. `null`, invalid values and provider errors produce `POSITION_UNAVAILABLE`. Omitted accuracy becomes synthetic `0`; this is not a measurement of device accuracy.
- Synthetic geolocation respects secure contexts, explicit Permissions Policy restrictions, visibility, `maximumAge` caching and acquisition timeout. Defaults are `enableHighAccuracy: false`, `maximumAge: 0`, `timeout: Infinity`. Watch polls once per second after completion without overlapping calls, delivers the first value and coordinate changes, and pauses while hidden. Pending provider work cannot be interrupted, but late results after timeout/cancellation are discarded.
- Retain and await the returned `dispose` in `finally`. It removes registrations, restores wrappers it still owns, and cancels pending delivery/watches. Closing the WebView starts cleanup automatically. Duplicate installation and inconsistent adapter configuration reject; partial installation rolls back.

Callbacks are checked against the current URL/document before and after execution, but `exposeFunction` does not provide trusted caller-frame metadata. The supplied origin is request context, not an authorization proof; do not use this utility as an origin-isolated bridge for privileged native facilities. Coordinates are not logged automatically.

Illustrative plugin configuration (the position source belongs to the plugin):

```ts
import { installPermissions, geoPermission } from '../../common/webview/permissions'

const permissions = await installPermissions(webView, {
  origins: ['https://example.test'],
  mode: 'fallback',
  permissions: { geolocation: 'granted' },
  fallbackWhen: failure => failure.permission === 'geolocation' && failure.reason === 'denied',
  adapters: [geoPermission({ getPosition: request => getPluginPosition(request) })]
})
try {
  await webView.goto('https://example.test')
  // Complete the plugin's interaction here.
} finally {
  await permissions.dispose()
}
```
