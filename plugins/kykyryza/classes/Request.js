/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

/**
 * @constructor
 */
function Request() {
    this.baseURI = 'https://mybank.oplata.kykyryza.ru/api/v0001/';

    /**
     * @param cardNumber
     * @param password
     */
    this.auth = function (cardNumber, password) {
        var url = this.baseURI + 'authentication/authenticate?rid=' + generateHash();

        var data = {
            principal: cardNumber,
            secret:    password,
            type:      "AUTO"
        };

        var requestData = getJson(ZenMoney.requestPost(url, data, defaultHeaders()));
        if (requestData.status != 'OK') { // AUTH_WRONG || AUTH_LOCKED_TEMPORARY
            ZenMoney.trace('Bad auth: ' + +requestData.status, 'warning');
            throw new ZenMoney.Error('Не удалось авторизоваться');
        }
    };

    /**
     * @returns {Object[]}
     */
    this.getWallets = function () {
        var url = this.baseURI + 'wallets?rid=' + generateHash();

        var request = ZenMoney.requestGet(url, defaultHeaders());

        return getJson(request).data.wallets;
    };

    /**
     * @returns {Object[]}
     */
    this.getAccounts = function () {
        var url = this.baseURI + 'cards?rid=' + generateHash();

        var request = ZenMoney.requestGet(url, defaultHeaders());

        return getJson(request).data;
    };

    /**
     * @returns {Object[]}
     */
    this.getOperations = function () {
        var request, requestData, loadNextPage;
        var paginationLimit  = 20;
        var paginationOffset = 0;
        var paginationTotal  = null;
        var isFirstPage      = true;
        var operations       = [];
        var lastSyncTime     = getLastSyncTime();

        var date = new Date(lastSyncTime);
        ZenMoney.trace('Дата последней синхронизации: ' + date.toUTCString());

        while (isFirstPage || paginationOffset < paginationTotal) {
            request     = this.requestOperations(paginationLimit, paginationOffset);
            requestData = getJson(request);

            if (requestData.part.offset != paginationOffset) { // банк ограничивает выборку
                break;
            }

            if (isFirstPage) {
                paginationTotal = requestData.part.totalCount;
                isFirstPage     = false;
            }

            loadNextPage = requestData.data.every(function (operation) {
                if (operation.date > lastSyncTime) {
                    if (operation.itemType == 'OPERATION') {
                        operations.push(operation);
                    }

                    return true;
                }
                return false;
            });

            if (loadNextPage) {
                paginationOffset += paginationLimit;
            } else {
                break;
            }
        }

        return operations;
    };

    /**
     * @param limit
     * @param offset
     */
    this.requestOperations = function (limit, offset) {
        var url = this.baseURI + 'hst?limit=' + limit + '&offset=' + offset + '&rid=' + generateHash();

        return ZenMoney.requestGet(url, defaultHeaders());
    };

    /**
     * @param time
     */
    this.setLastSyncTime = function (time) {
        ZenMoney.setData('last_sync_time', time);
    };

    /**
     * @returns {string}
     */
    function generateHash() {
        return hex_md5(Math.random()).substring(0, 13);
    }

    /**
     * @returns {{content-type: string}}
     */
    function defaultHeaders() {
        return {'content-type': 'application/json;charset=UTF-8'};
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

            time = Math.floor(Date.now() - period * 86400000);
        }

        return time;
    }
}
