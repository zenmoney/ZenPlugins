"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResponseAndSetCookies = exports.getCookies = exports.setCookies = exports.mergeCookies = void 0;
const errors_1 = require("../../errors");
function mergeCookies(currentCookieHeader, newCookieHeaders) {
    const parseCookies = (cookieString) => {
        return cookieString
            .split(';')
            .map(cookie => cookie.trim())
            .filter(cookie => cookie.includes('='))
            .reduce((acc, cookie) => {
            const [name, value] = cookie.split('=');
            acc[name.trim()] = value.trim();
            return acc;
        }, {});
    };
    const cookies1 = parseCookies(currentCookieHeader);
    const cookies2 = parseCookies(newCookieHeaders);
    const mergedCookies = Object.assign(Object.assign({}, cookies1), cookies2);
    return Object.entries(mergedCookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}
exports.mergeCookies = mergeCookies;
function setCookies(response) {
    const headers = response.headers;
    const newSetCookie = headers['set-cookie'];
    if (newSetCookie == null || newSetCookie == "") {
        return;
    }
    const currentSetCookie = ZenMoney.getData('cookies', '');
    ZenMoney.setData('cookies', mergeCookies(currentSetCookie, newSetCookie));
    ZenMoney.saveData();
}
exports.setCookies = setCookies;
function getCookies() {
    return ZenMoney.getData('cookies', '');
}
exports.getCookies = getCookies;
function checkResponseAndSetCookies(response) {
    if (response.status != 200) {
        throw new errors_1.TemporaryUnavailableError();
    }
    setCookies(response);
}
exports.checkResponseAndSetCookies = checkResponseAndSetCookies;
