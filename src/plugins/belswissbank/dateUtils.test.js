import {formatCommentDateTime, formatBsbApiDate} from "./dateUtils";

const nonDates = [undefined, null, "", 1234567890];
describe("formatCommentDateTime", () => {
    it("should return stringified datetime in year-month-day hours:minutes:seconds format", () => {
        expect(formatCommentDateTime(new Date(2017, 0, 2, 3, 4, 5))).toBe("2017-01-02 03:04:05");
        expect(formatCommentDateTime(new Date(2017, 10, 12, 13, 14, 15))).toBe("2017-11-12 13:14:15");
    });

    it("should throw on non-date", () => {
        nonDates.forEach((nonDate) => expect(() => formatCommentDateTime(nonDate)).toThrow());
    });
});

describe("formatBsbApiDate", () => {
    it("should return stringified date considering bank timezone", () => {
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 0, 2, 0, 0, 0)))).toBe("02.01.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 0, 2, 3, 0, 0)))).toBe("02.01.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 10, 12, 20, 59, 59)))).toBe("12.11.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 10, 12, 21, 0, 0)))).toBe("13.11.2017");
    });

    it("should throw on non-date", () => {
        nonDates.forEach((nonDate) => expect(() => formatBsbApiDate(nonDate)).toThrow());
    });
});
