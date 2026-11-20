import { ui } from '../../common/ui'
import { TemporaryError, UserInteractionError } from '../../errors'
import { CashbackSettings } from './models'

// Source: https://support.bankffin.kz/ru/fiz-litsam/urovni-loialnosti-limity-i-razmery-kesbeka?questionId=999
// Bank's published base and tokenized-payment rates; QR at Freedom POS adds 2% at every level; checked 2026-11-20.
const loyaltyLevels = [
  { title: 'Standard', basePercent: '1', contactlessPercent: '0.5' },
  { title: 'Silver', basePercent: '2', contactlessPercent: '1' },
  { title: 'Gold', basePercent: '3', contactlessPercent: '1.5' },
  { title: 'Platinum', basePercent: '4', contactlessPercent: '2' }
]

// Calendar months use Kazakhstan time, independently of the device time zone.
export function cashbackMonth (now: Date): string {
  return new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

function percent (value: unknown): value is string {
  return typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) && Number(value) <= 100
}

export function readCashbackSettings (value: unknown): CashbackSettings | null {
  if (value == null) return null
  if (typeof value !== 'object') throw new Error('Invalid stored cashback settings')
  const state = value as Record<string, unknown>
  if ((state.version !== 1 && state.version !== 2) || typeof state.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(state.month) ||
    typeof state.enabled !== 'boolean' || typeof state.level !== 'string' || (state.enabled && state.level.trim() === '') || !percent(state.basePercent) ||
    !percent(state.applePayPercent) || (state.version === 2 && !percent(state.qrPercent))) {
    throw new Error('Invalid stored cashback settings')
  }
  return {
    version: 1,
    month: state.month,
    enabled: state.enabled,
    level: state.level,
    basePercent: state.basePercent,
    applePayPercent: state.applePayPercent,
    qrPercent: state.version === 1 ? (state.enabled ? '2' : '0') : state.qrPercent as string
  }
}

async function ask (message: string): Promise<string> {
  const answer = await ui.readLine(message)
  if (answer == null) throw new TemporaryError('Настройка кэшбека отменена. Повторите импорт PDF.')
  return answer.trim()
}

async function choice (message: string, values: string[]): Promise<string> {
  while (true) {
    const answer = await ask(message)
    if (values.includes(answer)) return answer
    await ui.alert('Введите номер одного из предложенных вариантов.')
  }
}

export async function configureCashbacks (month: string, isInBackground: boolean): Promise<CashbackSettings> {
  if (isInBackground) throw new UserInteractionError()
  const enabled = await choice(`Кэшбек Freedom на ${month}.\n1 — настроить по данным приложения банка\n0 — не передавать кэшбеки в этом месяце`, ['0', '1'])
  const settings: CashbackSettings = { version: 1, month, enabled: enabled === '1', level: '', basePercent: '0', applePayPercent: '0', qrPercent: '0' }
  if (!settings.enabled) return settings
  const selectedLevel = await choice('Выберите уровень лояльности на текущий месяц после его обновления в приложении Freedom:\n1 — Standard: 1%, Apple Pay +0,5%, QR Freedom +2%\n2 — Silver: 2%, Apple Pay +1%, QR Freedom +2%\n3 — Gold: 3%, Apple Pay +1,5%, QR Freedom +2%\n4 — Platinum: 4%, Apple Pay +2%, QR Freedom +2%', ['1', '2', '3', '4'])
  const level = loyaltyLevels[Number(selectedLevel) - 1]
  settings.level = level.title
  settings.basePercent = level.basePercent
  settings.applePayPercent = level.contactlessPercent
  settings.qrPercent = '2'
  const confirmed = await choice(`Сохранить на ${month}?\nУровень: ${settings.level}\nБазовый кэшбек: ${settings.basePercent}%\nApple Pay: +${settings.applePayPercent}%\nQR через Freedom SuperApp в POS-терминалах Freedom: +${settings.qrPercent}%\n1 — сохранить\n0 — отменить импорт`, ['0', '1'])
  if (confirmed === '0') throw new TemporaryError('Настройка кэшбека отменена. Повторите импорт PDF.')
  return settings
}
