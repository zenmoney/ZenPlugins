import _ from "underscore";

function getReplacements(result) {
    const transfers = result.map(({bankTransactions, transactions}) => {
        return _.zip(bankTransactions, transactions)
            .filter(([bankTransaction]) => bankTransaction.isElectronicTransfer)
            .map((transactionPair) => {
                const [bankTransaction] = transactionPair;
                return {
                    transferId: [
                        bankTransaction.transactionDate.toISOString(),
                        Math.abs(bankTransaction.transactionAmount),
                        bankTransaction.transactionCurrency,
                    ].join("|"),
                    transactionPair,
                };
            });

    });
    return _.reduce(_.groupBy(_.flatten(transfers), (x) => x.transferId), (memo, transfers, transferId) => {
        if (transfers.length === 2) {
            const transactions = transfers.map(({transactionPair: [bankTransaction, transaction]}) => transaction);
            const [outcomeTransaction, incomeTransaction] = _.sortBy(transactions, (x) => x.income);
            memo[outcomeTransaction.id] = _.defaults(...[
                {
                    incomeBankID: incomeTransaction.id,
                    outcomeBankID: outcomeTransaction.id,
                },
                _.omit(incomeTransaction, "id", "outcome", "outcomeAccount"),
                _.omit(outcomeTransaction, "id", "income", "incomeAccount"),
            ]);
            memo[incomeTransaction.id] = null;
        } else {
            console.error("cannot merge non-pair transfer", {transferId, transfers});
        }
        return memo;
    }, {});
}

export function mergeTransfers(result) {
    const replacements = getReplacements(result);
    return result.map(({transactions, ...rest}) => ({
        ...rest,
        transactions: _.compact(transactions.map((x) => {
            const replacement = replacements[x.id];
            return _.isUndefined(replacement) ? x : replacement;
        })),
    }));
}
