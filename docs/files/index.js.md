# index.js

[Пример файла](../../src/plugins/example/index.js)

Модуль обязан экспортировать функцию, реализующую импорт данных о счетах и
транзакциях из банка.

```typescript
interface ScrapeFunc {
    (args: {
        fromDate: Date,
        toDate: Date | null,
        preferences: { string: any },
        isFirstRun: boolean,
        isInBackground: boolean
    }): Promise<{
        accounts: Array<Account>,
        transactions: Array<Transaction>
    }>;
}
```


## Входные именованные аргументы:

**fromDate** и **toDate** - объекты типа
[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date),
определяющие интересующий ZenMoney диапазон дат для синхронизации транзакций.
Каждое из значений может быть `null`, что означает открытость интересующего
диапазона.

Например:

```
{ fromDate: 2018-01-01T12:00:00.000Z, toDate: null }
```

означает, что ZenMoney интересуют транзакции с полудня (по UTC) 1 января 2018
до настоящего момента. scrape обязан вернуть операции строго за эти даты. Не нужно думать о том, что где-то во вне при метчинге операций могут быть дубли из-за того, что плагин возвращает в разные синхронизации одни и те же данные. Задача плагина - обеспечить однозначность и правильность данных в заданных временных пределах.

**preferences** - настройки плагина, которые были заполнены пользователем в соответствии с [preferences.xml](./files/preferences.xml.md)
```js
// При условии наличия в preferences.xml:
// <EditTextPreference key="login" ... />
// <EditTextPreference key="password" ... />
// Получаем так:
const { login, password } = preferences
```

**isFirstRun** - является ли запуск первым.

**isInBackground** - запущен ли плагин в фоне и взаимодействие с пользователем невозможно. В случае фонового запуска нет смысла запрашивать код из смс от пользователя, потому что он все равно не сможет ничего ввести. Стало быть лучше его и не спамить смсками при возможности.

## Возвращаемые именованые значения:

**accounts** - массив объектов, соответствующих описанию
[Account](../schema/Account.md).

**transactions** - массив объектов, соответствующих описанию
[Transaction](../schema/Transaction.md).
