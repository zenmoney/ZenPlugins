# Useful utilities

## Network
- `fetch`
  - `src/common/network.d.ts`
- `fetchJson`
  - `src/common/network.d.ts`
- `openWebViewAndInterceptRequest`
  - `src/common/network.d.ts`
- `WebSocket`
  - `src/common/protocols/webSocket.d.ts`

## Logging
- `console.log`
  - global scope

## Errors
- `assert`
  - global scope
- `console.assert`
  - global scope
  - without type assertion
- Various errors that can be interpreted by mobile app
  - `src/errors.d.ts`

## User input
- `Zenmoney.readLine`
  - `ZenMoney` global object (`src/types/index.d.ts`)

## Persistent storage
- `Zenmoney.setData/getData/saveData/clearData`
  - `ZenMoney` global object (`src/types/index.d.ts`)

## Stability
- `retry`
  - `src/common/retry.d.ts`
- `ZenMoney.isAccountSkipped`
  - `ZenMoney` global object (`src/types/index.d.ts`)

## Converter's stuff
- `adjustTransactions`
  - `src/common/transactionGroupHandler.d.ts`
- `getIntervalBetweenDates`
  - `src/common/momentDateUtils.d.ts`
- `createDateIntervals`
  - `src/common/dateUtils.d.ts`
