import {MD5} from "jshashes";
import * as _ from "lodash";
import padLeft from "pad-left";
import * as network from "../../common/network";
import {formatDateSql, toMoscowDate} from "../sberbank-online/converters";

const cheerio = require("cheerio");
const md5 = new MD5();

const PROTOCOL_VERSION = "2.37.3";
const APP_VERSION = "9.37.16";

function getByteLength(str) {
    // returns the byte length of an utf8 string
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
        let code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s += 2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

export function getSignature(protocolVersion, bodyStr) {
    const protocolStrLength = protocolVersion.length;
    const num = 1 + protocolStrLength + getByteLength(bodyStr);
    let symbols = _.chunk(padLeft(num.toString(16), 8, "0").split(""), 2)
        .map(hexPair => hexPair.join(""))
        .concat(padLeft(protocolStrLength.toString(16), 2, "0"));
    return symbols
        .map(hexStr => String.fromCharCode(parseInt(hexStr, 16)))
        .join("");
}

export function createSdkData(login) {
    const date = new Date();
    const osId = md5.hex(login + "sdk_data").substring(12, 29);
    const rsaAppKey = md5.hex(login + "rsa app key").toUpperCase();
    const timestamp = date.getUTCFullYear() + "-"
        + padLeft(date.getUTCMonth() + 1, 2, "0") + "-"
        + padLeft(date.getUTCDate(), 2, "0") + "T"
        + padLeft(date.getUTCHours(), 2, "0") + ":"
        + padLeft(date.getUTCMinutes(), 2, "0") + ":"
        + padLeft(date.getUTCSeconds(), 2, "0") + "Z";
    return `{
"TIMESTAMP": "${timestamp}",
"HardwareID": "-1",
"SIM_ID": "-1",
"PhoneNumber": "-1",
"DeviceModel": "Android SDK built for x86_64",
"MultitaskingSupported": true,
"DeviceName": "generic_x86_64",
"DeviceSystemName": "Android",
"DeviceSystemVersion": "23",
"Languages": "ru",
"WiFiMacAddress": "02:00:00:00:00:00",
"ScreenSize": "480x800",
"RSA_ApplicationKey": "${rsaAppKey}",
"OS_ID": "${osId}",
"SDK_VERSION": "3.6.0",
"Compromised": 1,
"Emulator": 4
}`;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

async function burlapRequest(options) {
    const id = getRandomInt(-2000000000, 2000000000).toFixed(0);
    let payload = null;
    let response;
    try {
        response = await network.fetch("https://mb.vtb24.ru/mobilebanking/burlap/", {
            method: "POST",
            headers: {
                "mb-protocol-version": PROTOCOL_VERSION,
                "mb-app-version": APP_VERSION,
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 6.0; Android SDK built for x86_64 Build/MASTER)",
                "Host": "mb.vtb24.ru",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip",
            },
            body: options.body || null,
            sanitizeRequestLog: {headers: {"cookie": true}, body: _.get(options, "sanitizeRequestLog.body")},
            sanitizeResponseLog: {headers: {"set-cookie": true}, body: _.get(options, "sanitizeResponseLog.body")},
            stringify: (body) => {
                body = {
                    __type: "com.mobiletransport.messaging.DefaultMessageImpl",
                    correlationId: getRandomInt(-2000000000, 2000000000).toFixed(0),
                    id,
                    localCacheId: 0,
                    sendTimestamp: Math.round(new Date().getTime()),
                    theme: options.theme || "Default theme",
                    timeToLive: 30000,
                    payload: body,
                    properties: {
                        __type: "java.util.Hashtable",
                        PROTOVERSION: PROTOCOL_VERSION,
                        DEVICE_MODEL: "Android SDK built for x86_64",
                        DEVICE_MANUFACTURER: "unknown",
                        APP_VERSION: APP_VERSION,
                        PLATFORM: "ANDROID",
                        DEVICE_PLATFORM: "ANDROID",
                        OS: "Android OS 6.0",
                        APPVERSION: APP_VERSION,
                        DEVICE: "Android SDK built for x86_64",
                        DEVICEUSERNAME: "android-build",
                        DEVICE_OS: "Android OS 6.0",
                        ...options.token && {"CLIENT-TOKEN": options.token},
                        ...options.sdkData && {
                            AF_MOBILE_DEVICE: options.sdkData,
                            AF_DEVICE_PRINT: "",
                        },
                    },
                };
                const bodyStr = stringifyToXml(body);
                const signature = getSignature(PROTOCOL_VERSION, bodyStr);
                return (getByteLength(signature) > 5
                    ? signature.substring(1)
                    : signature) + PROTOCOL_VERSION + bodyStr;
            },
            parse: (bodyStr) => {
                if (bodyStr === "") {
                    throw new TemporaryError("У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии");
                }
                const i = bodyStr.indexOf(PROTOCOL_VERSION);
                console.assert(i >= 0 && i <= 10, "Could not get response protocol version");
                const body = parseXml(bodyStr.substring(i + PROTOCOL_VERSION.length));
                console.assert(typeof body === "object"
                    && body.correlationId === id, "unexpected response");
                payload = body.payload;
                if (payload) {
                    reduceDuplicatesByTypeAndId(payload);
                    return resolveCycles(payload);
                }
                return payload;
            },
        });
    } catch (e) {
        if (e.response && e.response.status === 503) {
            throw new TemporaryError("Информация из Банка ВТБ временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите \"Отправить лог последней синхронизации разработчикам\".");
        } else {
            throw e;
        }
    }
    response.body = payload;
    if (response.body
            && response.body.__type === "ru.vtb24.mobilebanking.protocol.ErrorResponse"
            && response.body.message
            && [
                "операцию позже",
                "временно недоступна",
            ].some(str => response.body.message.indexOf(str) >= 0)) {
        throw new TemporaryError("Информация из Банка ВТБ временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите \"Отправить лог последней синхронизации разработчикам\".");
    }
    return response;
}

export async function login(login, password) {
    const sdkData = createSdkData(login);
    let response = await burlapRequest({
        sdkData,
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.StartSessionRequest",
            sessionContext: {
                __type: "ru.vtb24.mobilebanking.protocol.security.SessionContextMto",
                certificateNumber: null,
                clientIp: null,
                outerSessionId: "VTB_TEST_APP",
                timeoutDuration: null,
                userAgent: null,
            },
        },
        sanitizeResponseLog: {body: {sessionId: true, userInfo: true}},
    });
    const token = response.body.sessionId;
    response = await burlapRequest({
        sdkData,
        token,
        theme: "GetLoginModeRequest theme",
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.GetLoginModeRequest",
            login,
        },
        sanitizeRequestLog: {body: {login: true}},
    });
    console.assert(response.body.mode === "Pass", "unsupported login mode");
    response = await burlapRequest({
        sdkData,
        token,
        theme: "LoginRequest theme",
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.LoginRequest",
            login,
            password,
        },
        sanitizeRequestLog: {body: {login: true, password: true}},
        sanitizeResponseLog: {body: {
            sessionId: true,
            userInfo: true,
            lastLogonInChannel: true,
            authorization: {
                id: true,
            },
        }},
    });
    if (response.body.type === "invalid-credentials") {
        throw new InvalidPreferencesError("Неверный логин или пароль");
    }
    console.assert(response.body.authorization.methods[0].id === "SMS", "unsupported authorization method");
    await burlapRequest({
        token,
        theme: "SelectAuthorizationTypeRequest theme",
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.SelectAuthorizationTypeRequest",
            authorizationType: {
                __type: "ru.vtb24.mobilebanking.protocol.security.AuthorizationTypeMto",
                id: "SMS",
                value: "SMS",
            },
        },
        sanitizeResponseLog: {body: {
            sessionId: true,
            userInfo: true,
            lastLogonInChannel: true,
            authorization: {
                id: true,
            },
        }},
    });
    response = await burlapRequest({
        sdkData,
        token,
        theme: "GetChallengeRequest theme",
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.GetChallengeRequest",
        },
        sanitizeResponseLog: {body: {
            sessionId: true,
            userInfo: true,
            lastLogonInChannel: true,
            authorization: {
                id: true,
            },
        }},
    });
    console.assert(response.body.authorization.methods[0].id === "SMS", "unsupported authorization method");
    const code = await ZenMoney.readLine("Введите код из СМС", {
        time: 120000,
        inputType: "number",
    });
    if (!code || !code.trim()) {
        throw new TemporaryError("Вы не ввели код. Повторите запуск синхронизации.");
    }
    response = await burlapRequest({
        sdkData,
        token,
        theme: "ConfirmLoginRequest theme",
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.security.ConfirmLoginRequest",
            inChallengeResponse: code,
        },
        sanitizeResponseLog: {body: {
            sessionId: true,
            userInfo: true,
            lastLogonInChannel: true,
            authorization: {
                id: true,
            },
        }},
    });
    if (response.body.type === "invalid-sms-code") {
        throw new TemporaryError("Вы ввели неверный код. Повторите запуск синхронизации.");
    }
    console.assert(response.body.authorization.id === "00000000-0000-0000-0000-000000000000", "invalid response");
    return {
        login,
        token,
    };
}

export function stringifyToXml(object) {
    if (object === null) {
        return "<null></null>";
    } else if (typeof object === "boolean") {
        return `<boolean>${object === true ? "1" : "0"}</boolean>`;
    } else if (typeof object === "string") {
        return `<string>${object}</string>`;
    } else if (typeof object === "number") {
        return `<long>${object.toFixed(0)}</long>`;
    } else if (object instanceof Date) {
        return "<date>" + object.getUTCFullYear()
            + padLeft(object.getUTCMonth() + 1, 2, "0")
            + padLeft(object.getUTCDate(), 2, "0") + "T"
            + padLeft(object.getUTCHours(), 2, "0")
            + padLeft(object.getUTCMinutes(), 2, "0")
            + padLeft(object.getUTCSeconds(), 2, "0") + ".000Z</date>";
    } else if (_.isArray(object)) {
        let str = "<list><type>";
        if (object.length > 0) {
            str += "[" + object[0].__type;
        }
        str += `</type><length>${object.length}</length>`;
        object.forEach(object => {
            str += stringifyToXml(object);
        });
        str += "</list>";
        return str;
    } else if (typeof object === "object") {
        let str = "<map><type>";
        if (object.__type) {
            str += object.__type;
        }
        str += "</type>";
        for (const key in object) {
            if (key === "__type") {
                continue;
            }
            if (object.hasOwnProperty(key)) {
                str += `${stringifyToXml(key)}${stringifyToXml(object[key])}`;
            }
        }
        str += "</map>";
        return str;
    } else {
        throw new Error("unsupported xml object type");
    }
}

export async function fetchAccounts({login, token}) {
    const sdkData = createSdkData(login);
    const response = await burlapRequest({
        sdkData,
        token,
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.product.PortfolioRequest",
            refreshImmediately: false,
        },
    });
    console.assert(response.body.executionPercent === 100
        && response.body.status === "Complete", "missing some accounts data");
    return response.body.portfolios;
}

export async function fetchTransactions({login, token}, {id, type}, fromDate, toDate) {
    const sdkData = createSdkData(login);
    const response = await burlapRequest({
        sdkData,
        token,
        body: {
            __type: "ru.vtb24.mobilebanking.protocol.statement.StatementRequest",
            startDate: new Date(formatDateSql(toMoscowDate(fromDate)) + "T00:00:00+03:00"),
            endDate: new Date(formatDateSql(toMoscowDate(toDate)) + "T23:59:59+03:00"),
            products: [
                {
                    __type: "ru.vtb24.mobilebanking.protocol.ObjectIdentityMto",
                    id,
                    type,
                },
            ],
        },
    });
    return response.body.transactions;
}

export function parseXml(xml, cache = {}) {
    const $ = cheerio.load(xml, {
        xmlMode: true,
    });
    const root = $().children()[0].children[0];
    cache = cache || {};
    cache.count = 0;
    return parseNode(root, cache);
}

function getCachedObject(object, cache) {
    if (!object || !object.__type || typeof object.id !== "string"
            || object.id.length < 24
            || object.__type.indexOf("StatusMto") >= 0
            || object.__type.indexOf("PortfolioMto") >= 0
            || object.__type === "ru.vtb24.mobilebanking.protocol.item.ItemMto") {
        return null;
    }
    const id = `${object.__type}_${object.id}`;
    const cachedObject = cache[id];
    if (cachedObject === object) {
        return null;
    }
    if (cachedObject === undefined) {
        cache[id] = object;
        return null;
    }
    return cachedObject;
}

export function resolveCycles(object, cache = {}) {
    if (object && object.__id !== undefined) {
        const copy = cache[object.__id];
        if (copy && copy.__id === undefined) {
            copy.__id = object.__id;
        }
        return `<ref[${object.__id}]>`;
    }
    if (_.isArray(object)) {
        Object.defineProperty(object, "__id", {enumerable: false, value: cache.count || 0});
        cache.count = object.__id + 1;
        return object.map(value => resolveCycles(value, cache));
    } else if (_.isObject(object) && !(object instanceof Date)) {
        const copy = {};
        Object.defineProperty(object, "__id", {enumerable: false, value: cache.count || 0});
        cache.count = object.__id + 1;
        cache[object.__id] = copy;
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                copy[key] = resolveCycles(object[key], cache);
            }
        }
        return copy;
    } else {
        return object;
    }
}

export function reduceDuplicatesByTypeAndId(object, cache = {}, onlyCopyValueToCachedObject) {
    if (object && object.__reduceDuplicates) {
        return;
    }
    let forEach;
    let cachedObject = null;
    if (_.isArray(object)) {
        forEach = (fn) => object.forEach(fn);
    } else if (_.isObject(object) && !(object instanceof Date)) {
        cachedObject = getCachedObject(object, cache);
        forEach = (fn) => {
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    fn(object[key], key);
                }
            }
        };
    } else {
        return;
    }
    Object.defineProperty(object, "__reduceDuplicates", {enumerable: false, value: true});
    forEach((value, key) => {
        const cachedValue = getCachedObject(value, cache);
        if (cachedObject) {
            const _value = cachedObject[key];
            if (_value === null || _value === undefined) {
                cachedObject[key] = cachedValue || value;
            }
        }
    });
    forEach((value, key) => {
        const cachedValue = onlyCopyValueToCachedObject ? null : getCachedObject(value, cache);
        reduceDuplicatesByTypeAndId(value, cache, cachedValue !== null);
        if (cachedValue) {
            object[key] = cachedValue;
        }
    });
}

function parseNode(node, cache) {
    if (node.name === "null") {
        console.assert(!node.children || node.children.length === 0, "unexpected node null");
        return null;
    }
    if (["string", "long", "boolean", "double", "date", "int", "ref"].indexOf(node.name) >= 0) {
        console.assert(!node.children || node.children.length === 0 || (node.children.length === 1
            && node.children[0].type === "text"), `unexpected node ${node.name}`);
        let value = node.children && node.children.length > 0 ? node.children[0].data : null;
        if (value !== null) {
            if (node.name === "long" || node.name === "int") {
                value = parseInt(value, 10);
                console.assert(!isNaN(value), `unexpected node ${node.name}`);
            } else if (node.name === "boolean") {
                value = value !== "0";
            } else if (node.name === "double") {
                value = parseFloat(value);
                console.assert(!isNaN(value), "unexpected node double");
            } else if (node.name === "date") {
                const date = new Date(`${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}T`
                    + `${value.substring(9, 11)}:${value.substring(11, 13)}:${value.substring(13, 15)}Z`);
                console.assert(!isNaN(date) && date.getFullYear() >= 1900, `unexpected node date ${value}`);
                return date;
            } else if (node.name === "ref") {
                const object = cache[value];
                console.assert(object, `unexpected node ref ${value}`);
                return object;
            }
        }
        return value;
    }

    console.assert(node.name === "map" || node.name === "list", `unexpected node ${node.name}`);
    console.assert(node.children && node.children.length > 0
        && node.children[0].name === "type"
        && (!node.children[0].children
        || node.children[0].children.length === 0
        || (node.children[0].children.length === 1 && node.children[0].children[0].type === "text")), `unexpected node ${node.name}`);

    const id = cache.count.toString();
    if (node.name === "map") {
        const object = {};
        cache[id] = object;
        cache.count++;
        if (node.children[0].children && node.children[0].children.length === 1) {
            object.__type = node.children[0].children[0].data;
        }
        for (let i = 1; i < node.children.length; i += 2) {
            const key = parseNode(node.children[i], cache);
            object[key] = parseNode(node.children[i + 1], cache);
        }
        return object;
    }
    if (node.name === "list") {
        console.assert(node.children && node.children.length > 1
            && node.children[1].name === "length"
            && node.children[1].children
            && node.children[1].children.length === 1
            && node.children[1].children[0].type === "text", "unexpected node list. Could not get length");
        const length = parseInt(node.children[1].children[0].data, 10);
        console.assert(length === node.children.length - 2, "unexpected node list. Length != actual count of children");
        const object = [];
        cache[id] = object;
        cache.count++;
        for (let i = 2; i < node.children.length; i++) {
            object.push(parseNode(node.children[i], cache));
        }
        return object;
    }
}
