import sanitize from "./sanitize";

describe("sanitize", () => {
    it("should sanitize values by truthy mask", () => {
        const sampleValues = [true, false, new Date(), {key: "secure value"}, 1, "secure value"];
        const sanitizedValues = ["<bool>", "<bool>", "<date>", {"key": "<string[12]>"}, "<number>", "<string[12]>"];

        expect(sampleValues.map(value => sanitize(value, true)))
            .toEqual(sanitizedValues);
        expect(sanitize(sampleValues, true))
            .toEqual(sanitizedValues);

        expect(sanitize({
            a: "secure value",
            b: {c: "secure value", d: "secure value"},
        }, {
            a: true,
            b: {d: true},
        })).toEqual({
            a: "<string[12]>",
            b: {c: "secure value", d: "<string[12]>"},
        });

        expect(sampleValues.map(value => sanitize(value, false)))
            .toEqual(sampleValues);
        expect(sanitize(sampleValues, false))
            .toEqual(sampleValues);
    });

    it("should preserve value if value is unexpected for the mask", () => {
        expect(sanitize({
            a: "unexpected value"
        }, {a: {b: true}})).toEqual({
            a: "unexpected value"
        });
        expect(sanitize("unexpected value", {a: {b: true}})).toEqual("unexpected value");
    });
});
