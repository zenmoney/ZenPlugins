/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {converter} from "../../converters/card";
import {entity} from "../../zenmoney_entity/account";

describe("card converter", () => {
    it("should return zenmoney account object", () => {
        const account = converter({
            id: 12345,
            name: "Super card",
            equities: [
                {
                    type: "OTHER",
                    currencyCode: "USD",
                    amount: 456,
                },
                {
                    type: "FUNDS",
                    currencyCode: "RUR",
                    amount: "123",
                },
            ],
            ean: 12345678,
            panTail: "0987",
        });

        expect(account).toEqual(Object.assign({}, entity(), {
            id: "c-12345",
            title: "Super card",
            type: "ccard",
            instrument: "RUB",
            balance: 123,
            syncID: [
                "12345678",
                "0987",
            ],
        }));
    });
});
