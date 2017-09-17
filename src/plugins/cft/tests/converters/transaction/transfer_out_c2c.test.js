/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {entity} from "../../../zenmoney_entity/transaction";
import {converter} from "../../../converters/transaction";

describe("transaction converter", () => {
    it("should return zenmoney transaction object", () => {
        const transaction = converter(
            {
                actor:            "CONSUMER",
                bonus:            {
                    incomeExpectations: false,
                    bonuslessReason:    "MCC",
                },
                channel:          "POS",
                contractId:       9870000,
                counterpartyCode: "tinkoff",
                date:             1487712154000,
                description:      "TINKOFF BANK CARD2, Moscow",
                eventId:          null,
                id:               138487536,
                itemType:         "OPERATION",
                mcc:              {
                    description: "Перевод на другую карту",
                    code:        "6538",
                },
                money:            {
                    accountAmount: {
                        amount:   5000,
                        currency: "RUR",
                    },
                    amount:        5000,
                    amountDetail:  {
                        amount:             5000,
                        own:                5000,
                        credit:             0,
                        commission:         0,
                        acquirerCommission: 0,
                    },
                    currency:      "RUR",
                    income:        false,
                },
                movements:        [
                    {
                        amount:   5000,
                        currency: "RUR",
                        date:     1487712154000,
                        id:       "138487536#174294099",
                        income:   false,
                        type:     "AUTHORIZATION_HOLD",
                    },
                    {
                        amount:   5000,
                        currency: "RUR",
                        date:     1487919798000,
                        id:       "138487536#241666296",
                        income:   false,
                        type:     "WITHDRAW",
                    },
                ],
                status:           "DONE",
                title:            "Tinkoff Bank",
                type:             "TRANSFER",
            },
            {
                '9870000': 'c-1230000',
            }
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id:             '138487536',
            date:           1487712154000,
            income:         5000,
            outcome:        5000,
            incomeAccount:  "checking#RUB",
            outcomeAccount: 'c-1230000',
            mcc:            6538,
            payee:          "TINKOFF BANK CARD2, Moscow",
            comment:        [
                                "Tinkoff Bank",
                            ].join("\n"),
        }));
    });
});
