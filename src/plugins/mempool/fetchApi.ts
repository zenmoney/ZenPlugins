import { fetchJson } from '../../common/network'
import { InvalidPreferencesError, TemporaryUnavailableError } from '../../errors'
import { getArray, getBoolean, getNumber, getOptNumber, getOptString, getString } from '../../types/get'
import { BASE_URL, MempoolAddressInfo, MempoolTransaction, MempoolVin, MempoolVout } from './models'

const MAX_ATTEMPTS = 4
const RETRY_DELAY_MS = 2000

async function sleep (ms: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms))
}

// mempool.space лимиты числом не публикует, но обещает 429 и блокировки,
// поэтому 429 и 5xx повторяем с растущей паузой, а прочие коды считаем окончательными.
// 400 — особый случай: адрес прошёл структурную проверку в preferences.ts, но сам API
// его не принял. TemporaryUnavailableError ретраил бы это молча вечно, allowRetry: true
// не сообщил бы пользователю про опечатку; InvalidPreferencesError фатален и возвращает
// на экран настроек (см. src/plugins/jupitercard/fetchApi.ts:83-87 для того же паттерна).
// 403/404 и прочее — не вина пользователя (блокировка по рейт-лимиту, чужой роут), поэтому
// они остаются TemporaryUnavailableError.
async function requestJson (path: string, address: string): Promise<unknown> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetchJson(`${BASE_URL}${path}`)
    if (response.status === 200) {
      return response.body
    }
    if (response.status === 400) {
      throw new InvalidPreferencesError(
        `mempool.space не принял адрес «${address}» (400). Проверьте его среди адресов кошельков в настройках плагина.`
      )
    }
    if (response.status !== 429 && response.status < 500) {
      break
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
  throw new TemporaryUnavailableError()
}

function parseVout (raw: unknown): MempoolVout {
  return {
    scriptpubkey_address: getOptString(raw, 'scriptpubkey_address') ?? null,
    value: getNumber(raw, 'value')
  }
}

// prevout отсутствует у coinbase-входов, поэтому опираемся на наличие value.
function parseVin (raw: unknown): MempoolVin {
  const value = getOptNumber(raw, 'prevout.value')
  if (value == null) {
    return { prevout: null }
  }
  return { prevout: { scriptpubkey_address: getOptString(raw, 'prevout.scriptpubkey_address') ?? null, value } }
}

function parseTransaction (raw: unknown): MempoolTransaction {
  return {
    txid: getString(raw, 'txid'),
    vin: getArray(raw, 'vin').map(parseVin),
    vout: getArray(raw, 'vout').map(parseVout),
    confirmed: getBoolean(raw, 'status.confirmed'),
    block_time: getOptNumber(raw, 'status.block_time') ?? null
  }
}

export async function fetchAddressInfo (address: string): Promise<MempoolAddressInfo> {
  const body = await requestJson(`/address/${address}`, address)
  return {
    funded_txo_sum: getNumber(body, 'chain_stats.funded_txo_sum'),
    spent_txo_sum: getNumber(body, 'chain_stats.spent_txo_sum')
  }
}

export async function fetchAddressTransactionsPage (address: string, lastSeenTxId?: string): Promise<MempoolTransaction[]> {
  const path = lastSeenTxId != null
    ? `/address/${address}/txs/chain/${lastSeenTxId}`
    : `/address/${address}/txs`
  const body = await requestJson(path, address)
  // Тело ответа — массив в корне, а getArray работает по пути внутри объекта,
  // поэтому проверяем тип напрямую. Не массив при 200 — это сломанный ответ:
  // страница обслуживания от прокси, объект ошибки, смена контракта API. Подставить
  // здесь пустой массив значило бы выдать поломку за конец истории: пагинация
  // остановилась бы, и кошелёк навсегда замер бы на последней виденной транзакции.
  if (!Array.isArray(body)) {
    throw new TemporaryUnavailableError()
  }
  return body.map(parseTransaction)
}
