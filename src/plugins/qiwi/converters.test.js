import {convertAccounts, convertTransactions} from "./converters";

describe("convertAccounts", () => {
    it("returns valid accoutns", () => {
        expect(convertAccounts([
            {
                alias: "qw_wallet_rub",
                balance: {amount: 100, currency: 643},
                bankAlias: "QIWI",
                currency: 643,
                defaultAccount: true,
                fsAlias: "qb_wallet",
                hasBalance: true,
                title: "WALLET",
                type: {id: "WALLET", title: "Visa QIWI Wallet"},
            },
            {

                alias: "mc_mts_rub",
                balance: null,
                bankAlias: "QIWI",
                currency: 643,
                defaultAccount: false,
                fsAlias: "qb_mc_mts",
                hasBalance: false,
                title: "MC",
                type: {id: "MC", title: "Mobile Wallet"},
            },
            {
                alias: "qw_wallet_eur",
                balance: {amount: 2.98, currency: 978},
                bankAlias: "QIWI",
                currency: 978,
                defaultAccount: false,
                fsAlias: "qb_wallet",
                hasBalance: true,
                title: "WALLET",
                type: {id: "WALLET", title: "Visa QIWI Wallet"},
            },
        ], "79881234567")).toEqual([
            {
                id: "79881234567_643",
                type: "checking",
                title: "QIWI (RUB)",
                instrument: "RUB",
                syncID: ["4567"],
                balance: 100,
            },
            {
                id: "79881234567_978",
                type: "checking",
                title: "QIWI (EUR)",
                instrument: "EUR",
                syncID: ["4567"],
                balance: 2.98,
            },
        ]);
    });
});

describe("convertTransactions", () => {
    it("returns valid transactions", () => {
        expect(convertTransactions([
            {
                "txnId": 13319571944,
                "personId": 79881234567,
                "date": "2018-06-21T20:02:51+03:00",
                "errorCode": 0,
                "error": null,
                "status": "SUCCESS",
                "type": "IN",
                "statusText": "Success",
                "trmTxnId": "2911474611",
                "account": "Платежная система",
                "sum": {
                    "amount": 200,
                    "currency": 643,
                },
                "commission": {
                    "amount": 0,
                    "currency": 643,
                },
                "total": {
                    "amount": 200,
                    "currency": 643,
                },
                "provider": {
                    "id": 26444,
                    "shortName": "Рапида",
                    "longName": "НКО Рапида (резиденты)",
                    "logoUrl": null,
                    "description": null,
                    "keys": null,
                    "siteUrl": null,
                    "extras": [{
                        "key": "is_spa_form_available",
                        "value": "true",
                    }],
                },
                "source": {
                    "id": 99,
                    "shortName": "Перевод на QIWI Кошелек",
                    "longName": "Доставляется мгновенно",
                    "logoUrl": "https://static.qiwi.com/img/providers/logoBig/99_l.png",
                    "description": null,
                    "keys": "пополнить, перевести, qiwi, кошелек, оплатить, онлайн, оплата, счет, способ, услуга,перевести",
                    "siteUrl": "http://www.qiwi.com",
                    "extras": [{
                        "key": "ceo_description",
                        "value": "Способы пополнения QIWI кошелька онлайн. Как перевести деньги на QIWI кошелек. Оплата онлайн через электронный QIWI кошелек.",
                    }, {
                        "key": "ceo_title",
                        "value": "Пополнить QIWI кошелек - перевод и пополнение онлайн электронный QIWI кошелька",
                    }, {
                        "key": "is_spa_form_available",
                        "value": "true",
                    }],
                },
                "comment": null,
                "currencyRate": 1,
                "paymentExtras": [],
                "features": {
                    "chequeReady": false,
                    "bankDocumentReady": false,
                    "regularPaymentEnabled": false,
                    "bankDocumentAvailable": false,
                    "repeatPaymentEnabled": false,
                    "favoritePaymentEnabled": false,
                    "chatAvailable": false,
                    "greetingCardAttached": false,
                },
                "serviceExtras": {},
                "view": {
                    "title": "Рапида",
                    "account": "Платежная система",
                },
            },
        ], "79881234567")).toEqual([
            {
                id: "13319571944",
                date: new Date("2018-06-21T20:02:51+03:00"),
                hold: false,
                income: 200,
                incomeAccount: "79881234567_643",
                outcome: 0,
                outcomeAccount: "79881234567_643",
                comment: "Пополнение",
            },
        ]);
    });
});
