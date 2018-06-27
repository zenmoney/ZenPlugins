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
                channel: "POS",
                contractId: 9870000,
                counterpartyCode: "DEPOSIT_BIC_044525555",
                date: 1465373434000,
                eventId: null,
                id: 81979970,
                itemType: "OPERATION",
                money: {
                    accountAmount: {
                        amount: 200,
                        currency: "RUR",
                    },
                    amount: 200,
                    amountDetail: {
                        amount: 200,
                        own: 200,
                        commission: 0,
                        credit: 0,
                    },
                    currency: "RUR",
                    income: true,
                },
                movements: [
                    {
                        amount: 200,
                        currency: "RUR",
                        date: 1465373434000,
                        id: "81979970#109122023",
                        income: true,
                        type: "INCOME",
                    },
                ],
                paymentDetail: {
                    depositBankName: "ПАО \"ПРОМСВЯЗЬБАНК\"",
                    depositBankBic: "044525555",
                },
                status: "DONE",
                subtitle: "Проценты на остаток",
                title: "Начисление процентов на остаток",
                type: "DEPOSIT_PROC",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "81979970",
            date: 1465373434000,
            income: 200,
            outcome: 0,
            incomeAccount: "c-1230000",
            outcomeAccount: "c-1230000",
            payee: "ПАО \"ПРОМСВЯЗЬБАНК\"",
            comment: [
                "Начисление процентов на остаток",
            ].join("\n"),
        }));
    });
});
