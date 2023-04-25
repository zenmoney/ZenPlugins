# ZenMoney API
Описание API работы с данными Дзен-мани.


- [Авторизация](#auth)
- [Сущности](#entities)
    - [Instrument](#instrument)
    - [Company](#company)
    - [User](#user)
    - [Account](#account)
    - [Tag](#tag)
    - [Merchant](#merchant)
    - [Reminder](#reminder)
    - [ReminderMarker](#remindermarker)
    - [Transaction](#transaction)
    - [Budget](#budget)
- [Принцип работы](#principles)
    - [Diff](#diff)
        - [Diff object](#diff-object)
    - [Suggest](#suggest)

## Авторизация <a name="auth"></a>
Происходит через протокол [OAuth 2.0](https://habrahabr.ru/company/mailru/blog/115163/).

Зарегистрировать свой клиент можно, заполнив форму на [этой странице](https://docs.google.com/forms/d/e/1FAIpQLSf6ZL9wA3lo-vFLnjspBY47byqz4xGJtgDAC3Xe6yMDlOMdBg/viewform). После этого используем полученные consumer_key, consumer_secret и введенный OAuth callback point url в качестве соответственно client_id, client_secret и redirect_uri протокола OAuth 2.0 

Основные URL авторизации:

https://api.zenmoney.ru/oauth2/authorize/

https://api.zenmoney.ru/oauth2/token/

#### Пример:
```HTTP
GET /oauth2/authorize/?response_type=code&client_id=464119&redirect_uri=http%3A%2F%2Fexample.com%2Fcb%2F123 HTTP/1.1
Host: api.zenmoney.ru
```

После этого пользователь подтверждает выдачу прав клиенту, и происходит переадресация:

```HTTP
HTTP/1.1 302 Found
Location: http://example.com/cb/123?code=FD0485FC
```

Используем полученный code для получения access_token, выполняя запрос:

```HTTP
POST /oauth2/token/ HTTP/1.1
Host: api.zenmoney.ru
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&client_id=464119&client_secret=deadbeef&code=FD0485FC&redirect_uri=http%3A%2F%2Fexample.com%2Fcb%2F123


HTTP/1.1 200 OK
Content-Type: application/json

{
    "access_token":"RQJpVwPJie7wr9SEzYNi5nVWVdKRTP",
    "token_type":"bearer",
    "expires_in":86400,
    "refresh_token":"jHCAqb9A1WGIkuk34SJm2VTg6PZY5K"
}
```

## Сущности <a name="entities"></a>

| Пользовательские  | Системные     |
|:--------------:|:------------:|
| Account        |   Instrument |
| Tag            |      Company |
| Merchant       |         User |
| Reminder       |              |
| ReminderMarker |              |
| Transaction    |              |
| Budget         |              |

Пользовательские сущности можно создавать / изменять / удалять, системные же доступны только для чтения.

#### Instrument
```Swift
{
    id:         Int
    changed:    Int // Unix timestamp 
    title:      String
    shortTitle: String
    symbol:     String
    rate:       Double
}
```
`shortTitle` - это трехбуквенный код данной валюты.  
`symbol` - символ валюты.  
`rate` - стоимость единицы валюты в рублях.  

#### Company
```Swift
{
    id:        Int
    changed:   Int // Unix timestamp 
    title:     String
    fullTitle: String
    www:       String
    country:   String
}
```
Company - это банк либо другая платежная организация, в которой могут существовать счета.

#### User
```Swift
{
    id:       Int
    changed:  Int // Unix timestamp 
    login:    String?
    currency: Int  -> Instrument.id
    parent:   Int? -> User.id
}
```
`currency` - основная валюта пользователя. В ней система считает балансы и показывает пользователю отчеты.  
`parent` - родительский пользователь семейного учета. Он является администратором и может удалять дочерних пользователей. Для родительского пользователя `parent == null`.  

#### Account
```Swift
{
    id:         String // UUID
    changed:    Int    // Unix timestamp 
    user:       Int  -> User.id
    role:       Int? -> User.id?
    instrument: Int? -> Instrument.id
    company:    Int? -> Company.id
    type: ('cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt')
    title:   String
    syncID: [String]?
	
    balance:      Double?
    startBalance: Double?
    creditLimit:  Double? >= 0
	
    inBalance:        Bool
    savings:          Bool?
    enableCorrection: Bool
    enableSMS:        Bool
    archive:          Bool
	
    //Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
    capitalization: Bool
    percent: Double >= 0 && < 100
    startDate: 'yyyy-MM-dd'
    endDateOffset: Int
    endDateOffsetInterval: ('day' | 'week' | 'month' | 'year')
    payoffStep: Int?
    payoffInterval: ('month' | 'year')?
}
```
Account - счёт пользователя.

`balance` - текущий баланс счета.  
`startBalance` - баланс счета в момент открытия. Если тип счета - кредит, то указывается тело кредита.  
`creditLimit` - кредитный лимит в случае, если тип счета - банковская карта или банковский счет.  

`inBalance` - является ли счёт балансовым. Если является, то его баланс учитывается в общем балансе и в отчётах учитываются расходы и доходы по нему.  
`savings` - является ли счёт накопительным.  
`enableCorrection` - если true, то при распознавании SMS приложение Дзен-мани будет корректировать баланс счёта до его значения в SMS.  
`enableSMS` - включено ли распознавание SMS по счёту.  
`archive` - является ли счёт архивным.  

`syncID` - массив банковских номеров счета. Обычно берутся последние 4 цифры номера счета и последние 4 цифры номеров банковских карт, привязанных к счету.  
`type` - тип счета: `ccard` - банковская карта, `checking` - банковский счет, `loan` - кредит, `deposit` - депозит, `cash` - наличные, `debt` - долги. Счет с типом debt является системным и единственным с таким типом.  
При добавлении счетов типа `loan` или `deposit` нужно указать дополнительные параметры.  

`capitalization` - для депозита - есть ли капитализация процентов. Для кредита - является ли кредит аннуитетным.  
`percent` - процентная ставка по счету (в процентах).  
`startDate` - дата открытия депозита / кредита.  
`endDateOffset` - срок действия кредита / депозита в промежутках `endDateOffsetInterval` начиная с даты открытия.  
`payoffInterval`  - промежуток между выплатами. Может быть null, тогда считается, что выплата процентов или погашение кредита происходит в конце срока.  
`payoffStep` - раз в сколько `payoffInterval` происходят выплаты, начиная со следующей даты `startDate + payoffInterval`. Если `payoffInterval == null`, то значение должно быть равно 0.  

#### Tag
```Swift
{
    id:      String // UUID
    changed: Int    // Unix timestamp 
    user:    Int  -> User.id
	
    title:   String
    parent:  String? -> Tag.id
    icon:    String?
    picture: String?
    color:   Int?
	
    showIncome:    Bool
    showOutcome:   Bool
    budgetIncome:  Bool
    budgetOutcome: Bool	
    required:      Bool?
}
```
`parent` - родительская категория. Допускается степень вложенности не больше 1, т.е. у категории может быть родительская категория, а у родительской категории уже не может быть своего родителя.  
`showIncome` - является ли категория доходной.  
`showOutcome` - является ли категория расходной.  
`budgetIncome` - включена ли категория в расчёт дохода в бюджете.  
`budgetOutcome` - включена ли категория в расчёт расхода в бюджете.  
`required` - являются ли расходы по данной категории обязательными. Если null, то тоже считаются обязательными.  
`icon` - id иконки категории.  
`color` - цвет иконки категории в в виде числа. Рассчитывается по `alpha, red, green, blue 0 <= 255. unsigned long color = (a << 24) + (r << 16) + (g << 8) + (b << 0).`  
`picture` - ссылка на картинку для данной категории.  

#### Merchant
```Swift
{
    id:      String // UUID
    changed: Int    // Unix timestamp 
    user:    Int  -> User.id
    title:   String
}
```
Контрагент операции. В отличие от строкового payee в операциях, Merchant отображается в списке плательщиков и получателей в приложении и по ним приложение делает подсказки.

#### Reminder
```Swift
{
    id:      String // UUID
    changed: Int    // Unix timestamp
    user:    Int -> User.id
	
    incomeInstrument:  Int    -> Instrument.id
    incomeAccount:     String -> Account.id
    income:            Double >= 0
    outcomeInstrument: Int    -> Instrument.id
    outcomeAccount:    String -> Account.id
    outcome:           Double >= 0

    tag:      [String  -> Tag.id]?
    merchant:  String? -> Merchant.id
    payee:     String?
    comment:   String?

    interval: ('day' | 'week' | 'month' | 'year')?
    step:    Int? >= 0
    points: [Int  >= 0 && < step]?
    startDate: 'yyyy-MM-dd'
    endDate:   'yyyy-MM-dd'?
    notify: Bool
}
```
Объект описывающий принцип создания планируемых операций.  
`interval` - интервал шага. Если null, значит, планируемая без повторения.  
`step` - шаг с которым создаются планируемые операции.  
`points` - точки внутри шага, в которых создаются планируемые.  
`startDate` - с какой даты создавать планируемые.  
`endDate` - до какой даты включительно создавать планируемые. Если null, то бессрочно.  
`notify` - уведомлять ли о данных операциях.  

Пример:
```javascript
{
    //...
    interval: 'day',
    step: 7,
    points: [0, 2, 4],
    startDate: '2017-03-08',
    endDate: null
    //...
}
```
Reminder с такими параметрами означает, что нужно повторять операции каждую неделю, начиная с 2017-03-08 по средам, пятницам и воскресеньям. Потому что 2017-03-08 - среда, значит точка 0 - среда, точка 2 - пятница, точка 4 - воскресенье. Каждую неделю - потому как шаг 7 дней.

#### ReminderMarker
```Swift
{
    id:      String // UUID
    changed: Int    // Unix timestamp
    user:    Int -> User.id
	
    incomeInstrument:  Int    -> Instrument.id
    incomeAccount:     String -> Account.id
    income:            Double >= 0
    outcomeInstrument: Int    -> Instrument.id
    outcomeAccount:    String -> Account.id
    outcome:           Double >= 0

    tag:      [String  -> Tag.id]?
    merchant:  String? -> Merchant.id
    payee:     String?
    comment:   String?
	
    date: 'yyyy-MM-dd'

    reminder: String -> Reminder.id
    state: ('planned' | 'processed' | 'deleted')
	
    notify: Bool
}
```
Планируемая операция. Поля те же, что и в Reminder, только есть еще дата операции и ее состояние.  
`state` - состояние операции: `planned` - планируемая, `processed` - обработанная (внесенная, по ней была создана обычная операция Transaction),  `deleted` - удаленная.

#### Transaction
```Swift
{
    id:      String // UUID
    changed: Int    // Unix timestamp
    created: Int    // Unix timestamp
    user:    Int -> User.id
    deleted: Bool
    hold:    Bool?
	
    incomeInstrument:  Int    -> Instrument.id
    incomeAccount:     String -> Account.id
    income:            Double >= 0
    outcomeInstrument: Int    -> Instrument.id
    outcomeAccount:    String -> Account.id
    outcome:           Double >= 0

    tag:      [String  -> Tag.id]?
    merchant:  String? -> Merchant.id
    payee:         String?
    originalPayee: String?
    comment:       String?
	
    date: 'yyyy-MM-dd'
	
    mcc: Int?
	
    reminderMarker: String? -> ReminderMarker.id
	
    opIncome:            Double? >= 0
    opIncomeInstrument:  Int? -> Instrument.id
    opOutcome:           Double? >= 0
    opOutcomeInstrument: Int? -> Instrument.id

    latitude:  Double? >= -90  && <= 90
    longitude: Double? >= -180 && <= 180
}
```
Денежная операция.

`outcome` - снято со счета `outcomeAccount`.  
`income` - зачислено на счёт `incomeAccount`.  
`incomeInstrument` - то же самое, что и `incomeAccount.instrument` и  
`outcomeInstrument` - то же самое, что и `outcomeAccount.instrument` за исключением случая, когда этот счёт - долговой. В случае долговой операции сумма операции всегда пишется в валюте недолгового счёта, а в поле instrument стоит значение instrument недолгового счёта. Валюта же долгового счёта всегда равна `user.currency` - основной валюте пользователя.

`opIncomeInstrument` и  
`opOutcomeInstrument` - непосредственная валюта операции. Допустим была операция снятия долларов с рублевого счёта. Тогда в `outcome` будет сумма в рублях. А действительную сумму в долларах нужно записать в `opOutcome`. Данное поле следует использовать только, когда валюта операции отличается от валюты счета.  
`opIncome` и  
`opOutcome` - сумма операции в непосредственной валюте операции.  

Примеры:
- расход 500 рублей (instrument 2)
```javascript
{
    //...
    incomeInstrument: 2,
    incomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    income: 0,
    outcomeInstrument: 2,
    outcomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    outcome: 500
    //...
}
```
'574DA4BC-9598-4124-8749-E9DF7B240AE7' - рублевый счёт

- расход 10 $ с рублевого счёта по курсу 50 рублей за доллар
```javascript
{
    //...
    incomeInstrument: 2,
    incomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    income: 0,
    outcomeInstrument: 2,
    outcomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    outcome: 500,
    opOutcome: 10,
    opOutcomeInstrument: 1
    //...
}
```
'574DA4BC-9598-4124-8749-E9DF7B240AE7' - рублевый счёт

- доход 10 $ (instrument 1)
```javascript
{
    //...
    incomeInstrument: 1,
    incomeAccount: 'B8D2C203-60E7-4AFE-839E-4CFCEC3AFF3B',
    income: 10,
    outcomeInstrument: 1,
    outcomeAccount: 'B8D2C203-60E7-4AFE-839E-4CFCEC3AFF3B',
    outcome: 0
    //...
}
```
'B8D2C203-60E7-4AFE-839E-4CFCEC3AFF3B' - долларовый счёт

- перевод 500 рублей на долларовый счет по курсу 50 рублей за доллар
```javascript
{
    //...
    incomeInstrument: 1,
    incomeAccount: 'B8D2C203-60E7-4AFE-839E-4CFCEC3AFF3B',
    income: 10,
    outcomeInstrument: 2,
    outcomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    outcome: 500
    //...
}
```

- дал в долг Маше 500 рублей
```javascript
{
    //...
    incomeInstrument: 2,
    incomeAccount: 'E40F1B61-F1FC-4197-81BA-2C23DF5E71AA',
    income: 500,
    outcomeInstrument: 2,
    outcomeAccount: '574DA4BC-9598-4124-8749-E9DF7B240AE7',
    outcome: 500,
    payee: 'Маша',
    merchant: 'D8733A65-F61D-4E5D-A39D-5AB1C6983F2A'
    //...
}
```
'574DA4BC-9598-4124-8749-E9DF7B240AE7' - рублёвый счёт.
'E40F1B61-F1FC-4197-81BA-2C23DF5E71AA' - долговой счёт.  Обратите внимание, что его валюта может быть вовсе не рубли.

'D8733A65-F61D-4E5D-A39D-5AB1C6983F2A' - это мерчант Маша. Его можно и не создавать, но тогда Машу не будет видно в списке получателей в приложении.

- взял в долг у Маши 30 $
```javascript
{
    //...
    incomeInstrument: 1,
    incomeAccount: 'B8D2C203-60E7-4AFE-839E-4CFCEC3AFF3B',
    income: 30,
    outcomeInstrument: 1,
    outcomeAccount: 'E40F1B61-F1FC-4197-81BA-2C23DF5E71AA',
    outcome: 30,
    payee: 'Маша',
    merchant: 'D8733A65-F61D-4E5D-A39D-5AB1C6983F2A'
    //...
}
```
'E40F1B61-F1FC-4197-81BA-2C23DF5E71AA' - долговой счёт. Обратите внимание, что его валютой совсем не обязательно являются доллары.

`deleted` - является ли операция удаленной.  
`reminderMarker` - планируемая операция из которой была создана данная операция.  

#### Budget
```
{
    changed: Int    // Unix timestamp 
    user:    Int  -> User.id
	
    tag:  String? -> Tag.id | '00000000-0000-0000-0000-000000000000'
    date: 'yyyy-MM-dd'
	
    income:      Double
    incomeLock:  Bool
    outcome:     Double
    outcomeLock: Bool
}
```
`date` - дата начала месяца.  
`tag` - категория бюджета. Если null, то это бюджет по операциям без категории. Если '00000000-0000-0000-0000-000000000000', то это бюджет совокупный за месяц.  
`incomeLock` - если true, то сумма `income` задает точный доходный бюджет по данной категории. Если false, то в качестве бюджета по данной категории берется сумма `income` и всех доходов по планируемым операциям в этом месяце по данной категории.  
`income` - доходный бюджет.  
`outcomeLock` - то же самое, что для `incomeLock`.  
`outcome` - расходный бюджет.  
Удалить бюджет за данный месяц можно, если убрать lock и поставить 0 в соответствующую сумму.  

## Принцип работы <a name="principles"></a>

Основные URL:

https://api.zenmoney.ru/v8/diff/			- Diff

https://api.zenmoney.ru/v8/suggest/  - Suggest

Основная работа с API идёт через Diff.

### Diff
Скрипт синхронизации. Принимает на вход изменения на клиенте с момента последней синхронизации и отдает изменения на сервере за этот же промежуток времени. Формат обмена - Diff object.
```Swift
func diff = /v8/diff/
diff(diff: DiffObject) -> DiffObject
```

#### Diff object
```Swift
{
    currentClientTimestamp: Int //Unix timestamp
    serverTimestamp:        Int //Unix timestamp
	
    forceFetch: [String -> Object.class]?
	
    instrument:     [Instrument]?
    company:        [Company]?
    user:           [User]?
    account:        [Account]?
    tag:            [Tag]?
    merchant:       [Merchant]?
    budget:         [Budget]?
    reminder:       [Reminder]?
    reminderMarker: [ReminderMarker]?
    transaction:    [Transaction]?
	
    deletion: [
        {
            id:     String -> Object.id
            object: String -> Object.class
            stamp:  Int
            user:   Int
        }
    ]?
}
```

`currentClientTimestamp` - текущее время на клиенте. Используется сервером для коррекции времени. Не передается от сервера клиенту.

`serverTimestamp` - метка последней синхронизации. В случае первой синхронизации клиент должен передать 0. При получении ответа от сервера клиент сохраняет `serverTimestamp` из его ответа для передачи на сервер при следующем запросе.

`forceFetch` - какие сущности сервер должен выдать полностью, как будто это первая синхронизация.

Далее идут объекты системные и пользовательские, которые изменились со времени последней синхронизации. 
При обработке запроса клиента сервер сверяет changed в объекте с changed серверной версии объекта, и если на сервере объект более новый, то он не меняется. В ответ сервер симметрично запросу клиента выдает свои изменения с времени последней синхронизации.

`deletion` - информация по удаленному объекту. Некоторые объекты, например Transaction, ReminderMarker, Budget могут быть помечены удаленными полем внутри себя, но все пользовательские объекты, у которых есть id, могут быть удалены окончательно через deletion. При получении объекта deletion получившая сторона обязана удалить у себя этот объект.

Примеры: 

- Первая синхронизация
Клиент отправляет запрос:
```javascript
{
    currentClientTimestamp: (new Date()).getTime() / 1000,
    serverTimestamp: 0
}    
```

Ответ сервера (всего лишь пример):
```javascript
{
    serverTimestamp: 1490016362,
    instrument: [
        {
            id: 1,
            changed: 1490000000,
            title: 'Доллар США',
            shortTitle: 'USD',
            symbol: '$',
            rate: 57.55
        },
        {
            id: 2,
            title: 'Российский рубль',
            shortTitle: 'RUB',
            changed: 1490000000,
            symbol: 'руб.',
            rate: 1
        }
    ],
    company: [
        {
            id: 4624,
            title: 'Сбербанк России',
            fullTitle: null,
            www: 'sbrf.ru',
            country: 'RU'
        }
    ],
    user: [
        {
            id: 1,
            changed: 1490000000,
            login: 'my_user',
            currency: 1,
            parent: null
        }
    ],
    account: [
        {
            id: 'A85F1093-3886-4C99-823E-04E7202E5771',
            changed: 1490000000,
            user: 1,
            role: null,
            instrument: 1,
            company: null,
            type: 'debt',
            title: 'Долги',
            syncID: null,
            balance: 34.75,
            startBalance: 0,
            creditLimit: null,
            inBalance: false,
            savings: false,
            enableCorrection: false,
            enableSMS: false,
            archive: false,
            capitalization: null,
            percent: null,
            startDate: null,
            endDateOffset: null,
            endDateOffsetInterval: null,
            payoffStep: null,
            payoffInterval: null
        },
        {
            id: 'C52B6A9C-5BF1-435B-9568-DAA91CE8BAF8',
            changed: 1490000000,
            user: 1,
            role: null,
            instrument: 1,
            company: null,
            type: 'cash',
            title: 'Доллары',
            syncID: null,
            balance: 322.5,
            startBalance: 22.5,
            creditLimit: null,
            inBalance: true,
            savings: false,
            enableCorrection: false,
            enableSMS: false,
            archive: false,
            capitalization: null,
            percent: null,
            startDate: null,
            endDateOffset: null,
            endDateOffsetInterval: null,
            payoffStep: null,
            payoffInterval: null
        },
        {
            id: '1E60FC58-D639-47E3-8D7A-809586862F06',
            changed: 1490000000,
            user: 1,
            role: null,
            instrument: 2,
            company: null,
            type: 'cash',
            title: 'Рубли',
            syncID: null,
            balance: 4400,
            startBalance: 4400,
            creditLimit: null,
            inBalance: true,
            savings: false,
            enableCorrection: false,
            enableSMS: false,
            archive: false,
            capitalization: null,
            percent: null,
            startDate: null,
            endDateOffset: null,
            endDateOffsetInterval: null,
            payoffStep: null,
            payoffInterval: null
        },
        {
            id: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
            changed: 1490000000,
            user: 1,
            role: null,
            instrument: 2,
            company: 4624,
            type: 'ccard',
            title: 'Кредитка Сбера',
            syncID: ['1240'],
            balance: -2500,
            startBalance: 4000,
            creditLimit: 150000,
            inBalance: true,
            savings: false,
            enableCorrection: true,
            enableSMS: true,
            archive: false,
            capitalization: null,
            percent: null,
            startDate: null,
            endDateOffset: null,
            endDateOffsetInterval: null,
            payoffStep: null,
            payoffInterval: null
        }
    ],
    tag: [
        {
            id: '5114B761-4FC4-4107-A0F2-C4DF0ED9CB07',
            changed: 1490000000,
            title: 'Квартира (дом)',
            showIncome: false,
            showOutcome: true,
            budgetIncome: false,
            budgetOutcome: true
        },
        {
            id: '7B8A79A6-FA48-4DE8-A820-3CCC4DDB0EB6',
            changed: 1490000000,
            title: 'Зарплата',
            showIncome: true,
            showOutcome: false,
            budgetIncome: true,
            budgetOutcome: false
        }
    ],
    merchant: [
        {
            id: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
            changed: 1490000000,
            user: 1,
            title: 'Паша'
        }
    ],
    reminder: [
        {
            id: 'EB80C872-D9E1-48E7-B021-1C2B23BBE88F',
            changed: 1490010362,
            user: 1,
            incomeInstrument: 2,
            incomeAccount: 'A85F1093-3886-4C99-823E-04E7202E5771',
            income: 2000,
            outcomeInstrument: 2,
            outcomeAccount: '1E60FC58-D639-47E3-8D7A-809586862F06',
            outcome: 2000,
            tag: null,
            merchant: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
            payee: 'Паша',
            comment: 'Возврат долга',
            interval: null,
            step: null,
            points: null,
            startDate: '2017-03-22'
            endDate: null,
            notify: true
        }
    ],
    reminderMarker: [
        {
            id: '26AEDA53-D532-42FA-A099-EEC78741DE58',
            changed: 1490010362,
            user: 1,
            incomeInstrument: 2,
            incomeAccount: 'A85F1093-3886-4C99-823E-04E7202E5771',
            income: 2000,
            outcomeInstrument: 2,
            outcomeAccount: '1E60FC58-D639-47E3-8D7A-809586862F06',
            outcome: 2000,
            tag: null,
            merchant: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
            payee: 'Паша',
            comment: 'Возврат долга',
            date: '2017-03-22',
            reminder: 'EB80C872-D9E1-48E7-B021-1C2B23BBE88F',
            state: 'planned',
            notify: true
        }
    ],
    transaction: [
        {
            id: 'EB80C872-D9E1-48E7-B021-1C2B23BBE88F',
            changed: 1490010362,
            created: 1490010222,
            user: 1,
            deleted: false,
            incomeInstrument: 1,
            incomeAccount: 'C52B6A9C-5BF1-435B-9568-DAA91CE8BAF8',
            income: 300,
            outcomeInstrument: 1,
            outcomeAccount: 'C52B6A9C-5BF1-435B-9568-DAA91CE8BAF8',
            outcome: 0,
            tag: ['7B8A79A6-FA48-4DE8-A820-3CCC4DDB0EB6'],
            merchant: null,
            payee: null,
            originalPayee: null,
            comment: 'Аванс',
            date: '2017-03-20',
            mcc: null,
            reminderMarker: null,
            opIncome: null,
            opIncomeInstrument: null,
            opOutcome: null,
            opOutcomeInstrument: null,
            latitude: null,
            longitude: null
        },
        {
            id: '8ECFEAB7-17F2-40F5-8B9B-279D2A136732',
            changed: 1488000309,
            created: 1488000309,
            user: 1,
            deleted: false,
            incomeInstrument: 2,
            incomeAccount: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
            income: 0,
            outcomeInstrument: 2,
            outcomeAccount: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
            outcome: 8500,
            tag: ['5114B761-4FC4-4107-A0F2-C4DF0ED9CB07'],
            merchant: null,
            payee: 'OOO Techdom',
            originalPayee: null,
            comment: 'За воду + смена счетчиков',
            date: '2017-03-08',
            mcc: null,
            reminderMarker: null,
            opIncome: null,
            opIncomeInstrument: null,
            opOutcome: null,
            opOutcomeInstrument: null,
            latitude: null,
            longitude: null
        },
        {
            id: '8ECFEAB7-17F2-40F5-8B9B-279D2A136732',
            changed: 1488000309,
            created: 1488000309,
            user: 1,
            deleted: false,
            incomeInstrument: 2,
            incomeAccount: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
            income: 0,
            outcomeInstrument: 2,
            outcomeAccount: 'A85F1093-3886-4C99-823E-04E7202E5771',
            outcome: 2000,
            tag: null,
            merchant: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
            payee: 'Паша',
            originalPayee: null,
            comment: 'Паша дал в долг до среды',
            date: '2017-03-20',
            mcc: null,
            reminderMarker: null,
            opIncome: null,
            opIncomeInstrument: null,
            opOutcome: null,
            opOutcomeInstrument: null,
            latitude: null,
            longitude: null
        }
    ]
}   
```

- Допустим клиент полностью удалил у себя операцию с id '7DE41EB0-3C61-4DB2-BAE8-BDB2A6A46604'. Тогда он в Diff передает следующий объект deleteion:
```javascript
{
    //...
    deletion: [
        {
            id: '7DE41EB0-3C61-4DB2-BAE8-BDB2A6A46604',
            object: 'transaction',
            user: 123456,
            stamp: 1490008039
        }
    ]
    //...
}
```

### Suggest
Скрипт для подсказки категории и получателя для операции.

```Swift
func suggest = /v8/suggest/
suggest(transaction: Transaction)   -> Transaction
suggest(transaction: [Transaction]) -> [Transaction]
```

Можно при вызове передавать только часть полей операции, к примеру только `payee`. Тогда на выходе будет урезанный объект операции. Гарантированно возвращаются только переданные поля.

Пример:

```HTTP
POST /v8/suggest/ HTTP/1.1
Content-Type: application/json
Authorization: Bearer AbF949beF4DC46b1

{
    "payee": "McDonalds"
}


HTTP/1.1 200 OK
Content-Type: application/json

{
    "payee": "МакДональдс",
    "merchant": "7BF5E890-2E2B-42FD-842A-B70B56620755",
    "tag": ["1B11D636-5250-4DDA-8157-3810A0319EC2"]
}

```
