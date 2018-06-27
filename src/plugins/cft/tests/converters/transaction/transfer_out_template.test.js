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
                    details: [],
                },
                cardId: 1230000,
                channel: "WEB",
                contractId: 9870000,
                date: 1493300365000,
                eventId: null,
                id: 152495210,
                itemType: "OPERATION",
                money: {
                    accountAmount: {
                        amount: 300,
                        currency: "RUR",
                    },
                    amount: 300,
                    amountDetail: {
                        amount: 300,
                        own: 300,
                        credit: 0,
                        commission: 0,
                    },
                    currency: "RUR",
                    income: false,
                },
                movements: [
                    {
                        amount: 300,
                        contractId: 9870000,
                        currency: "RUR",
                        date: 1493300365000,
                        id: "152495210#207042606",
                        income: false,
                        type: "AUTHORIZATION_HOLD",
                    },
                    {
                        amount: 300,
                        currency: "RUR",
                        date: 1493300383000,
                        id: "152495210#278157877",
                        income: false,
                        type: "WITHDRAW",
                    },
                    {
                        amount: 300,
                        contractId: 9870000,
                        currency: "RUR",
                        date: 1493300402000,
                        id: "152495210#152495448",
                        income: true,
                        type: "INCOME",
                    },
                ],
                payTemplate: {
                    id: "24596799",
                    name: "2960117000000",
                },
                paymentDetail: {
                    transferKey: "655437000",
                    ean: "2 960117 000000",
                    targetName: "Иван",
                },
                serviceCode: "DP1Self",
                status: "0#DONE",
                title: "2960117000000",
                type: "TRANSFER",
                typeName: "Перевод на свою карту",
            },
            {
                "9870000": "c-1230000",
            },
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id: "152495210",
            date: 1493300365000,
            income: 300,
            outcome: 300,
            incomeAccount: "checking#RUB",
            outcomeAccount: "c-1230000",
            comment: [
                "Перевод на свою карту: 2960117000000",
            ].join("\n"),
        }));
    });
});
