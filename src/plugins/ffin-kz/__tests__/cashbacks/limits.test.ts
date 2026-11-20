import { describeCashbackLimits } from '../../cashback-limits'

// Formatting and level selection over domain settings, not PDF parsing.
// Expected values: official Freedom FAQ, checked 2026-11-20:
// https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999
// https://support.bankffin.kz/ru/fiz-litsam/puteshestviya-i-tury-freedom-travel?questionId=681
// https://support.bankffin.kz/ru/fiz-litsam/elektronika-freedom-mobile
describe('[model] cashback limits for the selected loyalty level', () => {
  it.each([
    ['Standard', {
      general: 'Лимит кэшбека за покупку — 5 000 ₸. Общий месячный лимит уровня Standard — 50 000 ₸.',
      travel: 'Авиа- и ж/д билеты: лимит кэшбека за покупку — 10 000 ₸. Общий месячный лимит уровня Standard — 50 000 ₸. Туры и отели: отдельный общий лимит кэшбека — 100 000 ₸ в месяц.',
      tyres: 'Лимит кэшбека за покупку шин — 50 000 ₸. Общий месячный лимит уровня Standard — 50 000 ₸.',
      electronics: 'Месячный лимит партнёрского кэшбека — 150 000 ₸. Кэшбек начисляется не более чем за 2 смартфона за последние 30 дней.'
    }],
    ['Silver', {
      general: 'Лимит кэшбека за покупку — 7 000 ₸. Общий месячный лимит уровня Silver — 100 000 ₸.',
      travel: 'Авиа- и ж/д билеты: лимит кэшбека за покупку — 15 000 ₸. Общий месячный лимит уровня Silver — 100 000 ₸. Туры и отели: отдельный общий лимит кэшбека — 100 000 ₸ в месяц.',
      tyres: 'Лимит кэшбека за покупку шин — 50 000 ₸. Общий месячный лимит уровня Silver — 100 000 ₸.',
      electronics: 'Месячный лимит партнёрского кэшбека — 200 000 ₸. Кэшбек начисляется не более чем за 2 смартфона за последние 30 дней.'
    }],
    ['Gold', {
      general: 'Лимит кэшбека за покупку — 20 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸.',
      travel: 'Авиа- и ж/д билеты: лимит кэшбека за покупку — 20 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸. Туры и отели: отдельный общий лимит кэшбека — 100 000 ₸ в месяц.',
      tyres: 'Лимит кэшбека за покупку шин — 50 000 ₸. Общий месячный лимит уровня Gold — 150 000 ₸.',
      electronics: 'Месячный лимит партнёрского кэшбека — 250 000 ₸. Кэшбек начисляется не более чем за 2 смартфона за последние 30 дней.'
    }],
    ['Platinum', {
      general: 'Лимит кэшбека за покупку — 30 000 ₸. Общий месячный лимит уровня Platinum — 200 000 ₸.',
      travel: 'Авиа- и ж/д билеты: лимит кэшбека за покупку — 30 000 ₸. Общий месячный лимит уровня Platinum — 200 000 ₸. Туры и отели: отдельный общий лимит кэшбека — 100 000 ₸ в месяц.',
      tyres: 'Лимит кэшбека за покупку шин — 50 000 ₸. Общий месячный лимит уровня Platinum — 200 000 ₸.',
      electronics: 'Месячный лимит партнёрского кэшбека — 300 000 ₸. Кэшбек начисляется не более чем за 2 смартфона за последние 30 дней.'
    }]
  ] as const)('renders general and partner limits for %s', (level, expected) => {
    expect({
      general: describeCashbackLimits(level, 'general'),
      travel: describeCashbackLimits(level, 'travel'),
      tyres: describeCashbackLimits(level, 'tyres'),
      electronics: describeCashbackLimits(level, 'electronics')
    }).toEqual(expected)
  })

  it('rejects an unknown level instead of inventing limits', () => {
    expect(() => describeCashbackLimits('unknown', 'general')).toThrow('Unsupported loyalty level for cashback limits')
  })
})
