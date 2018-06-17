import {ensureSyncIDsAreUniqueButSanitized, maybeSanitizeSyncIdMaybeNot} from "./accounts";

describe("ensureSyncIDsAreUniqueButSanitized", () => {
    it("truncate syncID to last4 digits if there is no intersection between accounts", () => {
        const accounts = [
            {syncID: ["0001", "111120"]},
            {syncID: ["0002", "2222"]},
            {syncID: ["0003"]},
        ];
        const expected = [
            {syncID: ["0001", "1120"]},
            {syncID: ["0002", "2222"]},
            {syncID: ["0003"]},
        ];
        expect(ensureSyncIDsAreUniqueButSanitized({accounts, sanitizeSyncId: maybeSanitizeSyncIdMaybeNot})).toEqual(expected);
    });

    it("truncates syncID to last 4 digits if there is intersection between accounts with different instruments", () => {
        const accounts = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "USD"},
            {syncID: ["0003"]},
        ];
        const expected = [
            {syncID: ["0001", "1120"], instrument: "RUB"},
            {syncID: ["0002", "1120"], instrument: "USD"},
            {syncID: ["0003"]},
        ];
        expect(ensureSyncIDsAreUniqueButSanitized({accounts, sanitizeSyncId: maybeSanitizeSyncIdMaybeNot})).toEqual(expected);
    });

    it("doesn't trim, but sanitizes syncID to guarantee id uniqueness between accounts with the same instrument", () => {
        const accounts = [
            {syncID: ["0001", "00000121120"], instrument: "RUB"},
            {syncID: ["0002", "00000111120"], instrument: "RUB"},
            {syncID: ["0003"]},
        ];
        const expected = [
            {syncID: ["0001", "*****121120"], instrument: "RUB"},
            {syncID: ["0002", "*****111120"], instrument: "RUB"},
            {syncID: ["0003"]},
        ];
        expect(ensureSyncIDsAreUniqueButSanitized({accounts, sanitizeSyncId: maybeSanitizeSyncIdMaybeNot})).toEqual(expected);
    });

    it("leaves full syncID if there is intersection but syncID are short", () => {
        const accounts = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "RUB"},
            {syncID: ["0003"]},
        ];
        const expected = [
            {syncID: ["0001", "121120"], instrument: "RUB"},
            {syncID: ["0002", "111120"], instrument: "RUB"},
            {syncID: ["0003"]},
        ];
        expect(ensureSyncIDsAreUniqueButSanitized({accounts, sanitizeSyncId: maybeSanitizeSyncIdMaybeNot})).toEqual(expected);
    });
});
