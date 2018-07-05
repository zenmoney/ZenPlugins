import {convertApiAbortedTransactionToReadableTransaction, mergeTransfers} from "./converters";

const transferOutcome = {
    accountId: "test(accountId)",
    accountCurrency: "BYN",
    abortedTransaction: {
        amount: -100,
        transAmount: 100,
        transCurrIso: "BYN",
        transDetails: "CH Payment BLR MINSK P2P SDBO NO FEE",
        transDate: "2018-01-01T00:00:00+03:00",
        transDateSpecified: true,
        transTime: "12:34:56",
        hce: false,
    },
};
const transferIncome = {
    accountId: "test(accountId)",
    accountCurrency: "USD",
    abortedTransaction: {
        amount: 49.99,
        transAmount: 100,
        transCurrIso: "BYN",
        transDetails: "CH Debit BLR MINSK P2P SDBO NO FEE",
        transDate: "2018-01-01T00:00:00+03:00",
        transDateSpecified: true,
        transTime: "12:34:56",
        hce: false,
    },
};

test("it chooses correct debit side sign", () => {
    expect(convertApiAbortedTransactionToReadableTransaction(transferOutcome))
        .toMatchObject({posted: {amount: -100, instrument: "BYN"}});

    expect(convertApiAbortedTransactionToReadableTransaction(transferIncome))
        .toMatchObject({posted: {amount: 49.99, instrument: "USD"}});
});

test("it merges correctly", () => {
    expect(mergeTransfers({
        items: [transferIncome, transferOutcome].map((transaction) => ({
            apiTransaction: {type: "abortedTransaction", payload: transaction.abortedTransaction},
            readableTransaction: convertApiAbortedTransactionToReadableTransaction(transaction),
        })),
    })).toEqual([
        {
            "comment": null,
            "date": new Date("2018-01-01T00:00:00+03:00"),
            "hold": true,
            "sides": [
                {"account": {"id": "test(accountId)"}, "amount": 49.99, "id": null, "instrument": "USD"},
                {"account": {"id": "test(accountId)"}, "amount": -100, "id": null, "instrument": "BYN"},
            ],
            "type": "transfer",
        },
    ]);
});
