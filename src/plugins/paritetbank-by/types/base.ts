export interface PreferenceInput {
  login: string
  password: string
}

export interface BaseFetchInput {
  sessionToken: string
}

export interface FetchError {
  code: string
  status: string
  message: string
}

export type FetchOutput<TData> =
  | {
    status: number
    data: TData
    error: null
  }
  | {
    status: number
    data: null
    error: FetchError
  }
