import {formatComment, formatRate} from "./converters";

describe("formatRate", () => {
    it("should never output rate below 1", () => {
        expect(formatRate({originAmount: 50, postedAmount: 50})).toEqual("1.0000");
        expect(formatRate({originAmount: 50, postedAmount: 49})).toEqual("1.0204");
        expect(formatRate({originAmount: 49, postedAmount: 50})).toEqual("1/1.0204");
    });
});

describe("formatComment", () => {
    expect(formatComment({posted: {amount: 120, instrument: "USD"}})).toEqual(null);
    expect(formatComment({posted: {amount: 120, instrument: "USD"}, origin: {amount: 100, instrument: "EUR"}})).toEqual("100.00 EUR\n(rate=1/1.2000)");
});

// TODO add toZenmoneyTransaction tests after shape discussion
