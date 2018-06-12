import {MD5} from "jshashes";
import * as Network from "../../common/network";
import _ from "lodash";

const baseUrl = "https://mob.homecredit.ru/mycredit";
const md5 = new MD5();
const defaultHeaders = {
    "_ver_": "3.2.2",
    "_os_": 1,
    "Host": "mob.homecredit.ru",
};

let device;
let key;
let token;
let phone;
export async function login(preferences) {
    console.log("Авторизация...");
    device = ZenMoney.getData("device", null);
    key = ZenMoney.getData("key", null);
    token = ZenMoney.getData("token", null);
    if (!device || !key || !token)
        return registerDevice(preferences);

    phone = preferences.phone;
    let response = await fetchJson("Pin/CheckUserPin", {
        API: 3,
        ignoreErrors: true,
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": phone,
            "X-Auth-Token": token,
        },
        body: {
            "Pin": preferences.pin,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true, "X-Auth-Token": true}, body: {Pin: true}},
        sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
    });

    if (response.body.StatusCode !== 200) {
        console.log("Нужна повторная регистрация.");
        registerDevice(preferences);
        return;
    }

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new ZenMoney.Error("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.", true);

    token = response.headers.map["x-auth-token"];
    ZenMoney.setData("token", token);
    ZenMoney.saveData();
}

async function registerDevice(preferences){
    console.log("Регистрация устройства...");

    device = md5.hex(preferences.phone + "homecredit").substr(0, 16);
    let response = await fetchJson("Account/Register", {
        API: 3,
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
        },
        body: {
            "BirthDate": preferences.birth,
            "DeviceName": "samsung zen",
            "OsType": 1,
            "PhoneNumber": preferences.phone,
            "ScreenSizeType": 4,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true}, body: {BirthDate: true, PhoneNumber: true}},
    });

    key = response.body.Result;
    response = await fetchJson("Sms/SendSmsCode", {
        API: 3,
        method: "POST",
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": preferences.phone,
        },
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
                "X-Device-Ident": device,
                "X-Private-Key": key,
                "X-Phone-Number": preferences.phone,
            },
            body: {
                "SmsCode": code,
            },
            sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {SmsCode: true}},
        });

        isPinCreated = response.body.Result.IsUserPinCodeCreated;
        isValidSms = response.body.Result.IsValidSMSCode;
        if (isValidSms)
            break;

        readlineTitle = "Пароль не верен. Попытка #"+(i+2);
    }
    if (!isValidSms)
        throw new TemporaryError("Не удалось зарегистрировать устройство в 'Мой кредит'");

    if (!isPinCreated)
        throw new ZenMoney.Error("Необходимо пройти регистрацию в приложении 'Мой кредит', чтобы установить пин-код для входа", true);

    response = await fetchJson("Pin/CheckUserPin", {
        API: 3,
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": preferences.phone,
        },
        body: {
            "Pin": preferences.pin,
        },
        sanitizeRequestLog: {headers: {"X-Device-Ident": true, "X-Private-Key": true, "X-Phone-Number": true}, body: {Pin: true}},
        sanitizeResponseLog: {headers: {"X-Auth-Token": true}},
    });

    const isValidPin = response.body.Result.IsPinValid;
    if (!isValidPin)
        throw new ZenMoney.Error("Пин-код не верен. Укажите код, заданный вами в приложении банка 'Мой кредит'.", true);

    token = response.headers.map["x-auth-token"];

    ZenMoney.setData("device", device);
    ZenMoney.setData("key", key);
    ZenMoney.setData("token", token);
    ZenMoney.saveData();
}

export async function fetchAccounts() {
    console.log("Загружаем список счетов...");
    // загрузим список счетов
    const response = await fetchJson("Product/GetClientProducts", {
        API: 0,
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": phone,
            "X-Auth-Token": token,
        },
    });
    console.log("Получены счета", response.body.Result);
    return _.pick(response.body.Result, ["CreditCard", "CreditCardTW", "CreditLoan"]);
}

export async function fetchDetails(account, type){
    let details;
    switch (type) {
        case "CreditLoan":
            details = await fetchLoanDetails(account);
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

async function fetchLoanDetails(account){
    // детали кредита
    let response = await fetchJson("Payment/GetProductDetails", {
        headers: {
            ...defaultHeaders,
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": phone,
            "X-Auth-Token": token,
        },
        body: {
            ContractNumber: account.ContractNumber,
            AccountNumber: account.AccountNumber,
            ProductSetCode: account.ProductSet.Code,
            ProductType: account.ProductType,
        },
    });

    const result = {
        accountBalance: response.body.Result.CreditLoan.AccountBalance,
    };

    // остаток по кредиту
    response = await fetchJson("https://api-myc.homecredit.ru/api/v1/prepayment", {
        headers: {
            ...defaultHeaders,
            "Host": "api-myc.homecredit.ru",
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": phone,
            "X-Auth-Token": token,
        },
        body: {
            ContractNumber: account.ContractNumber,
            AccountNumber: account.AccountNumber,
            ProductSetCode: account.ProductSet.Code,
            ProductType: account.ProductType,
        },
    });

    return {
        ...result,
        ...response.body,
    };
}

export async function fetchTransactions(account, fromDate, toDate = null) {
    if (account._details.type !== "CreditCard") {
        console.log(`Загрузка операций по счёту ${account._details.type} не поддерживается`);
        return [];
    }

    const type = _.lowerFirst(account._details.type)+"s";
    const response = await fetchJson(`https://ib.homecredit.ru/rest/${type}/transactions`, {
        ignoreErrors: true,
        headers: {
            ...defaultHeaders,
            "Authorization": "Bearer "+token,
            "Host": "ib.homecredit.ru",
            "X-Device-Ident": device,
            "X-Private-Key": key,
            "X-Phone-Number": phone,
            "X-Auth-Token": token,
        },
        body: {
            accountNumber: account._details.accountNumber,
            cardNumber: account._details.cardNumber,
            contractNumber: account._details.contractNumber,
            count: 0,
            fromDate: getFormatedDate(fromDate || (fromDate.setDate(fromDate.getDate() - 7))),
            isSort: false,
            startPosition: 0,
            toDate: getFormatedDate(toDate || new Date()),
        },
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
    if (!options.ignoreErrors)
        validateResponse(response, response => response.body && (response.body.StatusCode === 200 || response.body.statusCode === 200), response.body.Errors && response.body.Errors.length>0 && ("Ответ банка – "+response.body.Errors[0]));
    return response;
}

function validateResponse(response, predicate, message) {
    console.assert(!predicate || predicate(response), message || "non-successful response");
}

function getFormatedDate(date){
    return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
}