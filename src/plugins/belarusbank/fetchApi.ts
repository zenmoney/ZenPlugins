import { fetch, fetchJson } from '../../common/network'
import { TemporaryUnavailableError } from '../../errors'
import { BASE_API_URL } from './models'

export interface ApiResponse<T> {
  status: number
  body: T
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  sessionToken?: string
  tokenType?: string
  rawStringBody?: boolean
  binaryResponse?: boolean
  accept?: string
  retry?: boolean
}

const NETWORK_ERROR_PATTERN = /\[NER\]|\[NTI]|ECONNRESET|ETIMEDOUT|socket hang up/i
const MAX_ATTEMPTS = 3

const makeUrl = (path: string, query: RequestOptions['query']): string => {
  const values = query ?? {}
  const parameters = Object.keys(values)
    .filter((key) => values[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(values[key]))}`)
    .join('&')

  return `${BASE_API_URL}${path}${parameters.length > 0 ? `?${parameters}` : ''}`
}

export const fetchApi = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    Accept: options.accept ?? 'application/json, text/plain, */*',
    'Content-Type': 'application/json;',
    'Platform-Type': 'MOBILE',
    'X-Timezone': 'Europe/Minsk'
  }

  if (options.sessionToken != null) {
    headers.Authorization = `${options.tokenType ?? 'Bearer'} ${options.sessionToken}`
  }

  const maxAttempts = options.retry === false ? 1 : MAX_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await (options.binaryResponse === true ? fetch : fetchJson)(makeUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body: options.body,
        stringify: options.rawStringBody === true ? (body: unknown): string => String(body) : JSON.stringify,
        binaryResponse: options.binaryResponse,
        log: false,
        sanitizeRequestLog: {
          headers: {
            Authorization: true
          },
          body: {
            login: true,
            mobilePhone: true,
            password: true,
            code: true,
            codeWord: true,
            token: true,
            refreshToken: true,
            deviceUid: true
          }
        },
        sanitizeResponseLog: {
          body: {
            sessionToken: true,
            token: true,
            refreshToken: true
          }
        }
      })

      if (response.status < 500 || attempt === maxAttempts) {
        return {
          status: response.status,
          body: response.body as T
        }
      }
    } catch (error) {
      if (!(error instanceof Error) || !NETWORK_ERROR_PATTERN.test(error.message)) {
        throw error
      }
      if (attempt === maxAttempts) break
    }
  }

  console.error('[BELARUSBANK:API] Request failed after retries')
  throw new TemporaryUnavailableError()
}
