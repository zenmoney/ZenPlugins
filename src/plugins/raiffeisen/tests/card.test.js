import {parseCards} from '../index';

describe("card parser", () => {
    it("should return valid cards", () => {
        const cards = parseCards([
            {
                issuedProcurations: [ {
                    id: 611542,
                    createDate: '2017-02-09T15:19',
                    startDate: '2017-02-09T00:00',
                    expirationDate: '2116-02-09T00:00'
                } ],
                alien: false,
                accountId: 16453728,
                account: {
                    id: 16453728,
                    cba: '40817810401003615325',
                    currency: {
                        id: 'RUR',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '810',
                        shortName: 'RUB',
                        sort: 2
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: true },
                id: 63561259,
                icdbId: 8015944,
                open: '2017-01-23T00:00',
                expire: '2021-01-31T00:00',
                pan: '447603******3780',
                product: 'RUR Visa CASHBACK Credit',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: true,
                balance: 111363.67,
                hold: 1131.35,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                },
                cba: '40817810401003615325',
                rate: 34,
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'VISA', name: 'Visa' },
                type: { id: 2, name: 'Кредитная карта' },
                main: { id: 1, name: 'Основная' },
                status: { id: 0, name: 'Открыта' },
                smsNotificationEnabled: false,
                settings: {
                    countryCount: 10,
                    manageTrip: true,
                    manageLimit: true,
                    manageSms: true,
                    manageProcurations: false,
                    manageStatementDay: true
                }
            },
            {
                issuedProcurations: [
                    {
                        id: 611542,
                        createDate: '2017-02-09T15:19',
                        startDate: '2017-02-09T00:00',
                        expirationDate: '2116-02-09T00:00'
                    }
                ],
                alien: false,
                accountId: 16453728,
                account: {
                    id: 16453728,
                    cba: '40817810401003615325',
                    currency: {
                        id: 'RUR',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '810',
                        shortName: 'RUB',
                        sort: 2
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: true },
                id: 63625328,
                icdbId: 8066851,
                open: '2017-02-10T00:00',
                expire: '2021-01-31T00:00',
                pan: '447603******4085',
                product: 'RUR Supplementary Visa CASHBACK Credit',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: true,
                balance: 111363.67,
                hold: 1053.84,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                },
                cba: '40817810401003615325',
                rate: 34,
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'VISA', name: 'Visa' },
                type: { id: 2, name: 'Кредитная карта' },
                main: { id: 0, name: 'Дополнительная' },
                status: { id: 1, name: 'Открыта' },
                smsNotificationEnabled: false,
                settings: {
                    countryCount: 10,
                    manageTrip: true,
                    manageLimit: true,
                    manageSms: true,
                    manageProcurations: true,
                    manageStatementDay: false
                }
            },
            {
                alien: false,
                accountId: 16754955,
                account: {
                    id: 16754955,
                    cba: '40817810101003720811',
                    currency: {
                        id: 'RUR',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '810',
                        shortName: 'RUB',
                        sort: 2
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: true },
                id: 64641574,
                icdbId: 8137340,
                open: '2017-06-01T00:00',
                expire: '2021-03-31T00:00',
                pan: '510070******4506',
                product: 'RUR MasterCard Gold Package',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: false,
                balance: 0,
                hold: 0,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                },
                cba: '40817810101003720811',
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'EUROCARD', name: 'MasterCard' },
                type: { id: 1, name: 'Дебетовая карта' },
                main: { id: 1, name: 'Основная' },
                status: { id: 0, name: 'Открыта' },
                smsNotificationEnabled: true,
                settings: {
                    countryCount: 10,
                    manageTrip: true,
                    manageLimit: true,
                    manageSms: true,
                    manageProcurations: false,
                    manageStatementDay: false
                }
            },
            {
                issuedProcurations: [
                    {
                        id: 611542,
                        createDate: '2017-02-09T15:19',
                        startDate: '2017-02-09T00:00',
                        expirationDate: '2116-02-09T00:00'
                    }
                ],
                alien: false,
                accountId: 16453728,
                account: {
                    id: 16453728,
                    cba: '40817810401003615325',
                    currency: {
                        id: 'RUR',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '810',
                        shortName: 'RUB',
                        sort: 2
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: true },
                id: 67381479,
                icdbId: 8636759,
                open: '2017-11-08T00:00',
                expire: '2021-08-31T00:00',
                pan: '447603******6330',
                product: 'RUR Supplementary Visa CASHBACK Credit',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: true,
                balance: 111363.67,
                hold: 0,
                currencyId: 'RUR',
                currency: {
                    id: 'RUR',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '810',
                    shortName: 'RUB',
                    sort: 2
                },
                cba: '40817810401003615325',
                rate: 34,
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'VISA', name: 'Visa' },
                type: { id: 2, name: 'Кредитная карта' },
                main: { id: 0, name: 'Дополнительная' },
                status: { id: 1, name: 'Открыта' },
                smsNotificationEnabled: false,
                settings: {
                    countryCount: 10,
                    manageTrip: true,
                    manageLimit: true,
                    manageSms: true,
                    manageProcurations: false,
                    manageStatementDay: false
                }
            }
        ]);

        const expected = {};

        const account1 = {
            "available": 111363.67,
            "id": "ACCOUNT_16453728",
            "instrument": "RUB",
            "syncID": [
                "3780",
                "5325",
                "4085",
                "6330"
            ],
            "title": "RUR Visa CASHBACK Credit",
            "type": "ccard"
        };
        expected["ACCOUNT_16453728"] = account1;
        expected["CARD_63561259"]    = account1;
        expected["CARD_63625328"]    = account1;
        expected["CARD_67381479"]    = account1;

        const account2 = {
            "balance": 0,
            "id": "ACCOUNT_16754955",
            "instrument": "RUB",
            "syncID": [
                "4506",
                "0811",
            ],
            "title": "RUR MasterCard Gold Package",
            "type": "ccard"
        };
        expected["ACCOUNT_16754955"] = account2;
        expected["CARD_64641574"]    = account2;

        expect(cards).toEqual(expected);
    });
});
