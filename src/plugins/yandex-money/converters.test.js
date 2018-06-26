import {convertTransaction} from "./converters";

describe("convertTransaction", () => {
    const account = {id: "account"};

    it("converts outcome", () => {
        expect(convertTransaction({
            amount: 70,
            categories: [],
            datetime: "2017-02-22T10:01:38Z",
            direction: "out",
            group_id: "pattern_1721",
            operation_id: "541029695812341276",
            pattern_id: "1721",
            status: "success",
            title: "VK.com",
            type: "payment-shop",
        }, account)).toEqual({
            id: "541029695812341276",
            date: new Date("2017-02-22T10:01:38Z"),
            income: 0,
            incomeAccount: "account",
            outcome: 70,
            outcomeAccount: "account",
            payee: "VK.com",
        });

        expect(convertTransaction({
            pattern_id: "p2p",
            operation_id: "549866839017090007",
            title: "Поддержка проекта «Скрытый смысл»",
            amount: 100,
            direction: "out",
            datetime: "2017-06-04T04:47:22Z",
            status: "success",
            type: "outgoing-transfer",
            group_id: "type_history_p2p_outgoing_all",
            label: "",
        }, account)).toEqual({
            id: "549866839017090007",
            date: new Date("2017-06-04T04:47:22Z"),
            income: 0,
            incomeAccount: "account",
            outcome: 100,
            outcomeAccount: "account",
            payee: "Скрытый смысл",
        });

        expect(convertTransaction({
            amount: 100,
            datetime: "2017-03-11T10:04:34Z",
            direction: "out",
            group_id: "type_history_p2p_outgoing_all",
            operation_id: "542541865986110009",
            pattern_id: "p2p",
            status: "success",
            title: "Благодарность проекту BSP",
            type: "outgoing-transfer",
        }, account)).toEqual({
            id: "542541865986110009",
            date: new Date("2017-03-11T10:04:34Z"),
            income: 0,
            incomeAccount: "account",
            outcome: 100,
            outcomeAccount: "account",
            payee: "BSP",
        });
    });

    it("converts outcome with mcc", () => {
        expect(convertTransaction({
            amount: 60,
            datetime: "2017-08-30T11:30:53Z",
            direction: "out",
            group_id: "mcc_8999",
            operation_id: "557364654240923932",
            status: "success",
            title: "PP*2649CODE",
            type: "payment-shop",
        }, account)).toEqual({
            id: "557364654240923932",
            date: new Date("2017-08-30T11:30:53Z"),
            income: 0,
            incomeAccount: "account",
            outcome: 60,
            outcomeAccount: "account",
            payee: "PP*2649CODE",
            mcc: 8999,
        });
    });

    it("converts transfer to Yandex Money wallet", () => {
        expect(convertTransaction({
            pattern_id: "p2p",
            operation_id: "550751409179120010",
            title: "Перевод на счет 4100148118398",
            amount: 100.00,
            direction: "out",
            datetime: "2017-06-14T10:30:12Z",
            status: "success",
            type: "outgoing-transfer",
            group_id: "type_history_p2p_outgoing_all",
        }, account)).toEqual({
            id: "550751409179120010",
            date: new Date("2017-06-14T10:30:12Z"),
            income: 0,
            incomeAccount: "account",
            outcome: 100,
            outcomeAccount: "account",
            payee: "YM 4100148118398",
        });
    });

    it("converts replenishment", () => {
        expect(convertTransaction({
            "operation_id": "550751313786113004",
            "title": "Сбербанк, пополнение",
            "amount": 100.00,
            "direction": "in",
            "datetime": "2017-06-14T10:28:33Z",
            "status": "success",
            "type": "deposition",
            "group_id": "type_history_non_p2p_deposit",
        }, account)).toEqual({
            id: "550751313786113004",
            date: new Date("2017-06-14T10:28:33Z"),
            income: 100,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            comment: "Сбербанк, пополнение",
        });

        expect(convertTransaction({
            amount: 1404.94,
            datetime: "2018-04-13T06:43:14Z",
            direction: "in",
            group_id: "type_history_non_p2p_deposit",
            operation_id: "576916994317014012",
            status: "success",
            title: "travelpayouts.ru, пополнение",
            type: "deposition",
        }, account)).toEqual({
            id: "576916994317014012",
            date: new Date("2018-04-13T06:43:14Z"),
            income: 1404.94,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            comment: "travelpayouts.ru, пополнение",
        });

        expect(convertTransaction({
            amount: 900,
            datetime: "2018-04-11T12:56:39Z",
            direction: "in",
            group_id: "type_history_non_p2p_deposit",
            operation_id: "576766599818039004",
            status: "success",
            title: "Пополнение с банковской карты",
            type: "deposition",
        }, account)).toEqual({
            id: "576766599818039004",
            date: new Date("2018-04-11T12:56:39Z"),
            income: 900,
            incomeAccount: "account",
            outcome: 0,
            outcomeAccount: "account",
            comment: "Пополнение с банковской карты",
        });
    });
});
