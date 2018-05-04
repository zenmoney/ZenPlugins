import {MD5, SHA1} from "jshashes";

import _ from "lodash";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import {sanitize} from "../../common/sanitize";

const sha1 = new SHA1();
const md5 = new MD5();

function formatDate(date) {
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(toAtLeastTwoDigitsString).join(".");
}

export async function fetchXml(url, options = {}) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog", "log"]),
        headers: {
            "Accept": "application/xml, text/plain, */*",
            "Content-Type": "application/xml;charset=UTF-8",
            ...options.headers,
        },
    };

    const beforeFetchTicks = Date.now();
    const shouldLog = options.log !== false;
    shouldLog && console.debug("fetchXml request", sanitize({
        method: init.method || "GET",
        url,
        headers: init.headers,
        ...options.body && {body: options.body},
    }, options.sanitizeRequestLog || false));

    const response = await fetch(url, init);
    const body = await response.text();

    const endTicks = Date.now();
    shouldLog && console.debug("fetchXml response", sanitize({
        status: response.status,
        url: response.url,
        headers: response.headers.entries ? _.fromPairs(Array.from(response.headers.entries())) : response.headers.raw(),
        body,
        ms: endTicks - beforeFetchTicks,
    }, options.sanitizeResponseLog || false));

    return {
        ..._.pick(response, ["ok", "status", "statusText", "url", "headers"]),
        body,
    };
}

export class PrivatBank {
    constructor({merchant, password, url}) {
        this.baseUrl = url || "https://zenmoney.ru/plugins/privatbank/proxy/";
        this.merchant = merchant;
        this.password = password;
    }

    sign(data) {
        return sha1.hex(md5.hex(`${data}${this.password}`));
    }

    async fetch(url, data) {
        const xml =
            `<?xml version="1.0" encoding="UTF-8"?>
            <request version="1.0">
                <merchant>
                    <id>${this.merchant}</id>
                    <signature>${this.sign(data)}</signature>
                </merchant>
                <data>${data}</data>
            </request>`;
        const response = await fetchXml(`${this.baseUrl}${url}`, {
            method: "POST",
            body: xml,
        });
        if (response.body) {
            if (response.status === 504 && response.body.indexOf("504 Gateway Time-out") >= 0) {
                throw new ZenMoney.Error("[NER] Proxy connection error", true);
            }
            if (response.body.indexOf("invalid signature") >= 0) {
                throw new ZenMoney.Error(`Не удалось получить данные по мерчанту ${this.merchant}. ` +
                    `Неверный пароль. Проверьте, что вы указали верный пароль в настройках подключения к банку.`, true);
            }
            if (response.body.indexOf("invalid ip:") >= 0) {
                throw new ZenMoney.Error(`Не удалось получить данные по мерчанту ${this.merchant}. ` +
                    `Укажите IP-адрес: 95.213.236.52 в настройках мерчанта в Приват24.`, true);
            }
            if (response.body.indexOf("this card is not in merchants card") >= 0) {
                throw new ZenMoney.Error(`Не удалось получить баланс карты по мерчанту ${this.merchant}. ` +
                    `Если карта была недавно перевыпущена, зарегистрируйте для неё новый мерчант и ` +
                    `обновите его в настройках подключения к банку.`, true);
            }
            if (/point\s+\/.*not allowed for merchant/.test(response.body)) {
                throw new ZenMoney.Error(`Не удалось получить данные по мерчанту ${this.merchant}. ` +
                    `Проверьте, что в Приват24 вы поставили галочки "Баланс по счёту мерчанта физлица" и ` +
                    `"Выписка по счёту мерчанта физлица".`, true);
            }
        }
        console.assert(response && response.status === 200 && response.body, "non-successful response");
        return response.body;
    }

    async fetchAccounts() {
        const data =
            `<oper>cmt</oper>
            <wait>5</wait>
            <test>0</test>
            <payment id="">
                <prop name="country" value="UA"/>
            </payment>`;
        return this.fetch("balance", data);
    }

    async fetchTransactions(fromDate, toDate) {
        const data =
            `<oper>cmt</oper>
            <wait>5</wait>
            <test>0</test>
            <payment id="">
                <prop name="sd" value="${formatDate(fromDate)}"/>
                <prop name="ed" value="${formatDate(toDate || new Date())}"/>
            </payment>`;
        return this.fetch("rest_fiz", data);
    }
}
