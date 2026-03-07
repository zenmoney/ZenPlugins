export interface Preferences {
  flexToken: string
  queryId: string
}

export interface FlexStatement {
  accountId: string
  CashBalances?: {
    CashBalance: Array<{
      currency: string
      endingCashBalance: string
    }> | {
      currency: string
      endingCashBalance: string
    }
  }
  OpenPositions?: {
    OpenPosition: FlexPosition[] | FlexPosition
  }
}

export interface FlexPosition {
  symbol: string
  description: string
  position: string
  marketPrice: string
  currency: string
}
