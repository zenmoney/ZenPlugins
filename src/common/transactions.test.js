import {combineIntoTransferByTransferId, mapObjectsGroupedByKey} from "./transactions";

describe("combineIntoTransferByTransferId", () => {
    it("produces valid transfers", () => {
        expect(combineIntoTransferByTransferId([
            {
                income: 15,
                incomeAccount: "account1",
                outcome: 0,
                outcomeAccount: "account1",
            },
            {
                income: 0,
                incomeAccount: "account2",
                outcome: 30,
                outcomeAccount: "account2",
            },
            {
                incomeBankID: "1",
                income: 100,
                incomeAccount: "account1",
                outcome: 0,
                outcomeAccount: "account1",
                _transferId: "transferId1",
                _transferType: "outcome",
            },
            {
                income: 0,
                incomeAccount: "account2",
                outcomeBankID: "2",
                outcome: 200,
                outcomeAccount: "account2",
                _transferId: "transferId1",
                _transferType: "income",
            },
            {
                incomeBankID: "3",
                income: 300,
                incomeAccount: "account3",
                outcome: 0,
                outcomeAccount: "account3",
                payee: "Payee",
                _transferId: "transferId2",
                _transferType: "outcome",
            },
            {
                income: 0,
                incomeAccount: "account4",
                outcomeBankID: "4",
                outcome: 400,
                outcomeAccount: "account4",
                hold: true,
                _transferId: "transferId2",
                _transferType: "income",
            },
            {
                incomeBankID: "5",
                income: 500,
                incomeAccount: "account5",
                outcome: 0,
                outcomeAccount: "account5",
                payee: "Payee",
                _transferId: "transferId3",
                _transferType: "outcome",
            },
            {
                income: 0,
                incomeAccount: "account5",
                outcomeBankID: "5",
                outcome: 500,
                outcomeAccount: "account5",
                hold: true,
                _transferId: "transferId3",
                _transferType: "income",
            },
        ])).toEqual([
            {
                income: 15,
                incomeAccount: "account1",
                outcome: 0,
                outcomeAccount: "account1",
            },
            {
                income: 0,
                incomeAccount: "account2",
                outcome: 30,
                outcomeAccount: "account2",
            },
            {
                incomeBankID: "1",
                income: 100,
                incomeAccount: "account1",
                outcomeBankID: "2",
                outcome: 200,
                outcomeAccount: "account2",
            },
            {
                incomeBankID: "3",
                income: 300,
                incomeAccount: "account3",
                outcomeBankID: "4",
                outcome: 400,
                outcomeAccount: "account4",
                payee: null,
                hold: null,
            },
            {
                incomeBankID: "5",
                income: 500,
                incomeAccount: "account5",
                outcome: 0,
                outcomeAccount: "account5",
                payee: "Payee",
            },
            {
                income: 0,
                incomeAccount: "account5",
                outcomeBankID: "5",
                outcome: 500,
                outcomeAccount: "account5",
                hold: true,
            },
        ]);
    });
});

describe("mapObjectsGroupedByKey", () => {
    it("groups by key", () => {
        const groupMapper = jest.fn();
        mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
            object => object.key,
            groupMapper);
        expect(groupMapper).toHaveBeenCalledTimes(2);
        expect(groupMapper).toHaveBeenCalledWith([{id: "1", key: 1}, {id: "3", key: 1}], 1);
        expect(groupMapper).toHaveBeenCalledWith([{id: "2", key: 2}, {id: "4", key: 2}], 2);
    });

    it("maps groups", () => {
        const result = mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
            object => object.key,
            group => group[0].id);
        expect(result).toEqual(["1", "2"]);
    });

    it("filters empty groups", () => {
        const result = mapObjectsGroupedByKey([{id: "1", key: 1}, {id: "2", key: 2}, {id: "3", key: 1}, {id: "4", key: 2}],
            object => object.key,
            group => group[0].id === "1" ? group : null);
        expect(result).toEqual([{id: "1", key: 1}, {id: "3", key: 1}]);
    });
});
