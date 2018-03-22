const cheerio = require("cheerio");

export function convertAccounts(xml) {
    const $ = cheerio.load(xml, {
        xml: {
            recognizeSelfClosing: true
        }
    });
    const accounts = {};
    const account = $("cardbalance").children().toArray().reduce((account, node) => {
        if (!node.name) {
            return account;
        }
        if (node.name === "card") {
            node.children.forEach(node => {
                if (!node.name) {
                    return;
                }
                const key = node.name;
                let value = node.children && node.children.length > 0 ? node.children[0].data : null;
                switch (key) {
                    case "account":
                        if (value.length === 19) {
                            value = value.substring(0, value.length - 3);
                        }
                        account.syncID = account.syncID.filter(syncID => syncID !== value);
                        account.id     = value;
                        account.number = value;
                        break;
                    case "card_number":
                        if (account.number !== value && account.syncID.indexOf(value) < 0) {
                            account.syncID.push(value);
                        }
                        break;
                    case "currency":
                        account.instrument = value;
                        break;
                    case "acc_name":
                        account.title = value;
                        break;
                    default:
                        break;
                }
            });
        }
        const key   = node.name;
        const value = node.children[0].data;
        switch (key) {
            case "fin_limit":
                account.creditLimit = parseFloat(value);
                break;
            case "balance":
                account.balance = parseFloat(value);
                break;
            default:
                break;
        }
        return account;
    }, {syncID: []});
    accounts[account.number] = account;
    account.type   = "ccard";
    account.syncID = account.syncID.map(id => {
        accounts[id] = account;
        return id.slice(-4);
    });
    if (!account.title) {
        account.title = "*" + (account.syncID[0] || account.number.slice(-4));
    }
    return accounts;
}

export function convertTransactions(xml, accounts) {
    const $ = cheerio.load(xml, {
        xml: {
            recognizeSelfClosing: true
        }
    });
    const transactions = [];
    $("statements").children().toArray().forEach(node => {
        const json = node.attribs;
        const transaction = convertTransactionJson(json);
        if (transaction) {
            checkTransactionAccount(json.card, accounts);
            transactions.push(transaction);
        }
    });
    return transactions;
}

export function convertTransactionJson(json) {
    const description = cleanDescription(json.description);
    if (description && /кредитного лимита/i.test(description)) {
        return null;
    }
    const transaction = {};
    const opAmount = parseSum(json.amount);
    const amount   = parseSum(json.cardamount);
    if (json.appcode) {
        if (amount.sum > 0) {
            transaction.incomeBankID = json.appcode;
        } else {
            transaction.outcomeBankID = json.appcode;
        }
    }
    transaction.date = new Date(json.trandate + "T" + json.trantime);
    transaction.comment = description;
    transaction.incomeAccount = json.card;
    transaction.income = amount.sum > 0 ? amount.sum : 0;
    transaction.outcomeAccount = json.card;
    transaction.outcome = amount.sum < 0 ? -amount.sum : 0;
    if (opAmount.sum !== 0 && opAmount.instrument !== amount.instrument) {
        if (amount.sum > 0) {
            transaction.opIncome = Math.abs(opAmount.sum);
            transaction.opIncomeInstrument = opAmount.instrument;
        } else {
            transaction.opOutcome = Math.abs(opAmount.sum);
            transaction.opOutcomeInstrument = opAmount.instrument;
        }
    }
    if (transaction.comment) {
        [
            parseHold,
            parseCashWithdrawal,
            parseCashReplenishment,
            parseInnerTransferTo,
            parseInnerTransferFrom,
            parseTransfer,
            parsePayee
        ].some(parser => parser(transaction, opAmount));
    }
    if (!transaction.comment) {
        delete transaction.comment;
    }
    return transaction;
}

export function checkTransactionAccount(id, accounts) {
    if (!id || !accounts || accounts[id]) {
        return;
    }
    const account = accounts[Object.keys(accounts)[0]];
    account.syncID.push(id.slice(-4));
    accounts[id] = account;
}

export function cleanDescription(description) {
    if (!description) {
        return null;
    }
    return description
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, "");
}

export function getTransferSyncId(id) {
    if (id.lastIndexOf("*") < Math.max(0, id.length - 5)) {
        return id.slice(-4);
    } else {
        return `${id.substring(0, 1)}*${id.slice(-2)}`;
    }
}

export function getTransferId(transaction, opAmount) {
    return `${transaction.date.getTime() / 1000}_${opAmount.instrument}_${opAmount.sum}`;
}

export function parseHold(transaction) {
    if (/Предавторизация/i.test(transaction.comment)) {
        transaction.hold = true;
        delete transaction.incomeBankID;
        delete transaction.outcomeBankID;
    }
    return false;
}

export function parseCashWithdrawal(transaction, opAmount) {
    if (transaction.income === 0 && /Снятие нал/i.test(transaction.comment)) {
        transaction.income = opAmount.sum;
        transaction.incomeAccount = "cash#" + opAmount.instrument;
        transaction.comment = null;
        return true;
    }
    return false;
}

export function parseCashReplenishment(transaction, opAmount) {
    if (transaction.outcome === 0 && /Пополнение.*наличными/i.test(transaction.comment)) {
        transaction.outcome = opAmount.sum;
        transaction.outcomeAccount = "cash#" + opAmount.instrument;
        transaction.comment = null;
        return true;
    }
    return false;
}

export function parseInnerTransferTo(transaction, opAmount) {
    const match = transaction.comment.match(/Перевод на свою карту\s+(\d+\*+\d+)/i);
    if (match) {
        transaction.incomeAccount = "ccard#" + opAmount.instrument + "#" + getTransferSyncId(match[1]);
        transaction.income = opAmount.sum;
        transaction.comment = null;
        transaction._transferId = getTransferId(transaction, opAmount);
        transaction._transferType = "income";
        return true;
    }
    return false;
}

export function parseInnerTransferFrom(transaction, opAmount) {
    const match = transaction.comment.match(/Перевод со своей карты\s+(\d+\*+\d+)/i);
    if (match) {
        transaction.outcomeAccount = "ccard#" + opAmount.instrument + "#" + getTransferSyncId(match[1]);
        transaction.outcome = opAmount.sum;
        transaction.comment = null;
        transaction._transferId = getTransferId(transaction, opAmount);
        transaction._transferType = "outcome";
        return true;
    }
    return false;
}

export function parseTransfer(transaction) {
    for (const regex of [
        /еревод на.*Получатель:?\s*([^.]+)/i,
        /Перевод с.*Отправитель:?\s*([^.]+)/i,
        /Зачисление.*с.*Плательщик:?\s*([^.]+)/i,
        /латеж на.*Получатель:?\s*([^.]+)/i,
        /Зарплата,\s+(.+)$/i
    ]) {
        const match = transaction.comment.match(regex);
        if (match) {
            transaction.payee = match[1];
            transaction.comment = null;
            return true;
        }
    }
    return false;
}

export function parsePayee(transaction) {
    const i = transaction.comment.indexOf(":");
    if (i < 0 || i + 1 >= transaction.comment.length) {
        return false;
    }
    let payee = transaction.comment.substring(i + 1).replace(/\.*\s*Код квитанции:.*$/i, "").trim();
    if (payee) {
        transaction.payee = payee;
        transaction.comment = null;
        return true;
    }
    return false;
}

export function parseSum(text) {
    const parts = text.split(/\s/);
    const sum = parseFloat(parts[0]);
    console.assert(!isNaN(sum), `failed to parse sum in ${text}`);
    return {
        sum,
        instrument: parts.length <= 1 ? "UAH" : parts[1]
    };
}
