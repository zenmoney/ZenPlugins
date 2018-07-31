import {convertAccount, convertTransaction} from "./converters";

describe("convertAccount", () => {
    it("converts account", () => {
        expect(convertAccount({
            "accountNumber": "40702810610000000179",
            "status": "NORM",
            "name": "Мой счет",
            "currency": "643",
            "balance":  {
                "otb": 54202.31,
                "authorized": 0,
                "pendingPayments": 0,
                "pendingRequisitions": 0,
            },
        })).toEqual({
            id: "40702810610000000179",
            type: "checking",
            title: "Мой счет",
            instrument: "RUB",
            balance: 54202.31,
        });
    });
});

describe("convertTransaction", () => {
    it("converts transaction", () => {
        expect(convertTransaction({
            "id": "",
            "date": "2018-07-30",
            "amount": 35257.11,
            "drawDate": "2018-07-30",
            "payerName": "",
            "payerInn": "770000000082",
            "payerAccount": "43310000000724",
            "payerCorrAccount": "30101810900000000974",
            "payerBic": "044525974",
            "payerBank": "АО «Тинькофф Банк»",
            "chargeDate": "2018-07-30",
            "recipient": "Демо-компания",
            "recipientInn": "1239537766",
            "recipientAccount": "40101810900000000974",
            "recipientCorrAccount": "30101810145250000974",
            "recipientBic": "044525974",
            "recipientBank": "АО \"ТИНЬКОФФ БАНК\"",
            "operationType": "02",
            "uin": "",
            "paymentPurpose": "",
            "creatorStatus": "",
            "payerKpp": "0",
            "recipientKpp": "898701277",
        }, {id: "40101810900000000974"})).toEqual({
            income: 35257.11,
            incomeAccount: "40101810900000000974",
            outcome: 35257.11,
            outcomeAccount: "43310000000724",
            date: "2018-07-30",
            payee: null,
        });
    });
});
