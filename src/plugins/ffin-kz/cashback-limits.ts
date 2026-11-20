// Official limits checked 2026-11-20. Refresh all four levels together.
// General limits and partner exceptions:
// https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999
// Travel limits and the independent tours/hotels monthly pool:
// https://support.bankffin.kz/ru/fiz-litsam/puteshestviya-i-tury-freedom-travel?questionId=681
// Electronics monthly caps and the rolling smartphone count restriction:
// https://support.bankffin.kz/ru/fiz-litsam/elektronika-freedom-mobile
// General monthly caps are shared across eligible purchases, not per-partner budgets.
export type CashbackLimitKind = 'general' | 'travel' | 'tyres' | 'electronics'

const limitsByLevel = {
  Standard: { purchase: 5000, monthly: 50000, travelPurchase: 10000, electronicsMonthly: 150000 },
  Silver: { purchase: 7000, monthly: 100000, travelPurchase: 15000, electronicsMonthly: 200000 },
  Gold: { purchase: 20000, monthly: 150000, travelPurchase: 20000, electronicsMonthly: 250000 },
  Platinum: { purchase: 30000, monthly: 200000, travelPurchase: 30000, electronicsMonthly: 300000 }
}

function money (amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`
}

export function describeCashbackLimits (level: string, kind: CashbackLimitKind): string {
  const normalized = level.trim().toLowerCase()
  const name = (Object.keys(limitsByLevel) as Array<keyof typeof limitsByLevel>)
    .find(key => key.toLowerCase() === normalized || (key === 'Standard' && normalized === 'standart'))
  if (name == null) throw new Error('Unsupported loyalty level for cashback limits')
  const limits = limitsByLevel[name]
  const monthly = `Общий месячный лимит уровня ${name} — ${money(limits.monthly)}.`
  switch (kind) {
    case 'general':
      return `Лимит кэшбека за покупку — ${money(limits.purchase)}. ${monthly}`
    case 'tyres':
      return `Лимит кэшбека за покупку шин — 50 000 ₸. ${monthly}`
    case 'travel':
      return `Авиа- и ж/д билеты: лимит кэшбека за покупку — ${money(limits.travelPurchase)}. ${monthly} Туры и отели: отдельный общий лимит кэшбека — 100 000 ₸ в месяц.`
    case 'electronics':
      return `Месячный лимит партнёрского кэшбека — ${money(limits.electronicsMonthly)}. Кэшбек начисляется не более чем за 2 смартфона за последние 30 дней.`
  }
}
