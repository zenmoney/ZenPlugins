"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const converters_1 = require("../../../converters");
describe('convertTransaction', () => {
    it.each([
        [
            {
                type: 'HOLD',
                operationTime: '2018-01-05 09:10:34 GMT+3',
                relation: 'CARD',
                relationId: 'B7C94FAC',
                amount: {
                    value: -3,
                    currency: {
                        shortName: 'USD',
                        symbol: '$'
                    }
                },
                accountAmount: {
                    value: -164.10,
                    currency: {
                        shortName: 'RUB',
                        symbol: 'руб'
                    }
                },
                description: 'DE BERLIN MCDONALDS'
            },
            { id: 'B7C94FAC', instrument: 'RUB' },
            {
                hold: true,
                date: new Date('2018-01-05T06:10:34.000Z'),
                movements: [
                    {
                        id: null,
                        account: { id: 'B7C94FAC' },
                        invoice: { sum: -3, instrument: 'USD' },
                        sum: -164.10,
                        fee: 0
                    }
                ],
                merchant: {
                    fullTitle: 'DE BERLIN MCDONALDS',
                    mcc: null,
                    location: null
                },
                comment: null
            }
        ],
        [
            {
                id: '7876123',
                type: 'TRANSACTION',
                operationTime: '2018-01-04 18:44:12 GMT+3',
                debitingTime: '2018-01-07 12:21:07 GMT+3',
                relation: 'ACCOUNT',
                relationId: '4480910C',
                amount: {
                    value: -50,
                    currency: {
                        shortName: 'USD',
                        symbol: '$'
                    }
                },
                accountAmount: {
                    value: -50,
                    currency: {
                        shortName: 'USD',
                        symbol: '$'
                    }
                }
            },
            { id: '4480910C', instrument: 'USD' },
            {
                hold: false,
                date: new Date('2018-01-04T15:44:12.000Z'),
                movements: [
                    {
                        id: '7876123',
                        account: { id: '4480910C' },
                        invoice: null,
                        sum: -50,
                        fee: 0
                    }
                ],
                merchant: null,
                comment: null
            }
        ]
    ])('converts outcome', (apiTransaction, account, transaction) => {
        expect((0, converters_1.convertTransaction)(apiTransaction, account)).toEqual(transaction);
    });
});
