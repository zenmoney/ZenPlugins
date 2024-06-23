interface SupportedJettons {
  [key: string]: { ticker: string, title: string, decimals: number }
}
export const SUPPORTED_JETTONS: SupportedJettons = {
  '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE': {
    ticker: 'USDT',
    title: 'TON Tether USDT',
    decimals: 6
  }
}

export const MAX_RPS = 1
