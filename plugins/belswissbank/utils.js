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

    var logVerbose = ZenMoney.getPreferences().verboseLogging ? ZenMoney.trace.bind(ZenMoney) : _.noop;

    return {
        generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
                var seed = Math.random() * 16 | 0;
                var hexValue = char === 'x' ? seed : (seed & 0x3 | 0x8);
                return hexValue.toString(16);
            });
        },

        toReadableJson: function (x, sanitize) {
            if (x === undefined) {
                return 'undefined';
            }
            return JSON.stringify(x, sanitize, 4);
        },

        toAtLeastTwoDigitsString: function (x) {
            return padLeft(x, 2, '0');
        },

        retry: function (options) {
            for (var attempt = 1; attempt <= options.maxAttempts; ++attempt) {
                var value = options.getValue();
                var isSatisfied = options.isSatisfied(value);
                if (attempt > 1) {
                    logVerbose(
                        'retry ' +
                        utils.toReadableJson({
                            attempt: attempt,
                            maxAttempts: options.maxAttempts,
                            isSatisfied: isSatisfied
                        }));
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
            logVerbose(request.method + ' ' + request.url, 'request');
            var hasData = 'body' in request;
            if (hasData) {
                logVerbose(utils.toReadableJson(request.body, request.bodyLogSanitizer), 'requestData');
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
                ZenMoney.trace('unable to parse response body as json: ' + utils.toReadableJson(response.body) + '\nerror: ' + e.message);
            }
            logVerbose(response.status + ' ' + response.method + ' ' + response.url, 'response');
            logVerbose(utils.toReadableJson(response.body, request.bodyLogSanitizer), 'responseData');
            return response;
        },

        assertSuccessfulResponse: function (response, createError) {
            if (!isSuccessfulResponse(response)) {
                throw createError('non-successful response: ' + this.toReadableJson(response));
            }
        }
    };
})(ZenMoney, _);
