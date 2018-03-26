function getLast4Digits(id) {
    id = id.toString().trim();
    if (/\d\d\d\d$/.test(id) && !/[^\d\*]/.test(id)) {
        return id.slice(-4);
    } else {
        return id;
    }
}

function sanitizeSyncId(id) {
    id = id.toString().trim();
    return id.length > 9 ? "*****" + id.substring(5) : id;
}

export function convertAccountSyncID(accounts) {
    const accountsByLast4Digits = {};
    for (const account of accounts) {
        console.assert(Array.isArray(account.syncID), "account.syncID should be array of strings");
        for (const id of account.syncID) {
            console.assert(typeof id === "number" || typeof id === "string",
                "account.syncID should be array of strings");
            const key = account.instrument + "_" + getLast4Digits(id);
            let group = accountsByLast4Digits[key];
            if (!group) {
                accountsByLast4Digits[key] = group = [];
            }
            group.push(account);
        }
    }
    for (const account of accounts) {
        const syncID = [];
        for (let id of account.syncID) {
            const key   = account.instrument + "_" + getLast4Digits(id);
            const group = accountsByLast4Digits[key];
            id = group.length > 1 ? sanitizeSyncId(id) : getLast4Digits(id);
            if (syncID.indexOf(id) < 0) {
                syncID.push(id);
            }
        }
        account.syncID = syncID;
    }
    return accounts;
}

export function convertAccountMapToArray(accounts) {
    const filtered = [];
    for (const id in accounts) {
        const account = accounts[id];
        if (account.id.toString() === id) {
            filtered.push(account);
        }
    }
    return filtered;
}
