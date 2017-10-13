/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {entity} from "../../../zenmoney_entity/transaction";
import {converter} from "../../../converters/transaction";

describe("transaction converter", () => {
    it("should return zenmoney transaction object", () => {
        const transaction = converter(
            {
                actor:      "CONSUMER",
                bonus:      {
                    bonuslessReason:    "OTHER",
                    incomeExpectations: false,
                },
                channel:    "POS",
                contractId: 9870000,
                date:       1462966384000,
                eventId:    null,
                id:         74501568,
                itemType:   "OPERATION",
                money:      {
                    accountAmount: {
                        amount:   900.01,
                        currency: "RUR",
                    },
                    amount:        900.01,
                    amountDetail:  {
                        amount:     900.01,
                        own:        900.01,
                        commission: 0,
                        credit:     0,
                    },
                    currency:      "RUR",
                    income:        true,
                },
                movements:  [
                    {
                        amount:   900.01,
                        currency: "RUR",
                        date:     1462966384000,
                        id:       "74501568#95402930",
                        income:   true,
                        type:     "INCOME",
                    },
                ],
                status:     "DONE",
                title:      "Начисление процентов на остаток",
                type:       "PAYMENT",
            },
            {
                '9870000': 'c-1230000',
            }
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id:             '74501568',
            date:           1462966384000,
            income:         900.01,
            outcome:        0,
            incomeAccount:  'c-1230000',
            outcomeAccount: 'c-1230000',
            comment:        [
                                "Начисление процентов на остаток",
                            ].join("\n"),
        }));
    });
});
