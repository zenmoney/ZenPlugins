/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {converter} from "../../../converters/transaction";
import {entity} from "../../../zenmoney_entity/transaction";

describe("transaction converter", () => {
    it("should return zenmoney transaction object", () => {
        const transaction = converter(
            {
                actor: "CONSUMER",
                bonus: {
                    incomeExpectations: false,
                    bonuslessReason: "OTHER",
                },
                channel: "POS",
                contractId: 9870000,
                date: 1487711481000,
                eventId: null,
                id: 138487007,
                itemType: "OPERATION",
                money: {
                    amount: 5000,
                    amountDetail: {
                        amount: 5000,
                        commission: 0,
                    },
                    currency: "RUR",
                    income: true,
                },
                movements: [
                    {
                        amount: 5000,
                        currency: "RUR",
                        date: 1487711481000,
                        id: "138487007#240263798",
                        income: true,
                        type: "INCOME",
                    },
                ],
                status: "DONE",
                title: "MASTERCARD",
                type: "RECHARGE",
                typeName: "Перевод с карты",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "138487007",
            date: 1487711481000,
            income: 5000,
            outcome: 5000,
            incomeAccount: "c-1230000",
            outcomeAccount: "checking#RUB",
            comment: [
                "Перевод с карты: MASTERCARD",
            ].join("\n"),
        }));
    });
});
