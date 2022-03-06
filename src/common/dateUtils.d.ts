export declare function isValidDate (date: Date): boolean
export declare function formatCommentDateTime (date: Date): string
export declare function toISODateString (date: Date): string
export declare function toDate (date: Date | string | number): Date
export declare function createDateIntervals (args: { fromDate: Date, toDate: Date, addIntervalToDate: (x: Date) => Date, gapMs?: number }): Array<[Date, Date]>
export declare function dateInTimezone (date: Date, timezoneOffsetMinutes: number): Date
export declare function getMidnight (date: Date, offset: number): Date
