# Документация по устаревшему API для не-modular плагинов

Плагин запускается в JavaScript песочнице и выполняется синхронно.

Это означает, что в плагине недоступны объекты и функции DOM наподобие setTimeout, XMLHTTPRequest и т.п.

Для сетевого взаимодействия нужно использовать функции ZenPlugin API.

JS-файлы плагина исполняются в порядке перечисления файлов в манифесте.

После загрузки файлов в интерпретатор вызывается функция main(), которая обязана присутствовать в коде плагина.

Всё взаимодействие с API плагина идет через глобальный объект ZenMoney.

#### ZenMoney.setDefaultCharset(charset: String)

Задает кодировку по умолчанию, которая используется при сетевом взаимодействии.

#### ZenMoney.requestGet(url: String, headers: {String: String}?) -> String? throws

#### ZenMoney.requestPost(url: String, data: Any?, headers: {String: String}?) -> String? throws

#### ZenMoney.request(method: String, url: String, data: Any?, headers: {String: String}?) -> String? throws

Выполняют HTTP-запрос и возвращают тело ответа в виде строки. Если в заголовках ответа нет указания кодировки, то используется кодировка по умолчанию. При запросе так же, если среди заголовков нет 'Content-Type' с указанием типа данных и кодировки, то используется кодировка по умолчанию.

При ошибках в выполнении запроса бросают исключение ZenMoney.Error

#### ZenMoney.getLastUrl() -> Int?

Для последнего успешного HTTP-запроса возвращает его URL после всех переадресаций

#### ZenMoney.getLastStatusCode() -> Int?

Возвращает статус код последнего HTTP-ответа

#### ZenMoney.getLastResponseHeaders() -> [['header1', 'value1'], ['header2', 'value2'], ...]?

Возвращает массив заголовков последнего HTTP-ответа

#### ZenMoney.getLastResponseHeader(header: String) -> String?

Возвращает значение отдельного заголовка последнего HTTP-ответа

#### ZenMoney.trace(msg: String, tag: String?)

Вывод в лог сообщение: `[tag] msg`

#### ZenMoney.addAccount(account: (Account | [Account])) throws

Добавляет счет. Схема: [Account](schema/Account.md).

#### ZenMoney.addTransaction(transaction: (Transaction | [Transaction])) throws

Добавляет транзакцию. Схема: [Transaction](schema/Transaction.md).

#### ZenMoney.setResult({success: Bool, message: String?, account: [Account]?, transaction: [Transaction]?})

При вызове добавляет счета account и операции transaction и завершает работу плагина. Если `!success`, то это равносильно завершению работы с исключением `ZenMoney.Error(message)`.

