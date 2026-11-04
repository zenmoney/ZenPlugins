import type { Cashback, PluginCashbacksPayload } from '../../types/cashback'
import { assertCashbackPayload } from './validate'

// Synthetic domain values exercise the public payload contract, not bank parsing.
const cashback: Cashback = {
  externalId: null,
  content: { type: 'structured', title: 'Groceries', description: null },
  imageUrl: 'https://example.com/cashback.png',
  reward: { type: 'percent', value: '5.25', unit: 'PERCENT' },
  period: { type: 'month', from: '2026-10-01', to: '2026-10-31' },
  status: 'active',
  bindings: [{ type: 'account', externalId: 'account-1' }],
  scope: {
    type: 'mcc',
    mcc: [5411],
    exclude: [
      { type: 'merchant', merchant: { title: 'Excluded merchant' } },
      { type: 'text', text: 'Online purchases' }
    ]
  }
}

function payload (override: Partial<Cashback> = {}): PluginCashbacksPayload {
  return {
    schemaVersion: 1,
    scrapedAt: '2026-10-03T12:00:00Z',
    cashbacks: [{ ...cashback, ...override }]
  }
}

describe('[model] cashback payload validation', () => {
  test('accepts and narrows a snapshot without changing its contents', () => {
    const value: unknown = payload()
    assertCashbackPayload(value)
    expect(value).toEqual(payload())
    expect(value.cashbacks[0].reward).toEqual({ type: 'percent', value: '5.25', unit: 'PERCENT' })
  })

  test('accepts an explicit empty snapshot without adding optional metadata', () => {
    const value: unknown = { cashbacks: [] }
    assertCashbackPayload(value)
    expect(value).toEqual({ cashbacks: [] })
  })

  test('preserves raw reward and scope text instead of inventing parsed values', () => {
    const value: PluginCashbacksPayload = {
      cashbacks: [{
        content: { type: 'structured', title: 'Offer title and conditions' },
        reward: { type: 'raw', text: 'Up to 7%' },
        period: { type: 'month', from: '2026-10-01', to: '2026-10-31' },
        status: null,
        bindings: [{ type: 'account', externalId: 'account-1' }],
        scope: { type: 'raw', text: 'Fuel and car services' }
      }]
    }
    const before = JSON.stringify(value)
    assertCashbackPayload(value)
    expect(JSON.stringify(value)).toBe(before)
  })

  const validVariants: Array<[string, Partial<Cashback>]> = [
    ['all purchases with MCC exclusions', { scope: { type: 'all_purchases', exclude: [{ type: 'mcc', mcc: [5541] }] }, bindings: [{ type: 'all' }] }],
    ['merchant and account binding', { scope: { type: 'merchant', merchant: { title: 'Merchant', externalId: 'merchant-1' } }, bindings: [{ type: 'account', externalId: 'account-1' }] }],
    ['bank category', { scope: { type: 'category', category: { title: 'Transport' }, exclude: [] } }],
    ['permanent period without dates', { period: { type: 'permanent' } }],
    ['permanent period with explicit null dates', { period: { type: 'permanent', from: null, to: null } }],
    ['quarter period', { period: { type: 'quarter', from: '2026-10-01', to: '2026-12-31' }, status: 'future' }],
    ['year period', { period: { type: 'year', from: '2026-01-01', to: '2026-12-31' }, status: 'selected' }],
    ['custom period', { period: { type: 'custom', from: '2026-02-01', to: '2026-02-28' } }],
    ['available status', { status: 'available' }],
    ['empty optional external id', { externalId: '' }],
    ['unrestricted decimal percent', { reward: { type: 'percent', value: '101.0001', unit: 'PERCENT' } }]
  ]

  test.each(validVariants)('accepts %s without rewriting data', (_name, override) => {
    const value = payload(override)
    const before = JSON.stringify(value)
    assertCashbackPayload(value)
    expect(JSON.stringify(value)).toBe(before)
  })

  test.each([
    ['absent payload', undefined],
    ['null payload', null],
    ['array instead of snapshot', []],
    ['missing cashbacks', {}],
    ['null cashbacks', { cashbacks: null }],
    ['null item', { cashbacks: [null] }],
    ['unknown version', { cashbacks: [], schemaVersion: 2 }],
    ['invalid timestamp', { cashbacks: [], scrapedAt: '2026-10-03' }],
    ['HTTP envelope field', { cashbacks: [], companyId: '123' }]
  ])('rejects %s instead of treating it as an empty snapshot', (_name, value) => {
    expect(() => assertCashbackPayload(value)).toThrow(Error)
  })

  const invalidVariants: Array<[string, Record<string, unknown>, RegExp]> = [
    ['missing scope', { scope: undefined }, /scope/],
    ['null scope', { scope: null }, /\/scope/],
    ['null bindings', { bindings: null }, /\/bindings/],
    ['empty bindings', { bindings: [] }, /\/bindings/],
    ['raw bindings', { bindings: [{ type: 'raw', text: 'Selected card' }] }, /\/bindings\/0\/type/],
    ['missing status', { status: undefined }, /status/],
    ['expired status', { status: 'expired' }, /\/status/],
    ['empty account binding id', { bindings: [{ type: 'account', externalId: '' }] }, /\/bindings\/0\/externalId/],
    ['card binding instead of account binding', { bindings: [{ type: 'card', externalId: 'card-1' }] }, /\/bindings\/0\/type/],
    ['numeric percent', { reward: { type: 'percent', value: 5, unit: 'PERCENT' } }, /\/reward\/value/],
    ['comma decimal', { reward: { type: 'percent', value: '5,25', unit: 'PERCENT' } }, /\/reward\/value/],
    ['unknown reward kind', { reward: { type: 'points', value: '5' } }, /\/reward/],
    ['raw period', { period: { type: 'raw', text: 'Until the end of the month' } }, /\/period\/type/],
    ['impossible date', { period: { type: 'month', from: '2026-02-01', to: '2026-02-30' } }, /\/period\/to/],
    ['dated permanent period', { period: { type: 'permanent', from: '2026-10-01' } }, /\/period\/from/],
    ['fractional MCC', { scope: { type: 'mcc', mcc: [5411.5] } }, /\/scope\/mcc\/0/],
    ['out of range MCC', { scope: { type: 'mcc', mcc: [10000] } }, /\/scope\/mcc\/0/],
    ['empty MCC list', { scope: { type: 'mcc', mcc: [] } }, /\/scope\/mcc/],
    ['MCC exclusion inside MCC scope', { scope: { type: 'mcc', mcc: [5411], exclude: [{ type: 'mcc', mcc: [5541] }] } }, /\/scope\/exclude/],
    ['null exclusions', { scope: { type: 'all_purchases', exclude: null } }, /\/scope\/exclude/],
    ['raw content', { content: { type: 'raw', text: 'Offer title and conditions' } }, /\/content\/type/],
    ['empty structured title', { content: { type: 'structured', title: '' } }, /\/content\/title/],
    ['extra raw reward field', { reward: { type: 'raw', text: '5%', value: '5' } }, /\/reward/],
    ['invalid image URI', { imageUrl: 'not a URI' }, /\/imageUrl/],
    ['unknown item field', { typo: true }, /additional properties/]
  ]

  test.each(invalidVariants)('rejects %s without repairing it', (_name, override, errorPath) => {
    const value = { cashbacks: [{ ...cashback, ...override }] }
    const before = JSON.stringify(value)
    expect(() => assertCashbackPayload(value)).toThrow(errorPath)
    expect(JSON.stringify(value)).toBe(before)
  })

  test('reports the failing path and rule without including source values', () => {
    const value = { cashbacks: [{ ...cashback, reward: { type: 'percent', value: 'PRIVATE_BANK_TEXT', unit: 'PERCENT' } }] }
    expect(() => assertCashbackPayload(value)).toThrow(/payload\/cashbacks\/0\/reward\/value must match pattern/)
    expect(() => assertCashbackPayload(value)).not.toThrow(/PRIVATE_BANK_TEXT/)
  })
})
