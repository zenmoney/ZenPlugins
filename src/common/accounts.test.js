import {convertAccountSyncID} from "./accounts";

describe("convertAccountSyncID", () => {
    it("should truncate syncID to last 4 digits if there is no intersection between accounts", () => {
        const accounts = [
            {syncID: ["0001", "111120"]},
            {syncID: ["0002", "222"]},
            {syncID: ["0003"]}
        ];
        const expected = [
            {syncID: ["0001", "1120"]},
            {syncID: ["0002", "222"]},
            {syncID: ["0003"]}
        ];
        expect(convertAccountSyncID(accounts)).toEqual(expected);
    });

    it("should truncate syncID to last 4 digits if there is intersection between accounts with different instruments", () => {
        const accounts = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "USD"},
            {syncID: ["0003"]}
        ];
        const expected = [
            {syncID: ["0001", "1120"], instrument: "RUB"},
            {syncID: ["0002", "1120"], instrument: "USD"},
            {syncID: ["0003"]}
        ];
        expect(convertAccountSyncID(accounts)).toEqual(expected);
    });

    it("should sanitize syncID if there is intersection", () => {
        const accounts = [
            {syncID: ["0001", "00000121120"], instrument: "RUB"},
            {syncID: ["0002", "00000111120"], instrument: "RUB"},
            {syncID: ["0003"]}
        ];
        const expected = [
            {syncID: ["0001", "*****121120"], instrument: "RUB"},
            {syncID: ["0002", "*****111120"], instrument: "RUB"},
            {syncID: ["0003"]}
        ];
        expect(convertAccountSyncID(accounts)).toEqual(expected);
    });

    it("should leave full syncID if there is intersection but syncID are short", () => {
        const accounts = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "RUB"},
            {syncID: ["0003"]}
        ];
        const expected = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "RUB"},
            {syncID: ["0003"]}
        ];
        expect(convertAccountSyncID(accounts)).toEqual(expected);
    });
});
