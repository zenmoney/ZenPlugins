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

export async function configureCashbacks (month: string, isInBackground: boolean): Promise<CashbackSettings> {
  if (isInBackground) throw new UserInteractionError()
  const qrPercent = '2'
  const options = loyaltyLevels.map(({ title, basePercent, contactlessPercent }, index) =>
    `${index + 1} — ${title}: ${basePercent}%, Apple Pay +${contactlessPercent.replace('.', ',')}%`)
  const message = [
    `Выберите уровень лояльности Freedom на ${month}. Его можно посмотреть в приложении банка.`,
    ...options,
    `QR через Freedom SuperApp в POS-терминалах Freedom: +${qrPercent}% на любом уровне`,
    '0 — не настраивать кэшбек в этом месяце'
  ].join('\n')

  while (true) {
    const input = await ui.readLine(message)
    if (input == null) throw new TemporaryError('Настройка кэшбека отменена. Повторите импорт PDF.')

    const answer = input.trim()
    if (answer === '0') {
      return { version: 1, month, enabled: false, level: '', basePercent: '0', applePayPercent: '0', qrPercent: '0' }
    }
    const level = loyaltyLevels.find((_, index) => String(index + 1) === answer)
    if (level !== undefined) {
      return {
        version: 1,
        month,
        enabled: true,
        level: level.title,
        basePercent: level.basePercent,
        applePayPercent: level.contactlessPercent,
        qrPercent
      }
    }
    await ui.alert('Введите номер одного из предложенных вариантов.')
  }
}
