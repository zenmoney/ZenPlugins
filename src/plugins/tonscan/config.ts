interface SupportedJettons {
  [key: string]: { ticker: string, decimals: number }
}
export const SUPPORTED_JETTONS: SupportedJettons = {
  '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE': {
    ticker: 'USDT',
    decimals: 6
  }
}
