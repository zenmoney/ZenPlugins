import {formatBsbApiDate} from "./BSB";
describe("formatBsbApiDate", () => {
    it("should return stringified date considering bank UTC+3 timezone shift", () => {
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 0, 2, 0, 0, 0)))).toBe("02.01.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 0, 2, 3, 0, 0)))).toBe("02.01.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 10, 12, 20, 59, 59)))).toBe("12.11.2017");
        expect(formatBsbApiDate(new Date(Date.UTC(2017, 10, 12, 21, 0, 0)))).toBe("13.11.2017");
    });

    it("should throw on non-date", () => {
        [undefined, null, "", 1234567890].forEach((nonDate) => expect(() => formatBsbApiDate(nonDate)).toThrow());
    });
});
