import { AccountType } from '../../../../types/zenmoney'
import { assertCashbackPayload } from '../../../../common/cashback/validate'

// User-entered settings are domain input, not reconstructed bank API data.
// A small catalog models MCC set operations; production data comes from zenmoney/cashbacks.
// Reduced domain catalog: one ranged and one conditional partner offer.
jest.mock('../../cashback-partners', () => ({
  partnerCashbackOffers: [
    { limitKind: 'general', title: 'Продукты и аптеки', rewardText: '5–20% по уровню лояльности; с Friends дополнительно +5%', purchaseScope: 'Заказы продуктов и аптечных товаров через Freedom SuperApp.', conditions: 'Транзакционный кэшбек не начисляется.', sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/produkty-1' },
    { imageUrl: 'https://loyalty.bankffin.kz/images/partners/card-icons/freedom-icon.svg', limitKind: 'tyres', title: 'Freedom Drive — шины', merchant: { title: 'Freedom Drive', excludedPurchases: 'Покупки вне раздела «Шины» Freedom SuperApp.' }, rewardText: 'До 15%', purchaseScope: 'Шины Freedom Drive через раздел «Шины» Freedom SuperApp.', conditions: 'Базовый кэшбек не добавляется.', sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999' }
  ]
}))
jest.mock('../../cashback-mappings', () => ({ baseExcludedMcc: [4814, 6011] }))
const { convertCashbacks } = jest.requireActual<typeof import('../../converters/cashbacks')>('../../converters/cashbacks')
describe('[model] cashback conversion', () => {
  it('binds cashback only to distinct card accounts and preserves leap-month bounds', () => {
    const actual = convertCashbacks([
      { id: 'card-1', type: AccountType.ccard, title: 'Card', instrument: 'KZT', syncIds: ['card-1'] },
      { id: 'card-1', type: AccountType.ccard, title: 'Card', instrument: 'KZT', syncIds: ['card-1'] },
      { id: 'other', type: AccountType.checking, title: 'Other', instrument: 'KZT', syncIds: ['other'] },
      { id: 'card-2', type: AccountType.ccard, title: 'Card 2', instrument: 'USD', syncIds: ['card-2'] }
    ], { version: 1, month: '2028-02', enabled: true, level: 'Gold', basePercent: '3', applePayPercent: '1.5', qrPercent: '2' })
    assertCashbackPayload(actual)
    expect(actual).toEqual({
      schemaVersion: 1,
      cashbacks: [{
        content: { type: 'structured', title: 'Базовый кешбэк — Gold', description: 'Лимит кэшбека за покупку — 20 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸. Дополнительный кэшбек за оплату через Apple Pay / Google Pay / Samsung Pay: +1.5%. За оплату по QR через Freedom SuperApp в POS-терминалах Freedom: +2%.' },
        reward: { type: 'percent', value: '3', unit: 'PERCENT' },
        period: { type: 'month', from: '2028-02-01', to: '2028-02-29' },
        status: 'active',
        bindings: [{ type: 'account', externalId: 'card-1' }, { type: 'account', externalId: 'card-2' }],
        scope: { type: 'all_purchases', exclude: [{ type: 'mcc', mcc: [4814, 6011] }] }

      }, {
        content: { type: 'structured', title: 'Продукты и аптеки', description: 'Транзакционный кэшбек не начисляется. Лимит кэшбека за покупку — 20 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸. Условия и обновления: https://support.bankffin.kz/ru/fiz-litsam/produkty-1' },
        reward: { type: 'raw', text: '5–20% по уровню лояльности; с Friends дополнительно +5%' },
        period: { type: 'month', from: '2028-02-01', to: '2028-02-29' },
        status: 'active',
        bindings: [{ type: 'account', externalId: 'card-1' }, { type: 'account', externalId: 'card-2' }],
        scope: { type: 'raw', text: 'Заказы продуктов и аптечных товаров через Freedom SuperApp.' }
      }, {
        content: { type: 'structured', title: 'Freedom Drive — шины', description: 'Шины Freedom Drive через раздел «Шины» Freedom SuperApp. Базовый кэшбек не добавляется. Лимит кэшбека за покупку шин — 50 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸. Условия и обновления: https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999' },
        imageUrl: 'https://loyalty.bankffin.kz/images/partners/card-icons/freedom-icon.svg',
        reward: { type: 'raw', text: 'До 15%' },
        period: { type: 'month', from: '2028-02-01', to: '2028-02-29' },
        status: 'active',
        bindings: [{ type: 'account', externalId: 'card-1' }, { type: 'account', externalId: 'card-2' }],
        scope: { type: 'merchant', merchant: { title: 'Freedom Drive' }, exclude: [{ type: 'text', text: 'Покупки вне раздела «Шины» Freedom SuperApp.' }] }
      }]
    })
  })
})
