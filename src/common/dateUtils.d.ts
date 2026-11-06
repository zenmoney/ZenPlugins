export declare function isValidDate (date: Date): boolean
export declare function formatCommentDateTime (date: Date): string
export declare function toISODateString (date: Date): string
export declare function toDate (date: Date | string | number): Date
// Split time interval into parts
// Useful when you have constraint on period of transaction loading
export declare function createDateIntervals (args: { fromDate: Date, toDate: Date, addIntervalToDate: (x: Date) => Date, gapMs?: number }): Array<[Date, Date]>
export declare function dateInTimezone (date: Date, timezoneOffsetMinutes: number): Date
export declare function getMidnight (date: Date, offset: number): Date
export declare function getFirstDayOfMonth (date: Date, offset?: number): Date
export declare function isISODate (value: unknown): value is string
/** Classify an inclusive calendar-date range; partial periods remain custom. */
export declare function getDatePeriodType (from: string, to: string): 'month' | 'quarter' | 'year' | 'custom'
