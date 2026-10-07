import { ui } from './ui'
import type { PluginUi, VisibilityState, VisibilityChangeEvent, Theme } from './ui'

declare function expectType<T> (value: T): void

// Compile-only checks for the public UI object and provider contract.
export function checkUiTypes (): void {
  expectType<PluginUi>(ui)
  expectType<VisibilityState>(ui.visibilityState)
  expectType<Theme>(ui.theme)
  const listener = (): void => {}
  expectType<PluginUi>(ui.on('visibilitychange', listener).once('visibilitychange', listener).off('visibilitychange', listener))
  // @ts-expect-error Shared subscriptions use on/once/off.
  ui.addEventListener('visibilitychange', listener)
  // @ts-expect-error Shared subscriptions use on/once/off.
  ui.removeEventListener('visibilitychange', listener)
  expectType<number>(ui.listenerCount('visibilitychange', listener))
  ui.on('visibilitychange', event => {
    expectType<VisibilityChangeEvent>(event)
    expectType<VisibilityState>(event.oldValue)
    expectType<VisibilityState>(event.newValue)
    // @ts-expect-error UI visibility events do not expose native application state.
    void event.applicationState
    // @ts-expect-error Visibility event values are readonly.
    event.newValue = 'hidden'
    // @ts-expect-error UI events use visibility values, not native lifecycle values.
    expectType<'created' | 'started' | 'resumed'>(event.oldValue)
  })
  expectType<Promise<void>>(ui.alert('Model message'))
  expectType<Promise<string | null>>(ui.readLine('Model input', {
    inputType: 'numberPassword', image: new Uint8Array([1])
  }))
  expectType<Promise<Blob[]>>(ui.pickDocuments({
    mimeTypes: ['application/pdf'] as const, allowMultipleSelection: true
  }))
  expectType<Promise<Blob[]>>(ui.pickDocuments())
  expectType<Promise<Blob | null>>(ui.takePicture('jpeg'))
  // @ts-expect-error Cancellation and timeout may produce null.
  expectType<Promise<string>>(ui.readLine('Model input'))
  // @ts-expect-error Document options form one object in the proposed public API.
  void ui.pickDocuments(['application/pdf'], true)
  // @ts-expect-error The inspected host does not consume a plugin-defined timeout.
  void ui.readLine('Model input', { time: 1000 })
  // @ts-expect-error The image must contain bytes, not a remote URL.
  void ui.readLine('Model input', { image: 'https://example.test/image' })
  // @ts-expect-error The camera accepts jpeg and png format names, not MIME types.
  void ui.takePicture('image/jpeg')
  // @ts-expect-error The host alert has no configurable buttons.
  void ui.alert('Model message', { buttonTitle: 'Continue' })
  // @ts-expect-error Only the host controls visibility.
  ui.visibilityState = 'visible'
  // @ts-expect-error UI consumers cannot emit host events.
  ui.emit('visibilitychange')
  // @ts-expect-error The theme is controlled by the host.
  ui.theme = 'dark'
  // @ts-expect-error Application state belongs to environment.
  void ui.applicationState
  // @ts-expect-error Raw application lifecycle subscriptions belong to environment.
  ui.on('applicationState', listener)
  // @ts-expect-error The host does not expose theme change events.
  ui.on('themechange', listener)
  // @ts-expect-error Unrelated host events are not UI events.
  ui.on('unrelated', listener)
  // @ts-expect-error Visibility changes use a typed payload, not a DOM Event.
  ui.on('visibilitychange', (event: Event) => {})
}

// Legacy signatures keep positional arguments and accepted options during migration.
export function checkLegacyUiTypes (format: string): void {
  expectType<Promise<string | null>>(ZenMoney.readLine('Model input', { time: 1000, inputType: 'numberPassword' }))
  expectType<Promise<Blob[]>>(ZenMoney.pickDocuments(['application/pdf'], true))
  expectType<Promise<Blob | null>>(ZenMoney.takePicture(format))
}
