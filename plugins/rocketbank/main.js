var g_baseurl = "https://rocketbank.ru/api/v5";

function main() {
    var preferences = ZenMoney.getPreferences();
    if (!preferences.phone) {
        throw new ZenMoney.Error("Введите номер телефона", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);
    }
    if (!ZenMoney.getData('device_id')) {
        ZenMoney.trace("Необходимо привязать устройство...");
        registerDevice(preferences.phone);
        ZenMoney.trace("Устройство привязано");
    }
    ZenMoney.setResult({success: true});
}

/**
 * Регистрируем новое устройтво
 *
 * @param {String} phone
 */
function registerDevice(phone) {
    var device_id = "zenmoney_" + hex_md5(Math.random().toString() + "_" + phone + "_" + Date.now());
    var data = getJson(
        ZenMoney.requestPost(
            g_baseurl + "/devices/register",
            JSON.stringify({phone: phone}),
            getHeaders(device_id)
        )
    );
    if (data.response.status == 200) {
        ZenMoney.trace(data.response.description);
    } else {
        throw new ZenMoney.Error('Не удалось отправить код подтверждения');
    }
    var code = ZenMoney.retrieveCode("Введите код подтверждения из смс для авторизации приложения в интернет-банке", null, {
        inputType: "number",
        time: 18E4
    });
    ZenMoney.trace("Получили код");
    data = ZenMoney.request(
        'PATCH',
        g_baseurl + "/sms_verifications/" + data.sms_verification.id + "/verify",
        JSON.stringify({code: code}),
        getHeaders(device_id)
    );
    if (data.response.status == 200) {
        ZenMoney.trace(data.response.description);
    } else {
        throw new ZenMoney.Error('Не удалось подтвердить телефон');
    }
    ZenMoney.setData("device_id", deviceId);
    ZenMoney.setData("email", data.user.login_token);
    ZenMoney.setData("token", data.token);
    ZenMoney.saveData();
}

/**
 * Разбираем строку ответа
 *
 * @param {String} data
 */
function getJson(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        ZenMoney.trace('Bad json (' + e.message + '): ' + data);
        throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
    }
}

/**
 * Формируем объект заголовков
 *
 * @param {String} device_id
 * @param {String} token
 * @returns {Object}
 */
function getHeaders(device_id, token) {
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
}
