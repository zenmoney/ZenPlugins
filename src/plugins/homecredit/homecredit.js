import {MD5} from "jshashes";
import {parseStartDateString} from "../../common/adapters";
import * as Network from "../../common/network";
import _ from "lodash";

const baseUrl = "https://mob.homecredit.ru/mycredit";
const md5 = new MD5();
const defaultHeaders = {
    "_ver_": "3.2.2",
    "_os_": 1,
    "Host": "mob.homecredit.ru",
};

export async function login(preferences) {
    const auth = ZenMoney.getData("auth", null) || {};
    if (!auth || !auth.device || !auth.key || !auth.token || !auth.phone) {
        auth.phone = (preferences.phone || "").trim();
        return registerDevice(auth, preferences);
    }

    console.log(">>> Авторизация =====================================================================");
    let response = await fetchJson("Pin/CheckUserPin", {
        API: 3,
        ignoreErrors: true,
        headers: {
            ...defaultHeaders,
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
        registerDevice(auth, preferences);
        return;
    }

    if (response.body.StatusCode !== 200) {
        console.log("Нужна повторная регистрация.");
        registerDevice(auth, preferences);
        return;
    }

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new InvalidPreferencesError("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.");

    auth.token = response.headers["x-auth-token"];
    ZenMoney.setData("auth", auth);
    return auth;
}

async function registerDevice(auth, preferences){
    const date = getFormatedDate(preferences.birth);
    if (!date)
        throw new InvalidPreferencesError("Параметр подключения 'День рождения' указан не верно")

    console.log(">>> Регистрация устройства ============================================================");
    auth.device = md5.hex(auth.phone + "homecredit").substr(0, 16);
    let response = await fetchJson("Account/Register", {
        API: 3,
        headers: {
            ...defaultHeaders,
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
            ...defaultHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}},
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
                ...defaultHeaders,
                "X-Device-Ident": auth.device,
                "X-Private-Key": auth.key,
                "X-Phone-Number": auth.phone,
            },
            body: {
                "SmsCode": code,
            },
            sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {"SmsCode": true}},
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
            ...defaultHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
        },
        body: {
            "Pin": (preferences.pin || "").trim(),
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {Pin: true}},
        sanitizeResponseLog: {headers: {"x-auth-token": true}},
    });

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new ZenMoney.Error("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.", true);

    auth.token = response.headers["x-auth-token"];
    ZenMoney.setData("auth", auth);
    return auth;
}

export async function fetchAccounts(auth) {
    console.log(">>> Загружаем список счетов ===========================================================");
    // загрузим список счетов
    const response = await fetchJson("Product/GetClientProducts", {
        API: 0,
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
            "X-Auth-Token": auth.token,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
        sanitizeResponseLog: {headers: {"x-auth-token": true}},
    });

    // список интересующиъ счетов
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

    return fetchedAccounts;
}

export async function fetchDetails(auth, account, type){
    let details;
    switch (type) {
        case "CreditLoan":
            details = await fetchLoanDetails(auth, account);
            break;

        default:
            details = null;
            break;
    }
    return {
        account: account,
        details: details,
    };
}

async function fetchLoanDetails(auth, account){
    console.log(`>>> Загружаем детали счёта: ${account.AccountNumber} [${account.ContractNumber}] ==============`);

    // детали кредита
    let response = await fetchJson("Payment/GetProductDetails", {
        headers: {
            ...defaultHeaders,
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
        sanitizeResponseLog: {headers: {"x-auth-token": true}},
    });
    const accountBalance = response.body.Result.CreditLoan.AccountBalance;

    // Запрос остатка только по тем кредитам, где есть срок ближайшего платежа
    let detailedResponse = {};
    if (response.body.Result.PayDate) {
        // остаток по кредиту
        console.log(`>>> Запрашиваем остаток по кредиту (${account.AccountNumber}) ---------------------`);
        response = await fetchJson("https://api-myc.homecredit.ru/api/v1/prepayment", {
            headers: {
                ...defaultHeaders,
                "Host": "api-myc.homecredit.ru",
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
            sanitizeResponseLog: {headers: {"x-auth-token": true}},
        });

        detailedResponse = response.body;
    } else
        console.log(`>>> По кредиту (${account.AccountNumber}) нет данных о ближайшем платеже ---------------------`);

    return {
        ...detailedResponse,
        accountBalance: accountBalance,
    };
}

export async function fetchTransactions(auth, accountData, fromDate, toDate = null) {
    console.log(`>>> Загружаем список операций (${accountData.details.accountNumber}) =====================================`);
    if (accountData.details.type !== "CreditCard") {
        console.log(`Загрузка операций по счёту ${accountData.details.type} не поддерживается`);
        return [];
    }

    const type = _.lowerFirst(accountData.details.type)+"s";
    const response = await fetchJson(`https://ib.homecredit.ru/rest/${type}/transactions`, {
        ignoreErrors: true,
        headers: {
            ...defaultHeaders,
            "Authorization": "Bearer "+auth.token,
            "Host": "ib.homecredit.ru",
            "X-Device-Ident": auth.device,
            "X-Private-Key": auth.key,
            "X-Phone-Number": auth.phone,
            "X-Auth-Token": auth.token,
        },
        body: {
            accountNumber: accountData.details.accountNumber,
            cardNumber: accountData.details.cardNumber,
            contractNumber: accountData.details.contractNumber,
            count: 0,
            fromDate: getFormatedDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))),
            isSort: false,
            startPosition: 0,
            toDate: getFormatedDate(toDate || new Date()),
        },
        sanitizeRequestLog: {headers: {"Authorization": true, "X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}},
        sanitizeResponseLog: {headers: {"x-auth-token": true}},
    });
    return response.body.values;
}

async function fetchJson(url, options, predicate) {
    if (url.substr(0, 4) !== "http") {
        const api = options.API ? parseInt(options.API, 10) : 0;
        const apiStr = api > 0 ? `/v${api}` : "";
        url = `${baseUrl}${apiStr}/api/${url}`;
    }
    const response = await Network.fetchJson(url, {
        method: options.method || "POST",
        ..._.omit(options, ["API"]),
    });
    if (predicate)
        validateResponse(response, response => response.body && predicate(response));
    if (!options.ignoreErrors && response.body && (response.body.StatusCode !== 200 && response.body.statusCode !== 200)) {
        const message = getErrorMessage(response.body.Errors);
        if (message) {
            if (message.indexOf("повторите попытку") + 1)
                throw new TemporaryError(message);
            else if (message.indexOf("роверьте дату рождения") + 1)
                throw new InvalidPreferencesError(message);
            else
                throw new Error(message);
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

function getFormatedDate(date){
    const dt = typeof date === "string" ? parseStartDateString(date) : date;
    return isValidDate(dt) ? dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2) : null;
}

function isValidDate(d) {
    return d && d instanceof Date && !isNaN(d);
}