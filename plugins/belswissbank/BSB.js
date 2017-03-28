var BSB = (function (codeToCurrencyLookup, utils, errors) {
    function formatBsbApiDate(userDate) {
        // day.month.year in bank timezone (+3)
        var bankTimezone = 3 * 3600 * 1000;
        var date = new Date(userDate.valueOf() + bankTimezone);
        return [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear()].map(utils.toAtLeastTwoDigitsString).join('.');
    }

    var transactionTypeFactors = {
        'Vozvrat': 1,
        'Vozvrat sredstv': 1,
        'Popolnenie': 1,
        'Service payment to card': 1,
        'Zachislenie': 1,
        'Tovary i uslugi': -1,
        'Bankomat': -1,
        'Nalichnye': -1
    };

    var ownCashTransferTransactionTypes = [
        'Popolnenie',
        'Bankomat',
        'Nalichnye'
    ];

    return {
        bankBirthday: new Date(1033977600000),

        makeUrl: function (path) {
            return utils.getPreference('apiUrl', 'https://24.bsb.by/mobile/api') + path + '?lang=ru';
        },

        authorize: function (username, password, deviceId) {
            var BSB_AUTH_URL = this.makeUrl('/authorization');
            utils.requestJson({
                bodyLogSanitizer: utils.sanitize,
                url: BSB_AUTH_URL,
                method: 'DELETE'
            });
            var authStatusResponse = utils.retry({
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
                url: this.makeUrl('/devices/' + deviceId),
                method: 'POST',
                body: confirmationCode.toString()
            });
            if (response.body.deviceStatus !== 'CONFIRMED') {
                throw errors.temporal('confirmation failed: ' + utils.toReadableJson(response));
            }
        },

        getCards: function () {
            var response = utils.requestJson({
                bodyLogSanitizer: utils.sanitize,
                url: this.makeUrl('/cards'),
                method: 'GET'
            });
            utils.assertSuccessfulResponse(response, errors.temporal);
            return response.body;
        },

        getTransactions: function (cardId, from, to) {
            var response = utils.requestJson({
                url: this.makeUrl('/cards/' + cardId + '/sms'),
                method: 'POST',
                body: {
                    fromDate: formatBsbApiDate(from),
                    toDate: formatBsbApiDate(to)
                }
            });
            utils.assertSuccessfulResponse(response, errors.temporal);
            return response.body;
        },

        transactionTypeFactors: transactionTypeFactors,

        ownCashTransferTransactionTypes: ownCashTransferTransactionTypes,

        getIsoCurrency: function (currencyCode) {
            if (!(currencyCode in codeToCurrencyLookup)) {
                throw errors.fatal('unknown currency ' + card.currency);
            }
            return codeToCurrencyLookup[currencyCode];
        }
    };
})(codeToCurrencyLookup, utils, errors);
