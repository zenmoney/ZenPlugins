var g_soap;
var g_authSer = 'RCAuthorizationService';
var g_cardSer = 'RCCardService';
var g_accSer = 'RCAccountService';
var g_loanSer = 'RCLoanService';
var g_depositSer = 'RCDepositService';

/**
 * Обёртка вокруг marknote, нацеленая на soap для R-Connect
 *
 * @class
 */
var MarknoteWrapper = function () {
    var _parser = new marknote.Parser();
    var _baseUrl = 'https://connect.raiffeisen.ru/Mobile-WS/services/';
    var _headers = {
        "Connection": "close",
        "Host": "connect.raiffeisen.ru",
        "Accept-Encoding": "gzip"
    };
    var _envelope = "\
        <soapenv:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://entry.rconnect/xsd\" xmlns:ser=\"http://service.rconnect\" xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:soapenc=\"http://schemas.xmlsoap.org/soap/encoding/\">\
        <soapenv:Header />\
        <soapenv:Body>\
        </soapenv:Body>\
        </soapenv:Envelope>";

    /**
     * Отправить запрос на сервис и получить ответ
     *
     * @param {string} requestName Название запроса
     * @param {string} serviceName Название сервиса
     * @param {?Array.<marknote.Element>} nodes Дочерние xml-элементы для запроса
     * @returns {marknote.Document} Распарсенный ответ
     */
    this.sendRequest = function (requestName, serviceName, nodes) {
        var nodeRequest = new marknote.Element('ser:' + requestName);
        if (typeof nodes !== 'undefined') {
            for (var i = 0; i < nodes.length; i++)
                nodeRequest.addChildElement(nodes[i]);
        }

        var env = _parser.parse(_envelope);
        var nodeBody = env.getRootElement().getChildElement('soapenv:Body');
        nodeBody.addChildElement(nodeRequest);

        var reply = ZenMoney.requestPost(_baseUrl + serviceName, env.toString(), _headers);
        return _parser.parse(reply);
    }

    /**
     * Отправить запрос на сервис и обработать полученный ответ
     *
     * @param {string} requestName Название запроса
     * @param {string} serviceName Название сервиса
     * @param {?Array.<marknote.Element>} nodes Дочерние xml-элементы для запроса
     * @returns {Array.<marknote.Element>} Дочерние xml-элементы ответа
     */
    this.processRequest = function (requestName, serviceName, nodes) {
        var doc = this.sendRequest(requestName, serviceName, nodes);
        var nodeReply = doc.getRootElement().getChildElement('soap:Body');
        if (nodeReply == null) {
            ZenMoney.trace(requestName + ': ' + doc.toString());
            throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
        }
        return nodeReply.getChildElement('ns2:' + requestName + 'Response').getChildElements();
    }

    /**
     * Создать текстовый xml-элемент
     *
     * @param {string} name Название
     * @param {string} str Значение
     * @returns {marknote.Element} Xml-элемент
     */
    this.textNode = function (name, str) {
        var node = new marknote.Element(name);
        node.setText(str);
        return node;
    }

    /**
     * Создать xml-элемент c дочерними xml-элементами
     *
     * @param {string} name Название
     * @param {Array.<marknote.Element>} arr Дочерние xml-элементами
     * @returns {marknote.Element} Xml-элемент
     */
    this.arrayNode = function (name, arr) {
        var node = new marknote.Element(name);
        for (var i = 0; i < arr.length; i++)
            node.addChildElement(arr[i]);
        return node;
    }

    /**
     * Получить значение дочернего xml-элемента с указанным именем
     *
     * @param {marknote.Element} node Родительский xml-элемент
     * @param {string} name Имя
     * @param {?string} defaultValue Дефолтное значение
     * @returns {string} Значение
     */
    this.getValue = function (node, name, defaultValue) {
        defaultValue = (typeof defaultValue !== 'undefined') ? defaultValue : '';
        if (node == null)
            return defaultValue;
        if (node.getChildElement(name) == null)
            return defaultValue;
        var value = node.getChildElement(name).getText();
        if (value === '')
            return defaultValue;
        return value;
    }
};

