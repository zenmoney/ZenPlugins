# ZenPlugins API
Плагин обычно представляет из себя директорию со следующими файлами:
- ZenmoneyManifest.xml
- preferences.xml
- index.js модульный файл, экспортирующий функцию main

## ZenmoneyManifest.xml
Любой плагин должен содержать файл манифеста. Типичный вид файла:
```xml
<?xml version="1.0" encoding="utf-8"?>
<provider>
    <id>sberbank-online</id>
    <version>1.1</version>
    <build>36</build>
    <company>4624</company>
    <modular>true</modular>
    <files>
        <js>index.js</js>
        <preferences>preferences.xml</preferences>
    </files>
    <description>Для подключения импорта укажите ваш логин и пароль от интернет-банка и ПИН-код от мобильного приложения Сбербанк Онлайн. Если вы не пользуетесь мобильным приложением от Сбербанка, можете указать любой пятизначный код.
    </description>
</provider>
```

**id** - Уникальный ID плагина без пробелов (String)

**version** - Версия плагина (String)

**build** - Номер сборки плагина (Int)

**company** - ID банка для работы с которым предназначен плагин. Данный ID можно узнать у нашей поддержки <support@zenmoney.ru>

**files** - Список исполняемых файлов и название файла настроек.

**description** - Краткое описание работы с плагином

## Файл настроек
Обычно это preferences.xml. Структура файла повторяет структуру [Preferences в Android](https://developer.android.com/guide/topics/ui/settings.html?hl=ru) только без использования пространства имен `android:`
Пример файла настроек:
```xml
<?xml version="1.0" encoding="utf-8"?>
<PreferenceScreen>
    <EditTextPreference
        key="login"
        obligatory="true"
        title="Логин"
        summary="|ID пользователя или логин|{@s}"
        positiveButtonText="ОК"
        negativeButtonText="Отмена"
        dialogTitle="Логин"
        dialogMessage="Введите идентификатор пользователя или логин для входа в систему Сбербанк Онлайн.">
    </EditTextPreference>
    <EditTextPreference
        key="password"
        obligatory="true"
        title="Пароль"
        summary="||***********"
        inputType="textPassword"
        positiveButtonText="ОК"
        negativeButtonText="Отмена"
        dialogTitle="Пароль"
        dialogMessage="Введите пароль, используемый для входа в систему Сбербанк Онлайн.">
    </EditTextPreference>
    <ListPreference
        key="period"
        title="Начальный период загрузки данных"
        summary="|31|{@s}"
        entries="Квартал|Месяц|Неделя"
        entryValues="92|31|7"
        defaultValue="31"	
        positiveButtonText="ОК"
        negativeButtonText="Отмена"
        dialogTitle="Период загрузки"
        dialogMessage="Укажите начальный период, за который нужно загрузить данные.">
    </ListPreference>
</PreferenceScreen>
```
Поддерживается EditTextPreference, ListPreference, CheckBoxPreference.
Из кода плагина настройки доступны через функцию `ZenMoney.getPreferences()`

## Принцип работы
Плагин запускается в JavaScript песочнице и выполняется синхронно. Это означает, что в плагине недоступны объекты и функции DOM наподобие setTimeout, XMLHTTPRequest и т.п. Для сетевого взаимодействия нужно использовать функции ZenPlugin API.
JS-файлы плагина исполняются в порядке перечисления файлов в манифесте. После загрузки файлов в интерпретатор вызывается функция `main()`, которая обязана присутствовать в коде плагина.
Всё взаимодействие с API плагина идет через глобальный объект ZenMoney.

Пример простого плагина с постоянным набором операций но обновляемым балансом счета:
#### simple_plugin.js
```javascript
function main() {
    var auth = {
        login:    ZenMoney.getPreferences().login,
        password: ZenMoney.getPreferences().password
    };
    var account = JSON.parse(ZenMoney.requestPost(ACCOUNTS_URL, auth, {'Content-Type': 'application/json'}))[0];
    //account = {
    //  id: '1875739',
    //  type: 'card',
    //  name: 'Карта MasterCard',
    //  currency: 'RUB',
    //  balance: 150000,
    //  cardID: '****2590'
    //}
    ZenMoney.addAccount({
        id: account.id,
        type: 'ccard',
        title: account.name,
        instrument: account.currency,
        syncID: [account.cardID.replace(/[^\d]+/, '')],
        balance: account.balance
    });
  
    //Снятие 1000 рублей наличными
    ZenMoney.addTransaction({
        income: 1000,
        incomeAccount: 'cash#RUB',
        outcome: 1000,
        outcomeAccount: account.id,
        date: '2016-11-27'
    });
  
    //Снятие 5 долларов наличными по курсу 63 рубля + комиссия 10 руб.
    ZenMoney.addTransaction({
        income: 5,
        incomeAccount: 'cash#USD',
        outcome: 63 * 5 + 10,
        outcomeAccount: account.id,
        date: '2016-11-28',
        opOutcome: 5,
        opOutcomeInstrument: 'USD'
    });
  
    //Кофе в McDonalds
    ZenMoney.addTransaction({
        id: 'BE337E1A-3C1E-4867-89F4-6A9D89DD5073',
        income: 0,
        incomeAccount: account.id,
        outcome: 99,
        outcomeAccount: account.id,
        date: '2016-12-01',
        payee: 'McDonalds',
        mcc: 5814,
        latitude: 59.935214,
        longitude: 30.316683
    });
  
    ZenMoney.setResult({success: true});
}
```

## Описание ZenPlugin API
Для описания вида функций используется псевдоязык похожий на Swift. Знак ? после типа переменной означает ее опциональность и возможность быть опущенной или быть null.

#### ZenMoney.trace(msg: String, tag: String?)
Вывод в лог сообщение: `[tag] msg`

#### ZenMoney.getPreferences() -> {String: String}
Возвращает настройки плагина. Ключи те же, что и в файле настроек preferences.xml.

#### constructor ZenMoney.Error(message: String?, logIsNotImportant: Bool?, forcePluginReinstall: Bool?) -> ZenMoney.Error
Исключение, которое нужно использовать при необходимости такового.

logIsNotImportant: флаг, сигнализирующий о том, что лог работы плагина не важен.
>Если true, то в приложении, когда пользователю показывается ошибка, в алерте есть только одна кнопка "Ок".
>Если false, то есть две кнопки: "Отправить лог разарботчикам" и "Закрыть".

forcePluginReinstall: флаг, сигнализирующий о том, что плагин не может продолжить работу без переустановки с изменением настроек.

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

#### ZenMoney.retrieveCode(question: String, imageUrl: String?, options: {String: Any}?) -> String?
Просит пользователя ввести строковый ответ на вопрос question с показом картинки imageUrl.
`options.time: Int?` - время ввода в мс

`options.inputType: ('text' | 'textPassword' | 'number' | 'numberDecimal' | 'numberPassword' | 'phone' | 'textEmailAddress')?` - тип ввода. Совпадает по значениям с типом ввода EditTextPreference в настройках.

#### ZenMoney.setData(key: String, value: Any?)
#### ZenMoney.getData(key: String, defaultValue: Any?) -> Any?
#### ZenMoney.saveData()
#### ZenMoney.clearData()
Функции работы с хранилищем данных плагина. Позволяют сохранять данные между запусками плагина. Физически данные сохраняются или очищаются только после вызова `ZenMoney.saveData()`. Удалить значение по ключу можно при помощи вызова `ZenMoney.setData(key, null)`

#### ZenMoney.isAccountSkipped(id: String) -> Bool
Возвращает true, если данные по этому счёту не нужно обрабатывать. Это значит, что плагин может пропустить этот счёт и не добавлять его и операции по нему.

#### ZenMoney.addAccount(account: (Account | [Account])) throws
Добавляет счет.
 
```Swift
Account {
    id:      String
    title:   String
    syncID: [String]
    
    instrument: ('RUB' | 'руб.' | 'USD' | '$' | ...)
    type: ('ccard' | 'checking' | 'loan' | 'deposit')
	
    balance:      Double?
    startBalance: Double?
    creditLimit:  Double? >= 0
    
    savings: Bool?
	
    //Только для типов 'loan' || 'deposit'
    capitalization: Bool
    percent: Double >= 0 && < 100
    startDate: ('yyyy-MM-dd' | timestamp in s)
    endDateOffset: Int
    endDateOffsetInterval: ('day' | 'week' | 'month' | 'year')
    payoffStep: Int?
    payoffInterval: ('month' | 'year')?
}
```

`id` - уникальный в пределах плагина ID счета. На него ссылаются операции в полях `incomeAccount`, `outcomeAccount` . В случае отсутствия ID счета в источнике данных можно задать счету любой ID, главное, чтобы он отличался от ID других счетов, данные по которым импортирует плагин.

`syncID` - массив банковских номеров счета, по которым данный счет связывается со счетами в приложении ZenMoney. Обычно тут передаются последние 4 цифры номера счета и последние 4 цифры номера банковской карты.

`balance` - текущий баланс счета

`startBalance` - баланс счета в момент открытия. Если тип счета - кредит, то указывается тело кредита.

`creditLimit` - кредитный лимит в случае, если тип счета - банковская карта или банковский счет.

`savings` - является ли счёт накопительным

`type` - тип счета. `ccard` - банковская карта, `checking` - банковский счет, `loan` - кредит, `deposit` - депозит.
При добавлении последних двух нужно указать дополнительные параметры:

`capitalization` - для депозита - есть ли капитализация процентов. Для кредита - является ли кредит аннуитетным.

`percent` - процентная ставка по счету (в процентах)

`startDate` - дата открытия депозита / кредита

`endDateOffset` - срок действия кредита / депозита в промежутках `endDateOffsetInterval` начиная с даты открытия

`payoffInterval`  - промежуток между выплатами. Может быть null, тогда считается, что выплата процентов или погашение кредита происходит в конце срока.

`payoffStep` - раз в сколько `payoffInterval` происходят выплаты, начиная со следующей даты `startDate + payoffInterval`. Если `payoffInterval == null`, то значение должно быть равно 0.


#### ZenMoney.addTransaction(transaction: (Transaction | [Transaction])) throws
Добавляет операцию.
```Swift
Transaction {
    id:             String?
    incomeBankID:   String?
    incomeAccount:  String (-> Account.id | 'Account.type#Account.instrument' | 'cash#RUB' | 'deposit#$' | ...)
    income:         Double >= 0
    outcomeBankID:  String?
    outcomeAccount: String (-> Account.id | 'type#CUR' | ...)
    outcome:        Double >= 0
    
    mcc:   Int?
    payee: String?
	
    date: ('yyyy-MM-dd' | timestamp in s)?
	
    opIncome:            Double? >= 0
    opIncomeInstrument:  Account.instrument?
    opOutcome:           Double? >= 0
    opOutcomeInstrument: Account.instrument?

    latitude:  Double? >= -90  && <= 90
    longitude: Double? >= -180 && <= 180
}
```

`id` - уникальный в пределах плагина ID операции. Можно не указывать. 
Если есть префикс `tmp#`, то ID считается временным и допускается добавление нескольких операций с таким ID. В противном случае ID считается постоянным.

`incomeBankID` - ID операции в пределах счета `incomeAccount`.

`outcomeBankID` - ID операции в пределах счета `outcomeAccount`. Эти ID используются в случае перевода между счетами, когда ID операции разнятся на двух счетах.

`incomeAccount` - счет-получатель. Значение из ID сущности `Account` либо ссылка вида Account.type#Account.instrument

`outcomeAccount` - счет-источник. То же самое, что для `incomeAccount`

`income` - сумма операции в валюте счета `incomeAccount`

`outcome` - сумма операции в валюте счета `outcomeAccount`

`opIncomeInstrument`,
`opOutcomeInstrument` - непосредственная валюта операции. Допустим была операция снятие долларов с рублевого счета. Тогда в `outcome` будет сумма в рублях. А действительную сумму в долларах нужно записать в `opOutcome`. Данное поле следует использовать только когда валюта операции отличается от валюты счета.

`opIncome`,
`opOutcome` - сумма операции в непосредственной валюте операции

`payee` - место совершения операции. "МакДоналдс", "Пятерочка" и т.п.

`mcc` - [код места совершения операции](https://ru.wikipedia.org/wiki/Merchant_Category_Code)

#### ZenMoney.setResult({success: Bool, message: String?, account: [Account]?, transaction: [Transaction]?})
При вызове добавляет счета account и операции transaction и завершает работу плагина. Если `!success`, то это равносильно завершению работы с исключением `ZenMoney.Error(message)`.

# Инструменты разработчика
Для разработки и отладки плагина рекоммендуется использовать браузерный отладчик.
Для сборки плагина необходимой является установленная [свежая версия Node.js](https://nodejs.org) и [пакетного менеджера yarn](https://yarnpkg.com/).

### Настройка отладчика
Допустим, вы разрабатывате плагин, манифест которого находится в `~/repositories/ZenPlugins/src/my-bank`
Вам необходимо создать файл `zp_preferences.json` в папке с манифестом со значениями настроек, описанных вами в `preferences.xml`. Данные настройки будут доступны в рантайме в API: `ZenMoney.getPreferences()`

```javascript
{
    "login": "login",
    "password": "password",
    //...и другие настройки необходимые плагину. Здесь должны быть поля с теми же ключами, что и в preferences.xml вашего плагина
}
```

Также вам может понадобиться создать файл `zp_data.json` в папке с плагином. Содержимое этого файла опционально и доступно в API `ZenMoney.getData()`.

### Запуск отладчика
Для запуска сервера разработки необходимо указать путь до папки с манифестом плагина в переменную окружения `PLUGIN` и в корне репозитория выполнить команду `yarn start`.
Допустим, для вышеприведенного примера с плагином в `~/repositories/ZenPlugins/src/my-bank`, команда будет выглядеть следующим образом:

```bash
# для bash
yarn
PLUGIN=src/my-bank yarn start
# для windows
yarn
set PLUGIN=src/my-bank&&yarn start
или
set "PLUGIN=src/my-bank" && yarn start
```

При старте начинает работу вебсервер, занимающийся сборкой скриптов и проксированием запросов к сторонним (банковским) хостам.
После старта автоматически открывается в браузере страница с плагином. Не забудьте открыть инструменты разработчика!
В консоли разработчика вы можете просматривать логи плагина.

Известный нюанс, который ждёт вас при использовании функции `ZenMoney.retrieveCode`: отладчик ожидает пользовательский ввод в файле `zp_pipe.txt` в папке плагина до тех пор, пока файл пустой. Перед каждым запуском плагина рекомендуется убедиться, что `zp_pipe.txt` пустой, иначе будут подхватываться старые данные.

