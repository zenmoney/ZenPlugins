import { generateRandomString } from '../../common/utils'
import { InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../errors'
import { fetchAccounts, fetchCards, fetchDeviceConfirmation, fetchLogin, fetchOtp } from './fetchApi'
import { Auth, OtpChannel, Preferences, Session } from './models'

// Письмо с кодом доходит заметно медленнее СМС, поэтому ждём ввода дольше
const USER_INPUT_TIMEOUT_MS = 180000

const CHANNEL_TITLES: Record<OtpChannel['kind'], string> = {
  phone: 'СМС на',
  email: 'письмо на'
}

export async function login (preferences: Preferences, auth: Auth | undefined, isInBackground: boolean): Promise<Session> {
  const deviceId = auth?.deviceId ?? generateDeviceId()
  const result = await fetchLogin(preferences, deviceId)

  if (result.isDeviceVerified) {
    return { auth: { ...auth, deviceId }, sessionId: result.sessionId, token: result.token }
  }
  if (isInBackground) {
    // Подтверждение устройства требует ввода кода, в фоне спросить некого
    throw new UserInteractionError()
  }
  const channel = await selectOtpChannel(result.channels, auth?.otpChannelType)
  await fetchOtp(result.accountId, channel.type, deviceId)

  // Банк присылает пять цифр и гасит прежний код при каждой новой отправке
  const code = await ZenMoney.readLine(`Введите код из 5 цифр: ${CHANNEL_TITLES[channel.kind]} ${channel.recipient}`, {
    inputType: 'number',
    time: USER_INPUT_TIMEOUT_MS
  })
  if (code == null || code.trim() === '') {
    throw new InvalidOtpCodeError()
  }
  return {
    auth: { deviceId, otpChannelType: channel.type },
    ...await fetchDeviceConfirmation(result.accountId, code.trim(), channel.type, deviceId)
  }
}

async function selectOtpChannel (channels: OtpChannel[], knownChannelType?: number): Promise<OtpChannel> {
  if (channels.length === 0) {
    throw new TemporaryError('Банк не предложил ни одного способа подтвердить устройство. Обратитесь в контактный центр Idram +374 60 700700.')
  }
  const known = channels.find(channel => channel.type === knownChannelType)
  if (known != null) {
    return known
  }
  if (channels.length === 1) {
    return channels[0]
  }
  const options = channels.map((channel, index) => `${index + 1} — ${CHANNEL_TITLES[channel.kind]} ${channel.recipient}`).join('\n')
  const answer = await ZenMoney.readLine(`Как получить код для подтверждения устройства?\n${options}\n\nВведите номер способа`, {
    inputType: 'number',
    time: USER_INPUT_TIMEOUT_MS
  })
  const channel = channels[Number(answer) - 1]
  if (channel == null) {
    throw new TemporaryError(`Такого способа нет. Повторите синхронизацию и введите число от 1 до ${channels.length}.`)
  }
  return channel
}

// Банк принимает подтверждённое устройство по этому отпечатку,
// поэтому он живёт в auth и после первого входа больше не меняется
function generateDeviceId (): string {
  return generateRandomString(32, '0123456789abcdef')
}

export async function fetchAllAccounts (session: Session): Promise<{ accounts: unknown[], cards: unknown[] }> {
  return {
    accounts: await fetchAccounts(session),
    cards: await fetchCards(session)
  }
}
