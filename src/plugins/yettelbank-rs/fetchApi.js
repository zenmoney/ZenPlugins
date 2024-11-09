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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProductTransactions = exports.fetchAllAccounts = exports.fetchAuthorization = exports.parseAccounts = void 0;
const network_1 = require("../../common/network");
const errors_1 = require("../../errors");
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const cheerio_1 = __importDefault(require("cheerio"));
const converters_1 = require("./converters");
const exceptions_1 = require("./exceptions");
const baseUrl = 'https://online.mobibanka.rs/';
function fetchApi(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, network_1.fetch)(baseUrl + url, options !== null && options !== void 0 ? options : {});
    });
}
// First GET request to fetch initial cookies & workflow id for actual auth request
function initAuthorizationWorkflow(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const parseWorkflowId = (body) => {
            const $ = cheerio_1.default.load(body);
            return $('#WorkflowId').val();
        };
        const response = yield fetchApi(baseUrl + url, {
            method: 'GET',
            headers: { 'Accept': '*/*', 'X-Requested-With': 'XMLHttpRequest' },
            sanitizeResponseLog: { headers: { 'set-cookie': true } }
        });
        (0, helpers_1.checkResponseAndSetCookies)(response);
        return parseWorkflowId(response.body);
    });
}
function sendAuthRequest(url, workflowId, username, password) {
    return fetchApi(baseUrl + url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': (0, helpers_1.getCookies)()
        },
        body: `UserName=${username}&Password=${password}&WorkflowId=${workflowId}&X-Requested-With=XMLHttpRequest`,
        sanitizeResponseLog: { headers: { 'set-cookie': true } }
    });
}
// POST request with empty passwords to fetch auth cookies
function fetchAuth(url, workflowId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield sendAuthRequest(url, workflowId, username, '');
        (0, helpers_1.checkResponseAndSetCookies)(response);
    });
}
// Send POST request with login and password
function fetchLogin(url, workflowId, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const checkErrorInResponse = (body) => {
            const $ = cheerio_1.default.load(body);
            return $('.common-error-msg').val();
        };
        const response = yield sendAuthRequest(url, workflowId, username, password);
        (0, helpers_1.checkResponseAndSetCookies)(response);
        const error = checkErrorInResponse(response.body);
        if (error) {
            throw new errors_1.InvalidLoginOrPasswordError(error);
        }
    });
}
function extractAccountInfo(loaded_cheerio, accountId) {
    const accountElement = loaded_cheerio(`#pie-stats-${accountId}`);
    if (accountElement.length === 0) {
        console.log('Account not found');
        return null;
    }
    const name = accountElement.find('.stat-name').text().trim();
    const currency = accountElement.find('option[selected="selected"]').val();
    const balanceText = accountElement.find('.amount-stats.big-nr p').first().text().trim();
    const balance = parseFloat(balanceText.replace(/,/g, ''));
    return {
        id: accountId,
        name: name,
        currency: currency,
        balance: balance,
    };
}
function parseAccounts(body) {
    const accountIds = [];
    const $ = cheerio_1.default.load(body);
    $('#AccountPicker option').each((_, element) => {
        const accountNumber = $(element).attr('value');
        if (accountNumber) {
            accountIds.push(accountNumber);
        }
    });
    const accounts = accountIds.map(id => extractAccountInfo($, id)).filter(Boolean);
    if (!accounts) {
        throw new exceptions_1.AccountsInfoNotFound();
    }
    return accounts;
}
exports.parseAccounts = parseAccounts;
// ################################################
// #                main functionality            #
// ################################################
function fetchAuthorization({ login, password }) {
    return __awaiter(this, void 0, void 0, function* () {
        // It happens on server side
        if (login !== 'example' || password !== 'example') {
            throw new errors_1.InvalidLoginOrPasswordError();
        }
        const workflowId = yield initAuthorizationWorkflow('Identity');
        yield fetchAuth('Identity', workflowId, login);
        yield fetchLogin('Identity', workflowId, login, password);
        return { cookieHeader: (0, helpers_1.getCookies)() };
    });
}
exports.fetchAuthorization = fetchAuthorization;
function fetchAllAccounts(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetchApi('', {
            method: 'GET',
            headers: {
                'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Cookie': (0, helpers_1.getCookies)()
            }
        });
        return parseAccounts(response.body).map(converters_1.convertAccount);
    });
}
exports.fetchAllAccounts = fetchAllAccounts;
function fetchProductTransactions({ id, transactionNode }, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetchApi(`transactions_${transactionNode}${id}.json`);
        assert((0, lodash_1.isArray)(response.body), 'cant get transactions array', response);
        return response.body;
    });
}
exports.fetchProductTransactions = fetchProductTransactions;
