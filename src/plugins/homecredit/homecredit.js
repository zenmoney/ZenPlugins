import {parseStartDateString} from "../../common/adapters";
import * as Network from "../../common/network";
import _ from "lodash";

const myCreditUrl = "https://mob.homecredit.ru/mycredit";
const baseUri = "https://ib.homecredit.ru/mobile/remoting";
const defaultMyCreditHeaders = {
    "_ver_": "3.7.0",
    "_os_": 1,
};
const defaultBaseHeaders = {
    "User-Agent": "okhttp/3.10.0",
    "Content-Type": "application/json; charset=utf-8",
};
const defaultBaseHeaderForAuth = {
    "appVersion": "2.6.1",
    "javaClass": "cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo",
    "system": "Android",
    "systemVersion": "5.0",
};

let myCreditAuth; // авторизация в "Мой кредит"
export async function authMyCredit(preferences) {
    if (myCreditAuth) return myCreditAuth;

    const auth = ZenMoney.getData("auth", null) || {};
    if (!auth || !auth.device || !auth.key || !auth.token || !auth.phone) {
        auth.phone = (preferences.phone || "").trim();
        return registerMyCreditDevice(auth, preferences);
    }

    console.log(">>> Авторизация [Мой кредит] ========================================================");
    let response = await fetchJson("Pin/CheckUserPin", {
        API: 3,
        ignoreErrors: true,
        headers: {
            ...defaultMyCreditHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
            "X-Auth-Token": auth.token,
        },
        body: {
            "Pin": (preferences.pin || "").trim(),
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}, body: {"Pin": true}},
        sanitizeResponseLog: {headers: {"x-auth-token": true}},
    });

    if (response.body.StatusCode !== 200) {
        console.log("Нужна повторная регистрация.");
        registerMyCreditDevice(auth, preferences);
        return;
    }

    if (response.body.StatusCode !== 200) {
        console.log("Нужна повторная регистрация.");
        registerMyCreditDevice(auth, preferences);
        return;
    }

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new InvalidPreferencesError("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.");

    auth.token = response.headers["x-auth-token"];
    ZenMoney.setData("auth", auth);
    myCreditAuth = auth;
    return myCreditAuth;
}

export async function authBase(preferences) {
    console.log(">>> Авторизация [Базовый] ======================================================");
    let device_id = ZenMoney.getData("device_id", null);
    let isNewDevice = false;
    if (!device_id) {
        isNewDevice = true;
        device_id = getDeviceId();
    }

    const response = await fetchJson(`${baseUri}/LoginService`, {
        log: true,
        method: "POST",
        body: {
            "arguments": [
                {
                    ...defaultBaseHeaderForAuth,
                    "code": isNewDevice ? preferences.code : null,
                    "deviceID": device_id,
                    "password": preferences.password,
                    "username": preferences.login,
                },
            ],
            "attributes": null,
            "javaClass": "org.springframework.remoting.support.RemoteInvocation",
            "methodName": "login",
            "parameterTypes": ["cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo"],
        },
        headers: defaultBaseHeaders,
        sanitizeRequestLog: { body: {arguments: {"code": true, "password": true, "deviceID": true, "username": true}} },
        sanitizeResponseLog: { headers: {"set-cookie": true} },
    });

    // ERROR_LOGIN, BLOCK_USER_CODE
    if (!response.body.success)
        throw new InvalidPreferencesError("Не удалось авторизоваться в приложении банка Home Credit. Пожалуйста, настройте параметры подключения.");

    ZenMoney.setData("device_id", device_id);
    return response;
}

async function registerMyCreditDevice(auth, preferences){
    const date = getFormatedDate(preferences.birth);
    if (!date)
        throw new InvalidPreferencesError("Параметр подключения 'День рождения' указан не верно")

    console.log(">>> Регистрация устройства [Мой кредит] ===============================================");
    auth.device = getDeviceId();
    let response = await fetchJson("Account/Register", {
        API: 3,
        headers: {
            ...defaultMyCreditHeaders,
            "X-Device-Ident": auth.device,
        },
        body: {
            "BirthDate": date,
            "DeviceName": "samsung zen",
            "OsType": 1,
            "PhoneNumber": auth.phone,
            "ScreenSizeType": 4,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true}, body: {"BirthDate": true, "PhoneNumber": true}},
        sanitizeResponseLog: {body: {Result: true}},
    });

    auth.key = response.body.Result;
    response = await fetchJson("Sms/SendSmsCode", {
        API: 3,
        method: "POST",
        headers: {
            ...defaultMyCreditHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}},
        sanitizeResponseLog: {headers: {"set-cookie": true}},
    });

    let isPinCreated;
    let isValidSms;
    let readlineTitle = "Введите пароль из СМС для регистрации в 'Мой кредит'";
    for(let i=0; i<3; i++) {
        const code = await ZenMoney.readLine(readlineTitle, {
            time: 120000,
            inputType: "number",
        });
        if (!code || !code.trim())
            throw new TemporaryError("Получен пустой пароль");

        response = await fetchJson("Sms/ValidateSmsCode", {
            API: 3,
            headers: {
                ...defaultMyCreditHeaders,
                "X-Device-Ident": auth.device,
                "X-Private-Key": auth.key,
                "X-Phone-Number": auth.phone,
            },
            body: {
                "SmsCode": code,
            },
            sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {"SmsCode": true}},
            sanitizeResponseLog: {headers: {"set-cookie": true}},
        });

        isPinCreated = response.body.Result.IsUserPinCodeCreated;
        isValidSms = response.body.Result.IsValidSMSCode;
        if (isValidSms)
            break;

        readlineTitle = "Пароль не верен. Попытка #"+(i+2);
    }
    if (!isValidSms)
        throw new TemporaryError("Пароль не верен. Не удалось зарегистрировать устройство в 'Мой кредит'");

    if (!isPinCreated)
        throw new TemporaryError("Необходимо пройти регистрацию в приложении 'Мой кредит', чтобы установить пин-код для входа");

    response = await fetchJson("Pin/CheckUserPin", {
        API: 3,
        headers: {
            ...defaultMyCreditHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
        },
        body: {
            "Pin": (preferences.pin || "").trim(),
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {Pin: true}},
        sanitizeResponseLog: {headers: {"X-Auth-Token": true, "set-cookie": true}},
    });

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new TemporaryError("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.");

    auth.token = response.headers["x-auth-token"];
    ZenMoney.setData("auth", auth);
    return auth;
}

export async function fetchBaseAccounts() {
    console.log(">>> Загрузка списка счетов [Базовый] =======================================");
    const response = await fetchJson(`${baseUri}/ProductService`, {
        log: true,
        method: "POST",
        body: {
            "arguments": [],
            "javaClass": "org.springframework.remoting.support.RemoteInvocation",
            "methodName": "getAllProducts",
            "parameterTypes": [],
        },
        headers: defaultBaseHeaders,
    });

    // отфильтруем лишние и не рабочие счета
    const fetchedAccounts = {};
    ["creditCards", "debitCards", "merchantCards", "credits", "deposits"].forEach(function(key) {
        if (!response.body.hasOwnProperty(key) || !response.body[key].list || response.body[key].list.length === 0) return;
        const list = [];
        response.body[key].list.forEach(function(elem) {
            if (_.includes(["Действующий", "Active"], elem.contractStatus) === false) {
                console.log(`>>> Счёт '${elem.productName}' не активен. Пропускаем...`);
                return;
            }
            if (ZenMoney.isAccountSkipped(elem.contractNumber)) {
                console.log(`>>> Счёт "${elem.productName}" в списке игнорируемых. Пропускаем...`);
                return;
            }
            list.push(elem);
        });
        if (list.length === 0) return;
        fetchedAccounts[key] = list;
    });

    // догрузим подробную информацию по каждому счёту
    await Promise.all(["creditCards", "debitCards", "merchantCards", "credits", "deposits"].map(async type => {
        if (!fetchedAccounts.hasOwnProperty(type)) return;
        await Promise.all(fetchedAccounts[type].map(async account => {
            let methodName;
            let filterMo;
            switch (type){
                case "creditCards":
                    filterMo = "CreditCardFilterMo";
                    methodName = "getCreditCardDetails";
                    break;
                // приложение "Банк Хоум Кредит" по дебетовым картам возвращает только пустые (бесполезные) значения
                /*case "debitCards":
                    filterMo = "DebitCardFilterMo";
                    methodName = "getDebitCardDetails";
                    break;*/
                // в приложении "Банк Хоум Кредит" кредиты не поддерживается (вызывают ошибку)
                /*case "credits":
                    filterMo = "CreditFilterMo";
                    methodName = "getCreditDetails";
                    break;*/
                // приложение "Банк Хоум Кредит" по карте рассрочки возвращает только пустые (бесполезные) значения
                /*case "merchantCards":
                    filterMo = "MerchantCardFilterMo";
                    methodName = "getMerchantCardDetails";
                    break;*/
                // не было данных для проверки
                /*case "deposits":
                    filterMo = "DepositFilterMo";
                    methodName = "getDepositDetails";
                    break;*/
                default:
                    methodName = null;
                    break;
            }
            if (methodName) {
                console.log(`>>> Загрузка деталей '${account.productName}' (${getCardNumber(account.cardNumber)}) [Базовый] --------------------`);
                const response = await fetchJson(`${baseUri}/ProductService`, {
                    log: true,
                    method: "POST",
                    body: {
                        "arguments": [
                            {
                                "cardNumber": account.cardNumber,
                                "javaClass": "cz.bsc.g6.components.product.json.services.api.mo." + filterMo,
                            },
                        ],
                        "javaClass": "org.springframework.remoting.support.RemoteInvocation",
                        "methodName": methodName,
                        "parameterTypes": ["cz.bsc.g6.components.product.json.services.api.mo." + filterMo],
                    },
                    headers: defaultBaseHeaders,
                });

                if (response.body.creditLimit) account.creditLimit = response.body.creditLimit;
                if (response.body.accountNumber) account.accountNumber = response.body.accountNumber;
            }
        }));
    }));

    return fetchedAccounts;
}

// загрузка списка счетов в "Мой кредит"
export async function fetchMyCreditAccounts(auth) {
    console.log(">>> Загрузка списка счетов [Мой кредит] =========================================");
    const response = await fetchJson("Product/GetClientProducts", {
        API: 0,
        headers: {
            ...defaultMyCreditHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
            "X-Auth-Token": auth.token,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
        sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
    });

    const fetchedAccounts = _.pick(response.body.Result, ["CreditCard", "CreditCardTW", "CreditLoan"]);

    // удаляем не нужные счета
    _.forEach(Object.keys(fetchedAccounts), function(key) {
        _.remove(fetchedAccounts[key], function(elem){
            if (elem.ContractStatus > 1) {
                console.log(`>>> Счёт "${elem.ProductName}" не активен. Пропускаем...`);
                return true;
            }
            if (ZenMoney.isAccountSkipped(elem.ContractNumber)) {
                console.log(`>>> Счёт "${elem.ProductName}" в списке игнорируемых. Пропускаем...`);
                return true;
            }
            return false;
        })
    });

    // догрузим информацию по кредитам из "Мой Кредит"
    if (fetchedAccounts.CreditLoan && fetchedAccounts.CreditLoan.length > 0) {
        await Promise.all(Object.keys(fetchedAccounts.CreditLoan).map(async key => {
            const account = fetchedAccounts.CreditLoan[key];

            console.log(`>>> Загрузка информации по кредиту '${account.ProductName}' (${account.AccountNumber}) [Мой кредит] --------`);
            await fetchJson("Payment/GetProductDetails", {
                headers: {
                    ...defaultMyCreditHeaders,
                    "X-Device-Ident": auth.device,
                    "X-Private-Key": auth.key,
                    "X-Phone-Number": auth.phone,
                    "X-Auth-Token": auth.token,
                },
                body: {
                    ContractNumber: account.ContractNumber,
                    AccountNumber: account.AccountNumber,
                    ProductSetCode: account.ProductSet.Code,
                    ProductType: account.ProductType,
                },
                sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
                sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
            });

            const response = await fetchJson("https://api-myc.homecredit.ru/api/v1/prepayment", {
                headers: {
                    ...defaultMyCreditHeaders,
                    "X-Device-Ident": auth.device,
                    "X-Private-Key": auth.key,
                    "X-Phone-Number": auth.phone,
                    "X-Auth-Token": auth.token,
                },
                body: {
                    "contractNumber": account.ContractNumber,
                    "selectedPrepayment": "LoanBalance",
                    "isEarlyRepayment": "False",
                    "isSingleContract": "True",
                },
                sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
                sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
            });

            // добавим информацию о реалном остатке по кредиту
            if (!response.body)
                console.log(">>> ОСТАТОК НА СЧЕТУ КРЕДИТА НЕ ДОСТУПЕН! В течение нескольких дней после наступления расчётной даты остаток ещё не доступен.");
            else if (response.body.statusCode === 200)
                account.RepaymentAmount = response.body.repaymentAmount;
        }));
    }

    return fetchedAccounts;
}

export async function fetchBaseTransactions(accountData, type, fromDate, toDate = null) {
    console.log(`>>> Загружаем список операций '${accountData.details.title}' (${getCardNumber(accountData.details.cardNumber) || accountData.details.accountNumber}) [Базовый] ========================`);
    const listCount = 25;
    let listStartPosition = 0;

    let transactions = [];

    let methodName;
    let filterMo;
    switch (type){
        case "creditCards":
            methodName = "getCreditCardTransactions";
            filterMo = "CreditCardTransactionsFilterMo";
            break;
        case "debitCards":
            methodName = "getDebitCardTransactions";
            filterMo = "DebitCardTransactionsFilterMo";
            break;
        case "credits":
            methodName = "getCreditTransactions";
            filterMo = "CreditTransactionsFilterMo";
            break;
        case "merchantCards":
            methodName = "getMerchantCardTransactions";
            filterMo = "MerchantCardTransactionsFilterMo";
            break;
        default:
            methodName = null;
            break;
    }
    if (!methodName) {
        console.log(`>>> Загрузка операций для счёта с типом '${type}' не реализована! Пропускаем.`);
        return [];
    }

    let from = getDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))).getTime();
    let to = getDate(toDate || new Date()).getTime();
    while (true) {
        const response = await fetchJson(`${baseUri}/ProductService`, {
            log: true,
            method: "POST",
            body: {
                "arguments": [{
                    "accountNumber": accountData.details.accountNumber,
                    "cardNumber": accountData.details.cardNumber,
                    "contractNumber": accountData.details.contractNumber,
                    "count": listCount,
                    "fromDate": {
                        "javaClass": "java.util.Date",
                        "time": from,
                    },
                    "isSort": "false",
                    "startPosition": listStartPosition,
                    "toDate": {
                        "javaClass": "java.util.Date",
                        "time": to,
                    },
                    "javaClass": "cz.bsc.g6.components.product.json.services.api.mo." + filterMo,
                }],
                "javaClass": "org.springframework.remoting.support.RemoteInvocation",
                "methodName": methodName,
                "parameterTypes": ["cz.bsc.g6.components.product.json.services.api.mo." + filterMo],
            },
            headers: defaultBaseHeaders,
        });

        let list;
        switch (type){
            case "creditCards":
                list = response.body.creditCardTransactions.list;
                break;
            case "debitCards":
                list = response.body.debitCardTransactions.list;
                break;
            case "credits":
                list = response.body.creditTransactions.list;
                break;
            default:
                list = null;
                break;
        }

        if (list) {
            list.forEach((i) => {
                if (i.valueDate.time >= from)
                    transactions.push(i);
            });
            if (list.length < listCount) break;
        } else
            break;

        listStartPosition += listCount;
    }

    return transactions;
}

export async function fetchMyCreditTransactions(auth, accountData, fromDate, toDate = null) {
    console.log(`>>> Загружаем список операций '${accountData.details.title}' (${accountData.details.accountNumber}) [Мой кредит] ========================`);

    let type;
    const body = {
        "accountNumber": accountData.details.accountNumber,
        "cardNumber": accountData.details.cardNumber,
        "count": 0,
        "fromDate": getFormatedDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))),
        "isSort": false,
        "startPosition": 0,
        "toDate": getFormatedDate(toDate || new Date()),
    };

    switch(accountData.details.type){
        case "CreditCard":
            type = "creditCards";
            body.contractNumber = accountData.details.contractNumber;
            break;
        case "CreditCardTW":
            type = "merchantCards";
            break;
        default:
            break;
    }
    if (!type) {
        console.log(`>>> Загрузка операций для счёта с типом '${type}' не реализована! Пропускаем.`);
        return [];
    }

    const response = await fetchJson(`https://ib.homecredit.ru/rest/${type}/transactions`, {
        ignoreErrors: true,
        headers: {
            ...defaultMyCreditHeaders,
            "Authorization": "Bearer "+auth.token,
            "Host": "ib.homecredit.ru",
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
            "X-Auth-Token": auth.token,
        },
        body: body,
        sanitizeRequestLog: {headers: {"Authorization": true, "X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
        sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
    });
    return response.body.values;
}

async function fetchJson(url, options, predicate) {
    if (url.substr(0, 4) !== "http") {
        const api = options.API ? parseInt(options.API, 10) : 0;
        const apiStr = api > 0 ? `/v${api}` : "";
        url = `${myCreditUrl}${apiStr}/api/${url}`;
    }
    let response;
    try {
        response = await Network.fetchJson(url, {
            method: options.method || "POST",
            ..._.omit(options, ["API"]),
        });
    } catch (e) {
        if (e.response && e.response.status === 503) {
            throw new TemporaryError("Информация из Банка Хоум Кредит временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться несколько дней, откройте Настройки синхронизации и нажмите \"Отправить лог последней синхронизации разработчикам\".");
        } else {
            throw e;
        }
    }
    if (predicate)
        validateResponse(response, response => response.body && predicate(response));
    if (!options.ignoreErrors && response.body) {
        if ((response.body.StatusCode || response.body.statusCode) && response.body.StatusCode !== 200 && response.body.statusCode !== 200) {
            const message = getErrorMessage(response.body.Errors);
            if (message) {
                if (message.indexOf("повторите попытку") + 1)
                    throw new TemporaryError(message);
                else if (message.indexOf("роверьте дату рождения") + 1)
                    throw new InvalidPreferencesError(message);
                else
                    throw new Error(message);
            }
        } else if (response.body.success === false) {
            const message = response.body.errorResponseMo.errorMsg;
            if (message.indexOf("No entity found") + 1)
                throw new InvalidPreferencesError("Авторизация не прошла. Пожалуйста, проверьте корректность параметров подключения.");
        }
    }
    return response;
}

function validateResponse(response, predicate, message) {
    console.assert(!predicate || predicate(response), message || "non-successful response");
}

function getErrorMessage(errors){
    if (!errors || !_.isArray(errors) || errors.length === 0)
        return "";

    let message = errors[0];
    errors.forEach(function(value) {
        if (value.indexOf("повторите")<0) message = value;
    });
    return message;
}

function getDate(date) {
    return typeof date === "string" ? parseStartDateString(date) : date;
}

function getFormatedDate(date){
    const dt = getDate(date);
    return isValidDate(dt) ? dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2) : null;
}

function isValidDate(d) {
    return d && d instanceof Date && !isNaN(d);
}

function getDeviceId(){
    function chr8(){
        return Math.random().toString(16).slice(-8);
    }
    return chr8()+chr8();
}

export function getCardNumber(number) {
    if (typeof number !== "string" || number.length % 4 !== 0)
        return number;

    let result = "";
    for(let i=0; i<number.length/4; i++)
        result += number.substr(i*4, 4) + " ";

    return result.trim();
}
