var errors = (function (ZenMoney) {
    return {
        fatal: function (message) {
            return ZenMoney.Error(message, false, true);
        },
        temporal: function (message) {
            return ZenMoney.Error(message, false, false);
        }
    };
})(ZenMoney);