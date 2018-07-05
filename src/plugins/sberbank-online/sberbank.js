import {MD5} from "jshashes";
import _ from "lodash";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import * as network from "../../common/network";
import * as retry from "../../common/retry";
import {formatDateSql, parseDate, toMoscowDate} from "./converters";

const qs = require("querystring");
const md5 = new MD5();

const deviceName = "Xperia Z2";
const version = "9.20";
const appVersion = "7.11.1";

const defaultHeaders = {
    "User-Agent": "Mobile Device",
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": "online.sberbank.ru:4477",
    "Connection": "Keep-Alive",
    "Accept-Encoding": "gzip",
};

export async function login(login, pin, auth) {
    //Migration
    if (!ZenMoney.getData("devID") && ZenMoney.getData("devid")) {
        ZenMoney.setData("devID", ZenMoney.getData("devid"));
        ZenMoney.setData("devIDOld", getUid(36) + "0000");
        ZenMoney.setData("devid", undefined);
    }
    if (!ZenMoney.getData("mGUID") && ZenMoney.getData("guid")) {
        ZenMoney.setData("mGUID", ZenMoney.getData("guid"));
        ZenMoney.setData("guid", undefined);
    }

    if (!ZenMoney.getData("devID")) {
        ZenMoney.setData("devID", md5.hex(login) + "0000");
        ZenMoney.setData("devIDOld", getUid(36) + "0000");
    }
    ZenMoney.setData("simId", undefined);
    ZenMoney.setData("imei", undefined);

    let response;

    if (auth && auth.pfm === null) {
        auth = null;
    }
    if (auth) {
        response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/renewSession.do`, {
            headers: {
                ...defaultHeaders,
                "Accept": "application/x-www-form-urlencoded",
                "Accept-Charset": "windows-1251",
                "Host": `${auth.api.host}:4477`,
                "Cookie": `${auth.api.cookie}`,
            },
            parse: (body) => {
                if (body) {
                    return network.parseXml(body);
                } else {
                    return {response: {}};
                }
            },
        }, null);
        if (response.body && response.body.status === "0") {
            return auth;
        }
    }

    const commonBody = {
        "version": version,
        "appType": "android",
        "appVersion": appVersion,
        "deviceName": deviceName,
    };

    if (ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/login.do", {
            body: {
                ...commonBody,
                "operation": "button.login",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "isLightScheme": false,
                "devID": ZenMoney.getData("devID"),
                "mobileSdkData": JSON.stringify(createSdkData(login)),
            },
            sanitizeRequestLog: {body: {mGUID: true, password: true, devID: true, mobileSdkData: true}},
            sanitizeResponseLog: {body: {loginData: {token: true}}},
        }, null);
        if (response.body.status === "7") {
            ZenMoney.setData("mGUID", undefined);
        }
    }

    if (!ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            body: {
                ...commonBody,
                "operation": "register",
                "login": login,
                "devID": ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld"),
            },
            sanitizeRequestLog: {body: {login: true, devID: true, devIDOld: true}},
            sanitizeResponseLog: {body: {confirmRegistrationStage: {mGUID: true}}},
        }, null);
        if (response.body.status === "1" && response.body.error) {
            throw new TemporaryError(response.body.error);
        }
        validateResponse(response, response => response.body.status === "0"
            && _.get(response, "body.confirmRegistrationStage.mGUID"));

        ZenMoney.setData("mGUID", response.body.confirmRegistrationStage.mGUID);

        if (_.get(response, "body.confirmInfo.type") === "smsp") {
            const code = await ZenMoney.readLine("Введите код для входа в Сбербанк Онлайн для Android из SMS или пуш-уведомления", {
                time: 120000,
                inputType: "number",
            });
            if (!code || !code.trim()) {
                throw new TemporaryError("Получен пустой код авторизации устройства");
            }
            response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
                body: {
                    "operation": "confirm",
                    "mGUID": ZenMoney.getData("mGUID"),
                    "smsPassword": code,
                    "version": version,
                    "appType": "android",
                },
                sanitizeRequestLog: {body: {mGUID: true, smsPassword: true}},
            }, null);
            if (response.body.status === "1") {
                throw new TemporaryError("Вы ввели некорректные реквизиты доступа или код из SMS. Повторите подключение синхронизации.");
            } else {
                validateResponse(response, response => response.body.status === "0");
            }
        }

        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            body: {
                ...commonBody,
                "operation": "createPIN",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "isLightScheme": false,
                "devID": ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld"),
                "mobileSdkData": JSON.stringify(createSdkData(login)),
            },
            sanitizeRequestLog: {body: {mGUID: true, password: true, devID: true, devIDOld: true, mobileSdkData: true}},
            sanitizeResponseLog: {body: {loginData: {token: true}}},
        }, null);
    }

    if (response.body.status === "1" && response.body.error) {
        throw new InvalidPreferencesError(response.body.error);
    }
    validateResponse(response, response => response.body && response.body.status === "0"
        && _.get(response, "body.loginData.token")
        && _.get(response, "body.loginData.host"));

    const token = response.body.loginData.token;
    const host = response.body.loginData.host;

    response = await fetchXml(`https://${host}:4477/mobile9/postCSALogin.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${host}:4477`,
        },
        body: {
            "token": token,
            "appName": "????????",
            "appBuildOSType": "android",
            "appBuildType": "RELEASE",
            "appFormat": "STANDALONE",
            "deviceType": "Android SDK built for x86_64",
            "deviceOSType": "android",
            "deviceOSVersion": "6.0",
            "appVersion": appVersion,
            "deviceName": deviceName,
        },
        sanitizeRequestLog: {body: {token: true}},
        sanitizeResponseLog: {body: {person: true}},
    }, response => _.get(response, "body.loginCompleted") === "true");

    return {api: {token, host, cookie: getCookie(response)}};
}

export async function loginInPfm(auth) {
    let response;
    // if (auth.pfm) {
    //     response = await network.fetchJson(`https://${auth.pfm.host}/pfm/api/v1.20/budgets`, {
    //         method: "GET",
    //         headers: {
    //             "User-Agent": "Mobile Device",
    //             "Accept": "application/json",
    //             "Content-Type": "application/json;charset=UTF-8",
    //             "Accept-Charset": "UTF-8",
    //             "Host": `${auth.pfm.host}`,
    //             "Connection": "Keep-Alive",
    //             "Accept-Encoding": "gzip",
    //             "Cookie": auth.pfm.cookie,
    //         },
    //     });
    //     if (response.body && (response.body.statusCode === 4 || response.body.statusCode === 0)) {
    //         return auth;
    //     }
    // }
    // if (auth && !auth.api.token) {
    //     return {...auth, pfm: null};
    // }
    response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/unifiedClientSession/getToken.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
            "Content-Type": "application/x-www-form-urlencoded;charset=windows-1251",
            "Accept": "application/x-www-form-urlencoded",
            "Accept-Charset": "windows-1251",
            "Cookie": auth.api.cookie,
        },
        body: {systemName: "pfm"},
        sanitizeResponseLog: {body: {token: true}},
    }, response => _.get(response, "body.host") && _.get(response, "body.token"));
    const host = response.body.host;
    try {
        response = await network.fetchJson(`https://${host}/pfm/api/v1.20/login?token=${response.body.token}`, {
            method: "GET",
            headers: {
                "User-Agent": "Mobile Device",
                "Accept": "application/json",
                "Content-Type": "application/json;charset=UTF-8",
                "Accept-Charset": "UTF-8",
                "Host": `${host}`,
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip",
                "Cookie": auth.api.cookie,
            },
            sanitizeRequestLog: {url: true, headers: {Cookie: true}},
            sanitizeResponseLog: {url: true, headers: {"set-cookie": true}},
        });
    } catch (e) {
        if (e.response && typeof e.response.body === "string" && e.response.body.indexOf("<H1>SRVE") >= 0) {
            // PFM server error
            return {...auth, pfm: null};
        } else {
            throw e;
        }
    }
    return {...auth, pfm: {host, cookie: getCookie(response)}};
}

async function fetchTransactionsInPfmWithType(auth, accountIds, fromDate, toDate, income, ignoreToDateError) {
    if (!auth.pfm) {
        return [];
    }
    const currentYear = toMoscowDate(new Date()).getFullYear();
    const mskFromDate = toMoscowDate(fromDate);
    const mskToDate = toMoscowDate(toDate);
    if (mskFromDate.getFullYear() < currentYear) {
        mskFromDate.setFullYear(currentYear, 0, 1);
    }
    let response = await network.fetchJson(`https://${auth.pfm.host}/pfm/api/v1.20/extracts`
        + `?from=${formatDate(mskFromDate)}&to=${formatDate(mskToDate)}`
        + `&showCash=true&showCashPayments=true&showOtherAccounts=true`
        + `&selectedCardId=${accountIds.join(",")}&income=${income ? "true" : "false"}`, {
        method: "GET",
        headers: {
            "User-Agent": "Mobile Device",
            "Accept": "application/json",
            "Content-Type": "application/json;charset=UTF-8",
            "Accept-Charset": "UTF-8",
            "Host": `${auth.pfm.host}`,
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
            "Cookie": auth.pfm.cookie,
        },
        sanitizeRequestLog: {headers: {Cookie: true}},
    });
    if (!ignoreToDateError && response && response.body
            && response.body.statusCode === 2
            && response.body.errors
            && response.body.errors[0]
            && response.body.errors[0].field === "to") {
        return fetchTransactionsInPfmWithType(auth, accountIds,
            fromDate, new Date(toDate.getTime() - 24 * 3600 * 1000), income, true);
    }
    if (response && response.body && response.body.statusCode === 9) {
        console.log(`could not get data from pfm for accounts ${accountIds}`);
        return [];
    }
    validateResponse(response, response => response.body
        && response.body.statusCode === 0 && Array.isArray(response.body.operations));
    return response.body.operations;
}

export async function fetchTransactionsInPfm(auth, accountIds, fromDate, toDate) {
    const transactions = await fetchTransactionsInPfmWithType(auth, accountIds, fromDate, toDate, false);
    transactions.push(...await fetchTransactionsInPfmWithType(auth, accountIds, fromDate, toDate, true));
    return _.sortBy(transactions, apiTransaction => apiTransaction.id).reverse();
}

export async function fetchAccounts(auth) {
    const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/products/list.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
            "Content-Type": "application/x-www-form-urlencoded;charset=windows-1251",
            "Cookie": auth.api.cookie,
        },
        body: {showProductType: "cards,accounts,imaccounts,loans"},
    });
    const types = ["card", "account", "loan", "target"];
    return (await Promise.all(types.map(type => {
        return Promise.all(getArray(_.get(response.body, `${type}s.${type}`)).map(async account => {
            const params = type === "target"
                ? account.account && account.account.id
                    ? {id: account.account.id, type: "account"}
                    : null
                : account.mainCardId
                    ? null
                    : {id: account.id, type};
            return {
                account: account,
                details: params ? await fetchAccountDetails(auth, params) : null,
            };
        }));
    }))).reduce((accounts, objects, i) => {
        accounts[types[i]] = objects;
        return accounts;
    }, {});
}

async function fetchAccountDetails(auth, {id, type}) {
    const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/${type}s/info.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
            "Content-Type": "application/x-www-form-urlencoded;charset=windows-1251",
            "Cookie": auth.api.cookie,
        },
        body: {id: id},
    }, response => _.get(response, "body.detail"));
    return response.body;
}

export async function fetchTransactions(auth, {id, type}, fromDate, toDate) {
    const isFetchingByDate = type !== "card";
    const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/${type}s/abstract.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
            "Referer": `Android/6.0/${appVersion}`,
            "Cookie": auth.api.cookie,
        },
        body: isFetchingByDate
            ? {id, from: formatDate(fromDate), to: formatDate(toDate)}
            : {id, count: 10, paginationSize: 10},
    });
    let transactions = type === "loan"
        ? getArray(_.get(response, "body.elements.element"))
        : getArray(_.get(response, "body.operations.operation"));
    if (!isFetchingByDate || type === "loan") {
        const fromDateStr = formatDateSql(fromDate);
        const toDateStr = formatDateSql(toDate);
        transactions = transactions.filter(transaction => {
            const dateStr = formatDateSql(new Date(parseDate(transaction.date)));
            return dateStr >= fromDateStr && dateStr <= toDateStr;
        });
    }
    return transactions;
}

export async function makeTransfer(login, auth, {fromAccount, toAccount, sum}) {
    const response = await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/payment.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
        },
        body: {
            fromResource: fromAccount,
            exactAmount: "destination-field-exact",
            operation: "save",
            buyAmount: sum,
            transactionToken: auth.api.token,
            form: "InternalPayment",
            toResource: toAccount,
        },
        sanitizeRequestLog: {body: {transactionToken: true}},
    }, response => _.get(response, "body.transactionToken") && _.get(response, "body.document.id"));

    const id = response.body.document.id;
    const transactionToken = response.body.transactionToken;

    await fetchXml(`https://${auth.api.host}:4477/mobile9/private/payments/confirm.do`, {
        headers: {
            ...defaultHeaders,
            "Host": `${auth.api.host}:4477`,
        },
        body: {
            mobileSdkData: JSON.stringify(createSdkData(login)),
            operation: "confirm",
            id: id,
            form: "InternalPayment",
            transactionToken: transactionToken,
        },
    }, response => _.get(response, "body.document.status") === "EXECUTED");
}

async function fetchXml(url, options = {}, predicate = () => true) {
    options = {
        method: "POST",
        headers: defaultHeaders,
        stringify: qs.stringify,
        parse: network.parseXml,
        ...options,
    };

    _.set(options, "sanitizeRequestLog.headers.cookie", true);
    _.set(options, "sanitizeRequestLog.headers.Cookie", true);
    _.set(options, "sanitizeResponseLog.headers.set-cookie", true);

    if (typeof _.get(options, "sanitizeResponseLog.body") === "object") {
        options.sanitizeResponseLog.body = {response: options.sanitizeResponseLog.body};
    }

    let response;
    try {
        response = await retry.retry({
            getter: async () => {
                const response = await network.fetch(url, options);
                validateResponse(response, response => response && response.body && response.body.response);
                response.body = response.body.response;
                response.body.error = getErrorMessage(response.body);
                response.body.status = _.get(response, "body.status.code");
                return response;
            },
            predicate: response => response.body.status === "0" || !isTemporaryError(response.body.error),
            maxAttempts: 5,
        });
    } catch (e) {
        if (e instanceof retry.RetryError
                || (e.message && e.message.indexOf("could not satisfy predicate in") >= 0)) {
            throw new TemporaryError("Информация из Сбербанка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите \"Отправить лог последней синхронизации разработчикам\".");
        } else {
            throw e;
        }
    }

    if (response.body.status !== "0"
            && response.body.error
            && response.body.error.indexOf("личный кабинет заблокирован") >= 0) {
        throw new InvalidPreferencesError(response.body.error);
    }
    if (predicate) {
        validateResponse(response, response => response.body.status === "0" && predicate(response));
    }

    return response;
}

export function getErrorMessage(xmlObject, maxDepth = 3) {
    if (!xmlObject || maxDepth <= 0) {
        return null;
    }
    if (xmlObject.errors
            && xmlObject.errors.error
            && xmlObject.errors.error.text) {
        return xmlObject.errors.error.text;
    }
    if (maxDepth > 1) {
        for (const key in xmlObject) {
            if (xmlObject.hasOwnProperty(key)) {
                const error = getErrorMessage(xmlObject[key], maxDepth - 1);
                if (error) {
                    return error;
                }
            }
        }
    }
    return null;
}

function isTemporaryError(message) {
    return message && (message.indexOf("АБС временно") >= 0
        || message.indexOf("АБС не доступна") >= 0
        || message.indexOf("Во время выполнения операции произошла ошибка") >= 0
        || message.indexOf("По техническим причинам Вы не можете выполнить данную операцию") >= 0);
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

function getCookie(response) {
    let cookie;
    if (response.headers
            && response.headers["set-cookie"]
            && response.headers["set-cookie"].indexOf("JSESSIONID") === 0) {
        cookie = response.headers["set-cookie"].split(";")[0];
    } else {
        cookie = ZenMoney.getCookie("JSESSIONID");
        if (cookie) {
            cookie = "JSESSIONID=" + cookie;
        }
    }
    console.assert(cookie, "could not get cookie from response", response.url);
    return cookie;
}

function getArray(object) {
    return object === null || object === undefined
        ? []
        : Array.isArray(object) ? object : [object];
}

export function formatDate(date) {
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join(".");
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getUid(length, chars) {
    if (typeof chars !== "string") {
        chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    }
    const buf = [];
    for (let i = 0; i < length; i++) {
        buf.push(chars[getRandomInt(0, chars.length - 1)]);
    }
    return buf.join("");
}

function generateHex(mask, digits) {
    let i = 0;
    return mask.replace(/x/ig, () => {
        return digits[i++];
    });
}

function createSdkData(login) {
    const dt = new Date();
    const hex = md5.hex(login + "sdk_data");
    const rsa_app_key = md5.hex(login + "rsa app key").toUpperCase();

    const obj = {
        "TIMESTAMP": dt.getUTCFullYear() + "-"
            + toAtLeastTwoDigitsString(dt.getUTCMonth() + 1) + "-"
            + toAtLeastTwoDigitsString(dt.getUTCDate()) + "T"
            + dt.getUTCHours() + ":" + dt.getUTCMinutes() + ":" + dt.getUTCSeconds() + "Z",
        "HardwareID": generateImei(login, "35472406******L"),
        "SIM_ID": generateSimSN(login, "2500266********L"),
        "PhoneNumber": "",
        "GeoLocationInfo": [
            {
                "Longitude": (37.0 + Math.random()).toString(10),
                "Latitude": (55.0 + Math.random()).toString(10),
                "HorizontalAccuracy": "5",
                "Altitude": (150 + Math.floor(Math.random() * 20)).toString(10),
                "AltitudeAccuracy": "5",
                "Timestamp": (dt.getTime() - Math.floor(Math.random() * 1000000)).toString(10),
                "Heading": (Math.random() * 90).toString(10),
                "Speed": "3",
                "Status": "3",
            },
        ],
        "DeviceModel": "D6503",
        "MultitaskingSupported": true,
        "deviceName": deviceName,
        "DeviceSystemName": "Android",
        "DeviceSystemVersion": "22",
        "Languages": "ru",
        "WiFiMacAddress": generateHex("44:d4:e0:xx:xx:xx", hex.substr(0, 6)),
        "WiFiNetworksData": {
            "BBSID": generateHex("5c:f4:ab:xx:xx:xx", hex.substr(6, 12)),
            "SignalStrength": Math.floor(-30 - Math.random() * 20).toString(10),
            "Channel": "null",
            "SSID": "TPLink",
        },
        "CellTowerId": (12875 + Math.floor(Math.random() * 10000)).toString(10),
        "LocationAreaCode": "9722",
        "ScreenSize": "1080x1776",
        "RSA_ApplicationKey": rsa_app_key,
        "MCC": "250",
        "MNC": "02",
        "OS_ID": hex.substring(12, 16),
        "SDK_VERSION": "2.0.1",
        "Compromised": 0,
        "Emulator": 0,
    };

    return obj;
}

function generateImei(val, mask) {
    const g_imei_default = "35374906******L"; //Samsung
    const serial = String(Math.abs(crc32(val) % 1000000));

    if (!mask) {
        mask = g_imei_default;
    }

    mask = mask.replace(/\*{6}/, serial);
    mask = mask.replace(/L/, luhnGet(mask.replace(/L/, "")));

    return mask;
}

function generateSimSN(val, mask) {
    const g_simsn_default = "897010266********L"; //билайн
    const serial = (Math.abs(crc32(val + "simSN") % 100000000)).toString(10);

    if (!mask) {
        mask = g_simsn_default;
    }

    mask = mask.replace(/\*{8}/, serial);
    mask = mask.replace(/L/, luhnGet(mask.replace(/L/, "")));

    return mask;
}

function crc32(str) {
    function makeCRCTable() {
        let c;
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    }

    const crcTable = makeCRCTable();
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

function luhnGet(num) {
    const arr = [];
    num = num.toString();
    for (let i = 0; i < num.length; i++) {
        if (i % 2 === 0) {
            const m = parseInt(num[i], 10) * 2;
            if (m > 9) {
                arr.push(m - 9);
            } else {
                arr.push(m);
            }
        } else {
            const n = parseInt(num[i], 10);
            arr.push(n);
        }
    }

    const summ = arr.reduce((a, b) => {
        return a + b;
    });
    return (summ % 10);
}
