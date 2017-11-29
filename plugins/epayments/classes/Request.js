/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

 //Modified 29.11.2017
 /**
 * @author Pedorich Nikita <pedorich.n@gmail.com>
 */

/**
 * @constructor
 */
function Request() {
    var authTokenType;
    var authAccessToken;
    const otpRegex = /\d{6}/;

    const baseURL = 'https://api.epayments.com/';
    const cabinetURL = 'https://my.epayments.com/';

    const otpOptions = {
        'inputType': 'number',
        'time':      3E4
    };

    const authHeaders = Object.assign({}, defaultHeaders(), {
        'Referer':       cabinetURL,
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    });


    /**
     * @param login
     * @param password
     */
    this.auth = function (login, password, otp) {
        var response = ZenMoney.requestGet(cabinetURL, defaultHeaders());
        if (!response || ZenMoney.getLastStatusCode() > 400) {
            ZenMoney.trace(response)
            throw new ZenMoney.Error('Ошибка при подключении к интернет-банку!');
        }

        var authData = authenthicate(login, password, otp)

        authTokenType   = authData.token_type;
        authAccessToken = authData.access_token;
    };

    /**
     * @returns {Object[]}
     */
    this.getUser = function () {
        var url = baseURL + 'v1/user/';

        var response = ZenMoney.requestGet(url, apiHeaders());

        return getJson(response);
    };

    /**
     * @returns {Object[]}
     */
    this.getOperations = function () {
        var request, response;
        var paginationLimit  = 10; // min value: 10
        var paginationOffset = 0;
        var paginationTotal  = null;
        var isFirstPage      = true;
        var operations       = [];
        var lastSyncTime     = getLastSyncTime();

        var date = new Date(lastSyncTime * 1000);
        ZenMoney.trace('Дата последней транзакции: ' + date.toUTCString());

        while (isFirstPage || paginationOffset < paginationTotal) {
            responseJson = this.requestOperations(paginationLimit, paginationOffset);
            response     = getJson(responseJson);

            if (response.errorCode != 0) {
                throw new ZenMoney.Error('Errors: ' + JSON.stringify(response.errorMsgs));
            }

            if (isFirstPage) {
                paginationTotal = response.count;
                isFirstPage     = false;
            }

            response.transactions.forEach(function (operation) {
                if (operation.state != 'AuthDecline') {
                    operations.push(operation);
                }
            });

            paginationOffset += paginationLimit;
        }

        return operations;
    };

    /**
     * @param limit
     * @param offset
     */
    this.requestOperations = function (limit, offset) {
        var url = baseURL + 'v1/Transactions/';

        var from = getLastSyncTime();
        var till = parseInt(Date.now() / 1000);

        // fix for old saved data
        if (from > till) {
            from = parseInt(from / 1000);
        }

        var requestData = {
            from: from,
            skip: offset,
            take: limit,
            till: till
        };

        return ZenMoney.requestPost(url, requestData, apiHeaders());
    };

    /**
     * @param time
     */
    this.setLastSyncTime = function (time) {
        ZenMoney.setData('last_sync_time', time);
    };

    /**
     * @return {Object}
     */
    function defaultHeaders() {
        return {
            'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
            'Connection':      'keep-alive',
            'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36'
        };
    }

    /**
     * @return {Object}
     */
    function apiHeaders() {
        return Object.assign({}, defaultHeaders(), {
            'Authorization': authTokenType + ' ' + authAccessToken,
            'Content-type':  'application/json'
        });
    }

    /**
     * Разбираем строку ответа
     *
     * @param {String} data
     * @return {Object}
     */
    function getJson(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            ZenMoney.trace('Bad json (' + e.message + '): ' + data, 'error');
            throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
        }
    }

    /**
     * @returns {Number}
     */
    function getLastSyncTime() {
        var time = parseInt(ZenMoney.getData('last_sync_time', 0));

        if (time == 0) {
            var preferences = ZenMoney.getPreferences();
            var period      = !preferences.hasOwnProperty('period') || isNaN(period = parseInt(preferences.period)) ? 31 : period;

            time = Math.floor(Date.now() / 1000 - period * 86400);
        }

        return time;
    }

    /**
     * @param {String} login
     * @param {String} password
     * @param {String} otp
     * @return {Object}
     */
    function authenthicate(login, password, otp) {
        otp = processOtpInput(otp)

        var authData = {
            'grant_type': 'password_otp',
            'username':   login,
            'password':   password,
            'otpcode':    otp
        };

        var response = getJson(ZenMoney.requestPost(baseURL + 'token', authData, authHeaders));

        if (!response.access_token) {
            var error = response.error
            var errorDesc = response.error_description;

            if (error === 'otp_code_required') {
                var receivedOtp = ZenMoney.retrieveCode('Введите одноразовый пароль', null, otpOptions);
                return authenthicate(login, password, receivedOtp)
            }

            if (error === 'otp_code_invalid') {
                var receivedOtp = ZenMoney.retrieveCode('Одноразовый пароль введен неверно. Попробуйте еще раз', null, otpOptions);
                return authenthicate(login, password, receivedOtp)
            }

            if (error === 'bot_detected') {
                //TODO: CAPTCHA
                ZenMoney.trace("ePeayments заподозрил бота и хочет ввода CAPTCHA")
                throw new ZenMoney.Error('Банк заподозрил в вас бота, попробуйте зайти через браузер, ' +
                    'потом снова проведите синхронизацию в Zenmoney', true, false)
            }

            if (error) {
                throw new ZenMoney.Error(errorDesc, null, /invalid_grant/i.test(error));
            }

            ZenMoney.trace(response);
            throw new ZenMoney.Error('Не удалось зайти в личный кабинет. Сайт изменен?');
        } else {
            return { 'token_type': response.token_type, 'access_token': response.access_token }
        }
    }

    /**
     * @param {String} code
     * @return {String}
     */
    function processOtpInput(code) {
        if (code) {
            var match = code.match(otpRegex)
            if (match && match.length > 0) {
                return match[0]
            } else {
                return ''
            }
        } else {
            return ''
        }
    }
}
