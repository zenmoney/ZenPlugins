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
    for (const [key, group] of objectsByKey.entries()) {
        const objects = groupMapper(group, key);
        if (objects) {
            filtered = filtered.concat(objects);
        }
    }
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
