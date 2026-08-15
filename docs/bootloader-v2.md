# Bootloader V2

Bootloader runs a locally hosted plugin inside the real Zenmoney application and streams its diagnostics back to the development server.

## Usage

1. Build and install the `bootloader` plugin in Zenmoney.
2. Start the target plugin:

   ```sh
   yarn host example
   ```

3. Open `http://localhost:5050` to see the Bootloader UI.
4. Enter the development machine IP in the bootloader plugin settings and start a scrape.

The `serverIp` bootloader preference is required. Enter only the development machine IP address, for example `192.168.1.10`. Hostnames and URLs are rejected.

Every scrape creates a new session id. Sessions contain console and error events, network requests, accounts, transactions, plugin data state, checkpoints, and the final result. The selected session can be exported as a `.log` file from the web UI. Console and error events are mirrored to the browser DevTools console instead of being rendered on the page.

Port `5050` is reserved for Bootloader. `yarn host` stops a previous Bootloader V2 process found on that port, but refuses to stop any other service and exits with an error.

## bootloader_config.json

`yarn host` creates `src/plugins/<plugin>/bootloader_config.json` on first use and imports existing `zp_preferences.json` values when possible. The file is ignored by Git because it normally contains credentials.

```json
{
  "preferences": {
    "startDate": "2010-01-01T12:00:00.000Z"
  },
  "data": {
    "auth": {
      "token": "saved-token"
    }
  },
  "bootloader": {
    "captureConsole": true,
    "captureErrors": true,
    "overrideData": false,
    "network": {
      "enabled": true,
      "maxBodyBytes": 65536
    },
    "sessions": {
      "persist": true,
      "limit": 20
    }
  }
}
```

Network capture records raw URLs, headers, and bodies. They can contain credentials and tokens; do not expose the development server or exported logs to an untrusted party.

Persistent session files are stored under `.local/bootloader/<plugin>` and are ignored by Git.

The server reads `bootloader_config.json` again when each scrape starts, so preferences, data, and capture/session settings can be changed without restarting `yarn host`.

## Plugin data

Put optional persisted plugin data into the `data` field of `bootloader_config.json`. Set `bootloader.overrideData` to `true` to use it for the next scrape:

```json
{
  "data": {
    "auth": {
      "token": "saved-token"
    }
  },
  "bootloader": {
    "overrideData": true
  }
}
```

`overrideData` is `false` by default. In that mode the Bootloader client ignores the configured `data` and uses only the store already held by the Zenmoney application.

When the override is enabled, configured values take priority at every depth, while missing nested fields are filled from the client's native store. A plugin `setData` call replaces the override for that key, while `clearData` clears both layers. Applying the override itself does not call `clearData` or `saveData`.

The State section's **Copy** button copies the last state passed to `saveData`, or the current state when the plugin has not saved yet. Paste that JSON into the `data` field and enable `overrideData` to reuse authorization from a failed scrape.

## Plugin debug API

Use the safe common proxy from plugin code:

```ts
import { Debug } from '../../common/debug'

await Debug.checkpoint('parsed-accounts', accounts)
```

Outside Bootloader, `Debug.checkpoint()` is a resolved no-op and `Debug.isActive` is `false`, so plugin code does not need an environment check. The proxy also exposes `version`, `sessionId`, `plugin`, `server`, and `config`; these metadata properties are `undefined` outside Bootloader.

Under the hood, Bootloader still injects a read-only technical object into `global.bootloader`. `Debug.checkpoint(name, value)` forwards a named serializable snapshot to it. The Checkpoints section compares it with the most recent earlier session containing a checkpoint with the same name.

The State section observes `getData`, `setData`, `clearData`, and `saveData` and renders their changes as a git-style diff. As in the browser sandbox, it shows initial observed values, current values, and the state present when `saveData` was called. The real Zenmoney API cannot enumerate all stored keys, so initial state contains only keys read by the plugin during the session.

## Network capture

Bootloader wraps `global.fetch` after the hosted bundle is evaluated. This captures requests made through `src/common/network.js` and direct `global.fetch` calls. Response bodies are recorded when the plugin consumes them through `text()` or `arrayBuffer()`; an unconsumed streaming response has metadata but no captured body.
