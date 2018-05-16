import {normalizeCardExpirationDate} from "./preferences";

test("normalizeCardExpirationDate", () => {
    expect(normalizeCardExpirationDate("01/21")).toEqual("01/21");
    expect(normalizeCardExpirationDate("0121")).toEqual("01/21");
    expect(() => normalizeCardExpirationDate("")).toThrow("use MM/YY format");
    expect(() => normalizeCardExpirationDate("12")).toThrow("use MM/YY format");
    expect(() => normalizeCardExpirationDate("121")).toThrow("use MM/YY format");
    expect(() => normalizeCardExpirationDate("12121")).toThrow("use MM/YY format");
});
