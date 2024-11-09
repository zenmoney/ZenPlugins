"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const converters_1 = require("../../../converters");
describe('convertAccounts', () => {
    it.each([
        [
            [
                {
                    id: '4480910C',
                    transactionNode: 'p',
                    currency: {
                        shortName: 'USD',
                        symbol: '$',
                        rate: 54.60
                    },
                    product: 'Mastercard World Premium',
                    cba: '40817840401000898597',
                    moneyAmount: {
                        value: 2432.19
                    },
                    accountBalance: {
                        value: 2432.19
                    }
                }
            ],
            [
                {
                    products: [
                        {
                            id: '4480910C',
                            transactionNode: 'p'
                        }
                    ],
                    account: {
                        id: '40817840401000898597',
                        title: 'Mastercard World Premium',
                        type: 'ccard',
                        instrument: 'USD',
                        syncIds: [
                            '40817840401000898597'
                        ],
                        balance: 2432.19,
                        creditLimit: 0
                    }
                }
            ]
        ]
    ])('converts current account', (apiAccounts, accounts) => {
        expect((0, converters_1.convertAccounts)(apiAccounts)).toEqual(accounts);
    });
});
