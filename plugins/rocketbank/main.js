/**
 * Начинаем синхронизацию
 */
function main() {
    var preferences = ZenMoney.getPreferences();
    var rocketBank = new RocketBank(
        ZenMoney.getData,
        ZenMoney.setData,
        ZenMoney.saveData,
        ZenMoney.request,
        ZenMoney.retrieveCode,
        ZenMoney.Error,
        ZenMoney.trace
    );
    rocketBank.processAccounts();
    rocketBank.processTransactions();

    ZenMoney.setResult({success: true});
}


/**
 * @param get
 * @param set
 * @param save
 * @param request
 * @param prompt
 * @param error
 * @param log
 * @constructor
 */
function RocketBank(get, set, save, request, prompt, error, log) {

    var baseUrl = "https://rocketbank.ru/api/v5";

    /**
     * Обрабатываем счета
     */
    this.processAccounts = function () {
        log('Запрашиваем данные по счетам...');
    };

    /**
     * Обрабатываем транзакции
     */
    this.processTransactions = function () {
        log('Запрашиваем данные по транзакциям...');
    };

    /**
     * Возвращает ID устройства
     *
     * @returns {string}
     */
    var getDevice = function () {
        var deviceId = get('device_id');
        if (!deviceId) {
            log("Необходимо привязать устройство...");
            var phone = prompt("Введите свой номер телефона в формате +79211234567", null, {
                inputType: "string",
                time: 18E4
            });
            deviceId = registerDevice(phone);
            log("Устройство привязано");
        }
        return deviceId;
    }.bind(this);

    /**
     * Получить токен для запросов
     *
     * @param {String} device_id
     * @param {Boolean} force_new
     * @returns {string}
     */
    var getToken = function (device_id, force_new) {
        var token = get('token');
        if (!token || force_new) {
            var password = prompt(
                "Введите пароль, используемый для входа в официальные приложения",
                null,
                {
                    inputType: "number",
                    time: 18E4
                }
            );
            var data = getJson(
                request(
                    'GET',
                    baseUrl + "/login",
                    JSON.stringify({email: get('email'), password: password}),
                    getHeaders(device_id, null)
                )
            );
            if (data.response.status == 200) {
                log(data.response.description);
            } else {
                throw new error('Не удалось подтвердить телефон');
            }
            token = data.token;
            set("email", data.user.login_token);
            set("token", token);
            save();
        }
        return token;
    }.bind(this);

    /**
     * Регистрируем новое устройтво
     *
     * @param {String} phone
     * @returns {String}
     */
    var registerDevice = function (phone) {
        var device_id = "zenmoney_" + hex_md5(Math.random().toString() + "_" + phone + "_" + Date.now());
        var data = getJson(
            request(
                'GET',
                baseUrl + "/devices/register",
                JSON.stringify({phone: phone}),
                getHeaders(device_id, null)
            )
        );
        if (data.response.status == 200) {
            log(data.response.description);
        } else {
            throw new error('Не удалось отправить код подтверждения');
        }
        var code = prompt("Введите код подтверждения из смс для авторизации приложения в интернет-банке", null, {
            inputType: "number",
            time: 18E4
        });
        log("Получили код");
        data = getJson(
            request(
                'PATCH',
                baseUrl + "/sms_verifications/" + data.sms_verification.id + "/verify",
                JSON.stringify({code: code}),
                getHeaders(device_id, null)
            )
        );
        if (data.response.status == 200) {
            log(data.response.description);
        } else {
            throw new error('Не удалось подтвердить телефон');
        }
        set("device_id", deviceId);
        set("email", data.user.login_token);
        set("token", data.token);
        save();
        return device_id;
    }.bind(this);

    /**
     * Разбираем строку ответа
     *
     * @param {String} data
     */
    var getJson = function (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            log('Bad json (' + e.message + '): ' + data);
            throw new error('Сервер вернул ошибочные данные: ' + e.message);
        }
    }.bind(this);

    /**
     * Формируем объект заголовков
     *
     * @param {String} device_id
     * @param {String} token
     * @returns {Object}
     */
    var getHeaders = function (device_id, token) {
        var date = Math.floor(Date.now() / 1000);
        var headers = {
            "X-Device-ID": device_id,
            "X-Time": date,
            "X-Sig": hex_md5("0Jk211uvxyyYAFcSSsBK3+etfkDPKMz6asDqrzr+f7c=_" + date + "_dossantos")
        };
        if (token) {
            headers["Authorization"] = "Token token=" + token;
        }
        return headers;
    }.bind(this);
}
