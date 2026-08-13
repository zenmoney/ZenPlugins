import { AccountOrCard } from '../../types/zenmoney'

// Настройки из preferences.xml (key="token", key="pin", key="startDate")
// startDate не входит сюда — он становится fromDate при первом запуске
export interface Preferences {
  // Токен из lk.altyn.one (Bearer для запросов к API)
  token: string
  // PIN-код для подтверждения сессии (NextAuth callback/credentials, поле otp)
  pin: string
}

// Элемент массива results ответа GET /account/
export interface AltynAccount {
  account_number: string
  bank_name: string | null
  bic: string | null
  bank_inn: string | null
  bank_kpp: string | null
  cor_account: string | null
  currency: string
  balance: string
}

// Элемент массива results ответа GET /transaction/ (только нужные поля)
export interface AltynTransaction {
  token: string
  amount: string
  currency: string
  created_at: string
  type: 'deposit' | 'withdraw'
  status: number
  label: string | null
  details: string | null
}

// Результат конвертации счёта кошелька в домен zenmoney
export interface ConvertResult {
  account: AccountOrCard
  accountNumber: string
}
