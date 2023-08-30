type Interval = 'year' | 'month' | 'day'

// Useful for endDateOffset/payoff in loan/deposit
export declare function getIntervalBetweenDates (fromDate: Date, toDate: Date, intervals?: Interval[]): { interval: Interval, count: number }
