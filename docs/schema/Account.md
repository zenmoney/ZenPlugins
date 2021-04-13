```Swift
Account {
    id:      String
    title:   String
    syncID: [String]

    instrument: ('RUB' | 'руб.' | 'USD' | '$' | ...)
    type: ('card' | 'checking' | 'loan' | 'deposit')

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

-   **id** - уникальный в пределах плагина ID счета. На него ссылаются операции
    в полях `incomeAccount`, `outcomeAccount`. В случае отсутствия ID счета в
    источнике данных можно задать счету любой ID, главное, чтобы он отличался
    от ID других счетов, данные по которым импортирует плагин.

-   **syncID** - массив банковских номеров счета, по которым данный счет
    связывается со счетами в приложении ZenMoney. Обычно тут передаются
    последние 4 цифры номера счета и последние 4 цифры номера банковской карты.

-   **balance** - текущий баланс счета

-   **startBalance** - баланс счета в момент открытия. Если тип счета - кредит,
    то указывается тело кредита.

-   **creditLimit** - кредитный лимит в случае, если тип счета - банковская
    карта или банковский счет.

-   **savings** - является ли счёт накопительным

-   **type** - тип счета. `ccard` - банковская карта, `checking` - банковский
    счет, `loan` - кредит, `deposit` - депозит. При добавлении последних двух
    нужно указать дополнительные параметры:

    -   **capitalization** - для депозита - есть ли капитализация процентов.
        Для кредита - является ли кредит аннуитетным.

    -   **percent** - процентная ставка по счету (в процентах).

    -   **startDate** - дата открытия депозита / кредита.

    -   **endDateOffset** - срок действия кредита / депозита в промежутках
        `endDateOffsetInterval` начиная с даты открытия.

    -   **payoffInterval** - промежуток между выплатами. Может быть null, тогда
        считается, что выплата процентов или погашение кредита происходит в
        конце срока.

    -   **payoffStep** - раз в сколько `payoffInterval` происходят выплаты,
        начиная со следующей даты `startDate + payoffInterval`. Если
        `payoffInterval == null`, то значение должно быть равно 0.
