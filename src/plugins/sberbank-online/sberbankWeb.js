import _ from "lodash";
import * as network from "../../common/network";
import {formatDate} from "./sberbank";
import {parseDate} from "./converters";

const qs = require("querystring");
const cheerio = require("cheerio");

let baseUrl = ""; //"https://online.sberbank.ru";
const appVersion = "7.11.1";

const defaultHeaders = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip",
    "Accept-Language": "en-US,en;q=0.9,ru;q=0.8,de;q=0.7,pl;q=0.6",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "Keep-Alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
    "Host": "online.sberbank.ru",
    "X-Requested-With": "XMLHttpRequest",
};

export function extractPageToken(html) {
    const $ = cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: false,
    });
    return $("input[name=PAGE_TOKEN]").attr("value");
}

export function loadHtml(html) {
    return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: false,
    });
}

function getTextFromNode(node) {
    return node.text().replace(/\s+/g, " ").trim();
}

export function parseTransactions($, nowDate) {
    const nodes = $("table[class=tblInf]").children()[0].children.slice(1);
    return nodes.map(node => {
        const description = $("td[class=\"align-left leftPaddingCell\"]", node);
        const date = $("td[class=listItem]", node);
        let amount = $("td[class=align-right]", node);
        if (amount.children().length) {
            amount = amount.children()[0];
        }
        let dateStr = getTextFromNode(date).toLowerCase();
        if (dateStr.indexOf("сегодня") >= 0) {
            dateStr = formatDate(nowDate);
        } else if (dateStr.indexOf("вчера") >= 0) {
            dateStr = formatDate(new Date(nowDate.getTime() - 24 * 3600 * 1000));
        } else if (dateStr.length === 5) {
            dateStr += "." + nowDate.getFullYear();
        }
        return {
            description: getTextFromNode(description),
            date: dateStr,
            amount: getTextFromNode(amount),
        };
    });
}

export async function fetchTransactions(host, {id, type}, fromDate, toDate) {
    const response = await fetchHtml(`https://${host}/PhizIC/private/${type}s/info.do?id=${id}`, {
        method: "GET",
        headers: {
            "Host": `${host}`,
            "Referer": `https://${host}/PhizIC/private/${type}s/list.do`,
        },
    });
    return parseTransactions(loadHtml(response.body), new Date()).filter(transaction => {
        const date = new Date(parseDate(transaction.date));
        return date >= fromDate && date <= toDate;
    });
}

export async function login(host, login, password) {
    // let response = await getLoggedInHtml();
    // if (response) {
    //     console.log("В вебе уже залогинены, используем текущую сессию.");
    //     return response;
    // }

    const url = "https://online.sberbank.ru/CSAFront/login.do";
    const loginResponse = await fetchHtml(url, {
        method: "POST",
        headers: {
            ...defaultHeaders,
            "Referer": url,
            "Origin": "https://online.sberbank.ru",
        },
        body: {
            "fakeLogin": "",
            "fakePassword": "",
            "field(login)": login,
            "field(password)": password,
            "operation": "button.begin",
        },
    });

    let error = /<h1[^>]*>О временной недоступности услуги[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>|в связи с ошибкой в работе системы[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i.test(loginResponse.body);
    if (error) {
        //console.log("Ошибка входа HTML: ", loginResponse.body);
        throw new ZenMoney.Error("Ошибка входа");
    }

    if (/\$\$errorFlag/i.test(loginResponse.body)) {
        //console.log("Ошибка входа [2] HTML: ", loginResponse.body);
        throw new ZenMoney.Error("Ошибка входа [2]");
    }

    // определим страницу авторизации по токену
    const urlPageToken = loginResponse.getHtml("form[name=LoginForm] > input[name$=redirect]").attr("value");
    if (!urlPageToken) {
        //console.log("Login response HTML: ", loginResponse.body);
        throw new ZenMoney.Error("Не удалось пройти авторизацию в веб-версии Сбербанк Онлайн.");
    }

    // инициализируем рабочий адрес сервера
    baseUrl = /^(https?:\/\/.*?)\//i.exec(urlPageToken)[1];

    let response = await fetchHtml(urlPageToken, {
        headers: {
            ...defaultHeaders,
            "Origin": baseUrl,
            "Referer": `${baseUrl}/CSAFront/index.do`,
        },
    });

    // не известный ответ сервера
    if (!/online.sberbank.ru\/PhizIC/.test(response.body)) {
        //console.log("Login response HTML: ", response.body);
        throw new ZenMoney.Error("Не удалось пройти авторизацию в веб-версии Сбербанк Онлайн [2]");
    }

    let pageToken;
    if (/StartMobileBankRegistrationForm/i.test(response.body)) {
        // Сбербанк хочет, чтобы вы приняли решение о подключении мобильного банка. Откладываем решение.
        pageToken = response.getHtml("input[name=PAGE_TOKEN]").attr("value");
        if(!pageToken) throw new ZenMoney.Error("Попытались отказаться от подключения мобильного банка, но не удалось найти PAGE_TOKEN!");

        response = await fetchHtml(`${baseUrl}/PhizIC/login/register-mobilebank/start.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
                "Referer": baseUrl,
            },
            body: {
                "PAGE_TOKEN": pageToken,
                "operation": "skip",
            },
        });
    }

    response = await fetchHtml(`${baseUrl}/PhizIC/confirm/way4.do`, {
        headers: {
            ...defaultHeaders,
            "Referer": `${baseUrl}/CSAFront/index.do`,
        },
    });
    pageToken = extractPageToken(response.body);

    // Другой кейс, пользователь сменил идентификатор на логин
    if (/Ранее вы[^<]*?уже создали[^<]*?логин для входа/i.test(response.body))
        throw new ZenMoney.Error("Ранее вы уже создали логин вместо идентификатора для входа", null, true);

    if (ZenMoney.getLastStatusCode() >= 400) {
        throw new ZenMoney.Error("Временные технические проблемы в Сбербанк-онлайн. Пожалуйста, попробуйте ещё раз позже.");
    } else {
        if (/PhizIC/.test(response.body)) {
            if (/confirmTitle/.test(response.body)) {
                // проверяем сначала тип подтверждения и переключаем его на смс, если это чек
                const html = response.getHtml("div.confirmButtonRegion").html().trim();
                // запрошен СМС-код
                if (/confirmSMS/i.test(html)) {
                    console.log("Запрошен СМС-код для входа...");
                } else if (/confirmCard/i.test(html)) {
                    // запрошен пароль с чека. Это неудобно, запрашиваем пароль по смс.
                    console.log("Запрошен пароль с чека. Это неудобно, запрашиваем пароль по смс.");
                    pageToken = response.getHtml("input[name=PAGE_TOKEN]").attr("value");
                    await fetchHtml(`${baseUrl}/PhizIC/async/confirm.do`, {
                        method: "POST",
                        headers: {
                            ...defaultHeaders,
                            "Referer": baseUrl,
                        },
                        body: {
                            "PAGE_TOKEN": pageToken,
                            "operation": "button.confirmSMS",
                        },
                    });
                } else {
                    console.log("Неизвестный способ подтверждения:", html);
                }

                const pass = await ZenMoney.readLine("Введите пароль для входа в Сбербанк Онлайн из СМС.\n\nЕсли вы не хотите постоянно вводить СМС-пароли при входе, вы можете отменить" +
                    " их в настройках вашего Сбербанк-онлайн. Это безопасно - для совершения денежных операций требование одноразового пароля всё равно останется.", null, {
                    time: 300000,
                    inputType: "number",
                });

                // смс-код не ввели
                if (!pass || pass == 0 || String(pass).trim() === "")
                    throw new ZenMoney.Error("Получен пустой код для входа в веб-версию Сбербанк Онлайн", true);

                response = await fetchHtml(`${baseUrl}/PhizIC/async/confirm.do`, {
                    method: "POST",
                    headers: {
                        ...defaultHeaders,
                        "Origin": baseUrl,
                        "Referer": `${baseUrl}/PhizIC/confirm/way4.do`,
                    },
                    body: {
                        "receiptNo": "",
                        "passwordsLeft": "",
                        "passwordNo": "",
                        "SID": "",
                        "$$confirmSmsPassword": pass,
                        "PAGE_TOKEN": pageToken,
                        "operation": "button.confirm",
                    },
                }, response => response.body.trim() === "next");

                response = await fetchHtml(`${baseUrl}/PhizIC/confirm/way4.do`, {
                    method: "POST",
                    headers: {
                        ...defaultHeaders,
                        "Origin": baseUrl,
                        "Referer": `${baseUrl}/PhizIC/confirm/way4.do`,
                    },
                    body: {
                        "receiptNo": "",
                        "passwordsLeft": "",
                        "passwordNo": "",
                        "SID": "",
                        "$$confirmSmsPassword": pass,
                        "PAGE_TOKEN": pageToken,
                        "operation": "button.nextStage",
                    },
                });
            }

            if (!isLoggedIn(response)) {
                if (/Получите новый пароль, нажав/i.test(response.body))
                    throw new ZenMoney.Error("Не удалось подтвердить вход в веб-версию Сбербанк Онлайн");
            }

            checkAdditionalQuestions(response);

            if (!isLoggedIn(response)) {
                response = getLoggedInHtml();

                if (!isLoggedIn(response)) {
                    console.log("Не удалось войти в веб-версию Сбербанк Онлайн", response.body);
                    throw new ZenMoney.Error("Не удалось войти в Cбербанк-онлайн. Сайт изменен?");
                }
            }
        } else {
            console.log(response);
            throw new ZenMoney.Error("Ваш тип личного кабинета не поддерживается. Свяжитесь, пожалуйста, с разработчиками.");
        }
    }

    return response;
}

async function fetchHtml(url, options = {}, predicate = () => true) {
    if (url.substr(0, 4) !== "http") {
        if (url.substr(0, 1) !== "/") {
            url = "/" + url;
        }
        url = baseUrl + url;
    }
    options = {
        method: "GET",
        headers: defaultHeaders,
        ...options,
        stringify: qs.stringify,
    };
    if (typeof _.get(options, "sanitizeResponseLog.body") === "object") {
        options.sanitizeResponseLog.body = {response: options.sanitizeResponseLog.body};
    }

    const response = await network.fetch(url, options);
    response.html = null;
    response.getHtml = function(selector){
        "use strict";
        if (!this.html)
            this.html = cheerio.load(this.body, {
                normalizeWhitespace: true,
                xmlMode: false,
            });
        return this.html(selector);
    };

    if (predicate) {
        validateResponse(response, response => predicate(response));
    }

    return response;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

async function getLoggedInHtml() {
    const url = baseUrl || "https://node1.online.sberbank.ru";
    let response = await fetchHtml(`${url}/PhizIC/private/userprofile/userSettings.do`, {
        headers: {
            ...defaultHeaders,
        },
    });
    if (isLoggedIn(response)) {
        baseUrl = url;
        return response;
    }
    return null;
}

function isLoggedIn(response) {
    return /accountSecurity.do/i.test(response.body);
}

function checkNext(response) {
    // ToDO: пепроверить структуру ответа
    if ((response.body || "").trim() === "next") {
        console.log("У нас next, обновляем страницу.", response);
        response = getLoggedInHtml();
    }
    return response;
}

async function checkAdditionalQuestions(response) {
    // требуется принять соглашение о безопасности
    if (/internetSecurity/.test(response.body)) {
        console.log("Требуется принять соглашение о безопасности. Принимаем...");
        const pageToken = response.getHtml("input[name=PAGE_TOKEN]").attr("value");
        response = await fetchHtml(`${baseUrl}/PhizIC/internetSecurity.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
            },
            body: {
                "field(selectAgreed)": "on",
                "PAGE_TOKEN": pageToken,
                "operation": "button.confirm",
            },
        });
    }
    response = checkNext(response);

    if (/Откроется справочник регионов, в котором щелкните по названию выбранного региона/.test(response.body)) {
        console.log("Выбираем все регионы оплаты.");
        response = await fetchHtml(`${baseUrl}/PhizIC/region.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
            },
            body: {
                "id": -1,
                "operation": "button.save",
            },
        });
    }
    //response = checkNext(response);
}
