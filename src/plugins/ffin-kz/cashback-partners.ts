import { CashbackLimitKind } from './cashback-limits'

// Official public offers, checked 2026-11-20. This is an offline catalog.
// Refresh from the bank's “Как заработать кешбэк больше базового?” section:
// https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999
// Check each service FAQ and the current loyalty rules before changing rates:
// https://bankffin.kz/ru/documents
// Keep ranges and SuperApp restrictions; do not infer level rates or merchant MCCs.
// Only bank-confirmed brands are structured; the purchase channel remains a text exclusion.
// Omit externalId: the public sources expose no bank offer identifiers.
// The Travel FAQ currently contains conflicting rate explanations, so retain a range.
// Test shape validation is separate from verification of the bank's current terms.
export interface PartnerCashbackOffer {
  title: string
  imageUrl?: string
  merchant?: { title: string, excludedPurchases: string }
  rewardText: string
  purchaseScope: string
  conditions: string
  sourceUrl: string
  limitKind: CashbackLimitKind
}

const loyaltySource = 'https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999'

// Bank's own Partners cards: https://loyalty.bankffin.kz/ru
// Verified against its public /assets/index-rSxF9ZMO.js (2026-11-20).
// Some cards intentionally share the Freedom icon on the bank's website.
const partnerIcons = {
  freedom: 'https://loyalty.bankffin.kz/images/partners/card-icons/freedom-icon.svg',
  ticketon: 'https://loyalty.bankffin.kz/images/partners/card-icons/ticketon-icon.svg',
  aviata: 'https://loyalty.bankffin.kz/images/partners/card-icons/aviata-icon.svg',
  arbuz: 'https://loyalty.bankffin.kz/images/partners/card-icons/arbuz-icon.svg',
  naimi: 'https://loyalty.bankffin.kz/images/partners/card-icons/naimi-icon.svg',
  choco: 'https://loyalty.bankffin.kz/images/partners/card-icons/choco-icon.svg'
}

export const partnerCashbackOffers: PartnerCashbackOffer[] = [
  {
    limitKind: 'general',
    title: 'Продукты и аптеки',
    imageUrl: partnerIcons.arbuz,
    rewardText: '5–20% по уровню лояльности; с Friends дополнительно +5%',
    purchaseScope: 'Заказы продуктов и аптечных товаров через Freedom SuperApp.',
    conditions: 'Транзакционный кэшбек не начисляется.',
    sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/produkty-1'
  },
  {
    limitKind: 'general',
    title: 'Афиша',
    merchant: { title: 'Freedom Ticketon', excludedPurchases: 'Покупки вне раздела «Афиша» Freedom SuperApp.' },
    imageUrl: partnerIcons.ticketon,
    rewardText: '5–15%',
    purchaseScope: 'Билеты в кино и на развлечения через раздел «Афиша» Freedom SuperApp.',
    conditions: 'Ставка зависит от условий сервиса.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'travel',
    title: 'Freedom Travel',
    imageUrl: partnerIcons.aviata,
    merchant: { title: 'Freedom Travel', excludedPurchases: 'Покупки, оформленные вне Freedom SuperApp, включая сайт и отдельное приложение Freedom Travel.' },
    rewardText: '5–10% по условиям сервиса и уровню лояльности',
    purchaseScope: 'Авиа- и ж/д билеты, туры и отели, выбранные, забронированные и оплаченные в Freedom SuperApp.',
    conditions: 'На сайте и в отдельном приложении Freedom Travel партнёрский кэшбек не начисляется. Для новых клиентов предусмотрен промопериод; покупка в кредит исключена.',
    sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/puteshestviya-i-tury-freedom-travel?questionId=681'
  },
  {
    limitKind: 'tyres',
    title: 'Freedom Drive — шины',
    imageUrl: partnerIcons.freedom,
    merchant: { title: 'Freedom Drive', excludedPurchases: 'Покупки вне раздела «Шины» Freedom SuperApp.' },
    rewardText: 'До 15%',
    purchaseScope: 'Шины Freedom Drive через раздел «Шины» Freedom SuperApp.',
    conditions: 'Базовый кэшбек не добавляется.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'electronics',
    title: 'Freedom Mobile — электроника',
    imageUrl: partnerIcons.freedom,
    merchant: { title: 'Freedom Mobile', excludedPurchases: 'Покупки вне раздела «Электроника» Freedom SuperApp.' },
    rewardText: 'До 25%',
    purchaseScope: 'Покупка техники через раздел «Электроника» Freedom SuperApp.',
    conditions: 'Ставка зависит от товара, модели и уровня. Базовый кэшбек не добавляется.',
    sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/elektronika-freedom-mobile'
  },
  {
    limitKind: 'general',
    title: 'Страхование — ОГПО',
    merchant: { title: 'Freedom Insurance', excludedPurchases: 'Покупки, кроме оплаты полиса ОГПО через сервис страхования Freedom SuperApp.' },
    imageUrl: partnerIcons.freedom,
    rewardText: '1–4%',
    purchaseScope: 'Оплата полиса ОГПО через сервис страхования Freedom SuperApp.',
    conditions: 'Применяются условия полиса и программы лояльности.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'general',
    title: 'Страхование — КАСКО',
    merchant: { title: 'Freedom Insurance', excludedPurchases: 'Покупки, кроме оплаты полиса КАСКО через сервис страхования Freedom SuperApp.' },
    imageUrl: partnerIcons.freedom,
    rewardText: '25% по условиям страхования',
    purchaseScope: 'Оплата полиса КАСКО через сервис страхования Freedom SuperApp.',
    conditions: 'Применяются условия полиса и программы лояльности.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'general',
    title: 'Freedom Life',
    imageUrl: partnerIcons.freedom,
    merchant: { title: 'Freedom Life', excludedPurchases: 'Оплата страховки вне сервиса Freedom Life в Freedom SuperApp.' },
    rewardText: '1–4%',
    purchaseScope: 'Оплата страховки Freedom Life через Freedom SuperApp.',
    conditions: 'Ставка зависит от условий страхования.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'general',
    title: 'Freedom Еда',
    merchant: { title: 'Freedom Food', excludedPurchases: 'Покупки вне раздела «Freedom Еда» Freedom SuperApp, «Choco Рядом» и микромаркеты.' },
    imageUrl: partnerIcons.choco,
    rewardText: '7–20%',
    purchaseScope: 'Заказы через раздел «Freedom Еда» Freedom SuperApp.',
    conditions: 'Ставка зависит от условий сервиса.',
    sourceUrl: loyaltySource
  },
  {
    limitKind: 'general',
    title: 'Услуги специалистов',
    merchant: { title: 'Naimi.kz', excludedPurchases: 'Покупки вне раздела «Услуги» Freedom SuperApp.' },
    imageUrl: partnerIcons.naimi,
    rewardText: '5–12%',
    purchaseScope: 'Оплата услуг специалистов через раздел «Услуги» Freedom SuperApp.',
    conditions: 'Для новых клиентов есть отдельные промоусловия.',
    sourceUrl: 'https://support.bankffin.kz/ru/fiz-litsam/uslugi-naimi-kz/kakoj-keshbek-postupit-za-oplatu-uslugi'
  },
  {
    limitKind: 'general',
    title: 'Видео',
    merchant: { title: 'Freedom Media', excludedPurchases: 'Покупки вне раздела «Видео» Freedom SuperApp.' },
    imageUrl: partnerIcons.freedom,
    rewardText: '5–12%',
    purchaseScope: 'Оплата через раздел «Видео» Freedom SuperApp.',
    conditions: 'Ставка зависит от условий сервиса.',
    sourceUrl: loyaltySource
  }
]
