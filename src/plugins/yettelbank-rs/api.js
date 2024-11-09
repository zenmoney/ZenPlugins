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
exports.fetchTransactions = exports.fetchAccounts = exports.login = void 0;
const fetchApi_1 = require("./fetchApi");
const errors_1 = require("../../errors");
function login(preferences, auth) {
    return __awaiter(this, void 0, void 0, function* () {
        if (auth != null) {
            console.log("Auth is not null");
            return { auth };
        }
        if (preferences.login.length === 0 || preferences.password.length === 0) {
            throw new errors_1.InvalidLoginOrPasswordError('Username or password can not be empty');
        }
        return { auth: yield (0, fetchApi_1.fetchAuthorization)(preferences) };
    });
}
exports.login = login;
function fetchAccounts(session) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, fetchApi_1.fetchAllAccounts)(session);
    });
}
exports.fetchAccounts = fetchAccounts;
function fetchTransactions(session, product, fromDate, toDate) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, fetchApi_1.fetchProductTransactions)(product, session);
    });
}
exports.fetchTransactions = fetchTransactions;
