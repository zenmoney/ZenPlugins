/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

/**
 * @constructor
 */
function Request() {
    var authTokenType;
    var authAccessToken;

    this.baseURI = 'https://api.epayments.com/';

    /**
     * @param login
     * @param password
     */
    this.auth = function (login, password) {
        var cabinet_url = 'https://my.epayments.com/';

        var html = ZenMoney.requestGet(cabinet_url, defaultHeaders());
        if (!html || ZenMoney.getLastStatusCode() > 400) {
            ZenMoney.trace(html);
            throw new ZenMoney.Error('Ошибка при подключении к интернет-банку!');
        }

        var authData    = {
            'grant_type': 'password_otp',
            username:     login,
            password:     password,
            'otpcode':    ''
        };
        var authHeaders = Object.assign({}, defaultHeaders(), {
            'Referer':       cabinet_url,
            'Content-Type':  'application/x-www-form-urlencoded',
            'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
        });
        var requestData = getJson(ZenMoney.requestPost(this.baseURI + 'token', authData, authHeaders));
        if (!requestData.access_token) {
            var error = requestData.error_description;
            if (error) {
                throw new ZenMoney.Error(error, null, /Неверный логин или пароль/i.test(error));
            }

            ZenMoney.trace(requestData);
            throw new ZenMoney.Error('Не удалось зайти в личный кабинет. Сайт изменен?');
        }

        authTokenType   = requestData.token_type;
        authAccessToken = requestData.access_token;
    };

    /**
     * @returns {Object[]}
     */
    this.getUser = function () {
        var url = this.baseURI + 'v1/user/';

        var request = ZenMoney.requestGet(url, apiHeaders());

        return getJson(request);
    };

    /**
     * @returns {Object[]}
     */
    this.getOperations = function () {
        var request, requestData;
        var paginationLimit  = 10; // min value: 10
        var paginationOffset = 0;
        var paginationTotal  = null;
        var isFirstPage      = true;
        var operations       = [];
        var lastSyncTime     = getLastSyncTime();

        var date = new Date(lastSyncTime * 1000);
        ZenMoney.trace('Дата последней транзакции: ' + date.toUTCString());

        while (isFirstPage || paginationOffset < paginationTotal) {
            request     = this.requestOperations(paginationLimit, paginationOffset);
            requestData = getJson(request);

            if (requestData.errorCode != 0) {
                throw new ZenMoney.Error('Errors: ' + JSON.stringify(requestData.errorMsgs));
            }

            if (isFirstPage) {
                paginationTotal = requestData.count;
                isFirstPage     = false;
            }

            requestData.transactions.forEach(function (operation) {
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
        var url = this.baseURI + 'v1/Transactions/';

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
}
