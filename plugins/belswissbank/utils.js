var utils = (function (ZenMoney, _) {
    function repeat(str, times) {
        var result = '';
        for (var i = 0; i < times; ++i) {
            result += str;
        }
        return result;
    }

    function padLeft(str, num, char) {
        str = str.toString();
        return repeat(char, num - str.length) + str;
    }

    function isSuccessfulResponse(response) {
        return response.status === 200;
    }

    var categoriesToLog = (ZenMoney.getPreferences().categoriesToLog || 'info,warn').split(',');
    var logEverything = categoriesToLog.indexOf('*') !== -1;

    function log(message, category) {
        if (logEverything || categoriesToLog.indexOf(category) !== -1) {
            ZenMoney.trace(message, category);
        }
    }

    function toReadableJson(x, sanitize) {
        if (x === undefined) {
            return 'undefined';
        }
        return JSON.stringify(x, sanitize, 4);
    }

    log('logging categories: ' + JSON.stringify(categoriesToLog), 'info');

    return {
        log: log,

        generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
                var seed = Math.random() * 16 | 0;
                var hexValue = char === 'x' ? seed : (seed & 0x3 | 0x8);
                return hexValue.toString(16);
            });
        },

        toReadableJson: toReadableJson,

        toAtLeastTwoDigitsString: function (x) {
            return padLeft(x, 2, '0');
        },

        retry: function (options) {
            for (var attempt = 1; attempt <= options.maxAttempts; ++attempt) {
                var value = options.getValue();
                var isSatisfied = options.isSatisfied(value);
                if (attempt > 1) {
                    log(toReadableJson({
                        attempt: attempt,
                        maxAttempts: options.maxAttempts,
                        isSatisfied: isSatisfied
                    }), 'retry');
                }
                if (isSatisfied) {
                    return value;
                }
            }
            throw errors.temporal('could not satisfy condition in ' + options.maxAttempts + ' get attempts');
        },

        sanitize: function (key, value) {
            if (value === undefined) {
                return '<undefined>';
            }
            if (_.isString(value)) {
                return '<sanitized string[' + value.length + ']>';
            }
            if (_.isNumber(value)) {
                return '<sanitized number>';
            }
            return value;
        },

        requestJson: function request(request) {
            var headers = {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json;charset=UTF-8'
            };
            log(request.method + ' ' + request.url, 'request');
            var hasData = 'body' in request;
            if (hasData) {
                log(toReadableJson(request.body, request.bodyLogSanitizer), 'requestData');
            }
            var responseBody;
            if (!request.method || request.method.toUpperCase() === 'GET') {
                responseBody = ZenMoney.requestGet(request.url, headers);
            } else if (request.method.toUpperCase() === 'POST') {
                responseBody = ZenMoney.requestPost(request.url, request.body, headers);
            } else {
                responseBody = ZenMoney.request(request.method, request.url, request.body, headers);
            }
            var response = {
                status: ZenMoney.getLastStatusCode(),
                body: responseBody,
                method: request.method,
                url: ZenMoney.getLastUrl()
            };
            try {
                response.body = JSON.parse(response.body);
            } catch (e) {
                log('unable to parse response body as json: ' + toReadableJson(response.body) + '\nerror: ' + e.message, 'warn');
            }
            log(response.status + ' ' + response.method + ' ' + response.url, 'response');
            log(toReadableJson(response.body, request.bodyLogSanitizer), 'responseData');
            return response;
        },

        assertSuccessfulResponse: function (response, createError) {
            if (!isSuccessfulResponse(response)) {
                throw createError('non-successful response: ' + toReadableJson(response));
            }
        }
    };
})(ZenMoney, _);
