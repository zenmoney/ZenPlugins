import { AccountOrCard } from '../../types/zenmoney'

// Хранится между синхронизациями
export interface Auth {
  // Отпечаток устройства. Банк привязывает к нему подтверждение кодом,
  // поэтому он генерируется один раз и дальше не меняется.
  deviceId: string
  // Способ доставки кода, выбранный пользователем при подтверждении устройства
  otpChannelType?: number
}

// Способ доставки одноразового кода, который предлагает банк
export interface OtpChannel {
  type: number
  kind: 'phone' | 'email'
  // Замаскированный банком адрес или номер, чтобы человек понял, куда придёт код
  recipient: string
}

// Банк либо сразу пускает знакомое устройство, либо требует подтвердить новое
export type LoginResult =
  | { isDeviceVerified: true, sessionId: string, token: string }
  | { isDeviceVerified: false, accountId: number, channels: OtpChannel[] }

// Живёт только внутри одной синхронизации
export interface Session {
  auth: Auth
  sessionId: string
  // Ключ шифрования тела запросов в виде '<ключ 32 байта>-<iv 16 байт>'
  token: string
}

// Поля из preferences.xml
export interface Preferences {
  phone: string
  password: string
}

export interface ConvertResult {
  // Номер, по которому запрашивается выписка. У закрытых счетов банк её не отдаёт
  accountNumber: string | null
  account: AccountOrCard
}
