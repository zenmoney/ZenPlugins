var defaultHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'UniCredit Mobile/2.18.23.1 CFNetwork/808.3 Darwin/16.3.0',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'Accept-Language': 'ru',
    'Accept-Encoding': 'gzip, deflate',
    'Cache-Control': 'max-age=0'
};

var BASE_URL = 'https://enter.unicredit.ru/v2/cgi/bsi.dll';
var GET_TAG_REGEX = /<(\w+)[^>]*\/?\s?>/igm;
var GET_ATTRIBUTE_REGEX = /\s+(\w+)=\"([^\"]*)\"/igm;
var FIRST_SYNC_PERIOD = 6 * 30;

function xml2json(xml) {
    var tagMatch;
    var objArray = [];
    try {
        while (tagMatch = GET_TAG_REGEX.exec(xml)) {
            var tagString = tagMatch[0];
            var tagType = tagMatch[1];
            var jsonObject = {
                name: tagType,
                properties: {}
            };

            while (attrMatch = GET_ATTRIBUTE_REGEX.exec(tagString)) {
                var key = attrMatch[1];
                var value = attrMatch[2];

                jsonObject.properties[key] = value;
            }

            objArray.push(jsonObject);
        }
    }
    catch (e) {
        ZenMoney.trace('XmlParseError: ' + e);
        return null;
    }

    return objArray;
}

function newGuid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function getDateString(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    return `${("0" + day).slice(-2)}.${("0" + month).slice(-2)}.${year}`;
}

function parseDate(str, separator) {
    if (!separator)
        separator = ".";

    var parts = str.split(separator);
    return new Date(parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10));
}

var cardNumberRegex = /\d+/;
function getCardId(inputString) {
    var result = cardNumberRegex.exec(inputString);
    if (!result)
        throw "Не удается распознать ID аккаунта";
    return result[0];
}

function isNullOrEmpty(array) {
    return !array || array.length == 0;
}