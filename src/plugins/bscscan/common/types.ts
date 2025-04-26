export interface Response {
  status: string
  message: string
}

export interface BlockNoResponse extends Response {
  result: string
}
