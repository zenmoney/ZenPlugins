import {convertAccounts} from "../../converters";

describe("convertAccounts", () => {
    it("should return valid accounts", () => {
        const accounts = convertAccounts([
            {
                alien: false,
                account: {
                    id: 2358990,
                    cba: '40817810401001898597',
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
                id: 2358990,
                cba: '40817810401001898597',
                open: '2009-02-21T00:00',
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
                balance: 0,
                hold: 0,
                creditBlock: false,
                debitBlock: false,
                subtype: { name: 'Текущий' },
                type: { id: 1, name: 'Текущий' },
                status: { id: 1, name: 'Открыт' },
                cards: [ ]
            },
            {
                alien: false,
                account: {
                    id: 2358991,
                    cba: '40817840401000898597',
                    currency: {
                        id: 'USD',
                        symbol: '$',
                        name: { name: 'Доллар США' },
                        precision: 2,
                        code: '840',
                        shortName: 'USD',
                        sort: 3
                    }
                },
                procurationCredentials: { debit: true, credit: true, createProcuration: true },
                id: 2358991,
                cba: '40817840401000898597',
                open: '2009-02-21T00:00',
                currencyId: 'USD',
                currency: {
                    id: 'USD',
                    symbol: '$',
                    name: { name: 'Доллар США' },
                    precision: 2,
                    code: '840',
                    shortName: 'USD',
                    sort: 3
                },
                balance: 12345,
                hold: 0,
                creditBlock: false,
                debitBlock: false,
                subtype: { name: 'Текущий' },
                type: { id: 1, name: 'Текущий' },
                status: { id: 1, name: 'Открыт' },
                cards: [ ]
            }
        ]);

        expect(accounts).toEqual({
            "ACCOUNT_2358990": {
                "balance": 0,
                "id": "ACCOUNT_2358990",
                "instrument": "RUB",
                "syncID": [
                    "40817810401001898597"
                ],
                "title": "*8597",
                "type": "checking"
            },
            "ACCOUNT_2358991": {
                "balance": 12345,
                "id": "ACCOUNT_2358991",
                "instrument": "USD",
                "syncID": [
                    "40817840401000898597"
                ],
                "title": "*8597",
                "type": "checking"
            }
        });
    });

    it("should convert savings account", () => {
        const accounts = convertAccounts([
            {
                alien: false,
                account: {
                    id: 16265038,
                    cba: '40817810701003528316',
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
                id: 16265038,
                cba: '40817810701003528316',
                open: '2016-10-04T00:00',
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
                balance: 0.85,
                hold: 0,
                creditBlock: false,
                debitBlock: false,
                subtype: { name: 'Накопительный счет "На каждый день"' },
                rate: 4.5,
                type: { id: 2, name: 'Накопительный' },
                status: { id: 1, name: 'Открыт' },
                cards: []
            }
        ]);

        const account = {
            "balance": 0.85,
            "id": "ACCOUNT_16265038",
            "instrument": "RUB",
            "syncID": [
                "40817810701003528316"
            ],
            "title": "*8316",
            "type": "checking",
            "savings": true
        };
        const expected = {};
        expected[account.id] = account;

        expect(accounts).toEqual(expected);
    });
});
