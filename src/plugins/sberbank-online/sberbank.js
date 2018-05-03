import {sanitize} from "../../common/sanitize";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import {MD5} from "jshashes";
import _ from "lodash";

const cheerio = require("cheerio");
const qs      = require("querystring");

const md5 = new MD5();

export async function login(login, pin) {
    if (!ZenMoney.getData("devID")) {
        ZenMoney.setData("devID", getUid(36) + "0000");
        ZenMoney.setData("devIDOld", getUid(36) + "0000");
    }

    let response;

    if (ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/login.do", {
            method: "POST",
            headers: {
                "User-Agent": "Mobile Device",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "online.sberbank.ru:4477",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip"
            },
            body: {
                "operation": "button.login",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "version": "9.20",
                "appType": "android",
                "appVersion": "7.11.1",
                "isLightScheme": false,
                "deviceName": "Xperia Z2",
                "devID":    ZenMoney.getData("devID"),
                "mobileSdkData": JSON.stringify(createSdkData(login))
            }
        }, null);
        if (_.get(response, "body.response.status.code") === "7") {
            ZenMoney.setData("mGUID", null);
        }
    }

    if (!ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            method: "POST",
            headers: {
                "User-Agent": "Mobile Device",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "online.sberbank.ru:4477",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip"
            },
            body: {
                "operation": "register",
                "login": login,
                "version": "9.20",
                "appType": "android",
                "appVersion": "7.11.1",
                "deviceName": "Xperia Z2",
                "devID":    ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld")
            }
        }, response => _.get(response, "body.response.confirmRegistrationStage.mGUID"));

        ZenMoney.setData("mGUID", response.body.response.confirmRegistrationStage.mGUID);

        if (_.get(response, "body.response.confirmInfo.type") === "smsp") {
            const code =  await ZenMoney.readLine("Введите пароль регистрации из СМС для подключения импорта операций из Сбербанк Онлайн для Android", {
                time: 120000,
                inputType: "number"
            });
            if (!code || !code.trim()) {
                throw new ZenMoney.Error("Получен пустой код авторизации устройства", true);
            }
            response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
                method: "POST",
                headers: {
                    "User-Agent": "Mobile Device",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Host": "online.sberbank.ru:4477",
                    "Connection": "Keep-Alive",
                    "Accept-Encoding": "gzip"
                },
                body: {
                    "operation": "confirm",
                    "mGUID": ZenMoney.getData("mGUID"),
                    "smsPassword": code,
                    "version": "9.20",
                    "appType": "android"
                }
            }, null);
            if (_.get(response, "body.response.status.code") === "1") {
                throw new ZenMoney.Error("Вы ввели неправильный идентификатор или пароль из SMS. Повторите подключение импорта.", true);
            }
        }

        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            method: "POST",
            headers: {
                "User-Agent": "Mobile Device",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "online.sberbank.ru:4477",
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip"
            },
            body: {
                "operation": "createPIN",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "version": "9.20",
                "appType": "android",
                "appVersion": "7.11.1",
                "isLightScheme": false,
                "deviceName": "Xperia Z2",
                "devID":    ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld"),
                "mobileSdkData": JSON.stringify(createSdkData(login))
            }
        });
    }

    validateResponse(response, response =>
        _.get(response, "body.response.loginData.token") &&
        _.get(response, "body.response.loginData.host"));

    const token = response.body.response.loginData.token;
    const host  = response.body.response.loginData.host;

    response = await fetchXml(`https://${host}:4477/mobile9/postCSALogin.do`, {
        method: "POST",
        headers: {
            "User-Agent": "Mobile Device",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": `${host}:4477`,
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip"
        },
        body: {
            "token": token,
            "appName": "????????",
            "appBuildOSType": "android",
            "appVersion": "7.11.1",
            "appBuildType": "RELEASE",
            "appFormat": "STANDALONE",
            "deviceName": "Xperia Z2",
            "deviceType": "Android SDK built for x86_64",
            "deviceOSType": "android",
            "deviceOSVersion": "6.0"
        }
    }, response => _.get(response, "body.response.loginCompleted") === "true");

    return response.body.response.person;
}

export async function fetchAccounts() {
    const response = await fetchXml("https://node1.online.sberbank.ru:4477/mobile9/private/products/list.do", {
        method: "POST",
        headers: {
            "User-Agent": "Mobile Device",
            "Content-Type": "application/x-www-form-urlencoded;charset=windows-1251",
            "Host": "node1.online.sberbank.ru:4477",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
        },
        body: {showProductType: "cards,accounts,imaccounts,loans"}
    }, response => _.get(response, "body.response.cards"));
    return getArray(response.body.response.cards.card);
}

export async function fetchAccountDetails(accountId) {
    const response = await fetchXml("https://node1.online.sberbank.ru:4477/mobile9/private/cards/info.do", {
        method: "POST",
        headers: {
            "User-Agent": "Mobile Device",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "node1.online.sberbank.ru:4477",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
        },
        body: {id: accountId}
    }, response => response => _.get(response, "body.response.detail"));
    return response.body.response.detail;
}

export async function fetchTransactions(accountId, fromDate, toDate) {
    const response = await fetchXml("https://node1.online.sberbank.ru:4477/mobile9/private/cards/abstract.do", {
        method: "POST",
        headers: {
            "User-Agent": "Mobile Device",
            "Referer": "Android/6.0/7.11.1",
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "node1.online.sberbank.ru:4477",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip"
        },
        body: {id: accountId, count: 10, paginationSize: 10}
        // Допускаются и другие параметры, чтобы получить операции за указанные даты.
        // Но этот способ не работает с кредитной картой.
        // body: {id: accountId, from: formatDate(fromDate), to: formatDate(toDate)}
    }, response => response => _.get(response, "body.response.operations"));
    return getArray(response.body.response.operations.operation);
}

export async function fetchXml(url, options = {}, predicate = () => true) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog", "log"]),
        ...options.body && {body: qs.stringify(options.body)},
        headers: options.headers
    };

    const beforeFetchTicks = Date.now();
    const shouldLog = options.log !== false;
    shouldLog && console.debug("fetchXml request", sanitize({
        method: init.method || "GET",
        url,
        headers: init.headers,
        ...options.body && {body: options.body},
    }, options.sanitizeRequestLog || false));

    let response = await fetch(url, init);
    let isBodyValidXml = true;
    let bodyText = await response.text();
    let body;
    try {
        body = bodyText ? parseXml(bodyText) : null;
    } catch (e) {
        body = null;
        isBodyValidXml = false;
    }

    const endTicks = Date.now();
    shouldLog && console.debug("fetchXml response", sanitize({
        status: response.status,
        url: response.url,
        headers: response.headers.entries ? _.fromPairs(Array.from(response.headers.entries())) : response.headers.raw(),
        ...(isBodyValidXml ? {body} : {bodyText}),
        ms: endTicks - beforeFetchTicks,
    }, options.sanitizeResponseLog || false));

    if (!isBodyValidXml) {
        throw new Error("body is not a valid XML");
    }

    response = {
        ..._.pick(response, ["ok", "status", "statusText", "url", "headers"]),
        body
    };
    if (predicate) {
        validateResponse(response, response => _.get(response, "body.response.status.code") === "0" && predicate(response));
    }

    return response;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

function getArray(object) {
    return object === null || object === undefined
        ? object
        : Array.isArray(object) ? object : [object];
}

function formatDate(date) {
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join(".");
}

export function parseXml(xml) {
    const $ = cheerio.load(xml, {
        xmlMode: true
    });
    return parseXmlNode($().children()[0]);
}

function parseXmlNode(root) {
    const children = root.children.filter(node => {
        if (node.type === "text") {
            const value = node.data.trim();
            if (value === "" || value === "?") {
                return false;
            }
        }
        return true;
    });
    let object = null;
    for (const node of children) {
        if (node.attribs && Object.keys(node.attribs).length > 0) {
            throw new Error("Error parsing XML. Unexpected node attributes");
        }
        if (node.type === "cdata") {
            if (children.length !== 1 || !node.children
                    || node.children.length !== 1
                    || node.children[0].type !== "text") {
                throw new Error("Error parsing XML. Unsupported CDATA node");
            }
            return node.children[0].data.trim();
        }
        if (node.type === "tag") {
            if (object === null) {
                object = {};
            }
            const key = node.name;
            let value;
            if (!node.children || !node.children.length) {
                value = null;
            } else if (node.children.length === 1
                    && node.children[0].type === "text") {
                value = node.children[0].data.trim();
                if (value === "") {
                    value = null;
                }
            } else {
                value = parseXmlNode(node);
            }
            let _value = object[key];
            if (_value !== undefined) {
                if (!Array.isArray(_value)) {
                    _value = [_value];
                    object[key] = _value;
                }
                _value.push(value);
            } else {
                object[key] = value;
            }
        }
    }
    return object;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUid(length, chars) {
    if (typeof chars !== "string") {
        chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    }
    const buf = [];
    for (let i = 0; i < length; i++) {
        buf.push(chars[getRandomInt(0, chars.length - 1)]);
    }
    return buf.join("");
}

/**
 * Сгенерировать HEX
 * @param mask
 * @param digits
 * @returns {string|void|XML}
 */
function generateHex(mask, digits) {
    let i = 0;
    return mask.replace(/x/ig, () => {
        return digits[i++];
    });
}

/**
 * Сгенерировать параметры устройства
 * @returns {{TIMESTAMP: string, HardwareID: string, SIM_ID: string, PhoneNumber: string, GeoLocationInfo: *[], DeviceModel: string, MultitaskingSupported: boolean, DeviceName: string, DeviceSystemName: string, DeviceSystemVersion: string, Languages: string, WiFiMacAddress: (string|void|XML), WiFiNetworksData: {BBSID: (string|void|XML), SignalStrength: string, Channel: string, SSID: string}, CellTowerId: string, LocationAreaCode: string, ScreenSize: string, RSA_ApplicationKey: string, MCC: string, MNC: string, OS_ID: string, SDK_VERSION: string, Compromised: number, Emulator: number}}
 */
function createSdkData(login) {
    const dt = new Date();
    const hex = md5.hex(login + "sdk_data");
    const rsa_app_key = md5.hex(login + "rsa app key").toUpperCase();

    let imei = ZenMoney.getData("imei");
    if (!imei) {
        imei = generateImei(login, "35472406******L");
    }

    let simId = ZenMoney.getData("simId");
    if (!simId) {
        simId = generateSimSN(login, "2500266********L");
    }

    const obj = {
        "TIMESTAMP": dt.getUTCFullYear() + "-"
            + toAtLeastTwoDigitsString(dt.getUTCMonth()) + "-"
            + toAtLeastTwoDigitsString(dt.getUTCDate()) + "T"
            + dt.getUTCHours() + ":" + dt.getUTCMinutes() + ":" + dt.getUTCSeconds() + "Z",
        "HardwareID": imei,
        "SIM_ID": simId,
        "PhoneNumber": "",
        "GeoLocationInfo": [
            {
                "Longitude": "" + (37 + Math.random()),
                "Latitude": "" + (55 + Math.random()),
                "HorizontalAccuracy": "5",
                "Altitude": "" + (150 + Math.floor(Math.random() * 20)),
                "AltitudeAccuracy": "5",
                "Timestamp": "" + (dt.getTime() - Math.floor(Math.random() * 1000000)),
                "Heading": "" + (Math.random() * 90),
                "Speed": "3",
                "Status": "3"
            }
        ],
        "DeviceModel": "D6503",
        "MultitaskingSupported": true,
        "DeviceName": "Xperia Z2",
        "DeviceSystemName": "Android",
        "DeviceSystemVersion": "22",
        "Languages": "ru",
        "WiFiMacAddress": generateHex("44:d4:e0:xx:xx:xx", hex.substr(0, 6)),
        "WiFiNetworksData": {
            "BBSID": generateHex("5c:f4:ab:xx:xx:xx", hex.substr(6, 12)),
            "SignalStrength": "" + Math.floor(-30 - Math.random() * 20),
            "Channel": "null",
            "SSID": "TPLink"
        },
        "CellTowerId": "" + (12875 + Math.floor(Math.random() * 10000)),
        "LocationAreaCode": "9722",
        "ScreenSize": "1080x1776",
        "RSA_ApplicationKey": rsa_app_key,
        "MCC": "250",
        "MNC": "02",
        "OS_ID": hex.substring(12, 16),
        "SDK_VERSION": "2.0.1",
        "Compromised": 0,
        "Emulator": 0
    };

    ZenMoney.setData("imei", imei);
    ZenMoney.setData("simId", simId);

    return obj;
}

/**
 * Сгенерировать IMEI-устроства
 * @param val
 * @param mask
 * @returns {string|XML|*}
 */
function generateImei(val, mask) {
    const g_imei_default = "35374906******L"; //Samsung
    const serial = (Math.abs(crc32(val) % 1000000)) + "";

    if (!mask)
        mask = g_imei_default;

    mask = mask.replace(/\*{6}/, serial);
    mask = mask.replace(/L/, luhnGet(mask.replace(/L/, "")));

    return mask;
}

/**
 * Сгенерировать серийный номер SIM
 * @param val
 * @param mask
 * @returns {string|XML|*}
 */
function generateSimSN(val, mask) {
    const g_simsn_default = "897010266********L"; //билайн
    const serial = (Math.abs(crc32(val + "simSN") % 100000000)) + "";

    if (!mask)
        mask = g_simsn_default;

    mask = mask.replace(/\*{8}/, serial);
    mask = mask.replace(/L/, luhnGet(mask.replace(/L/, "")));

    return mask;
}

function crc32(str) {
    function makeCRCTable(){
        let c;
        const crcTable = [];
        for (let n =0; n < 256; n++){
            c = n;
            for (let k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    }

    const crcTable = makeCRCTable();
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

function luhnGet(num) {
    const arr = [];
    num = num.toString();
    for (let i = 0; i < num.length; i++) {
        if (i % 2 === 0) {
            const m = parseInt(num[i]) * 2;
            if (m > 9) {
                arr.push(m - 9);
            } else {
                arr.push(m);
            }
        } else {
            const n = parseInt(num[i]);
            arr.push(n)
        }
    }

    const summ = arr.reduce((a, b) => { return a + b; });
    return (summ % 10);
}
