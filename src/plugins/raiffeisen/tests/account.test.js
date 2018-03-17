import {parseAccountWithCards} from "../index";

describe("account parser", () => {
    it("should return valid accounts", () => {
        const accounts = Object.assign(...[
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
        ].map(parseAccountWithCards));

        expect(accounts).toEqual({
            "ACCOUNT_2358990": {
                "balance": 0,
                "id": "ACCOUNT_2358990",
                "instrument": "RUB",
                "syncID": [],
                "title": "*8597",
                "type": "checking",
                "_cba": "40817810401001898597"
            },
            "ACCOUNT_2358991": {
                "balance": 12345,
                "id": "ACCOUNT_2358991",
                "instrument": "USD",
                "syncID": [],
                "title": "*8597",
                "type": "checking",
                "_cba": "40817840401000898597"
            }
        });
    });
});
