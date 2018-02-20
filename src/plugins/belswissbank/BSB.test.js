import {figureOutAccountRestsDelta, formatBsbApiDate, isRejectedTransaction} from "./BSB";

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

describe("isRejectedTransaction", () => {
    it("should trim corrupted transactionType", () => {
        expect(isRejectedTransaction({transactionType: "Отказ "})).toBe(true);
    });
});

describe("figureOutAccountRestsDelta", () => {
    it("should do its best in aggressive environment with null accountRest", () => {
        const transactions = [
            {accountRest: 900, transactionCurrency: "USD", transactionAmount: 100, transactionType: "Товары и услуги"},
            {accountRest: null, transactionCurrency: "USD", transactionAmount: 200, transactionType: "Товары и услуги"},
            {accountRest: null, transactionCurrency: "USD", transactionAmount: 300, transactionType: "Товары и услуги"},
            {accountRest: 0, transactionCurrency: "USD", transactionAmount: 400, transactionType: "Товары и услуги"},
            {accountRest: null, transactionCurrency: "USD", transactionAmount: 1000, transactionType: "Зачисление"},
            {accountRest: 750, transactionCurrency: "EUR", transactionAmount: 200, transactionType: "Товары и услуги"},
            {accountRest: null, transactionCurrency: "EUR", transactionAmount: 300, transactionType: "Товары и услуги"},
            {accountRest: 0, transactionCurrency: "USD", transactionAmount: 400, transactionType: "Товары и услуги"},
        ];
        const accountCurrency = "USD";
        expect(figureOutAccountRestsDelta({index: 0, transactions, accountCurrency})).toBe(null);
        expect(figureOutAccountRestsDelta({index: 1, transactions, accountCurrency})).toBe(-200);
        expect(figureOutAccountRestsDelta({index: 2, transactions, accountCurrency})).toBe(-300);
        expect(figureOutAccountRestsDelta({index: 3, transactions, accountCurrency})).toBe(-400);
        expect(figureOutAccountRestsDelta({index: 4, transactions, accountCurrency})).toBe(1000);
        expect(figureOutAccountRestsDelta({index: 5, transactions, accountCurrency})).toBe(-250);
        expect(figureOutAccountRestsDelta({index: 6, transactions, accountCurrency})).toBe(null);
        expect(figureOutAccountRestsDelta({index: 7, transactions, accountCurrency})).toBe(null);
    });

    it("should check that index is in range", () => {
        const transactions = [
            {accountRest: 900, transactionCurrency: "USD", transactionAmount: 100, transactionType: "Товары и услуги"},
        ];
        const accountCurrency = "USD";
        expect(() => figureOutAccountRestsDelta({index: -1, transactions, accountCurrency})).toThrow();
        expect(() => figureOutAccountRestsDelta({index: 1, transactions, accountCurrency})).toThrow();
    });

    it("should handle ambiguous amounts signs", () => {
        const transactions = [
            {
                "transactionType": "Товары и услуги",
                "transactionAmount": 1,
                "transactionCurrency": "BYN",
                "accountRest": 11.46,
            },
            {
                "transactionType": "Товары и услуги",
                "transactionAmount": 10,
                "transactionCurrency": "BYN",
                "accountRest": 27.93,
            },
        ];
        expect(figureOutAccountRestsDelta({index: 1, transactions, accountCurrency: "USD"})).toBeNull();
    });
});
