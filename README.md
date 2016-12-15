# ZenPlugins
Плагин обычно представляет из себя директорию со следующими файлами:
- ZenmoneyManifest.xml
- preferences.xml
- *.js файлы с кодом

## ZenmoneyManifest.xml
Любой плагин должен содержать файл манифеста. Типичный вид файла:
```xml
<?xml version="1.0" encoding="utf-8"?>
<provider>
	<id>sberbank-online</id>
	<version>1.1</version>
	<build>36</build>
	<company>4624</company>
	<files>
	    <js>md5.js</js>
	    <js>library.js</js>
		<js>main.js</js>
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
		title="Логин"
		positiveButtonText="ОК"
		summary="|ID пользователя или логин|{@s}"
		dialogTitle="Логин"
		negativeButtonText="Отмена"
		dialogMessage="Введите идентификатор пользователя или логин для входа в систему Сбербанк Онлайн."
		obligatory="true"
		key="login">
	</EditTextPreference>
	<EditTextPreference
		positiveButtonText="ОК"
		key="password"
		dialogTitle="Пароль"
		negativeButtonText="Отмена"
		title="Пароль"
		summary="||***********"
		obligatory="true"
		dialogMessage="Введите пароль, используемый для входа в систему Сбербанк Онлайн."
		inputType="textPassword">
	</EditTextPreference>
	<ListPreference
		positiveButtonText="ОК"
		key="period"
		dialogTitle="Период загрузки"
		negativeButtonText="Отмена"
		title="Начальный период загрузки данных"
		entries="Квартал|Месяц|Неделя"
		entryValues="92|31|7"
        defaultValue="31"	
      	summary="|31|{@s}"
		dialogMessage="Укажите начальный период, за который нужно загрузить данные.">
	</ListPreference>
</PreferenceScreen>
```
Поддерживается EditTextPreference и ListPreference.
Из кода плагина настройки доступны через функцию `ZenMoney.getPreferences()`

##Принцип работы
Плагин запускается в Java Script песочнице и выполняется синхронно. Это означает, что в плагине недоступны объекты и функции DOM наподобие setTimeout, XMLHTTPRequest и т.п. Для сетевого взаимодействия нужно использовать функции ZenPlugin API.
JS-файлы плагина исполняются в порядке перечисления файлов в манифесте. После загрузки файлов в интерпретатор вызывается функция `main()`, которая обязана присутствовать в коде плагина.
Всё взаимодействие с API плагина идет через глобальный объект ZenMoney.

Пример простого плагина с постоянным набором операций но обновляемым балансом счета:
####simple_plugin.js
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
  //  currency: 'RUB',
  //  balance: 150000,
  //  cardID: '****2590'
  //}
  ZenMoney.addAccount({
    id: account.id,
    type: 'ccard',
    instrument: account.currency,
    syncID: [account.cardID.replace(/[^\d]+/, '')]
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

##Описание ZenPlugin API
Для описания вида функций используется псевдоязык похожий на Swift. Знак ? после типа переменной означает ее опциональность и возможность быть опущенной или быть null.

####ZenMoney.trace(msg: String, tag: String?)
Вывод в лог сообщение: `[tag] msg`

####ZenMoney.getPreferences() -> {String: String}
Возвращает настройки плагина. Ключи те же, что и в файле настроек preferences.xml.

####constructor ZenMoney.Error(message: String?, allowRetry: Bool?, fatal: Bool?) -> ZenMoney.Error
Исключение, которое нужно использовать при необходимости такового. Так же некоторые функции ZenPlugin API могут бросать исключения. В случае если плагин не может продолжить работу без изменения настроек, нужно бросать фатальное исключение с fatal = true.

####ZenMoney.setDefaultCharset(charset: String) 
Задает кодировку по умолчанию, которая используется при сетевом взаимодействии.

####ZenMoney.requestGet(url: String, headers: {String: String}?) -> String? throws
####ZenMoney.requestPost(url: String, data: Any?, headers: {String: String}?) -> String? throws
####ZenMoney.request(method: String, url: String, data: Any?, headers: {String: String}?) -> String? throws

Выполняют HTTP-запрос и возвращают тело ответа в виде строки. Если в заголовках ответа нет указания кодировки, то используется кодировка по умолчанию. При запросе так же, если среди заголовков нет 'Content-Type' с указанием типа данных и кодировки, то используется кодировка по умолчанию.
При ошибках в выполнении запроса бросают исключение ZenMoney.Error

####ZenMoney.getLastUrl() -> Int?
Для последнего успешного HTTP-запроса возвращает его URL после всех переадресаций 
####ZenMoney.getLastStatusCode() -> Int?
Возвращает статус код последнего HTTP-ответа
####ZenMoney.getLastResponseHeaders() -> [['header1', 'value1'], ['header2', 'value2'], ...]?
Возвращает массив заголовков последнего HTTP-ответа
####ZenMoney.getLastResponseHeader(header: String) -> String?
Возвращает значение отдельного заголовка последнего HTTP-ответа

####ZenMoney.retrieveCode(question: String, imageUrl: String?, options: {String: Any}?) -> String?
Просит пользователя ввести строковый ответ на вопрос question с показом картинки imageUrl.
`options.time: Int?` - время ввода в мс

`options.inputType: ('text' | 'textPassword' | 'number' | 'numberDecimal' | 'numberPassword' | 'phone' | 'textEmailAddress')?` - тип ввода. Совпадает по значениям с типом ввода EditTextPreference в настройках.

####ZenMoney.setData(key: String, value: Any?)
####ZenMoney.getData(key: String, defaultValue: Any?) -> Any?
####ZenMoney.saveData()
####ZenMoney.clearData()
Функции работы с хранилищем данных плагина. Позволяют сохранять данные между запусками плагина. Физически данные сохраняются или очищаются только после вызова `ZenMoney.saveData()`. Удалить значение по ключу можно при помощи вызова `ZenMoney.setData(key, null)`

####ZenMoney.isAccountSkipped(id: String) -> Bool
Возвращает true, если данные по этому счёту не нужно обрабатывать. Это значит, что плагин может пропустить этот счёт и не добавлять его и операции по нему.

####ZenMoney.addAccount(account: (Account | [Account])) throws
Добавляет счет.
 
```
Account {
	id: String
	title: String
	syncID: [String],
	instrument: ('RUB' | 'руб.' | 'USD' | '$' | ...)
	type: ('ccard' | 'checking' | 'loan' | 'deposit')
	
	balance: Double?
	startBalance: Double?
	creditLimit: Double? //лимит для кредитных карт
	savings: Bool? //является ли счет накопительным
	
	//Только для типов 'loan' || 'deposit'
	capitalization: Bool
	startDate: ('yyyy-MM-dd' | timestamp in s)
	endDateOffset: Int
	endDateOffsetInterval: ('day' | 'week' | 'month' | 'year')
	payoffStep: Int?
	payoffInterval: ('month' | 'year')?
 }
```

####ZenMoney.addTransaction(transaction: (Transaction | [Transaction])) throws
Добавляет операцию.
```
Transaction {
	id: String? //допускаются временные id вида '[tmp]-...'
	incomeBankID:   String? //то же, что для id
	incomeAccount:  String (-> Account.id | 'Account.type#Account.instrument' | 'cash#RUB' | 'deposit#$' | ...)
	income:         Double >= 0
	outcomeBankID:  String? //то же, что для id
	outcomeAccount: String (-> Account.id | 'type#CUR' | ...)
	outcome:        Double >= 0
	date: ('yyyy-MM-dd' | timestamp in s)?
	
	opIncome:            Double? >= 0
	opIncomeInstrument:  Account.instrument?
	opOutcome:           Double? >= 0
	opOutcomeInstrument: Account.instrument?

	mcc: Int?
	payee: String?
	
	latitude:  Double?  // -90  <= latitude  <= 90
	longitude: Double?  // -180 <= longitude <= 180
}
```

####ZenMoney.setResult({success: Bool, message: String?, account: [Account]?, transaction: [Transaction]?})
При вызове добавляет счета account и операции transaction и завершает работу плагина. Если `!success`, то это равносильно завершению работы с исключением `ZenMoney.Error(message)`.
