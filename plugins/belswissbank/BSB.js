var BSB = (function (codeToCurrencyLookup, utils, errors) {
    function formatBsbApiDate(userDate) {
        // day.month.year in bank timezone (+3)
        var bankTimezone = 3 * 3600 * 1000;
        var date = new Date(userDate.valueOf() + bankTimezone);
        return [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear()].map(utils.toAtLeastTwoDigitsString).join('.');
    }

    var transactionTypeFactors = {
        'Vozvrat': 1,
        'Popolnenie': 1,
        'Service payment to card': 1,
        'Zachislenie': 1,
        'Tovary i uslugi': -1,
        'Bankomat': -1
    };

    function retry(options) {
        for (var attempt = 1; attempt <= options.maxAttempts; ++attempt) {
            var value = options.getValue();
            var isSatisfied = options.isSatisfied(value);
            if (attempt > 1) {
                ZenMoney.trace(
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
    }

    return {
        bankBirthday: new Date(1033977600000),

        authorize: function (username, password, deviceId) {
            var BSB_AUTH_URL = 'https://24.bsb.by/mobile/api/authorization?lang=ru';
            utils.requestJson({
                bodyLogSanitizer: utils.sanitize,
                url: BSB_AUTH_URL,
                method: 'DELETE'
            });
            var authStatusResponse = retry({
                getValue: function () {
                    return utils.requestJson({
                        bodyLogSanitizer: utils.sanitize,
                        url: BSB_AUTH_URL,
                        method: 'POST',
                        body: {
                            "username": username,
                            "password": password,
                            "deviceId": deviceId,
                            "applicationVersion": "Web 5.3.12",
                            "osType": 3,
                            "currencyIso": "BYN"
                        }
                    });
                },
                isSatisfied: function (response) {
                    return response.status !== 415;
                },
                maxAttempts: 10
            });
            utils.assertSuccessfulResponse(authStatusResponse, errors.fatal);
            return authStatusResponse.body;
        },

        confirm: function (deviceId, confirmationCode) {
            var response = utils.requestJson({
                bodyLogSanitizer: utils.sanitize,
                url: 'https://24.bsb.by/mobile/api/devices/' + deviceId + '?lang=ru',
                method: 'POST',
                body: confirmationCode
            });
            if (response.body.deviceStatus !== 'CONFIRMED') {
                throw errors.temporal('confirmation failed: ' + utils.toReadableJson(response));
            }
        },

        getCards: function () {
            var response = utils.requestJson({
                bodyLogSanitizer: utils.sanitize,
                url: 'https://24.bsb.by/mobile/api/cards?lang=ru',
                method: 'GET'
            });
            utils.assertSuccessfulResponse(response, errors.temporal);
            return response.body;
        },

        getTransactions: function (cardId, from, to) {
            var response = utils.requestJson({
                url: 'https://24.bsb.by/mobile/api/cards/' + cardId + '/sms?lang=ru',
                method: 'POST',
                body: {
                    fromDate: formatBsbApiDate(from),
                    toDate: formatBsbApiDate(to)
                }
            });
            utils.assertSuccessfulResponse(response, errors.temporal);
            return response.body;
        },

        getFactor: function (transaction) {
            var transactionType = transaction.transactionType;
            if (!(transactionType in transactionTypeFactors)) {
                throw errors.fatal('unknown transactionType: ' + utils.toReadableJson(transactionType));
            }
            return transactionTypeFactors[transactionType];
        },

        getIsoCurrency: function (currencyCode) {
            if (!(currencyCode in codeToCurrencyLookup)) {
                throw errors.fatal('unknown currency ' + card.currency);
            }
            return codeToCurrencyLookup[currencyCode];
        }
    };
})(codeToCurrencyLookup, utils, errors);
