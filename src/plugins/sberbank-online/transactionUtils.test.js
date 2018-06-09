import {addDeltaToLastCurrencyTransaction, restoreNewCurrencyTransactions, RestoreResult} from "./transactionUtils";

describe("addDeltaToLastCurrencyTransaction", () => {
    const date = new Date("2018-01-01");

    it("adds delta if it < 5%", () => {
        const account = {
            id: "account",
            instrument: "RUB",
        };
        let currTransaction = {
            date,
            income: null,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        };
        let prevTransaction = {
            date,
            income: 100,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        };
        let prevTransactionCopy = Object.assign({}, prevTransaction);
        let accountData = {
            balance: 1004,
            currencyTransaction: currTransaction,
        };

        addDeltaToLastCurrencyTransaction({
            account,
            accountData,
            previousAccountData: {
                balance: 1000,
                currencyTransaction: prevTransaction,
            },
        });
        expect(accountData.currencyTransaction).toBeUndefined();
        expect(prevTransaction).toEqual(prevTransactionCopy);
        expect(currTransaction).toEqual({
            date,
            income: 104,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        });

        currTransaction.income = null;
        accountData = {
            balance: 1000,
            currencyTransaction: currTransaction,
        };
        addDeltaToLastCurrencyTransaction({
            account,
            accountData,
            previousAccountData: {
                balance: 1004,
                currencyTransaction: prevTransaction,
            },
        });
        expect(accountData.currencyTransaction).toBeUndefined();
        expect(prevTransaction).toEqual(prevTransactionCopy);
        expect(currTransaction).toEqual({
            date,
            income: 96,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        });

        currTransaction = {
            date,
            income: 0,
            incomeAccount: account.id,
            outcome: null,
            outcomeAccount: account.id,
            opOutcome: 1.5,
            opOutcomeInstrument: "USD",
        };
        prevTransaction = {
            date,
            income: 0,
            incomeAccount: account.id,
            outcome: 100,
            outcomeAccount: account.id,
            opOutcome: 1.5,
            opOutcomeInstrument: "USD",
        };
        prevTransactionCopy = Object.assign({}, prevTransaction);
        accountData = {
            balance: 1000,
            currencyTransaction: currTransaction,
        };

        addDeltaToLastCurrencyTransaction({
            account,
            accountData,
            previousAccountData: {
                balance: 1004,
                currencyTransaction: prevTransaction,
            },
        });
        expect(accountData.currencyTransaction).toBeUndefined();
        expect(prevTransaction).toEqual(prevTransactionCopy);
        expect(currTransaction).toEqual({
            date,
            income: 0,
            incomeAccount: account.id,
            outcome: 104,
            outcomeAccount: account.id,
            opOutcome: 1.5,
            opOutcomeInstrument: "USD",
        });
    });

    it("ignores delta if it >= 5%", () => {
        const account = {
            id: "account",
            instrument: "RUB",
        };
        const currTransaction = {
            date,
            income: null,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        };
        const prevTransaction = {
            date,
            income: 100,
            incomeAccount: account.id,
            outcome: 0,
            outcomeAccount: account.id,
            opIncome: 1.5,
            opIncomeInstrument: "USD",
        };
        const currTransactionCopy = Object.assign({}, currTransaction);
        const prevTransactionCopy = Object.assign({}, prevTransaction);
        const accountData = {
            balance: 1000,
            currencyTransaction: currTransaction,
        };

        addDeltaToLastCurrencyTransaction({
            account,
            accountData,
            previousAccountData: {
                balance: 1005,
                currencyTransaction: prevTransaction,
            },
        });
        expect(accountData.currencyTransaction).toBeUndefined();
        expect(prevTransaction).toEqual(prevTransactionCopy);
        expect(currTransaction).toEqual(currTransactionCopy);
    });
});

describe("restoreNewCurrencyTransactions", () => {
    const account = {instrument: "RUB"};

    it("returns error if there is more than one currency", () => {
        const previousAccountData = {
            balance: 1000,
        };
        const accountData = {
            balance: 500,
            currencyMovements: {
                "RUB": {
                    amount: 100,
                    instrument: "RUB",
                },
                "USD": {},
                "EUR": {},
            },
        };
        expect(restoreNewCurrencyTransactions({
            account,
            accountData,
            previousAccountData,
        })).toEqual(RestoreResult.ERROR);
    });

    it("returns error if balance delta does not correspond to currency movements", () => {
        const previousAccountData = {
            balance: 1000,
        };
        const accountData = {
            balance: 500,
            currencyMovements: {
                "RUB": {
                    amount: 100,
                    instrument: "RUB",
                },
                "USD": {
                    amount: 10,
                    instrument: "USD",
                },
            },
        };
        expect(restoreNewCurrencyTransactions({
            account,
            accountData,
            previousAccountData,
        })).toEqual(RestoreResult.ERROR);
    });

    it("returns unchanged result if there is only account currency movement", () => {
        const previousAccountData = {
            balance: 1000,
        };
        const accountData = {
            balance: 500,
            currencyMovements: {
                "RUB": {
                    amount: 100,
                    instrument: "RUB",
                },
            },
        };
        expect(restoreNewCurrencyTransactions({
            account,
            accountData,
            previousAccountData,
        })).toEqual(RestoreResult.UNCHANGED);
    });

    it("restores posted amounts", () => {
        const rubTransaction = {
            origin: {
                amount: 100,
                instrument: "RUB",
            },
        };
        const usdTransaction1 = {
            origin: {
                amount: -5,
                instrument: "USD",
            },
        };
        const usdTransaction2 = {
            origin: {
                amount: -6,
                instrument: "USD",
            },
        };
        const usdTransaction3 = {
            origin: {
                amount: 1,
                instrument: "USD",
            },
        };
        const previousAccountData = {
            balance: 1000,
        };
        const accountData = {
            balance: 500,
            currencyMovements: {
                "RUB": {
                    amount: 100,
                    instrument: "RUB",
                    transactions: [
                        rubTransaction,
                    ],
                },
                "USD": {
                    amount: -10,
                    instrument: "USD",
                    transactions: [
                        usdTransaction1,
                        usdTransaction2,
                        usdTransaction3,
                    ],
                },
            },
        };
        expect(restoreNewCurrencyTransactions({
            account,
            accountData,
            previousAccountData,
        })).toEqual(RestoreResult.RESTORED);
        expect(rubTransaction).toEqual({
            origin: {
                amount: 100,
                instrument: "RUB",
            },
        });
        expect(usdTransaction1).toEqual({
            origin: {
                amount: -5,
                instrument: "USD",
            },
            posted: {
                amount: -300,
                instrument: "RUB",
            },
        });
        expect(usdTransaction2).toEqual({
            origin: {
                amount: -6,
                instrument: "USD",
            },
            posted: {
                amount: -360,
                instrument: "RUB",
            },
        });
        expect(usdTransaction3).toEqual({
            origin: {
                amount: 1,
                instrument: "USD",
            },
            posted: {
                amount: 60,
                instrument: "RUB",
            },
        });
    });
});
