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
                    bonuslessReason: "OTHER",
                    incomeExpectations: false,
                },
                channel: "WEB",
                contractId: 9870000,
                date: 1486798986000,
                eventId: null,
                id: 136250704,
                itemType: "OPERATION",
                money: {
                    accountAmount: {
                        amount: 5000,
                        currency: "RUR",
                    },
                    amount: 5000,
                    amountDetail: {
                        amount: 5000,
                        own: 5000,
                        commission: 0,
                        credit: 0,
                    },
                    currency: "RUR",
                    income: true,
                },
                movements: [
                    {
                        amount: 5000,
                        currency: "RUR",
                        date: 1486798986000,
                        id: "136250704#233873187",
                        income: true,
                        type: "INCOME",
                    },
                ],
                status: "DONE",
                title: "Пополнение с карты MASTERCARD",
                type: "RECHARGE",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "136250704",
            date: 1486798986000,
            income: 5000,
            outcome: 5000,
            incomeAccount: "c-1230000",
            outcomeAccount: "checking#RUB",
            comment: [
                "Пополнение с карты MASTERCARD",
            ].join("\n"),
        }));
    });
});
