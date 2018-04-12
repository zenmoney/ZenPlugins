import {convertCards} from '../../converters';

describe("convertCards", () => {
    it("should return valid cards", () => {
        const cards = convertCards([
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
                "447603******3780",
                "447603******4085",
                "447603******6330",
                "40817810401003615325",
            ],
            "title": "RUR Visa CASHBACK Credit",
            "type": "ccard",
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
                "510070******4506",
                "40817810101003720811"
            ],
            "title": "RUR MasterCard Gold Package",
            "type": "ccard"
        };
        expected["ACCOUNT_16754955"] = account2;
        expected["CARD_64641574"]    = account2;

        expect(cards).toEqual(expected);
    });

    it("should convert card with no cba", () => {
        const cards = convertCards([
            {
                alien: false,
                accountId: 15964969,
                account: {
                    id: 15964969,
                    cba: '40817810301003402816',
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
                id: 62629984,
                icdbId: 7215739,
                open: '2016-03-28T00:00',
                expire: '2020-03-31T00:00',
                pan: '462729******8643',
                product: 'RUR Visa Classic',
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
                cba: '40817810301003402816',
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'VISA', name: 'Visa' },
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
                alien: false,
                accountId: -3,
                account: {
                    id: -3,
                    currency: {
                        id: 'RUB',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '643',
                        shortName: 'RUB',
                        sort: 1
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: false },
                id: 68684601,
                icdbId: 9183348,
                open: '2018-01-24T00:00',
                expire: '2021-01-31T00:00',
                pan: '553496******0271',
                product: 'RUR MasterCard Corporate Debit',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: false,
                balance: 354223.4,
                hold: 423,
                currencyId: 'RUB',
                currency: {
                    id: 'RUB',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '643',
                    shortName: 'RUB',
                    sort: 1
                },
                paymentSystem: { id: 'EUROCARD', name: 'MasterCard' },
                type: { id: 3, name: 'Дебетовая корпоративная карта' },
                main: { id: 1, name: 'Основная' },
                status: { id: 0, name: 'Открыта' },
                smsNotificationEnabled: true,
                settings: {
                    countryCount: 10,
                    manageTrip: false,
                    manageLimit: false,
                    manageSms: false,
                    manageProcurations: false,
                    manageStatementDay: false
                }
            }
        ]);

        const expected = {};
        const account1 = {
            "id": "ACCOUNT_15964969",
            "balance": 0,
            "instrument": "RUB",
            "syncID": [
                "462729******8643",
                "40817810301003402816"
            ],
            "title": "RUR Visa Classic",
            "type": "ccard"
        };
        expected["ACCOUNT_15964969"] = account1;
        expected["CARD_62629984"] = account1;

        const account2 = {
            "id": "ACCOUNT_-3",
            "balance": 354223.4,
            "instrument": "RUB",
            "syncID": [
                "553496******0271"
            ],
            "title": "RUR MasterCard Corporate Debit",
            "type": "ccard"
        };
        expected["ACCOUNT_-3"] = account2;
        expected["CARD_68684601"] = account2;

        expect(cards).toEqual(expected);
    });

    it("should find account for card without cba", () => {
        const accounts = {
            'ACCOUNT_17347766': {
                id: 'ACCOUNT_17347766',
                type: 'checking',
                instrument: 'RUB',
                balance: 82355.4,
                syncID: [ '40802810200000035677'],
                title: '*5677'
            }
        };
        const cards = convertCards([
            {
                alien: false,
                accountId: -3,
                account: {
                    id: -3,
                    currency: {
                        id: 'RUB',
                        symbol: '₽',
                        name: { name: 'Российский рубль' },
                        precision: 2,
                        code: '643',
                        shortName: 'RUB',
                        sort: 1
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: false },
                id: 68643928,
                icdbId: 9177977,
                open: '2018-01-23T00:00',
                expire: '2021-01-31T00:00',
                pan: '446916******1038',
                product: 'RUR Visa Business Optimum Gold',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: false,
                name: 'Business',
                balance: 82355.4,
                hold: 28705.13,
                currencyId: 'RUB',
                currency: {
                    id: 'RUB',
                    symbol: '₽',
                    name: { name: 'Российский рубль' },
                    precision: 2,
                    code: '643',
                    shortName: 'RUB',
                    sort: 1
                },
                paymentSystem: { id: 'VISA', name: 'Visa' },
                type: { id: 3, name: 'Дебетовая корпоративная карта' },
                main: { id: 1, name: 'Основная' },
                status: { id: 0, name: 'Открыта' },
                smsNotificationEnabled: true,
                settings: {
                    countryCount: 10,
                    manageTrip: false,
                    manageLimit: false,
                    manageSms: false,
                    manageProcurations: false,
                    manageStatementDay: false
                }
            }
        ], accounts);

        expect(cards).toEqual({
            'ACCOUNT_17347766': {
                id: 'ACCOUNT_17347766',
                type: 'ccard',
                instrument: 'RUB',
                balance: 82355.4,
                syncID: [
                    '446916******1038',
                    '40802810200000035677'
                ],
                title: 'RUR Visa Business Optimum Gold'
            },
            'CARD_68643928': {
                id: 'ACCOUNT_17347766',
                type: 'ccard',
                instrument: 'RUB',
                balance: 82355.4,
                syncID: [
                    '446916******1038',
                    '40802810200000035677'
                ],
                title: 'RUR Visa Business Optimum Gold'
            }
        });
    });

    it("should convert alien card", () => {
        const cards = convertCards([
            {
                alien: true,
                accountId: 16264501,
                account: {
                    id: 16264501,
                    cba: '40817810701003528028',
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
                procurationCredentials: { debit: true, credit: true, createProcuration: false },
                id: 63249656,
                icdbId: 7755982,
                open: '2016-10-18T00:00',
                expire: '2020-10-31T00:00',
                pan: '447603******6946',
                product: 'RUR Supplementary Visa CASHBACK Credit',
                appleWalletSupport: true,
                androidPaySupport: true,
                cobrend: true,
                balance: 40.76,
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
                cba: '40817810701003528028',
                rate: 34,
                creditBlock: false,
                debitBlock: false,
                paymentSystem: { id: 'VISA', name: 'Visa' },
                type: { id: 2, name: 'Кредитная карта' },
                main: { id: 0, name: 'Дополнительная' },
                status: { id: 1, name: 'Открыта' },
                smsNotificationEnabled: true,
                settings: {
                    countryCount: 10,
                    manageTrip: true,
                    manageLimit: false,
                    manageSms: true,
                    manageProcurations: false,
                    manageStatementDay: false
                }
            }
        ]);

        const card = {
            "id": "ACCOUNT_16264501",
            "type": "ccard",
            "title": "RUR Supplementary Visa CASHBACK Credit",
            "instrument": "RUB",
            "available": 40.76,
            "syncID": [
                "447603******6946",
                "40817810701003528028",
            ]
        };
        const expected = {};
        expected["ACCOUNT_16264501"] = card;
        expected["CARD_63249656"] = card;

        expect(cards).toEqual(expected);
    });
});
