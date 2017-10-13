/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {entity} from "../../../zenmoney_entity/transaction";
import {converter} from "../../../converters/transaction";

describe("transaction converter", () => {
    it("should return zenmoney transaction object", () => {
        const transaction = converter(
            {
                actor:       "CONSUMER",
                cardId:      1230000,
                channel:     "MOBILE",
                contractId:  9870000,
                date:        1498810400000,
                eventId:     null,
                id:          166189057,
                itemType:    "OPERATION",
                money:       {
                    accountAmount: {
                        amount:   61523.69,
                        currency: "RUR",
                    },
                    amount:        1041.01,
                    amountDetail:  {
                        amount:     61523.69,
                        own:        61523.69,
                        commission: 0,
                    },
                    currency:      "USD",
                    income:        false,
                },
                movements:   [
                    {
                        amount:   1041.01,
                        currency: "USD",
                        date:     1498810400000,
                        id:       "166189057#241316215",
                        income:   false,
                        type:     "WITHDRAW",
                    },
                    {
                        amount:   61523.69,
                        currency: "RUR",
                        date:     1498810400001,
                        id:       "166189057#241316215#income",
                        income:   true,
                        type:     "INCOME",
                    },
                ],
                rate:        {
                    amount: "59.1000",
                    date:   1498810400000,
                    type:   "PURCHASE",
                },
                serviceCode: "WLT_W2C",
                status:      "0#DONE",
                title:       "Курс 1$ = 59.1000₽",
                type:        "WALLET",
                typeName:    "Продажа валюты",
                walletId:    88410,
            },
            {
                '9870000': 'c-1230000',
            }
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id:             '166189057',
            date:           1498810400000,
            income:         61523.69,
            outcome:        1041.01,
            incomeAccount:  'c-1230000',
            outcomeAccount: 'w-88410',
            comment:        [
                                'Продажа валюты: Курс 1$ = 59.1000₽',
                            ].join("\n"),
        }));
    });
});
