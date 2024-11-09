"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const converters_1 = require("../../../converters");
describe('convertAccounts', () => {
    it.each([
        [
            [
                {
                    id: 'B7C94FAC',
                    transactionNode: 's',
                    currency: {
                        shortName: 'RUB',
                        symbol: 'руб',
                        rate: 1
                    },
                    product: 'Mastercard Credit World Premium',
                    cba: '40817810301003402816',
                    pan: '5536********1038',
                    moneyAmount: {
                        value: 145600.24
                    },
                    accountBalance: {
                        value: 45600.24
                    }
                },
                {
                    id: 'FFA73280',
                    transactionNode: 'l',
                    currency: {
                        shortName: 'RUB',
                        symbol: 'руб',
                        rate: 1
                    },
                    product: 'Maestro',
                    cba: '40817810301003402816',
                    pan: '5536********7427',
                    moneyAmount: {
                        value: 145600.24
                    },
                    accountBalance: {
                        value: 45600.24
                    }
                }
            ],
            [
                {
                    products: [
                        {
                            id: 'B7C94FAC',
                            transactionNode: 's'
                        },
                        {
                            id: 'FFA73280',
                            transactionNode: 'l'
                        }
                    ],
                    account: {
                        id: '40817810301003402816',
                        type: 'ccard',
                        title: 'Mastercard Credit World Premium',
                        instrument: 'RUB',
                        syncIds: [
                            '40817810301003402816',
                            '5536********1038',
                            '5536********7427'
                        ],
                        balance: 45600.24,
                        creditLimit: 100000
                    }
                }
            ]
        ]
    ])('converts card', (apiAccounts, accounts) => {
        expect((0, converters_1.convertAccounts)(apiAccounts)).toEqual(accounts);
    });
});
