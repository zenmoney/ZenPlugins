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
                    bonuslessReason: "MCC",
                },
                channel: "ATM",
                connector: "в банкомате",
                contractId: 9870000,
                date: 1487014700000,
                description: "VB24, SPB",
                eventId: null,
                id: 136788480,
                itemType: "OPERATION",
                money: {
                    accountAmount: {
                        amount: 1000,
                        currency: "RUR",
                    },
                    amount: 1000,
                    amountDetail: {
                        amount: 1000,
                        own: 1000,
                        credit: 0,
                        commission: 0,
                        acquirerCommission: 0,
                    },
                    currency: "RUR",
                    income: false,
                },
                movements: [
                    {
                        amount: 1000,
                        currency: "RUR",
                        date: 1487014700000,
                        id: "136788480#170345846",
                        income: false,
                        type: "AUTHORIZATION_HOLD",
                    },
                    {
                        amount: 1000,
                        currency: "RUR",
                        date: 1487210613000,
                        id: "136788480#236861693",
                        income: false,
                        type: "WITHDRAW",
                    },
                ],
                status: "DONE",
                title: "VB24",
                type: "CASH",
                typeName: "Снятие наличных",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "136788480",
            date: 1487014700000,
            income: 1000,
            outcome: 1000,
            incomeAccount: "cash#RUB",
            outcomeAccount: "c-1230000",
            comment: [
                "Снятие наличных: VB24, SPB",
            ].join("\n"),
        }));
    });
});
