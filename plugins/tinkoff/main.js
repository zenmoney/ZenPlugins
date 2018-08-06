/* eslint-disable brace-style */
var g_headers = {
    "User-Agent": "User-Agent: Sony D6503/android: 5.1.1/TCSMB/3.1.0",
    "Referrer": "https://www.tinkoff.ru/mybank/",
};
//var g_baseurl =  "https://www.tinkoff.ru/api/v1/";
var g_baseurl = "https://api01.tinkoff.ru/v1/";
var g_deviceid;
var g_sessionid;
var g_preferences;

/**
 * Основной метод
 */
function main(){
    g_preferences = ZenMoney.getPreferences();

    if (login() === false) {
        ZenMoney.setResult({success: false});
        return;
    }

    processAccounts();
    processTransactions();

    if (g_accDict.length === 0)
        throw new ZenMoney.Error("Не удалось обнаружить счета для синхронизации");

    ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 * @returns {String} Идентификатор сессии
 */
function login() {
    if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк в параметрах подключения!", true, true);

    //if (!g_preferences.pin) throw new ZenMoney.Error("Введите пин-код для входа в интернет-банк в параметрах подключения!", true);

    function LevelUp() {
        ZenMoney.trace("Запрашиваем подтверждение привилегий пользователя...");

        // получим привилегии пользователя
        var level_up = requestJson("level_up", null, {
            post: {
                sessionid: sessionId,
            },
            noException: true,
        });

        if (level_up.resultCode === "OK") {
            ZenMoney.trace("Успешно повысили привилегии пользователя.");
        }
        // подтверждение через секретный вопрос
        else if (level_up.resultCode === "WAITING_CONFIRMATION" && level_up.confirmationData && level_up.confirmationData.Question) {
            ZenMoney.trace("Необходимо подтвердить права...");

            var answer = ZenMoney.retrieveCode("Секретный вопрос от банка: " +
                level_up.confirmationData.Question.question + ". Ответ на этот вопрос сразу передается в банк.", null, {
                inputType: "text",
                time: 18E4,
            });
            ZenMoney.trace("Получили ответ на секретный вопрос.");

            var json = requestJson("confirm", {}, {
                post: {
                    //deviceId: deviceId,
                    sessionid: sessionId,
                    initialOperation: level_up.initialOperation,
                    initialOperationTicket: level_up.operationTicket,
                    confirmationData: "{\"Question\":\"" + answer + "\"}",
                },
                noException: true,
            });

            // ответ на вопрос не верный
            if (json.resultCode === "CONFIRMATION_FAILED") {
                ZenMoney.trace("Ответ не принят: " + JSON.stringify(json));
                throw new ZenMoney.Error("Ответ банка: " + (json.plainMessage || json.errorMessage), true);
            }
            // ответ не принят
            if (json.resultCode !== "OK") {
                ZenMoney.trace("Ответ не принят: " + JSON.stringify(json));
                throw new ZenMoney.Error("Ответ не принят: " + (json.plainMessage || json.errorMessage));
            }
            // всё хорошо, ответ верный
            else
                ZenMoney.trace("Ответ на секретный вопрос принят банком.");
        } else {
            ZenMoney.trace("Ошибка получения привилегий для входа: " + JSON.stringify(level_up));
            throw new ZenMoney.Error("Не удалось повысить привилегии пользователя для входа!");
        }
    }

    if (g_sessionid)
        ZenMoney.trace("Cессия уже установлена. Используем её.");
    else {
        ZenMoney.trace("Пытаемся войти...");

        var deviceId = ZenMoney.getData("device_id", 0), deviceNew = false;
        if (deviceId == 0) {
            ZenMoney.trace("Первый запуск.");
            deviceId = hex_md5(Math.random().toString() + "_" + g_preferences.login);
            deviceNew = true;
        }

        // сохраняем идентификатор устройства
        g_deviceid = deviceId;
        if (deviceNew)
            ZenMoney.setData("device_id", deviceId);


        // создаём сессию
        var session = requestJson("session");
        if (session.resultCode !== "OK") {
            ZenMoney.trace("Не удалось создать сессию с банком: " + JSON.stringify(session));
            throw new ZenMoney.Error("Ошибка: не удалось создать сессию с банком!");
        }

        ZenMoney.trace("Получили идентификатор сессии.");
        var sessionId = session.payload;

        var pinHash = ZenMoney.getData("pinHash", null);
        // если пина ещё нет, установим его
        if (!pinHash) {
            // получаем пароль
            var password = g_preferences.hasOwnProperty("password") ? g_preferences.password : null;
            if (!password)
                for (var i = 0; i < 2; i++) {
                    password = ZenMoney.retrieveCode("Введите пароль для входа в интернет-банк Тинькофф", null, {
                        inputType: "password",
                        time: 18E4,
                    });

                    if (password) {
                        ZenMoney.trace("Пароль получен от пользователя.");
                        break;
                    }
                } else
                ZenMoney.trace("Пароль взят из настроек подключения.");

            if (!password) {
                ZenMoney.trace("Не указан пароль для входа");
                throw new ZenMoney.Error("Ошибка: не удалось получить пароль для входа!", true);
            }

            // входим по логину-паролю
            var post = {
                //deviceId: deviceId,
                sessionid: sessionId,
                password: password,
            };
            /*if (in_array(g_preferences.login.substr(0, 1), ['+', '7', '8']))
             //post.phone = trimStart(g_preferences.login, ['+', '8']);
             post.phone = g_preferences.login;
            else*/
            post.username = g_preferences.login;

            var sign_up = requestJson("sign_up", null, {
                post: post,
                noException: true,
            });

            // ошибка входа по паролю
            if (sign_up.resultCode.substr(0, 8) === "INVALID_") {
                ZenMoney.trace("Ошибка входа: " + JSON.stringify(sign_up));
                throw new ZenMoney.Error("Ответ от банка: " + (sign_up.plainMessage || sign_up.errorMessage), true);
            }
            // операция отклонена
            else if (sign_up.resultCode === "OPERATION_REJECTED") {
                ZenMoney.trace("Ошибка входа: " + JSON.stringify(sign_up));
                throw new ZenMoney.Error("Ответ от банка: " + (sign_up.plainMessage || sign_up.errorMessage), true, true);
            }
            // если нужно подтверждение по смс
            else if (sign_up.resultCode === "WAITING_CONFIRMATION") // DEVICE_LINK_NEEDED
            {
                ZenMoney.trace("Необходимо подтвердить вход...");

                var smsCode = ZenMoney.retrieveCode("Введите код подтверждения из смс для первого входа в интернет-банк Тинькофф", null, {
                    inputType: "number",
                    time: 18E4,
                });
                ZenMoney.trace("Получили код");

                var json2 = requestJson("confirm", {
                    confirmationData: "{\"SMSBYID\":\"" + smsCode + "\"}",
                }, {
                    post: {
                        //deviceId: deviceId,
                        sessionid: sessionId,
                        initialOperation: "sign_up",
                        initialOperationTicket: sign_up.operationTicket,
                    },
                    noException: true,
                });

                // проверим ответ на ошибки
                if (in_array(json2.resultCode, ["INTERNAL_ERROR", "CONFIRMATION_FAILED"])) {
                    ZenMoney.trace("Ошибка авторизации устройства: " + JSON.stringify(json2));
                    throw new ZenMoney.Error("Ответ банка: " + (json2.plainMessage || json2.errorMessage), true);
                }
                // ошибки с логом
                else if (json2.resultCode !== "OK") {
                    ZenMoney.trace("Ошибка авторизации устройства: " + JSON.stringify(json2));
                    throw new ZenMoney.Error("Ошибка авторизации: " + (json2.plainMessage || json2.errorMessage));
                } else
                    ZenMoney.trace("СМС-код принят банком.");
            } else {
                ZenMoney.trace("Прошёл вход без подтверждения.");
                if (sign_up.resultCode === "AUTHENTICATION_FAILED")
                    throw new ZenMoney.Error("Ответ от банка: " + (sign_up.plainMessage || sign_up.errorMessage));
            }

            // получаем привилегии пользователя
            LevelUp();

            // попытаемся привязать устройство
            /*var device_linked = ZenMoney.getData('device_linked', false);
            if (!device_linked) {
             // авторизуем устройство, чтобы не вводить СМС-код каждый раз
             var mobile_link_device = requestJson("mobile_link_device", null, {
              post: {
               sessionid: sessionId
              },
              noException: true
             });
             ZenMoney.trace("Авторизуем устройство...");

             var sms = ZenMoney.retrieveCode("Введите код подтверждения из смс для авторизации приложения в интернет-банке Тинькофф", null, {
              inputType: "number",
              time: 18E4
             });
             ZenMoney.trace("Получили код авторизации.");

             var confirm = requestJson("confirm", {
              confirmationData: '{"SMSBYID":"' + sms + '"}'
             }, {
              post: {
               //deviceId: deviceId,
               sessionid: sessionId,
               initialOperation: 'mobile_link_device',
               initialOperationTicket: mobile_link_device.operationTicket
              },
              noException: true
             });
             ZenMoney.trace("Авторизовали устройство.");

             // проверим ответ на ошибки
             if (confirm.resultCode === 'DEVICE_ALREADY_LINKED') {
              // если устройство уже вдруг слинковано, ну и отлично
              ZenMoney.trace('Устройство уже авторизовано.');
              ZenMoney.setData('device_linked', true);
              deviceNew = true;
             }
             else if (confirm.resultCode !== 'OK') {
              // обработаем прочие ошибки
              ZenMoney.trace('Ошибка авторизации устройства: ' + JSON.stringify(confirm));
              throw new ZenMoney.Error("Ошибка авторизации: " + (confirm.plainMessage || confirm.errorMessage), true);
             }
            }*/


            // устанавливаем ПИН для быстрого входа
            pinHash = hex_md5(Math.random().toString());
            var save_pin = requestJson("mobile_save_pin", null, {
                post: {
                    sessionid: sessionId,
                    pinHash: pinHash,
                },
                noException: true,
            });

            if (save_pin.resultCode === "OK") {
                ZenMoney.trace("Установили ПИН-код для быстрого входа.");
                ZenMoney.setData("pinHash", pinHash);

                // сохраним время установки пин-кода для авторизации
                var dt = new Date();
                var dtOffset = dt.getTimezoneOffset() * 60 * 1000;
                var pinHashTime = dt.getTime() - dtOffset + 3 * 60 * 1000; // по Москве
                ZenMoney.setData("pinHashTime", pinHashTime);
            } else
                ZenMoney.trace("Не удалось установить ПИН-код для быстрого входа: " + JSON.stringify(save_pin));
        } else {
            // входим по пину
            var pinHashDate = ZenMoney.getData("pinHashTime", 0);
            var oldSessionId = ZenMoney.getData("session_id", 0);
            var sign_up2 = requestJson("sign_up", {
                auth_type: "pin",
            }, {
                post: {
                    //deviceId:			deviceId,
                    sessionid: sessionId,
                    pinHash: pinHash,
                    auth_type_set_date: pinHashDate,
                    oldSessionId: oldSessionId,
                },
                noException: true,
            });
            //ZenMoney.trace('SIGN_UP 2: '+ JSON.stringify(sign_up));

            if (in_array(sign_up2.resultCode, ["DEVICE_LINK_NEEDED", "WRONG_PIN_CODE", "PIN_ATTEMPS_EXCEEDED"])) {
                ZenMoney.setData("pinHash", null);
                ZenMoney.saveData();

                switch (sign_up2.resultCode) {
                    // устройство не авторизировано
                    case "DEVICE_LINK_NEEDED":
                        ZenMoney.trace("Требуется привязка устройства: " + JSON.stringify(sign_up2));
                        throw new ZenMoney.Error("Требуется привязка устройства. Перезапустите подключение к банку.", true);
                        //return false;

                    // не верный пин-код
                    case "WRONG_PIN_CODE":
                    case "PIN_ATTEMPS_EXCEEDED":
                        ZenMoney.trace("Ошибка входа по ПИН-коду: " + JSON.stringify(sign_up2));
                        throw new ZenMoney.Error("Ошибка входа по ПИН-коду. Перезапустите подключение к банку.", true);

                    default:
                        break;
                }
            } else if (sign_up2.resultCode !== "OK") {
                ZenMoney.setData("pinHash", null);
                ZenMoney.saveData();
                ZenMoney.trace("Ошибка входа по ПИН-коду: " + JSON.stringify(sign_up2));
                throw new ZenMoney.Error("Ошибка входа по ПИН-коду: " + (sign_up2.plainMessage || sign_up2.errorMessage));
            } else
                ZenMoney.trace("Успешно вошли по ПИН-коду.");

            // получаем привилегии пользователя
            LevelUp();
        }

        g_sessionid = sessionId;
        ZenMoney.trace("Сохранили сессию.");

        // сохраним id сесии для следующего входа
        ZenMoney.setData("session_id", g_sessionid);

        ZenMoney.saveData();
    }

    return g_sessionid;
}

var g_accDict = []; // список активных счетов
/**
 * Обработка счетов
 */
function processAccounts() {
    ZenMoney.trace("Запрашиваем данные по счетам...");
    //var accounts = requestJson("accounts_flat");
    var accounts = requestJson("grouped_requests", {_methods: "accounts_flat"},
        {
            post: {
                requestsData: JSON.stringify(
                    [{
                        key: 0,
                        operation: "accounts_flat",
                    }]
                ),
            },
        }
    );

    ZenMoney.trace("JSON счетов: "+JSON.stringify(accounts));

    // при первом запуске подключения остатки на счетах передаём принудительно
    var initialized = ZenMoney.getData("initialized", false);

    accounts = accounts.payload[0].payload;
    for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];
        if (isAccountSkipped(a.id)) {
            ZenMoney.trace("Пропускаем карту/счёт: " + a.name + " (#" + a.id + ")");
            continue;
        }

        // дебетовые карты ------------------------------------
        if (a.accountType === "Current" && a.status === "NORM") {
            var acc1 = {
                id: a.id,
                title: a.name,
                type: "ccard",
                syncID: [],
                instrument: a.moneyAmount.currency.name,
            };

            // овердрафт
            var creditLimit = a.creditLimit ? a.creditLimit.value : 0;
            if (creditLimit > 0) acc1.creditLimit = creditLimit;

            // контроль точности расчёта остатка
            if (!initialized || parseDecimal(a.moneyAmount.value) === parseDecimal(a.accountBalance.value - a.authorizationsAmount.value))
                acc1.balance = parseDecimal(a.moneyAmount.value - creditLimit);

            ZenMoney.trace("Добавляем дебетовую карту: "+ a.name +" (#"+ a.id +") = "+ (acc1.balance !== null ? acc1.balance +" "+ acc1.instrument : "undefined"));

            // номера карт
            for (var k1 = 0; k1 < a.cardNumbers.length; k1++) {
                var card1 = a.cardNumbers[k1];
                if (card1.activated)
                    acc1.syncID.push(card1.value.substring(card1.value.length - 4))
            }

            // добавим и номер счёта карты
            acc1.syncID.push(a.id.substring(a.id.length - 4));

            g_accDict.push(acc1);
        }
        // кредитные карты ----------------------------------------
        else if (a.accountType === "Credit" && a.status === "NORM") {
            var acc2 = {
                id: a.id,
                title: a.name,
                type: "ccard",
                syncID: [],
                creditLimit: a.creditLimit.value,
                instrument: a.moneyAmount.currency.name,
            };

            var algorithm = "";
            // A1: перерасход кредитного лимита
            if (parseDecimal(a.moneyAmount.value) === 0) {
                acc2.balance = -a.debtAmount.value;
                algorithm = "A1";
            }
            // A3: нет долга перед банком
            else if (a.moneyAmount.value > a.creditLimit.value) {
                acc2.balance = a.moneyAmount.value - a.creditLimit.value;
                algorithm = "A3";
            }
            // A2: нет долга перед банком
            else if (a.moneyAmount.value - a.authorizationsAmount.value > a.creditLimit.value) {
                acc2.balance = parseDecimal(a.moneyAmount.value - a.creditLimit.value - a.authorizationsAmount.value);
                algorithm = "A2";
            }
            // контроль точности расчёта остатка
            else if (!initialized || parseDecimal(a.moneyAmount.value) === parseDecimal(a.creditLimit.value - a.debtAmount.value - a.authorizationsAmount.value)) {
                acc2.balance = parseDecimal(a.creditLimit.value > a.moneyAmount.value
                    ? -a.debtAmount.value - a.authorizationsAmount.value
                    : a.moneyAmount.value - a.creditLimit.value - a.authorizationsAmount.value);
                algorithm = "B";
            } else {
                // доверимся данным банка
                acc2.balance = a.moneyAmount.value - a.creditLimit.value;
                algorithm = "C";
            }

            ZenMoney.trace("Добавляем кредитную карту: " + a.name + " (#" + a.id + ") = "+ acc2.balance +" "+ acc2.instrument +" ["+ algorithm +"]");

            // номера карт
            for (var k2 = 0; k2 < a.cardNumbers.length; k2++) {
                var card2 = a.cardNumbers[k2];
                if (card2.activated)
                    acc2.syncID.push(card2.value.substring(card2.value.length - 4))
            }

            // добавим и номер счёта карты
            acc2.syncID.push(a.id.substring(a.id.length - 4));

            g_accDict.push(acc2);
        }
        // накопительные счета ------------------------------------
        else if (a.accountType === "Saving" && a.status === "NORM") {
            ZenMoney.trace("Добавляем накопительный счёт: "+ a.name +" (#"+ a.id +") = "+ a.moneyAmount.value +" "+ a.moneyAmount.currency.name);
            g_accDict.push({
                id: a.id,
                title: a.name,
                type: "checking",
                syncID: a.id.substring(a.id.length-4),
                instrument: a.moneyAmount.currency.name,
                balance: a.moneyAmount.value,
                savings: true,
            });
        }
        // депозиты --------------------------------------------------
        else if (a.accountType === "Deposit" && a.status === "ACTIVE") {
            ZenMoney.trace("Добавляем депозит: "+ a.name +" (#"+ a.id +") = "+ a.moneyAmount.value +" "+ a.moneyAmount.currency.name);
            g_accDict.push({
                id: a.id,
                title: a.name,
                type: "deposit",
                syncID: a.id.substring(a.id.length-4),
                instrument: a.moneyAmount.currency.name,
                balance: a.moneyAmount.value,
                percent: a.depositRate,
                capitalization:	a.typeOfInterest === "TO_DEPOSIT",
                startDate: a.openDate.milliseconds,
                endDateOffsetInterval: "month",
                endDateOffset:	a.period,
                payoffInterval:	"month",
                payoffStep: 1,
            });
        }
        // мультивалютный вклад
        else if (a.accountType === "MultiDeposit" && a.accounts) {
            for (var k=0; k<a.accounts.length; k++) {
                var deposit = a.accounts[k];
                var currency = deposit.moneyAmount.currency.name;
                var name = a.name + " (" + currency + ")";
                var id = a.id +"_"+ currency;
                var syncid = a.id.substring(a.id.length-4) +"_"+ currency;
                ZenMoney.trace("Добавляем мультивалютный вклад: "+ name +" (#"+ id +") = "+ deposit.moneyAmount.value +" "+ deposit.moneyAmount.currency.name);
                g_accDict.push({
                    id: id,
                    title: name,
                    type: "deposit",
                    syncID: syncid,
                    instrument: deposit.moneyAmount.currency.name,
                    balance: deposit.moneyAmount.value,
                    percent: deposit.depositRate,
                    capitalization:	deposit.typeOfInterest === "TO_DEPOSIT",
                    startDate: a.openDate.milliseconds,
                    endDateOffsetInterval: "month",
                    endDateOffset:	a.period,
                    payoffInterval:	"month",
                    payoffStep: 1,
                });
            }
        }
        // кредиты наличными
        else if (a.accountType === "CashLoan" && a.status === "NORM") {
            if (a.debtAmount.value > 0) {
                ZenMoney.trace("Добавляем кредит наличными: " + a.name + " (#" + a.id + ") = -"+ a.debtAmount.value +" "+ a.debtAmount.currency.name);
                g_accDict.push({
                    id: a.id,
                    title: a.name,
                    type: "loan",
                    syncID: a.id.substring(a.id.length-4),
                    instrument: a.debtAmount.currency.name,
                    balance: a.debtAmount.value,
                    startBalance: a.creditAmount.value,
                    startDate: a.creationDate.milliseconds,
                    percent: a.tariffInfo.interestRate,
                    capitalization:	true,
                    endDateOffsetInterval: "month",
                    endDateOffset:	a.remainingPaymentsCount,
                    payoffInterval:	"month",
                    payoffStep: 1,
                });
            } else
                ZenMoney.trace("Пропускаем кредит наличными " + a.name + " (#" + a.id + "), так как он уже закрыт");
        }
        // потребительские кредиты
        else if (a.accountType === "KupiVKredit" && a.creditAccounts) {
            for (var j=0; j<a.creditAccounts.length; j++) {
                var vkredit = a.creditAccounts[j];
                ZenMoney.trace("Добавляем потребительский кредит: " + vkredit.name + " (#" + vkredit.account + ") = " + vkredit.balance.value + " " + vkredit.balance.currency.name);
                g_accDict.push({
                    id: vkredit.account,
                    title: vkredit.name,
                    type: "loan",
                    syncID: vkredit.account.substring(a.id.length-4),
                    instrument: vkredit.balance.currency.name,
                    balance: vkredit.balance.value,
                    startBalance: vkredit.amount.value,
                    startDate: Date.now(), // ToDO: нужно разобраться как достать параметры потребительского кредита
                    percent: 1,
                    capitalization:	true,
                    endDateOffsetInterval: "month",
                    endDateOffset:	1,
                    payoffInterval:	"month",
                    payoffStep: 1,
                });
            }
        }
        // виртуальные карты ------------------------------------
        else if (a.accountType === "Wallet" && a.status === "NORM") {
            var acc3 = {
                id: a.id,
                title: a.name,
                type: "ccard",
                syncID: [],
                instrument: a.moneyAmount.currency.name,
                balance: a.moneyAmount.value,
            };

            ZenMoney.trace("Добавляем виртуальную карту: "+ a.name +" (#"+ a.id +") = "+ acc3.balance +" "+ acc3.instrument);

            // номера карт
            for (var k3 = 0; k3 < a.cardNumbers.length; k3++) {
                var card3 = a.cardNumbers[k3];
                if (card3.activated)
                    acc3.syncID.push(card3.value.substring(card3.value.length - 4))
            }

            // добавим и номер счёта карты
            acc3.syncID.push(a.id.substring(a.id.length - 4));

            g_accDict.push(acc3);
        }
        // телеком-карта ------------------------------------
        else if (a.accountType === "Telecom" && a.status === "NORM") {
            var acc4 = {
                id: a.id,
                title: a.name,
                type: "ccard",
                syncID: [],
                instrument: a.moneyAmount.currency.name,
                balance: a.moneyAmount.value,
            };

            ZenMoney.trace("Добавляем телеком-карту: "+ a.name +" (#"+ a.id +") = "+ acc4.balance +" "+ acc4.instrument);

            // номера карт
            for (var k4 = 0; k4 < a.cardNumbers.length; k4++) {
                var card4 = a.cardNumbers[k4];
                if (card4.activated)
                    acc4.syncID.push(card4.value.substring(card4.value.length - 4))
            }

            // добавим и номер счёта карты
            acc4.syncID.push(a.id.substring(a.id.length - 4));

            g_accDict.push(acc4);
        }
    }

    if (!initialized) {
        ZenMoney.setData("initialized", true);
        ZenMoney.saveData();
    }

    ZenMoney.trace("Всего счетов добавлено: "+ g_accDict.length);
    ZenMoney.trace("JSON: "+ JSON.stringify(g_accDict));
    //ZenMoney.addAccount(g_accDict);
}

/**
 * Обработка операций
 * @param data
 */
function processTransactions(data) {
    var createSyncTime = ZenMoney.getData("createSync", 0);

    // инициализация начального времени
    if (!createSyncTime) {
        // период загрузки данных в месяцах (с начала календарного месяца)
        ZenMoney.trace("periodNew: "+ g_preferences.periodNew);

        var period = !g_preferences.hasOwnProperty("periodNew") || isNaN(period = parseInt(g_preferences.periodNew)) ? 1 : period;
        if (period > 3) period = 3;

        ZenMoney.trace("Начальный период загрузки операций: "+ period);

        // загружать операции нужно
        if (period > 0) {
            var dtNow = new Date();
            var year = dtNow.getFullYear();
            var month = dtNow.getMonth() - (period - 1);
            if (month < 0) {
                month = 12 + month;
                year--;
            }

            var dtSync = new Date(year, month, 1);
            ZenMoney.trace("CalcSyncTime: "+ dtSync);

            createSyncTime = dtSync.getTime();
        } else
            createSyncTime = Date.now();

        ZenMoney.setData("createSync", createSyncTime);

        if (period <= 0) {
            ZenMoney.trace("Подключение без операций. Первый запуск. Операции пропускаем.");
            ZenMoney.addAccount(g_accDict);
            ZenMoney.saveData();
            return;
        }
    }

    var lastSyncTime = ZenMoney.getData("last_sync", 0);
    ZenMoney.trace("LastSyncTime: "+ new Date(lastSyncTime) +" ("+ lastSyncTime +")");

    // всегда захватываем одну неделю минимум для обработки hold-операций
    if (lastSyncTime) {
        lastSyncTime -= 7 * 24 * 60 * 60 * 1000;
        ZenMoney.trace("NeedSyncTime: " + new Date(lastSyncTime) + " (" + lastSyncTime + ")");

        // если есть время последней синхронизации, то всегда работаем от него
        // lastSyncTime = Math.max(lastSyncTime, createSyncTime);
    } else
        lastSyncTime = createSyncTime;

    ZenMoney.trace("WorkSyncTime: " + new Date(lastSyncTime) + " (" + lastSyncTime + ")");

    if (lastSyncTime <= 0)
        throw new ZenMoney.Error("Ошибка инициализации плагина 2.");

    var lastSyncDate = new Date(lastSyncTime);
    var startDate = n2(lastSyncDate.getDate()) +"."+ n2(lastSyncDate.getMonth() + 1) +"."+ lastSyncDate.getFullYear() +" "+ n2(lastSyncDate.getHours()) +":"+ n2(lastSyncDate.getMinutes());
    ZenMoney.trace("Запрашиваем операции с " + startDate);

    /*var transactions2 = requestJson("operations", null, {
     "start": 	lastSyncTime
     //"start":	Date.parse('2017-08-27T00:00'),
     //"end":	Date.parse('2017-08-27T23:00')
    });*/
    var transactions = requestJson("grouped_requests", null, {
        post: {
            requestsData: JSON.stringify(
                [{
                    key: 0,
                    operation: "operations",
                    params: {
                        start: lastSyncTime,
                    },
                }]
            ),
        },
    });

    var tranDict = {}; // список найденных оперций
    var tranDictHold = {}; // список ключей операций для контроля холдов и акцептов в одной выписке
    var tranDictHold2 = {}; // список ключей операций для контроля пропадающих холдов и акцептов через новую операцию

    var payload = transactions.payload[0].payload;
    if (!payload) {
        ZenMoney.trace("Не удалось получить операции: "+ JSON.stringify(transactions));
        throw new ZenMoney.Error("Не удалось получить список операций от банка. Пожалуйста, повторите позднее.", true);
    } else {
        ZenMoney.trace("Получено операций: " + payload.length);
        ZenMoney.trace("JSON: " + JSON.stringify(payload));

        for (var iPayload = 0; iPayload < payload.length; iPayload++) {
            var t = payload[iPayload];

            if (t.operationTime.milliseconds > lastSyncTime)
                lastSyncTime = t.operationTime.milliseconds;

            var tran = {};
            // дата по-видимому всегда привязана к часовому поясу Москвы. Так что нужно ее корректировать
            var dt = new Date(t.operationTime.milliseconds + (180 + new Date().getTimezoneOffset()) * 60000);
            //tran.date = n2(dt.getDate()) + "." + n2(dt.getMonth() + 1) + "." + dt.getFullYear();
            tran.date = dt.getFullYear() + "-" + n2(dt.getMonth() + 1) + "-" + n2(dt.getDate());
            tran.time = n2(dt.getHours()) + ":" + n2(dt.getMinutes() + 1) + ":" + n2(dt.getSeconds()); // для внутреннего использования
            tran.created = t.operationTime.milliseconds;

            var operLog = "#" + iPayload + ": " + tran.date + ", " + tran.time + ", " + t.description + ", "
             + (t.type === "Credit" ? "+" : (t.type === "Debit" ? "-" : "")) + t.accountAmount.value;

            // работаем только по активным счетам
            var tAccount = t.account;
            if (!in_accounts(tAccount, g_accDict)) {
                tAccount = t.account + "_" + t.amount.currency.name;
                if (!in_accounts(tAccount, g_accDict)) {
                    ZenMoney.trace("Пропускаем операцию " + operLog + " (счёт игнорируется)");
                    continue;
                }
            }

            // учитываем только успешные операции
            if (t.status && t.status === "FAILED") {
                ZenMoney.trace("Пропускаем операцию " + operLog + " (статус: " + t.status + ")");
                continue;
            }

            if (t.accountAmount.value == 0) {
                ZenMoney.trace("Пропускаем пустую операцию " + operLog);
                continue;
            }

            // ИТОГИ АНАЛИЗА:
            //   id - уникальный идентификатор операции (технический идетификатор)
            //   paymentId - идентификатор финансового документа/проводки
            //   ucid - не понятная и не уникальная фигня :(

            // Внутренний ID операции
            var tranId = t.payment && t.payment.paymentId
                // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
                ? (t.group === "CHARGE" ? "f" : "p") + t.payment.paymentId
                // либо работаем просто как с операциями, разделяя их на доходы и расходы
                : t.id;

            // отделяем акцепт от холда временем дебетового списания
            tran.id = t.debitingTime ? t.id : "tmp#" + t.id;

            // добавим флаг холда
            tran.hold = t.debitingTime ? false : true;

            var hold = tran.hold ? " [H] " : "";
            ZenMoney.trace("Добавляем операцию #" + iPayload + ":  " + tran.date + ", " + tran.time + ", " + hold + t.description + ", "
             + (t.type === "Credit" ? "+" : (t.type === "Debit" ? "-" : "")) + t.accountAmount.value
             + " [" + tranId + "] acc:" + tAccount);
            //ZenMoney.trace('JSON: '+JSON.stringify(t));

            // флаг операции в валюте
            var foreignCurrency = t.accountAmount.currency.name !== t.amount.currency.name;

            // ключ для поиска дублей по идентификатору
            var tranKey = t.type + ":" + tranId;
            // обратный ключ для второй половины перевода
            var tranKey2 = (t.type === "Debit" ? "Credit" : "Debit") + ":" + tranId;

            // ключ контроля дублей по холду
            var tranAmount = t.amount ? t.amount.value + t.amount.currency.name : t.accountAmount.value + t.accountAmount.currency.name;
            var tranKeyHold = tran.created + ":" + tAccount + ":" + tranAmount;
            if (t.payment && t.payment.fieldsValues && t.payment.fieldsValues.uid)
                tranKeyHold += ":" + t.payment.fieldsValues.uid;
            //ZenMoney.trace('tranKeyHold: '+tranKeyHold);

            // холд пропускаем ----------------------------------------------------------------
            if (!t.debitingTime && (tranDict[tranKey] || tranDictHold[tranKeyHold]))
                continue;

            // перевод ------------------------------------------------------------------------
            if (tranDict[tranKey2]) {
                // доходная часть перевода ---
                if (t.type === "Credit" && tranDict[tranKey2].income == 0 && tranDict[tranKey2].incomeAccount != t.account) {
                    tranDict[tranKey2].income = t.accountAmount.value;
                    tranDict[tranKey2].incomeAccount = tAccount;

                    // операция в валюте
                    if (foreignCurrency) {
                        tranDict[tranKey2].opOutcome = t.amount.value;
                        tranDict[tranKey2].opOutcomeInstrument = t.amount.currency.name;
                    }

                    tranDict[tranKey2].incomeBankID = tran.id;
                    tranDict[tranKey2].outcomeBankID = tranDict[tranKey2].id;
                    delete tranDict[tranKey2].id;

                    tranDict["Transfer:" + tranId] = tranDict[tranKey2];
                    delete tranDict[tranKey2];

                    ZenMoney.trace("Объединили операцию в перевод с имеющейся ID " + tranId);
                    continue;
                }

                // расходная часть перевода ----
                if (t.type === "Debit" && tranDict[tranKey2].outcome == 0 && tranDict[tranKey2].outcomeAccount != tAccount) {
                    tranDict[tranKey2].outcome = t.accountAmount.value;
                    tranDict[tranKey2].outcomeAccount = tAccount;

                    // операция в валюте
                    if (foreignCurrency) {
                        tranDict[tranKey2].opOutcome = t.amount.value;
                        tranDict[tranKey2].opOutcomeInstrument = t.amount.currency.name;
                    }

                    // при объединении в перевод всегда берём комментарий из расходной части
                    if (t.operationPaymentType === "TEMPLATE")
                        tranDict[tranKey2].comment = t.description; // наименование шаблона
                    else {
                        // добавим в перевод коммент из расходной части
                        tranDict[tranKey2].comment = "";
                        if (t.merchant)
                            tranDict[tranKey2].comment = t.merchant.name + ": ";
                        tranDict[tranKey2].comment += t.description;
                    }

                    tranDict[tranKey2].incomeBankID = tranDict[tranKey2].id;
                    tranDict[tranKey2].outcomeBankID = tran.id;
                    delete tranDict[tranKey2].id;

                    tranDict["Transfer:" + tranId] = tranDict[tranKey2];
                    delete tranDict[tranKey2];

                    ZenMoney.trace("Объединили операцию в перевод с имеющейся ID " + tranId);
                    continue;
                }
            }

            // акцепт холда ------------------------------------------------------------------
            if (tranDictHold[tranKeyHold]) {
                var t2 = tranDict[tranDictHold[tranKeyHold]];
                ZenMoney.trace("Обнаружили акцепт холда: #" + t2.id + " => #" + t.id);
                t2.id = t.id;
                continue;
            }

            // mcc-код операции
            let mcc = t.mcc ? parseInt(t.mcc, 10) : -1;
            if (isNaN(mcc)) mcc = -1;

            // флаг card2card переводов
            const c2c = mcc === 6538;

            // доход -------------------------------------------------------------------------
            if (t.type === "Credit") {
                tran.income = t.accountAmount.value;
                tran.incomeAccount = tAccount;
                tran.outcome = 0;
                tran.outcomeAccount = tran.incomeAccount;

                if (t.group) {
                    switch (t.group) {
                        // Пополнение наличными
                        case "CASH":
                            /*(t.partnerType && t.partnerType.toLowerCase() === "card2card")
                            || (t.merchant && (t.merchant.name.toLowerCase().indexOf("card2card") >= 0 || t.merchant.name.toLowerCase().indexOf("c2c") >= 0))
                            || (t.payment && t.payment.providerId && (t.payment.providerId.toLowerCase().indexOf("card2card") >= 0 || t.payment.providerId.toLowerCase().indexOf("c2c") >= 0));*/

                            if (!c2c) {
                                // операция с наличными
                                tran.outcomeAccount = "cash#" + t.amount.currency.name;
                                tran.outcome = t.amount.value;
                            }
                            // card2card-перевод
                            else if (t.payment && t.payment.cardNumber) {
                                tran.outcomeAccount = "ccard#" + t.amount.currency.name + "#" + t.payment.cardNumber.substring(t.payment.cardNumber.length - 4);
                                tran.outcome = t.amount.value;
                                tran.hold = null;
                            }
                            break;

                        case "INCOME":
                            if (c2c && t.payment && t.payment.cardNumber && t.payment.cardNumber.length > 4) {
                                tran.comment = t.description;
                                tran.outcome = t.amount.value;
                                tran.outcomeAccount = "ccard#" + t.amount.currency.name + "#" + t.payment.cardNumber.substring(t.payment.cardNumber.length - 4);
                            } else if (t.senderDetails)
                                tran.payee = t.senderDetails;
                            break;

                        // Если совсем ничего не подошло
                        default:
                            if (t.subgroup) {
                                switch (t.subgroup.id) {
                                    // перевод от другого клиента банка
                                    case "C4":
                                        tran.payee = t.description;
                                        break;
                                }
                            }

                            if (!tran.payee) {
                                if (t.operationPaymentType === "TEMPLATE")
                                    tran.comment = t.description; // наименование шаблона
                                else {
                                    tran.comment = "";
                                    if (t.merchant)
                                        tran.comment = t.merchant.name + ": ";
                                    tran.comment += t.description;
                                }
                            } else {
                                // если получатель определился, то нет необходимости писать его и в комментарии
                                if (t.merchant)
                                    tran.comment = t.merchant.name;
                            }
                    }
                } else {
                    tran.comment = "";
                    if (t.merchant)
                        tran.comment = t.merchant.name + ": ";
                    tran.comment += t.description;
                }

                // операция в валюте
                if (foreignCurrency) {
                    tran.opIncome = t.amount.value;
                    tran.opIncomeInstrument = t.amount.currency.name;
                }
            }
            // расход -----------------------------------------------------------------
            else if (t.type === "Debit") {
                tran.outcome = t.accountAmount.value;
                tran.outcomeAccount = tAccount;
                tran.income = 0;
                tran.incomeAccount = tran.outcomeAccount;

                if (t.group) {
                    switch (t.group) {
                        // Снятие наличных
                        case "CASH":
                            /*var c2c = (t.partnerType && t.partnerType.toLowerCase() === "card2card")
                                || (t.merchant && (t.merchant.name.toLowerCase().indexOf("card2card") >= 0 || t.merchant.name.toLowerCase().indexOf("c2c") >= 0))
                                || (t.payment && t.payment.providerId && (t.payment.providerId.toLowerCase().indexOf("card2card") >= 0 || t.payment.providerId.toLowerCase().indexOf("c2c") >= 0));*/
                            if (!c2c) {
                                // операция с наличными
                                tran.incomeAccount = "cash#" + t.amount.currency.name;
                                tran.income = t.amount.value;
                            }
                            // card2card-перевод
                            else if (t.payment && t.payment.cardNumber) {
                                tran.incomeAccount = "ccard#" + t.amount.currency.name + "#" + t.payment.cardNumber.substring(t.payment.cardNumber.length - 4);
                                tran.income = t.amount.value;
                            }
                            break;

                        // Перевод
                        case "TRANSFER":
                            if (t.payment && t.payment.fieldsValues) {
                                if (t.payment.fieldsValues.addressee)
                                    tran.payee = t.payment.fieldsValues.addressee;
                                else if (t.payment.fieldsValues.lastName)
                                    tran.payee = t.payment.fieldsValues.lastName;
                            }

                            if (t.operationPaymentType === "TEMPLATE")
                                tran.comment = t.description; // наименование шаблона
                            else {
                                tran.comment = "";
                                if (t.merchant)
                                    tran.comment = t.merchant.name + ": ";
                                tran.comment += t.description;
                            }
                            break;

                        // Плата за обслуживание
                        case "CHARGE":
                            tran.comment = t.description;
                            break;

                        // Платеж
                        case "PAY":
                            if (t.operationPaymentType && t.operationPaymentType === "REGULAR") {
                                tran.payee = t.brand ? t.brand.name : t.description;
                            } else {
                                tran.payee = t.merchant ? t.merchant.name : t.description;
                            }

                            // MCC
                            if (mcc > 99) {
                                tran.mcc = mcc; // у Тинькова mcc-коды используются для своих нужд
                            }

                            break;

                        // Если совсем ничего не подошло
                        default:
                            tran.comment = t.description;
                    }
                }

                // операция в валюте
                if (foreignCurrency) {
                    tran.opOutcome = t.amount.value;
                    tran.opOutcomeInstrument = t.amount.currency.name;
                }

                // местоположение
                if (t.locations && is_array(t.locations) && t.locations.length > 0) {
                    tran.latitude = t.locations[0].latitude;
                    tran.longitude = t.locations[0].longitude;
                }
            }

            // ключ дублей холд с акцептом через новую операцию и отменой холда
            // НЕ РАБОТАЕТ
            /*var tranKeyHold2 = tAccount + ":" + tran.date + ":" + (tran.payee ? tran.payee : "") + ":" + tranAmount;
            if (!tran.hold && tranDictHold2[tranKeyHold2]) {
                // если за этот день тому же получателю уже был холд на ту же сумму, гасим его
                ZenMoney.trace("Замещаем HOLD найденным акцептом: "+ tranDict[tranDictHold2[tranKeyHold2]].id +" => "+ tran.id);
                tran.created = tranDict[tranDictHold[tranKeyHold]].created; // сохраним время холда, так как у акцепта его нет
                tranDict[tranDictHold2[tranKeyHold2]] = tran;
                delete(tranDictHold[tranKeyHold]);
                delete(tranDictHold2[tranKeyHold2]);
            }
            else {
                //ZenMoney.trace('Операция!!! ' + tranId);
                tranDict[tranKey] = tran;
                tranDictHold[tranKeyHold] = tranKey;
                if (tran.hold) tranDictHold2[tranKeyHold2] = tranKey;
            }*/

            //ZenMoney.trace('Операция!!! ' + tranId);
            tranDict[tranKey] = tran;
            tranDictHold[tranKeyHold] = tranKey;
        }
    }

    ZenMoney.trace("Всего операций добавлено: "+ Object.getOwnPropertyNames(tranDict).length);
    ZenMoney.trace("JSON: "+ JSON.stringify(tranDict));

    ZenMoney.addAccount(g_accDict);
    for (var k in tranDict)
        ZenMoney.addTransaction(tranDict[k]);

    //ZenMoney.setData('last_sync', lastSyncTime);
    //ZenMoney.trace('LastSyncTime: '+ lastSyncTime);
    //ZenMoney.trace('Следующий период синхронизации с '+ new Date(lastSyncTime));

    var nextSyncTime = Date.now();
    ZenMoney.setData("last_sync", nextSyncTime);
    ZenMoney.saveData();

    ZenMoney.trace("NextSyncTime: " + new Date(nextSyncTime) + " (" + nextSyncTime + ")");
}

/**
 * Перевод между счетами
 * @param {String} fromAcc Идентификатор счёта-источника
 * @param {String} toAcc Идентификатор счёта-назначения
 * @param {Number} sum Сумма перевода
 */
function makeTransfer(fromAcc, toAcc, sum){
    g_preferences = ZenMoney.getPreferences();
    login();

    ZenMoney.trace("Перевод " + sum + " со счёта " + fromAcc + " на счёт " + toAcc);

    // определим валюту счёта-источника
    var fromCurr = ZenMoney.getData("accCurrency"+fromAcc, "");
    if (!fromCurr) {
        // определим валюту счёта
        ZenMoney.trace("Запрашиваем данные по счетам...");

        var accounts = requestJson("accounts_flat");
        //ZenMoney.trace('JSON счетов: '+JSON.stringify(accounts.payload));

        for (var iAcc = 0; iAcc < accounts.payload.length; iAcc++) {
            var acc = accounts.payload[iAcc];
            if (acc.id != fromAcc)
                continue;

            fromCurr = acc.moneyAmount.currency.name;

            ZenMoney.trace("Нашли счёт "+ fromAcc +" и определили валюту как "+ fromCurr);

            ZenMoney.setData("accCurrency"+ fromAcc, fromCurr);
            ZenMoney.saveData();

            break;
        }
    }

    if (!fromCurr)
        throw new ZenMoney.Error("Не удалось определить валюту счёта-источника");

    // если во время перевода произойдёт ошибка, будет выброшен эксепшен
    var payment = requestJson("pay", null, {
        "payParameters": JSON.stringify({
            "account": fromAcc,
            "provider": "transfer-inner",
            "currency": fromCurr,
            "moneyAmount": sum,
            "moneyCommission": sum,
            "providerFields": {
                "bankContract": toAcc,
            },
        }),
    });

    //ZenMoney.trace('JSON перевода: '+ JSON.stringify(payment));
}

/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

/**
 * Обработка JSON-строки в объект
 * @param html
 */
function getJson(html) {
    try {
        return JSON.parse(html);
    } catch (e) {
        ZenMoney.trace("Bad json (" + e.message + "): " + html);

        // попытаемся представить, что это html
        if (/технические\s+работы/i.exec(html))
            throw new ZenMoney.Error("Сервер банка сообщает о технических работах. Попробуйте повторить позднее.", true);

        throw new ZenMoney.Error("Сервер банка вернул ошибочные данные: " + e.message);
    }
}

/**
 * Выполнение запроса с получением JSON-результата
 * @param requestCode
 * @param data
 * @param parameters
 * @returns {*}
 */
function requestJson(requestCode, data, parameters) {
    var params = [];
    parameters || (parameters = {});
    g_sessionid && params.push(encodeURIComponent("sessionid") + "=" + encodeURIComponent(g_sessionid));

    if (data)
        for (var d in data) params.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    params.push(encodeURIComponent("appVersion") + "=" + encodeURIComponent("4.1.3"));
    params.push(encodeURIComponent("platform") + "=" + encodeURIComponent("android"));
    params.push(encodeURIComponent("origin") + "=" + encodeURIComponent("mobile,ib5,loyalty,platform"));
    g_deviceid && params.push(encodeURIComponent("deviceId") + "=" + encodeURIComponent(g_deviceid));

    if (parameters.post)
        data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
    else {
        if (parameters)
            for (var k in parameters)
                if (k !== "noException")
                    params.push(encodeURIComponent(k) + "=" + encodeURIComponent(parameters[k]));
        data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
    }

    if (!data) {
        ZenMoney.trace("Пришёл пустой ответ во время запроса по адресу \""+ g_baseurl + requestCode + "\". Попытаемся ещё раз...");

        if (parameters.post)
            data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
        else {
            if (parameters) for (var k2 in parameters) params.push(encodeURIComponent(k2) + "=" + encodeURIComponent(parameters[k2]));
            data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
        }
    }

    data = getJson(data);

    if (data.resultCode !== "OK" && !parameters.noException) {
        ZenMoney.trace("Ошибка: " + requestCode + ", " + data.errorMessage);
        if (!data.errorMessage)
            ZenMoney.trace("Request data: " + JSON.stringify(data));
        throw new ZenMoney.Error("Ответ от банка: " + (parameters.scope ? parameters.scope + ". " : "") + (data.plainMessage || data.errorMessage));
    }
    return data
}

function in_array(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

function in_accounts(id, accounts) {
    var length = accounts.length;
    for(var i = 0; i < length; i++)
        if(accounts[i].id == id) return true;
    return false;
}

function is_array(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
}

function n2(n) {
    return n < 10 ? "0" + n : String(n);
}

function trimStart(string, chars) {
    var start = 0;

    while (in_array(string[start], chars)) {
        start++;
    }

    return string.substr(start);
}

function parseDecimal(str) {
    const number = Number(str.toFixed(2).replace(/\s/g, "").replace(/,/g, "."));
    return number;
}