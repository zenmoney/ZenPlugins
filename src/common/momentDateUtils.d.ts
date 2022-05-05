type Interval = 'year' | 'month' | 'day'

export declare function getIntervalBetweenDates (fromDate: Date, toDate: Date, intervals?: Interval[]): { interval: Interval, count: number }
