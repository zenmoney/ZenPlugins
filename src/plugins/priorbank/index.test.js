import fetchMock from "fetch-mock";
import _ from "lodash";
import util from "util";
import {scrape} from "./index";

const priorSuccessResponse = (result) => ({
    "success": true,
    "errorMessage": "",
    "errorMessageOriginal": "",
    "internalErrorCode": 0,
    "externalErrorCode": "",
    "token": false,
    "tokenFields": null,
    "result": result,
});

describe("scraper happy path", () => {
    beforeEach(() => {
        fetchMock.catch((url, opts) => {
            throw new Error(util.format("Unmatched fetch request", {
                matcher: {inspect: () => `(url, {body}) => url.endsWith(${JSON.stringify(url)}) && _.isEqual(JSON.parse(body), ${opts.body})`},
                ..._.omit(opts, ["body"]),
            }));
        });
    });
    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it("should work", () => {
        global.ZenMoney = {
            isAccountSkipped: () => false,
        };

        fetchMock.once({
            method: "GET",
            matcher: (url) => url.endsWith("/Authorization/MobileToken"),
            response: {
                access_token: "access_token",
                token_type: "token_type",
                client_secret: "client_secret",
            },
        });

        const preAuthExpectedHeaders = {
            Authorization: "token_type access_token",
            client_id: "client_secret",
            "User-Agent": "PriorMobile3/3.17.03.22 (Android 24; versionCode 37)",
        };

        fetchMock.once({
            matcher: (url, {body}) => url.endsWith("/Authorization/GetSalt") && _.isEqual(JSON.parse(body), {
                "login": "login",
                "lang": "RUS",
            }),
            method: "POST",
            headers: preAuthExpectedHeaders,
            response: priorSuccessResponse({"salt": "salt"}),
        });

        fetchMock.once({
            matcher: (url, {body}) => url.endsWith("/Authorization/Login") && _.isEqual(JSON.parse(body), {
                "login": "login",
                "password": "0a610f0bbf7a92accc7e962c53ef3ed7d7d2cabb16139ae169555a6685056b405fa4a3edb041f27e6d8c29bea70eb9bd89bad9fcfcdf05e23b1b8b99ad1256a5",
                "lang": "RUS",
            }),
            method: "POST",
            headers: preAuthExpectedHeaders,
            response: priorSuccessResponse({"access_token": "logged_in_access_token", "userSession": "userSession"}),
        });

        const postAuthExpectedHeaders = {
            Authorization: "bearer logged_in_access_token",
            client_id: "client_secret",
            "User-Agent": "PriorMobile3/3.17.03.22 (Android 24; versionCode 37)",
        };

        fetchMock.once({
            matcher: (url,
                {body}) => url.endsWith("/Cards") && _.isEqual(JSON.parse(body), {"usersession": "userSession"}),
            method: "POST",
            headers: postAuthExpectedHeaders,
            response: priorSuccessResponse([
                {
                    "clientObject": {
                        "id": "BYN_ACCOUNT_ID",
                        "type": 6,
                        "currIso": "BYN",
                        "cardMaskedNumber": "************2345",
                        "defaultSynonym": "BYNdefaultSynonym",
                        "customSynonym": null,
                    },
                    "balance": {
                        "available": 499.99,
                    },
                },
                {
                    "clientObject": {
                        "id": "USD_ACCOUNT_ID",
                        "type": 6,
                        "currIso": "USD",
                        "cardMaskedNumber": "************1234",
                        "defaultSynonym": "USDdefaultSynonym",
                        "customSynonym": "USDcustomSynonym",
                    },
                    "balance": {
                        "available": 100.50,
                    },
                },
            ]),
        });

        fetchMock.once({
            matcher: (url, {body}) => url.endsWith("/Cards/CardDesc") && _.isEqual(JSON.parse(body), {
                "usersession": "userSession",
                "ids": [],
                "dateFromSpecified": false,
                "dateToSpecified": false,
            }),
            method: "POST",
            headers: {
                Authorization: "bearer logged_in_access_token",
                client_id: "client_secret",
                "User-Agent": "PriorMobile3/3.17.03.22 (Android 24; versionCode 37)",
            },
            response: priorSuccessResponse([
                {
                    "id": "BYN_ACCOUNT_ID",
                    "contract": {
                        "account": {
                            "transCardList": [
                                {
                                    "transactionList": [
                                        {
                                            "postingDate": "2017-01-03T00:00:00+03:00",
                                            "transDate": "2017-01-03T00:00:00+03:00",
                                            "transCurrIso": "BYN",
                                            "amount": 10.0,
                                            "feeAmount": 0.0,
                                            "accountAmount": 10.0,
                                            "transDetails": "Поступление на контракт клиента #ID  ",
                                        },
                                        {
                                            "postingDate": "2017-01-04T00:00:00+03:00",
                                            "transDate": "2017-01-03T00:00:00+03:00",
                                            "transCurrIso": "BYN",
                                            "amount": -4.0,
                                            "feeAmount": 0.0,
                                            "accountAmount": -4.0,
                                            "transDetails": "Payment From Client Contract  ",
                                        },
                                    ],
                                },
                            ],
                        },
                        "abortedContractList": [
                            {
                                "abortedTransactionList": [
                                    {
                                        "amount": 6,
                                        "transAmount": 6,
                                        "transCurrIso": "BYN",
                                        "transDetails": "Retail BLR",
                                        "transDate": "2017-01-09T00:00:00+03:00",
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    "id": "USD_ACCOUNT_ID",
                    "contract": {
                        "account": {
                            "transCardList": [
                                {
                                    "transactionList": [
                                        {
                                            "postingDate": "2017-01-02T00:00:00+03:00",
                                            "transDate": "2017-01-01T00:00:00+03:00",
                                            "transCurrIso": "USD",
                                            "amount": 1000,
                                            "feeAmount": 0.0,
                                            "accountAmount": 1000,
                                            "transDetails": "Поступление на контракт клиента #ID  ",
                                        },
                                        {
                                            "postingDate": "2017-01-02T00:00:00+03:00",
                                            "transDate": "2017-01-01T00:00:00+03:00",
                                            "transCurrIso": "BYN",
                                            "amount": 4,
                                            "feeAmount": 0.0,
                                            "accountAmount": 2,
                                            "transDetails": "Retail BLR",
                                        },
                                    ],
                                },
                                {
                                    "transactionList": [
                                        {
                                            "postingDate": "2017-01-10T00:00:00+03:00",
                                            "transDate": "2017-01-10T00:00:00+03:00",
                                            "transCurrIso": "BYN",
                                            "amount": -20,
                                            "feeAmount": 0.0,
                                            "accountAmount": -10.00,
                                            "transDetails": "Retail BLR",
                                        },
                                        {
                                            "postingDate": "2017-01-09T00:00:00+03:00",
                                            "transDate": "2017-01-08T00:00:00+03:00",
                                            "transCurrIso": "USD",
                                            "amount": -200,
                                            "feeAmount": 0.0,
                                            "accountAmount": -200,
                                            "transDetails": "Cash BLR",
                                        },
                                        {
                                            "postingDate": "2017-01-09T00:00:00+03:00",
                                            "transDate": "2017-01-08T00:00:00+03:00",
                                            "transCurrIso": "BYN",
                                            "amount": -100,
                                            "feeAmount": 0.0,
                                            "accountAmount": -50.67,
                                            "transDetails": "ATM BLR",
                                        },
                                        {
                                            "postingDate": "2017-01-07T00:00:00+03:00",
                                            "transDate": "2017-01-06T00:00:00+03:00",
                                            "transCurrIso": "USD",
                                            "amount": -2.79,
                                            "feeAmount": 0.0,
                                            "accountAmount": -2.79,
                                            "transDetails": "Retail NLD",
                                        },
                                    ],
                                },
                            ],
                        },
                        "abortedContractList": [
                            {
                                "abortedTransactionList": [
                                    {
                                        "amount": 100,
                                        "transAmount": 202.34,
                                        "transCurrIso": "BYN",
                                        "transDetails": "Retail BLR",
                                        "transDate": "2017-01-10T00:00:00+03:00",
                                    },
                                ],
                            },
                        ],
                    },
                },
            ]),
        });

        return expect(scrape({
            preferences: {login: "login", password: "password"},
            fromDate: null,
            toDate: null,
        }))
            .resolves
            .toMatchSnapshot("happy path scrape result");
    });

});
