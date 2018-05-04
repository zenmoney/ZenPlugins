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
                    bonuslessReason: "MCC",
                    incomeExpectations: false,
                },
                channel: "ATM",
                contractId: 9870000,
                date: 1463469168000,
                description: "Alfa Iss 42B-A KAMENNO, S.-peterburg",
                eventId: null,
                id: 75062562,
                itemType: "OPERATION",
                mcc: {
                    code: "6011",
                    description: "Снятие наличности автоматически",
                },
                money: {
                    accountAmount: {
                        amount: 30000,
                        currency: "RUR",
                    },
                    amount: 30000,
                    amountDetail: {
                        amount: 30000,
                        acquirerCommission: 0,
                        own: 30000,
                        commission: 0,
                        credit: 0,
                    },
                    currency: "RUR",
                    income: false,
                },
                movements: [
                    {
                        amount: 30000,
                        currency: "RUR",
                        date: 1463469168000,
                        id: "75062562#51929305",
                        income: false,
                        type: "AUTHORIZATION_HOLD",
                    },
                    {
                        amount: 30000,
                        currency: "RUR",
                        date: 1463625281000,
                        id: "75062562#109122001",
                        income: false,
                        techover: 0,
                        type: "WITHDRAW",
                    },
                ],
                status: "DONE",
                title: "Alfa Iss 42B-A KAMENNO",
                type: "CASH",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "75062562",
            date: 1463469168000,
            income: 30000,
            outcome: 30000,
            incomeAccount: "cash#RUB",
            outcomeAccount: "c-1230000",
            mcc: 6011,
            comment: [
                "Снятие наличности автоматически: Alfa Iss 42B-A KAMENNO, S.-peterburg",
            ].join("\n"),
        }));
    });
});
