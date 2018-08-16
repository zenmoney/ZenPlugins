import {MD5} from "jshashes";
import * as Network from "../../common/network";
import _ from "lodash";

const md5 = new MD5();

const baseUrl = "https://api01.tinkoff.ru/v1/";
const defaultHeaders = {
    //"Accept": "*/*",
    //"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": "User-Agent: Sony D6503/android: 5.1.1/TCSMB/3.1.0",
    "Referrer": "https://www.tinkoff.ru/mybank/",
};

let tinkoffAuth = { sessionid: null, deviceid: null }; // авторизация
export async function login(preferences, inBackground){
    if (tinkoffAuth.sessionid)
        console.log(">>> Cессия уже установлена. Используем её.");
    else {
        console.log(">>> Пытаемся войти...");

        // определяем идентификатор устройства
        tinkoffAuth.deviceid = ZenMoney.getData("device_id");
        if (!tinkoffAuth.deviceid) {
            console.log(">>> Первый запуск подключения...");
            tinkoffAuth.deviceid = md5.hex(Math.random().toString());
            ZenMoney.setData("device_id", tinkoffAuth.deviceid);
        }

        // создаём сессию
        const response = await fetchJson("session", {
            headers: {
                ...defaultHeaders,
            },
            sanitizeResponseLog: {body: {"payload": true}},
        });
        if (response.body.resultCode !== "OK")
            throw new Error("Ошибка: не удалось создать сессию с банком");
        tinkoffAuth.sessionid = response.body.payload;

        let pinHash = ZenMoney.getData("pinHash", null);
        if (!pinHash) {
            if (inBackground)
                throw new console.log(">>> Необходима регистрация по ПИН-коду. Запрос в фоновом режиме не возможен. Прекращаем работу.");

            // ПИНа ещё нет, установим его =====================================================================================================================
            // получаем пароль
            let password = preferences.password;
            if (!password)
                for (let i = 0; i < 2; i++) {
                    password = await ZenMoney.readLine("Введите пароль для входа в интернет-банк Тинькофф", {
                        time: 120000,
                        inputType: "password",
                    });
                    if (password) {
                        console.log(">>> Пароль получен от пользователя.");
                        break;
                    }
                }
            else
                console.log(">>> Пароль получен из настроек подключения.");

            if (!password)
                throw new Error("Ошибка: не удалось получить пароль для входа");

            // входим по логину-паролю
            const sign_up = await fetchJson("sign_up", {
                ignoreErrors: true,
                headers: {
                    ...defaultHeaders,
                },
                get: {
                    "username": preferences.login,
                    "password": password,
                },
            });
            const resultCode = sign_up.body.resultCode;

            // ошибка входа по паролю
            if (resultCode.substr(0, 8) === "INVALID_")
                throw new InvalidPreferencesError("Ответ от банка: " + (sign_up.body.plainMessage || sign_up.body.errorMessage));
            // операция отклонена
            else if (resultCode === "OPERATION_REJECTED")
                throw new Error("Ответ от банка: " + (sign_up.body.plainMessage || sign_up.body.errorMessage), true, true);
            // если нужно подтверждение по смс
            else if (resultCode === "WAITING_CONFIRMATION") {// DEVICE_LINK_NEEDED
                console.log(">>> Необходимо подтвердить вход...");

                const smsCode = await ZenMoney.readLine("Введите код подтверждения из смс для первого входа в интернет-банк Тинькофф", {
                    inputType: "number",
                    time: 120000,
                });

                const json2 = await fetchJson("confirm", {
                    ignoreErrors: true,
                    headers: defaultHeaders,
                    get: {
                        "confirmationData": "{\"SMSBYID\":\"" + smsCode + "\"}",
                        "initialOperationTicket": sign_up.body.operationTicket,
                    },
                    body: {
                        "initialOperation": "sign_up",
                    },
                });

                // проверим ответ на ошибки
                if (["INTERNAL_ERROR", "CONFIRMATION_FAILED"].indexOf(json2.body.resultCode)+1)
                    throw new TemporaryError("Ошибка авторизации: " + (json2.body.plainMessage || json2.body.errorMessage));
                else if (json2.body.resultCode !== "OK")
                    throw new Error("Ошибка авторизации: " + (json2.body.plainMessage || json2.body.errorMessage));

            } else {
                ZenMoney.trace("Прошёл вход без подтверждения.");
                if (sign_up.body.resultCode === "AUTHENTICATION_FAILED")
                    throw new Error("Ошибка авторизации: " + (sign_up.body.plainMessage || sign_up.body.errorMessage));
            }

            // получаем привилегии пользователя
            await levelUp();

            // устанавливаем ПИН для быстрого входа
            pinHash = md5.hex(Math.random());
            const save_pin = await fetchJson("mobile_save_pin", {
                ignoreErrors: true,
                headers: defaultHeaders,
                get: {
                    pinHash: pinHash,
                },
            });

            if (save_pin.body.resultCode === "OK") {
                console.log(">>> Установили ПИН-код для быстрого входа.");
                ZenMoney.setData("pinHash", pinHash);

                // сохраним время установки пин-кода для авторизации
                const dt = new Date();
                const dtOffset = dt.getTimezoneOffset() * 60 * 1000;
                const pinHashTime = dt.getTime() - dtOffset + 3 * 60 * 1000; // по Москве
                ZenMoney.setData("pinHashTime", pinHashTime);
            } else
                console.log("Не удалось установить ПИН-код для быстрого входа: " + JSON.stringify(save_pin));
        } else {
            // ПИН есть, входим по нему ========================================================================================================================
            const pinHashDate = ZenMoney.getData("pinHashTime", 0);
            const oldSessionId = ZenMoney.getData("session_id", 0);
            const sign_up2 = await fetchJson("sign_up", {
                ignoreErrors: true,
                headers: defaultHeaders,
                get: {
                    "auth_type": "pin",
                    "pinHash": pinHash,
                    "auth_type_set_date": pinHashDate,
                    "oldSessionId": oldSessionId,
                },
            });
            //ZenMoney.trace('SIGN_UP 2: '+ JSON.stringify(sign_up));

            if (["DEVICE_LINK_NEEDED", "WRONG_PIN_CODE", "PIN_ATTEMPS_EXCEEDED"].indexOf(sign_up2.body.resultCode)+1) {
                ZenMoney.setData("pinHash", null);
                ZenMoney.saveData();

                switch (sign_up2.body.resultCode) {
                    // устройство не авторизировано
                    // устройство не авторизировано
                    case "DEVICE_LINK_NEEDED":
                        throw new InvalidPreferencesError("Требуется привязка устройства. Пожалуйста, пересоздайте подключение к банку.");

                    // не верный пин-код
                    case "WRONG_PIN_CODE":
                    case "PIN_ATTEMPS_EXCEEDED":
                        throw new TemporaryError("Ошибка входа по ПИН-коду. Перезапустите подключение к банку.");

                    default:
                        break;
                }
            } else if (sign_up2.body.resultCode !== "OK") {
                ZenMoney.setData("pinHash", null);
                ZenMoney.saveData();
                //ZenMoney.trace("Ошибка входа по ПИН-коду: " + JSON.stringify(sign_up2));
                throw new TemporaryError("Ошибка входа по ПИН-коду: " + (sign_up2.body.plainMessage || sign_up2.body.errorMessage));
            } else
                console.log(">>> Успешно вошли по ПИН-коду.");

            // получаем привилегии пользователя
            await levelUp();
        }

        // сохраним id сесии для следующего входа
        ZenMoney.setData("session_id", tinkoffAuth.sessionid);
        ZenMoney.saveData();
    }
}

async function levelUp() {
    ZenMoney.trace("Запрашиваем подтверждение привилегий пользователя...");

    // получим привилегии пользователя
    const level_up = await fetchJson("level_up", {
        ignoreErrors: true,
        headers: defaultHeaders,
    });

    if (level_up.body.resultCode === "OK") {
        console.log(">>> Успешно повысили привилегии пользователя.");
        return;
    }

    // подтверждение через секретный вопрос
    if (level_up.body.resultCode === "WAITING_CONFIRMATION" && level_up.body.confirmationData && level_up.body.confirmationData.Question) {
        ZenMoney.trace("Необходимо подтвердить права...");

        const answer = await ZenMoney.readLine("Секретный вопрос от банка: "+ level_up.body.confirmationData.Question.question +". Ответ на этот вопрос сразу передается в банк.", {
            inputType: "text",
            time: 120000,
        });

        const json = await fetchJson("confirm", {
            ignoreErrors: true,
            headers: defaultHeaders,
            body: {
                initialOperation: level_up.body.initialOperation,
                initialOperationTicket: level_up.body.operationTicket,
                confirmationData: "{\"Question\":\"" + answer + "\"}",
            },
        });

        // ответ на вопрос не верный
        if (json.body.resultCode === "CONFIRMATION_FAILED") {
            throw new TemporaryError("Ответ не верный: " + (json.body.plainMessage || json.body.errorMessage));
        }
        // ответ не принят
        if (json.body.resultCode !== "OK") {
            throw new Error("Ответ не принят: " + (json.body.plainMessage || json.body.errorMessage));
        }
        // всё хорошо, ответ верный
        console.log(">>> Ответ на секретный вопрос принят банком.");
    } else {
        throw new Error("Не удалось повысить привилегии пользователя для входа!");
    }
}

async function fetchJson(url, options) {
    const params = [];
    tinkoffAuth.sessionid && params.push(encodeURIComponent("sessionid") + "=" + encodeURIComponent(tinkoffAuth.sessionid));
    if (options.get)
        for (let param in options.get)
            if (options.get.hasOwnProperty(param))
                params.push(`${encodeURIComponent(param)}=${encodeURIComponent(options.get[param])}`);
    params.push(encodeURIComponent("appVersion") + "=" + encodeURIComponent("4.1.3"));
    params.push(encodeURIComponent("platform") + "=" + encodeURIComponent("android"));
    params.push(encodeURIComponent("origin") + "=" + encodeURIComponent("mobile,ib5,loyalty,platform"));
    tinkoffAuth.deviceid && params.push(encodeURIComponent("deviceId") + "=" + encodeURIComponent(tinkoffAuth.deviceid));

    if (url.substr(0, 4) !== "http") {
        url = baseUrl + url;
    }

    let response;
    try {
        response = await Network.fetchJson(url +"?"+ params.join("&"), {
            method: options.method || "POST",
            ..._.omit(options, ["method", "get"]),
        });
    } catch (e) {
        if (e.response && e.response.status === 503) {
            throw new TemporaryError("Информация из банка Тинькофф временно недоступна. Повторите синхронизацию через некоторое время.");
        } else {
            throw e;
        }
    }
    if (response.status !== 200) {
        const message = response.body && response.body.message;
        throw new Error(response.statusText +(message ? ": "+ message : ""));
    }
    if (options && !options.ignoreErrors && response.body) {

    }
    return response;
}