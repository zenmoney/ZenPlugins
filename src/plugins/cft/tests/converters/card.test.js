/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {converter} from "../../converters/card";
import {entity} from "../../zenmoney_entity/account";

describe("card converter", () => {
    it("should return zenmoney account object", () => {
        const account_data = {
            id: 12345,
            name: "Super card",
            contractId: 1,
            equities: [
                {
                    type: "OTHER",
                    currencyCode: "USD",
                    amount: 456,
                },
                {
                    type: "FUNDS",
                    currencyCode: "RUR",
                    amount: "123.66",
                },
            ],
            ean: 12345678,
            panTail: "0987",
        };

        const credit_data = [
            {
                contractId: 1,
                grantedAmount: 200,
            }
        ];

        expect(converter(account_data, [])).toEqual(Object.assign({}, entity(), {
            id: "c-12345",
            title: "Super card",
            type: "ccard",
            instrument: "RUB",
            balance: 123.66,
            syncID: [
                "12345678",
                "0987",
            ],
        }));
        expect(converter(account_data, credit_data)).toEqual(Object.assign({}, entity(), {
            id: "c-12345",
            title: "Super card",
            type: "ccard",
            instrument: "RUB",
            balance: -76.34,
            creditLimit: 200,
            syncID: [
                "12345678",
                "0987",
            ],
        }));
    });
});
