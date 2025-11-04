export interface Preferences {
  readonly username: string
  readonly password: string
}

export interface Device {
  model: string
  manufacturer: string
  ip: string
  osVersion: string
  androidId: string
}

export interface Session {
  accessToken: string
}
