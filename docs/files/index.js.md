# index.js

[Пример файла](../../src/plugins/example/index.js)

Модуль обязан экспортировать функцию, реализующую импорт данных о счетах и транзакциях из банка.

```
export async function scrape({fromDate, toDate}) {
    /*...*/
    return {
        accounts: [/*...*/],
        transactions: [/*...*/],
    };
}
```

## Входные именованные аргументы:

**fromDate** и **toDate** - объекты типа [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date), определяющие интересующий Zenmoney диапазон дат для синхронизации транзакций. Каждое из значений может быть `null`, что означает открытость интересующего диапазона.

Например:

```
{ fromDate: 2018-01-01T12:00:00.000Z, toDate: null }
```

означает, что Zenmoney интересуют транзакции с полудня (по UTC) 1 января 2018 до настоящего момента.

## Возвращаемые именованые значения:

**accounts** - массив объектов, соответствующих описанию [Account](../schema/Account.md).

**transactions** - массив объектов, соответствующих описанию [Transaction](../schema/Transaction.md).
