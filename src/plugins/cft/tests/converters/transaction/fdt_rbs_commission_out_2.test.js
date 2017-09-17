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
                bonus:       {
                    incomeExpectations: false,
                    bonuslessReason:    "OTHER",
                },
                cardId:      1230000,
                channel:     "WEB",
                connector:   "получателю",
                contractId:  9870000,
                date:        1486040511000,
                eventId:     null,
                id:          134621218,
                itemType:    "OPERATION",
                money:       {
                    accountAmount: {
                        amount:   100,
                        currency: "RUR",
                    },
                    amount:        100,
                    amountDetail:  {
                        amount:     100,
                        own:        100,
                        credit:     0,
                        commission: 0,
                    },
                    currency:      "RUR",
                    income:        false,
                },
                movements:   [
                    {
                        amount:   100,
                        currency: "RUR",
                        date:     1486040511000,
                        id:       "134621218#165328714",
                        income:   false,
                        type:     "AUTHORIZATION_HOLD",
                    },
                    {
                        amount:   100,
                        currency: "RUR",
                        date:     1486040522000,
                        id:       "134621218#228921838",
                        income:   false,
                        type:     "WITHDRAW",
                    },
                ],
                payReceipt:  {
                    previewAvailable: false,
                },
                serviceCode: "FDTOWN",
                status:      "0#DONE",
                title:       "Петров Иван Иванович",
                type:        "FDT_RBS_COMMISSION",
                typeName:    "Перевод на счет",
            },
            {
                '9870000': 'c-1230000',
            }
        );

        expect(transaction).toEqual(Object.assign({}, entity(), {
            id:             '134621218',
            date:           1486040511000,
            income:         100,
            outcome:        100,
            incomeAccount:  'checking#RUB',
            outcomeAccount: 'c-1230000',
            comment:        [
                                'Перевод на счет: Петров Иван Иванович',
                            ].join("\n"),
        }));
    });
});
