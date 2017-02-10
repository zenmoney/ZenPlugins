/**
 * @param cardNumber
 * @param password
 * @constructor
 */
function Request(cardNumber, password) {
    var cookies;

    this.baseURI = 'https://mybank.oplata.kykyryza.ru/api/v0001/';

    this.getCookies = function() {
        if (!cookies) {
            var url = this.baseURI + 'authentication/authenticate?rid=' + generateHash();

            var data    = {
                principal: cardNumber,
                secret: password,
                type: "AUTO"
            };
            var headers = {
                'content-type': 'application/json;charset=UTF-8'
            };

            var requestData = getJson(ZenMoney.requestPost(url, data, headers));
            if (requestData.status != 'OK') { // AUTH_WRONG || AUTH_LOCKED_TEMPORARY
                ZenMoney.trace('Bad auth: ' +  + requestData.status, 'warning');
                throw new ZenMoney.Error('Не удалось авторизоваться');
            }

            cookies = ZenMoney.getLastResponseHeader('Set-Cookie');
        }

        return cookies;
    };

    this.getAccounts = function () {
        var url = this.baseURI + 'cards?rid=' + generateHash();

        var headers = {'content-type': 'application/json;charset=UTF-8'};
        headers['cookie'] = this.getCookies();

        var request = ZenMoney.requestGet(url, headers);

        return getJson(request).data;
    };

    this.getAllOperations = function () {
        var limit      = 150;
        var offset     = 0;
        var total      = null;

        var operations = [];

        if (null === total) {
            var request      = this.requestOperations(limit, offset);
            var requestData = getJson(request);

            total = requestData.part.totalCount;

            operations = operations.concat(requestData.data);

            offset += limit;
        }

        while (offset < total) {
            request      = this.requestOperations(limit, offset);
            requestData = getJson(request);

            if (requestData.part.offset != offset) { // кукуруза ограничивает выборку
                break;
            }

            operations = operations.concat(requestData.data);

            offset += limit;
        }

        return operations.filter(function(operation) {
            return operation.itemType == 'OPERATION';
        });
    };

    /**
     * @param limit
     * @param offset
     */
    this.requestOperations = function (limit, offset) {
        var url = this.baseURI + 'hst?limit=' + limit + '&offset=' + offset + '&rid=' + generateHash();

        var headers = {'content-type': 'application/json;charset=UTF-8'};
        headers['cookie'] = this.getCookies();

        return ZenMoney.requestGet(url, headers);
    };

    function generateHash() {
        return hex_md5(Math.random()).substring(0,13);
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
}