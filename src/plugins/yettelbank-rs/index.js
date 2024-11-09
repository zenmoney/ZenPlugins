"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrape = void 0;
const api_1 = require("./api");
const converters_1 = require("./converters");
const scrape = ({ preferences, fromDate, toDate }) => __awaiter(void 0, void 0, void 0, function* () {
    toDate = toDate !== null && toDate !== void 0 ? toDate : new Date();
    const session = yield (0, api_1.login)(preferences, ZenMoney.getData('auth'));
    ZenMoney.setData('auth', session.auth);
    ZenMoney.saveData();
    const accounts = [];
    const transactions = [];
    yield Promise.all((0, converters_1.convertAccounts)(yield (0, api_1.fetchAccounts)(session)).map(({ account, products }) => __awaiter(void 0, void 0, void 0, function* () {
        accounts.push(account);
        if (ZenMoney.isAccountSkipped(account.id)) {
            return;
        }
        yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
            const apiTransactions = yield (0, api_1.fetchTransactions)(session, product, fromDate, toDate);
            for (const apiTransaction of apiTransactions) {
                transactions.push((0, converters_1.convertTransaction)(apiTransaction, account));
            }
        })));
    })));
    return {
        accounts,
        transactions
    };
});
exports.scrape = scrape;
