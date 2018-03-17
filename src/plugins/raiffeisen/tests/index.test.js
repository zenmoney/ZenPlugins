import {adjustAccounts} from "../index";

describe("#adjustAccounts", () => {
    it("should filter account links", () => {
        const accounts = {
            "1": {id: "1"},
            "2": {id: "1"},
            "3": {id: "3"}
        };
        const expected = [
            {id: "1"},
            {id: "3"}
        ];
        expect(adjustAccounts(accounts)).toEqual(expected);
    });

    it("should add last 4 letters of _cba to syncID if they don't intersect", () => {
        const accounts = {
            "1": {id: "1", syncID: ["0001"], _cba: "111120"},
            "2": {id: "2", syncID: ["0002"], _cba: "222"},
            "3": {id: "3", syncID: ["0003"]}
        };
        const expected = [
            {id: "1", syncID: ["0001", "1120"]},
            {id: "2", syncID: ["0002", "222"]},
            {id: "3", syncID: ["0003"]}
        ];
        expect(adjustAccounts(accounts)).toEqual(expected);
    });

    it("should add last 4 letters of _cba to syncID if they intersect but have different instruments", () => {
        const accounts = {
            "1": {id: "1", syncID: ["0001"], _cba: "121120", instrument: "RUB"},
            "2": {id: "2", syncID: ["0002"], _cba: "111120", instrument: "USD"},
            "3": {id: "3", syncID: ["0003"]}
        };
        const expected = [
            {id: "1", syncID: ["0001", "1120"], instrument: "RUB"},
            {id: "2", syncID: ["0002", "1120"], instrument: "USD"},
            {id: "3", syncID: ["0003"]}
        ];
        expect(adjustAccounts(accounts)).toEqual(expected);
    });

    it("should add full _cba to syncID if they intersect", () => {
        const accounts = {
            "1": {id: "1", syncID: ["0001"], _cba: "121120", instrument: "RUB"},
            "2": {id: "2", syncID: ["0002"], _cba: "111120", instrument: "RUB"},
            "3": {id: "3", syncID: ["0003"]}
        };
        const expected = [
            {id: "1", syncID: ["0001", "121120"], instrument: "RUB"},
            {id: "2", syncID: ["0002", "111120"], instrument: "RUB"},
            {id: "3", syncID: ["0003"]}
        ];
        expect(adjustAccounts(accounts)).toEqual(expected);
    });
});
