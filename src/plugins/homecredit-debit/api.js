/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {fetchJson} from "../../common/network";

let apiUri = "https://ib.homecredit.ru/mobile/remoting";
let isNewDevice = false;

const defaultHeaders = {
    "User-Agent": "okhttp/3.10.0",
    "Content-Type": "application/json; charset=utf-8",
};

export async function auth(login, password, code) {
    const deviceId = getDeviceId();

    const response = await fetchJson(`${apiUri}/LoginService`, {
        log: true,
        method: "POST",
        body: {
            "arguments": [
                {
                    "appVersion": "2.6.1",
                    "code": isNewDevice ? code : null,
                    "deviceID": deviceId,
                    "javaClass": "cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo",
                    "password": password,
                    "system": "Android",
                    "systemVersion": "7.1.2",
                    "username": login,
                },
            ],
            "attributes": null,
            "javaClass": "org.springframework.remoting.support.RemoteInvocation",
            "methodName": "login",
            "parameterTypes": ["cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo"],
        },
        headers: defaultHeaders,
        sanitizeRequestLog: {
            // body: {
            // },
        },
        sanitizeResponseLog: {
            headers: {
                // "set-cookie" : true,
            },
        },
    });

    // @TODO обработка неправильно введенного пароля и прочего
    // {"errorResponseMo":{"errorFields":{"javaClass":"java.util.ArrayList","list":[{"javaClass":"cz.bsc.g6.components.base.json.services.api.mo.ErrorDetailMo","fieldCode":"code","errorMsg":"User was blocked"}]},"errorCode":"BLOCK_USER_CODE","javaClass":"cz.bsc.g6.components.base.json.services.api.mo.ErrorResponseMo","errorMsg":"User was blocked"},"javaClass":"cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginResultMo","success":false}
    // {"errorResponseMo":{"errorFields":{"javaClass":"java.util.ArrayList","list":[{"javaClass":"cz.bsc.g6.components.base.json.services.api.mo.ErrorDetailMo","fieldCode":"code","errorMsg":"Wrong code"}]},"errorCode":"ERROR_LOGIN","javaClass":"cz.bsc.g6.components.base.json.services.api.mo.ErrorResponseMo","errorMsg":"Invalid credential"},"javaClass":"cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.LoginResultMo","success":false}

    // {"arguments":[{"appVersion":"2.6.1","code":null,"deviceID":"53887e81cfdf6664","javaClass":"cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo","password":"***","system":"Android","systemVersion":"5.0.2","username":"***"}],"attributes":null,"javaClass":"org.springframework.remoting.support.RemoteInvocation","methodName":"login","parameterTypes":["cz.bsc.g6.components.usernamepasswordauthentication.json.services.api.mo.UsernamePasswordCredentialMo"]}

    return response
}

export async function fetchProducts() {
    const response = await fetchJson(`${apiUri}/ProductService`, {
        log: true,
        method: "POST",
        body: {
            "arguments": [],
            "javaClass": "org.springframework.remoting.support.RemoteInvocation",
            "methodName": "getAllProducts",
            "parameterTypes": [],
        },
        headers: defaultHeaders,
        sanitizeRequestLog: {
            // body: {
            // },
        },
    });

    assertResponseSuccess(response);

    return response.body;
}

export async function fetchDebitCardTransactions(cardNumber, accountNumber, contractNumber, fromDate, toDate) {
    const listCount = 25;
    let listStartPosition = 0;

    let transactions = [];

    while (true) {
        const response = await fetchJson(`${apiUri}/ProductService`, {
            log: true,
            method: "POST",
            body: {
                "arguments": [{
                    "cardNumber": cardNumber,
                    "accountNumber": accountNumber,
                    "contractNumber": contractNumber,
                    "count": listCount,
                    "fromDate": {
                        "javaClass": "java.util.Date",
                        "time": fromDate,
                    },
                    "isSort": "false",
                    "startPosition": listStartPosition,
                    "toDate": {
                        "javaClass": "java.util.Date",
                        "time": toDate,
                    },
                    "javaClass": "cz.bsc.g6.components.product.json.services.api.mo.DebitCardTransactionsFilterMo",
                }],
                "javaClass": "org.springframework.remoting.support.RemoteInvocation",
                "methodName": "getDebitCardTransactions",
                "parameterTypes": ["cz.bsc.g6.components.product.json.services.api.mo.DebitCardTransactionsFilterMo"],
            },
            headers: defaultHeaders,
            sanitizeRequestLog: {
                // body: {
                // },
            },
        });

        assertResponseSuccess(response);

        response.body.debitCardTransactions.list.forEach((i) => {
            transactions.push(i);
        });

        if (response.body.debitCardTransactions.list.length < listCount) {
            break;
        }

        listStartPosition += listCount;
    }

    return transactions;
}

const assertResponseSuccess = (response) => {
    // @TODO
};

const getDeviceId = () => {
    let deviceId = ZenMoney.getData("device_id", 0);

    if (deviceId === 0) {
        isNewDevice = true;

        deviceId = Array.apply(null, {length: 16})
            .map(() => Number(Math.floor(Math.random() * 16)).toString(16))
            .join("")
            .substring(0, 16);

        ZenMoney.setData("device_id", deviceId);
    }

    return deviceId;
};
