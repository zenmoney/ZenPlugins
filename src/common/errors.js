export const fatal = function(message) {
    return ZenMoney.Error(message, false, true);
};
export const temporal = function(message) {
    return ZenMoney.Error(message, false, false);
};
