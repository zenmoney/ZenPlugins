/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {entity} from "../../../zenmoney_entity/transaction";
import {converter} from "../../../converters/transaction";

describe("transaction converter PURCHASE", () => {
    it("should return zenmoney transaction object", () => {
        const transaction = converter(
            {
                actor:            "CONSUMER",
                bonus:            {
                    incomeExpectations: true,
                },
                channel:          "POS",
                contractId:       9870000,
                counterpartyCode: "megafon",
                date:             1487711656000,
                description:      "Megafon, Moscow",
                eventId:          null,
                id:               138487133,
                itemType:         "OPERATION",
                mcc:              {
                    description: "Телекоммуникационные услуги",
                    code:        "4814",
                },
                money:            {
                    amount:        100,
                    accountAmount: {
                        amount:   100,
                        currency: "RUR",
                    },
                    income:        false,
                    amountDetail:  {
                        amount:             100,
                        own:                100,
                        credit:             0,
                        commission:         0,
                        acquirerCommission: 0,
                    },
                    currency:      "RUR",
                },
                movements:        [
                    {
                        amount:   100,
                        currency: "RUR",
                        date:     1487711656000,
                        id:       "138487133#174293117",
                        income:   false,
                        type:     "AUTHORIZATION_HOLD",
                    },
                    {
                        amount:   100,
                        currency: "RUR",
                        date:     1487919798000,
                        id:       "138487133#241666297",
                        income:   false,
                        type:     "WITHDRAW",
                    }
                ],
                status:           "DONE",
                title:            "Мегафон",
                type:             "PURCHASE",
            },
            {
                '9870000': 'c-1230000',
            }
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id:             '138487133',
            date:           1487711656000,
            income:         0,
            outcome:        100,
            incomeAccount:  'c-1230000',
            outcomeAccount: 'c-1230000',
            payee:          "Megafon, Moscow",
            mcc:            4814,
            comment:        [
                                "Мегафон",
                            ].join("\n"),
        }));
    });
});
