import {MD5} from "jshashes";
import _ from "lodash";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import {sanitize} from "../../common/sanitize";

const cheerio = require("cheerio");
const qs = require("querystring");

const md5 = new MD5();

const hostDefault = "https://node1.online.sberbank.ru:4477/mobile9/private";
const bodyDefault = {
    "version": "9.20",
    "appType": "android",
    "appVersion": "7.11.1",
    "deviceName": "Xperia Z2",
};
const headerDefault = {
    "User-Agent": "Mobile Device",
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": "node1.online.sberbank.ru:4477",
    "Connection": "Keep-Alive",
    "Accept-Encoding": "gzip",
};

export async function login(login, pin) {
    if (!ZenMoney.getData("devID")) {
        ZenMoney.setData("devID", getUid(36) + "0000");
        ZenMoney.setData("devIDOld", getUid(36) + "0000");
    }

    let response;
    if (ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/login.do", {
            method: "POST",
            headers: headerDefault,
            body: Object.assign({
                "operation": "button.login",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "isLightScheme": false,
                "devID": ZenMoney.getData("devID"),
                "mobileSdkData": JSON.stringify(createSdkData(login)),
            }, bodyDefault),
        }, null);
        if (_.get(response, "body.response.status.code") === "7") {
            ZenMoney.setData("mGUID", null);
        }
    }

    if (!ZenMoney.getData("mGUID")) {
        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            method: "POST",
            headers: headerDefault,
            body: Object.assign({
                "operation": "register",
                "login": login,
                "devID": ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld"),
            }, bodyDefault),
        }, response => _.get(response, "body.response.confirmRegistrationStage.mGUID"));

        ZenMoney.setData("mGUID", response.body.response.confirmRegistrationStage.mGUID);

        if (_.get(response, "body.response.confirmInfo.type") === "smsp") {
            const code = await ZenMoney.readLine("Введите пароль регистрации из СМС для подключения импорта операций из Сбербанк Онлайн для Android", {
                time: 120000,
                inputType: "number",
            });
            if (!code || !code.trim()) {
                throw new ZenMoney.Error("Получен пустой код авторизации устройства", true);
            }
            response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
                method: "POST",
                headers: headerDefault,
                body: {
                    "operation": "confirm",
                    "mGUID": ZenMoney.getData("mGUID"),
                    "smsPassword": code,
                    "version": bodyDefault.version,
                    "appType": "android",
                },
            }, null);
            if (_.get(response, "body.response.status.code") === "1") {
                throw new ZenMoney.Error("Вы ввели неправильный идентификатор или пароль из SMS. Повторите подключение импорта.", true);
            }
        }

        response = await fetchXml("https://online.sberbank.ru:4477/CSAMAPI/registerApp.do", {
            method: "POST",
            headers: headerDefault,
            body: Object.assign({
                "operation": "createPIN",
                "mGUID": ZenMoney.getData("mGUID"),
                "password": pin,
                "isLightScheme": false,
                "devID": ZenMoney.getData("devID"),
                "devIDOld": ZenMoney.getData("devIDOld"),
                "mobileSdkData": JSON.stringify(createSdkData(login)),
            }, bodyDefault),
        });
    }

    validateResponse(response, response =>
        _.get(response, "body.response.loginData.token") &&
        _.get(response, "body.response.loginData.host"));

    const token = response.body.response.loginData.token;
    const host = response.body.response.loginData.host;

    response = await fetchXml(`https://${host}:4477/mobile9/postCSALogin.do`, {
        method: "POST",
        headers: Object.assign({}, headerDefault, {"Host": `${host}:4477`}),
        body: Object.assign({
            "token": token,
            "appName": "????????",
            "appBuildOSType": "android",
            "appBuildType": "RELEASE",
            "appFormat": "STANDALONE",
            "deviceType": "Android SDK built for x86_64",
            "deviceOSType": "android",
            "deviceOSVersion": "6.0",
        }, _.pick(bodyDefault, [ "appVersion", "deviceName" ] )),
    }, response => _.get(response, "body.response.loginCompleted") === "true");

    return response.body.response.person;
}

export async function fetchAccounts() {
    let headersForm = Object.assign({}, headerDefault, {"Content-Type": "application/x-www-form-urlencoded;charset=windows-1251"});

    const response = await fetchXml("products/list.do", {
        method: "POST",
        headers: headersForm,
        body: {showProductType: "cards,accounts,imaccounts,loans"},
    });

    const accDict = [];
    const additionalCards =[];

    //--- карты ------------------------------
    const cards = response.body.response.cards ? getArray(response.body.response.cards.card) : [];
    const parsedAccounts = [];
    for (const card of cards) {
        if (card.state !== "active") {
            console.log(`Пропускаем карту '${card.name}' – не активна (#${card.id})`);
            continue;
        }

        const acc = {
            id: card.id,
            title: card.name,
            type: "ccard",
            syncID: [],
            balance: parseFloat(card.availableLimit.amount),
            instrument: card.availableLimit.currency.code,
            mainCard: "",	// идентификатор основной карты, если эта - дополнительная
        };

        const cardNum = getAccNumber(card);

        // отдельно обрабатываем доп.карты
        if (card.mainCardId) {
            console.log(`Замечена дополнительная карта: ${acc.title} (#${acc.id})`);

            const mainCardId = card.mainCardId;
            let mainCardIdStr = "card:" + mainCardId;

            // сохраним номер доп.карты у родителя
            let cardMain;
            for (let j = 0; j < accDict.length; j++) {
                cardMain = accDict[j];

                if (cardMain.id !== mainCardIdStr)
                    continue;

                if (cardNum && cardNum !== "")
                    cardMain.syncID.push(cardNum);

                break;
            }

            // отметим, что это доп.карта, чтобы не добавлять её отдельно
            acc.mainCard = mainCardIdStr;
            if (cardMain)
                console.log(`... прикрепляем к карте '${cardMain.title}' (#${mainCardIdStr})`);
            else {
                additionalCards[mainCardId] = cardNum;
                console.log(`... прикрепляем к неизвестной пока карте (#${mainCardIdStr})`);
            }
        } else {
            // сохраним номер карты
            if (cardNum && cardNum != "")
                acc.syncID.push(cardNum);

            if (card.type === "credit") {
                console.log(`Добавляем кредитную карту: ${acc.title} (#${acc.id})`);

                // обработаем свойства кредитных карт
                const response = await fetchXml("cards/info.do", {
                    method: "POST",
                    headers: headersForm,
                    body: {
                        id: acc.id,
                    },
                }, response => _.get(response, "body.response.detail.creditType.limit.amount"));

                // установим кредитный лимит
                const creditLimits = response.body.response.detail.creditType.limit.amount;
                if (creditLimits > 0) {
                    acc.creditLimit = parseInt(creditLimits, 10);
                    acc.balance = Math.round((acc.balance - acc.creditLimit) * 100) / 100;
                }

            } else {
                console.log(`Добавляем дебетовую карту: ${acc.title} (#${acc.id})`);

                // обработаем свойства дебетовых карт с овердрафтом
                // обработаем свойства кредитных карт
                const response = await fetchXml("cards/info.do", {
                    method: "POST",
                    headers: headersForm,
                    body: {
                        id: acc.id,
                    },
                }, response => _.get(response, "body.response.detail"));

                console.log(`Свойства дебетовой карты для анализа овердрафта (#${acc.id}): `, response);

                // Сбер не передаёт размер овердрафта, но включает его в доступный остаток по карте
                acc.available = parseFloat(acc.balance);
                delete acc.balance;

                // для дебетовок добавим также и syncID лицевого счёта
                let cardAcc = card.cardAccount;
                if (cardAcc && cardAcc !== "") {
                    cardAcc = cardAcc.substr(-4);
                    acc.syncID.push(cardAcc);
                }
            }
        }

        if (acc.syncID.length > 0) {
            parsedAccounts[getAccTypeId(acc)] = { account: acc };
            accDict.push(acc);
        }
    }

    // обработаем доп.карты, отложенные на потом
    for (let addCard in additionalCards) {
        if (!parsedAccounts[addCard])
            continue;

        const mainCard = parsedAccounts[addCard].account;
        mainCard.syncID.push(additionalCards[addCard]);
        ZenMoney.trace("Записали дополнительную карту *"+ additionalCards[addCard] +" к карте " + mainCard.title + " (#" + addCard + ")");
    }

    //--- счета ------------------------------
    const accounts = response.body.response.accounts ? getArray(response.body.response.accounts.account) : [];
    for (const account of accounts) {
        if (account.state !== "OPENED") {
            console.log(`Пропускаем счёт '${account.name}' – не действующий (#${account.id})`);
            continue;
        }

        const acc = {
            id: account.id,
            title: account.name,
            type: "checking",
            syncID: [],
            balance: parseFloat(account.balance.amount),
            instrument: account.balance.currency.code,
        };

        console.log(`Добавляем сберегательный счёт: ${acc.title} (#${acc.id})`);

        const accNum = getAccNumber(account);
        if (accNum && accNum !== "")
            acc.syncID.push(accNum);

        if (account.rate && account.rate > 0) {
            // обработаем свойства депозита
            const response = await fetchXml("accounts/info.do", {
                method: "POST",
                headers: headersForm,
                body: {
                    id: acc.id,
                },
            }, response => _.get(response, "body.response.detail"));

            acc.type = "deposit";
            acc.percent = parseFloat(account.rate);
            acc.capitalization = true;
            acc.startDate = response.body.response.detail.open.substr(0, 10);
            acc.endDateOffsetInterval = "year";
            acc.endDateOffset = 1;
            acc.payoffInterval = "month";
            acc.payoffStep = 1;
        }

        accDict.push(acc);
    }

    //--- кредиты ------------------------------
    const loans = response.body.response.loans ? getArray(response.body.response.loans.loan) : [];
    for (const loan of loans) {
        const acc = {
            id: loan.id,
            title: loan.name,
            type: "loan",
            //syncID: [],
            //balance: loan.balance.amount,
            instrument: loan.balance.currency.code,
        };

        console.log(`Добавляем кредит: ${acc.title} (#${acc.id})`, loan);

        const accNum = getAccNumber(loan);
        if (accNum && accNum !== "")
            acc.syncID.push(accNum);

        // обработаем свойства депозита
        const response = await fetchXml("loans/info.do", {
            method: "POST",
            headers: headersForm,
            body: {
                id: acc.id,
            },
        }, response => _.get(response, "body.response.detail"));

        console.log("Нужно добавить обработку свойств кредита", response.body.response.detail);

        /*acc.syncID = getElementByTag(xml4, 'accountNumber', replaceTagsAndSpaces).substr(-4);
        acc.percent = getElementByTag(xml4, 'creditingRate', replaceTagsAndSpaces, parseToFloat);
        acc.capitalization = getElementByTag(xml4, 'repaymentMethod', replaceTagsAndSpaces).toLowerCase().indexOf('аннуитетный') >= 0;
        acc.startBalance = getElementByTag(xml4, ['origianlAmount', 'amount'], replaceTagsAndSpaces, parseToFloat);
        /!*acc.balance = -(getElementByTag(xml4, ['mainDeptAmount', 'amount'], replaceTagsAndSpaces, parseToFloat) +
         getElementByTag(xml4, ['interestsAmount', 'amount'], replaceTagsAndSpaces, parseToFloat));*!/
        acc.balance = getElementByTag(xml4, ['detail', 'remainAmount', 'amount'], replaceTagsAndSpaces, parseToFloat) * -1;

        var start = getElementByTag(xml4, 'termStart', replaceTagsAndSpaces).substr(0, 10);
        var end = getElementByTag(xml4, 'termEnd', replaceTagsAndSpaces).substr(0, 10);
        var dt1 = new Date(start.substr(6, 4), start.substr(3, 2) - 1, start.substr(0, 2));
        var dt2 = new Date(end.substr(6, 4), end.substr(3, 2) - 1, end.substr(0, 2));
        var days = Math.floor((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
        acc.startDate = start;
        acc.endDateOffsetInterval = 'day';
        acc.endDateOffset = days;
        acc.payoffInterval = 'month';
        acc.payoffStep = 1;

        acc.id = "loan:" + acc.id; // для переводов необходим тип счёта
        accDict.push(acc);*/
    }

    //--- ????? ------------------------------
    const imaccounts = response.body.response.imaccounts ? getArray(response.body.response.imaccounts.imaccount) : [];
    for (const imaccount of imaccounts) {
        console.log("Найден счёт не известного типа:", imaccount);
    }

    return accDict;
}

export async function fetchTransactions(account, fromDate, toDate) {
    let body = {};
    let accountType = "";
    switch (account.type) {
        case "ccard":
            body = {id: account.id, count: 10, paginationSize: 10};
            accountType = "cards";
            break;

        case "loan":
        case "checking":
        case "deposit":
            body = {id: account.id, from: formatDate(fromDate), to: formatDate(toDate)};
            accountType = "accounts";
            break;

        default:
            accountType = account.type + "s";
            break;
    }

    const response = await fetchXml(accountType + "/abstract.do", {
        method: "POST",
        headers: Object.assign({}, headerDefault, {"Referer": "Android/6.0/7.11.1"}),
        body: body,
    }, response => response => _.get(response, "body.response.operations"));

    // обработаем массив операций
    const tranDict = [];
    if (response.body.response.operations && response.body.response.operations.operation) {
        for (let i = 0; i < response.body.response.operations.operation.length; i++) {
            const operation = response.body.response.operations.operation[i];

            const tran = { date: operation.date.substr(0, 10) };

            const sum = parseFloat(operation.sum.amount);
            const instrument = operation.sum.currency.code;

            //if (true) { // ToDO: DEBUG
            /*if (instrument.toLocaleLowerCase() != acc.instrument.toLocaleLowerCase()) {
                if (!tranInstrument)
                    ZenMoney.trace('Обнаружена валютная операция! Необходима подгрузка данных через веб-версию Сбербанк Онлайн.');

                tranInstrument = true;
                break;
            }*/

            if (Math.abs(sum) < 0.01)
                continue;
            else {
                const accId = account.mainCard ? account.mainCard : account.id;

                if (sum > 0) {
                    tran.income = sum;
                    tran.incomeAccount = accId;
                    tran.outcome = 0;
                    tran.outcomeAccount = accId;
                } else {
                    tran.income = 0;
                    tran.incomeAccount = accId;
                    tran.outcome = -sum;
                    tran.outcomeAccount = accId;
                }
            }

            let description = operation.description;
            if (description) {
                if (description.substr(0, 9) === "<![CDATA[")
                    description = description.substring(9, description.length - 3);

                parseTransactionDescription(description, sum, instrument, tran);
            }

            tranDict.push(tran);
        }
    }

    return tranDict;
}

export async function fetchXml(url, options = {}, predicate = () => true) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog", "log"]),
        ...options.body && {body: qs.stringify(options.body)},
        headers: options.headers,
    };

    // дополним адрес, если он не полный
    if (url.substr(0, 4) !== "http") {
        if (url.substr(0, 1) !== "/")
            url = "/" + url;
        url = hostDefault + url;
    }

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
        body,
    };
    if (predicate) {
        validateResponse(response, response => _.get(response, "body.response.status.code") === "0" && predicate(response));
    }

    return response;
}

/**
 * Обработать описание операции
 * @param {string} description Описание операции
 * @param {number} sum Сумма операции
 * @param {string} instrument Код валюты
 * @param {object} tran Транзакция
 * @returns {object} tran
 */
function parseTransactionDescription(description, sum, instrument, tran) {

    let str;
    // расходные операции по карте
    if (str = getWebDescriptionValue(description,
            [
                "Retail", // оплата по карте
                "Unique", // unique
        ])) {
        tran.payee = str;
    }
    // расходные операции по счёту
    else if (str = getWebDescriptionValue(description, [
            "Credit", // оплата в кредит
            "CH Debit", // поступление
            "CH Payment", // списание
            "BP Billing Transfer", // платёж в Сбербанк Онлайн
            "BP Card - Acct", // дополнительный взнос на вклад
            "BP Acct - Card", // частичное снятие со вклада
        ])) {
        tran.comment = str;
    }
    // взнос наличными
    else if (str = getWebDescriptionValue(description, "Note Acceptance") && sum > 0) {
        tran.outcome = sum;
        tran.outcomeAccount = "cash#" + instrument;
    }
    // снятие наличных
    else if (str = getWebDescriptionValue(description, "ATM", "ITT") && sum < 0) {
        tran.income = -sum;
        tran.incomeAccount = "cash#" + instrument;
    }
    // значение по умолчанию - оставляем описание как есть
    else
        tran.comment = description;

    return tran;
}

/**
 * Получить значение описания операции
 * @param {string} description Описание
 * @param {Array} arr Искомая строка либо массив строк
 * @returns {string}
 */
function getWebDescriptionValue(description, arr) {
    if (typeof arr === "string")
        arr = [ arr ];

    if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
            const pos = description.lastIndexOf(arr[i]);
            if (pos >= 0) {
                let str = description.substr(pos + arr[i].length).trim();
                if (str.substr(0, 4) === "RUS ") str = str.substr(4).trim();
                return str;
            }
        }
    }

    return null;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

function getArray(object) {
    return object === null || object === undefined
        ? []
        : Array.isArray(object) ? object : [object];
}

function formatDate(date) {
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join(".");
}

export function parseXml(xml) {
    const $ = cheerio.load(xml, {
        xmlMode: true,
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
        "deviceName": bodyDefault.deviceName,
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

    if (!mask) {
        mask = g_imei_default;
    }

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

/**
 * Получить код счёта (4 последние цифры)
 * @param card
 * @returns {*}
 */
function getAccNumber(card) {
    let cardNum = card.smsName;
    if (cardNum && cardNum !== "")
     return cardNum;

    cardNum = card.number;
    if (cardNum && cardNum !== "") {
        cardNum = cardNum.substr(-4);
        return cardNum;
    }

    return null;
}

/**
 * Получить префикс типа счёта
 * @param account
 * @returns {*}
 */
function getAccTypeId(account) {
    switch (account.type) {
        case "ccard":
            return "card";

        case "checking":
        case "deposit":
            return "account";

        default:
            return account.type;
    }
}
