```typescript
declare type Account = AccountOrCard | DepositOrLoan;

interface AccountOrCard {
    id: string;
    type: AccountType.ccard | AccountType.checking;
    title: string;
    instrument: string;
    syncIds: Array<String> | null;
    balance: number | null;
    available: number | null;
    creditLimit: number | null;
    totalAmountDue: number | null;
    gracePeriodEndDate: Date | null;
}

interface DepositOrLoan {
    id: string;
    type: AccountType.deposit | AccountType.loan;
    title: string;
    instrument: string;
    syncIds: Array<String> | null;
    balance: number | null;
    startDate: Date;
    startBalance: number;
    capitalization: boolean;
    percent: number;
    endDateOffsetInterval: 'month' | 'year' | 'day';
    endDateOffset: number;
    payoffInterval: 'month' | null;
    payoffStep: number;
}

declare enum AccountType {
    cash = "cash",
    ccard = "ccard",
    checking = "checking",
    deposit = "deposit",
    loan = "loan"
}
```

-   **id** - уникальный в пределах плагина ID счета. На него ссылаются операции
    в случае AccountReferenceById. Если ID счета в
    источнике данных нет, то можно задать счету любой ID, главное, чтобы он отличался
    от ID других счетов, данные по которым загружает плагин.

-   **syncIds** - массив банковских номеров счета, по которым данный счет
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
