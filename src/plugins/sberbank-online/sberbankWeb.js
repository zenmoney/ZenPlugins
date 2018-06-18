import * as network from "../../common/network";
import {parseDate, reduceWhitespaces} from "./converters";
import {formatDate} from "./sberbank";

const qs = require("querystring");
const cheerio = require("cheerio");

const defaultHeaders = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip",
    "Accept-Language": "en-US,en;q=0.9,ru;q=0.8,de;q=0.7,pl;q=0.6",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "Keep-Alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36",
};

export async function login(login, password) {
    let response = await goToUserSettings();
    if (isLoggedIn(response)) {
        console.log("В вебе уже залогинены, используем текущую сессию.");
        return {host: /^https?:\/\/(.*?)\//i.exec(response.url)[1]};
    }

    response = await fetchHtml("https://online.sberbank.ru/CSAFront/login.do", {
        method: "POST",
        headers: {
            ...defaultHeaders,
            "Referer": "https://online.sberbank.ru/CSAFront/login.do",
            "Origin": "https://online.sberbank.ru",
            "Host": "online.sberbank.ru",
        },
        body: {
            "fakeLogin": "",
            "fakePassword": "",
            "field(login)": login,
            "field(password)": password,
            "operation": "button.begin",
        },
        sanitizeRequestLog: {body: {"field(login)": true, "field(password)": true}},
    });

    if (/<h1[^>]*>О временной недоступности услуги[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>|в связи с ошибкой в работе системы[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i.test(response.body)) {
        throw new TemporaryError("Сервер банка временно недоступен");
    }
    if (/\$\$errorFlag/i.test(response.body)) {
        if (response.body.indexOf("Неверный логин или пароль") >= 0) {
            throw new InvalidPreferencesError("Неверный пароль от Сбербанк Онлайн");
        }
        throw new Error("Неизвестная ошибка");
    }

    const authUrl = response.querySelector("form[name=LoginForm] > input[name$=redirect]").attr("value");
    if (!authUrl) {
        throw new Error("Не удалось получить url переадресации");
    }

    const host = /^https?:\/\/(.*?)\//i.exec(authUrl)[1];

    response = await fetchHtml(authUrl, {
        headers: {
            ...defaultHeaders,
            "Host": host,
            "Referer": "https://online.sberbank.ru/CSAFront/index.do",
        },
    });

    if (!/online.sberbank.ru\/PhizIC/.test(response.body)) {
        throw new Error("Не удалось пройти авторизацию в веб-версии Сбербанк Онлайн");
    }

    let pageToken;
    if (/StartMobileBankRegistrationForm/i.test(response.body)) {
        pageToken = getPageToken(response);
        if (!pageToken) {
            throw new Error("Попытались отказаться от подключения мобильного банка, но не удалось найти PAGE_TOKEN!");
        }
        //TODO: Check Referer, Host, Origin
        await fetchHtml(`https://${host}/PhizIC/login/register-mobilebank/start.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
                "Referer": "https://online.sberbank.ru/CSAFront/index.do",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: {
                "PAGE_TOKEN": pageToken,
                "operation": "skip",
            },
        });
        response = await fetchHtml(`https://${host}/PhizIC/confirm/way4.do`, {
            headers: {
                ...defaultHeaders,
                "Host": host,
                "Referer": "https://online.sberbank.ru/CSAFront/index.do",
            },
        });
    }

    pageToken = getPageToken(response);

    if (/Ранее вы[^<]*?уже создали[^<]*?логин для входа/i.test(response.body)) {
        throw new InvalidPreferencesError("Ранее вы уже создали логин вместо идентификатора для входа");
    }
    if (response.status >= 400) {
        throw new TemporaryError("Временные технические проблемы в Сбербанк-онлайн. Пожалуйста, попробуйте ещё раз позже.");
    }

    if (!/PhizIC/.test(response.body)) {
        throw new Error("Ваш тип личного кабинета не поддерживается. Свяжитесь, пожалуйста, с разработчиками.");
    }

    if (/confirmTitle/.test(response.body)) {
        // проверяем сначала тип подтверждения и переключаем его на смс, если это чек
        const html = response.querySelector("div.confirmButtonRegion").html().trim();
        if (/confirmCard/i.test(html)) {
            // запрошен пароль с чека. Это неудобно, запрашиваем пароль по смс.
            console.log("Запрошен пароль с чека. Это неудобно, запрашиваем пароль по смс.");
            pageToken = getPageToken(response);
            await fetchHtml(`https://${host}/PhizIC/async/confirm.do`, {
                method: "POST",
                headers: {
                    ...defaultHeaders,
                    "Host": host,
                    "Origin": `https://${host}`,
                    "Referer": `https://${host}/PhizIC/confirm/way4.do`,
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: {
                    "PAGE_TOKEN": pageToken,
                    "operation": "button.confirmSMS",
                },
            });
        } else if (/confirmSMS/i.test(html)) {
            console.log("Запрошен СМС-код для входа...");
        } else {
            console.log("Неизвестный способ подтверждения");
        }

        const pass = await ZenMoney.readLine("Введите пароль для входа в Сбербанк Онлайн из СМС.\n\nЕсли вы не хотите постоянно вводить СМС-пароли при входе, вы можете отменить" +
            " их в настройках вашего Сбербанк-онлайн. Это безопасно - для совершения денежных операций требование одноразового пароля всё равно останется.", {
            time: 300000,
            inputType: "number",
        });

        if (!pass) {
            throw new TemporaryError("Получен пустой код для входа в веб-версию Сбербанк Онлайн");
        }

        await fetchHtml(`https://${host}/PhizIC/async/confirm.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
                "Host": host,
                "Origin": `https://${host}`,
                "Referer": `https://${host}/PhizIC/confirm/way4.do`,
                "X-Requested-With": "XMLHttpRequest",
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

        response = await fetchHtml(`https://${host}/PhizIC/confirm/way4.do`, {
            method: "POST",
            headers: {
                ...defaultHeaders,
                "Host": host,
                "Origin": `https://${host}`,
                "Referer": `https://${host}/PhizIC/confirm/way4.do`,
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

    if (!isLoggedIn(response) && /Получите новый пароль, нажав/i.test(response.body)) {
        throw new Error("Не удалось подтвердить вход в веб-версию Сбербанк Онлайн");
    }

    await checkAdditionalQuestions(host, response);

    if (!isLoggedIn(response)) {
        response = goToUserSettings(host);
    }
    if (!isLoggedIn(response)) {
        throw new Error("Не удалось войти в Cбербанк-онлайн. Сайт изменен?");
    }

    return {host};
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

export function parseTransactions($, nowDate) {
    const nodes = $("table[class=tblInf]").children()[0].children.slice(1);
    return nodes.map(node => {
        const description = $("td[class=\"align-left leftPaddingCell\"]", node);
        const date = $("td[class=listItem]", node);
        let amount = $("td[class=align-right]", node);
        if (amount.children().length) {
            amount = amount.children()[0];
            if (amount.children && amount.children.length) {
                amount = amount.children[0];
            }
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

export function loadHtml(html) {
    return cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: false,
    });
}

function getPageToken(response) {
    return response.querySelector("input[name=PAGE_TOKEN]").attr("value");
}

function getTextFromNode(node) {
    try {
        return reduceWhitespaces(typeof node.text === "function" ? node.text() : node.data);
    } catch (e) {
        console.error("unexpected node", node);
        throw e;
    }
}

async function fetchHtml(url, options = {}, predicate = () => true) {
    options = {
        method: "GET",
        headers: defaultHeaders,
        ...options,
        stringify: qs.stringify,
    };

    const response = await network.fetch(url, options);
    let $ = null;
    response.querySelector = function () {
        if ($ === null) {
            $ = loadHtml(this.body);
        }
        return $.apply($, arguments);
    };

    if (predicate) {
        validateResponse(response, response => predicate(response));
    }

    return response;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

async function goToUserSettings(host = "node1.online.sberbank.ru") {
    return fetchHtml(`https://${host}/PhizIC/private/userprofile/userSettings.do`, {
        headers: {
            ...defaultHeaders,
        },
    });
}

function isLoggedIn(response) {
    return response && /accountSecurity.do/i.test(response.body);
}

function checkNext(host, response) {
    // TODO: пепроверить структуру ответа
    if ((response.body || "").trim() === "next") {
        console.log("У нас next, обновляем страницу.", response);
        response = goToUserSettings(host);
    }
    return response;
}

async function checkAdditionalQuestions(host, response) {
    //TODO: Check Referer, Host, Origin

    // требуется принять соглашение о безопасности
    if (/internetSecurity/.test(response.body)) {
        console.log("Требуется принять соглашение о безопасности. Принимаем...");
        const pageToken = getPageToken(response);
        response = await fetchHtml(`https://${host}/PhizIC/internetSecurity.do`, {
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
    response = checkNext(host, response);

    if (/Откроется справочник регионов, в котором щелкните по названию выбранного региона/.test(response.body)) {
        console.log("Выбираем все регионы оплаты.");
        await fetchHtml(`https://${host}/PhizIC/region.do`, {
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
}
