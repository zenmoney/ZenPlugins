import { Account, AccountType } from '../../../types/zenmoney'
import { Bindings, Cashback, PluginCashbacksPayload } from '../../../types/cashback'
import { CashbackSettings } from '../models'
import { baseExcludedMcc } from '../cashback-mappings'
import { partnerCashbackOffers } from '../cashback-partners'
import { describeCashbackLimits } from '../cashback-limits'

// Source: zenmoney/cashbacks, src/Freedom Bank-kz_15492/categories.
// Bundled mappings are deliberately offline; they are not refreshed during scrape.
export function convertCashbacks (accounts: Account[], settings: CashbackSettings): PluginCashbacksPayload | undefined {
  const ids = Array.from(new Set(accounts.filter(account => account.type === AccountType.ccard).map(account => account.id)))
  if (!settings.enabled || ids.length === 0) return undefined
  const bindings = ids.map(externalId => ({ type: 'account' as const, externalId })) as Bindings
  const year = Number(settings.month.slice(0, 4))
  const month = Number(settings.month.slice(5))
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const period = { type: 'month' as const, from: `${settings.month}-01`, to: `${settings.month}-${lastDay}` }
  const description = `${describeCashbackLimits(settings.level, 'general')} Дополнительный кэшбек за оплату через Apple Pay / Google Pay / Samsung Pay: +${settings.applePayPercent}%. За оплату по QR через Freedom SuperApp в POS-терминалах Freedom: +${settings.qrPercent}%.`
  const cashbacks: Cashback[] = [{
    content: { type: 'structured', title: `Базовый кешбэк — ${settings.level}`, description },
    reward: { type: 'percent', value: settings.basePercent, unit: 'PERCENT' },
    period,
    status: 'active',
    bindings,
    scope: { type: 'all_purchases', exclude: [{ type: 'mcc', mcc: baseExcludedMcc as [number, ...number[]] }] }
  }]
  for (const offer of partnerCashbackOffers) {
    cashbacks.push({
      content: {
        type: 'structured',
        title: offer.title,
        description: `${offer.merchant === undefined ? '' : offer.purchaseScope + ' '}${offer.conditions} ${describeCashbackLimits(settings.level, offer.limitKind)} Условия и обновления: ${offer.sourceUrl}`
      },
      ...(offer.imageUrl === undefined ? {} : { imageUrl: offer.imageUrl }),
      reward: { type: 'raw', text: offer.rewardText },
      period,
      status: 'active',
      bindings,
      scope: offer.merchant === undefined
        ? { type: 'raw', text: offer.purchaseScope }
        : {
            type: 'merchant',
            merchant: { title: offer.merchant.title },
            exclude: [{ type: 'text', text: offer.merchant.excludedPurchases }]
          }
    })
  }
  return { schemaVersion: 1, cashbacks }
}
