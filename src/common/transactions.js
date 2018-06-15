export function combineIntoTransferByTransferId(transactions) {
    return mapObjectsGroupedByKey(transactions,
        (transaction) => transaction._transferId || null,
        (transactions, key) => {
            if (key === null) {
                return transactions;
            }
            if (transactions.length === 2
                    && transactions[0]._transferType !== transactions[1]._transferType) {
                const transaction1 = transactions[0];
                const transaction2 = transactions[1];
                const transferType = transaction1._transferType;
                ["", "Account", "BankID"].forEach(postfix => {
                    const value = transaction2[transferType + postfix];
                    if (value !== undefined) {
                        transaction1[transferType + postfix] = value;
                    }
                });
                const hold1 = "hold" in transaction1 ? transaction1.hold : null;
                const hold2 = "hold" in transaction2 ? transaction2.hold : null;
                if (hold1 === hold2) {
                    transaction1.hold = hold1;
                } else {
                    transaction1.hold = null;
                }
                transactions = [transaction1];
            }
            transactions.forEach(transaction => {
                delete transaction._transferId;
                delete transaction._transferType;
            });
            return transactions;
        });
}

export function mapObjectsGroupedByKey(objects, keyGetter, groupMapper) {
    const objectsByKey = new Map();
    for (const object of objects) {
        const key = keyGetter(object);
        let group = objectsByKey.get(key);
        if (!group) {
            group = [];
            objectsByKey.set(key, group);
        }
        group.push(object);
    }
    let filtered = [];
    objectsByKey.forEach((group, key) => {
        const objects = groupMapper(group, key);
        if (objects) {
            filtered = filtered.concat(objects);
        }
    });
    return filtered;
}

export function convertTransactionAccounts(transactions, accounts) {
    const filtered = [];
    for (const transaction of transactions) {
        const incomeAccount = accounts[transaction.incomeAccount];
        const outcomeAccount = accounts[transaction.outcomeAccount];
        if (!incomeAccount && !outcomeAccount) {
            continue;
        }
        if (incomeAccount) {
            transaction.incomeAccount = incomeAccount.id;
        }
        if (outcomeAccount) {
            transaction.outcomeAccount = outcomeAccount.id;
        }
        filtered.push(transaction);
    }
    return filtered;
}

export function filterTransactionDuplicates(transactions) {
    return mapObjectsGroupedByKey(transactions, transaction => {
        const payee = transaction.payee && transaction.incomeAccount === transaction.outcomeAccount ?
            transaction.payee.trim() : "";
        const date =
            typeof transaction.date === "string" ||
            typeof transaction.date === "number" ? transaction.date.toString() : transaction.date.getTime().toString();
        return `${date}_${payee}_${transaction.incomeAccount}_${transaction.income}_${transaction.outcomeAccount}_${transaction.outcome}`;
    }, group => group[0]);
}
