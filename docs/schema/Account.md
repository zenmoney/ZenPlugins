```typescript
declare type Account = AccountOrCard | DepositOrLoan;

interface AccountOrCard {
    id: string;
    type: AccountType.ccard | AccountType.checking;
    title: string;
    instrument: string;
    syncIds: Array<String> | null;
    savings: boolean,
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

- **id** - уникальный в пределах плагина ID счёта. На него ссылаются операции в случае AccountReferenceById. Если ID счёта в источнике данных нет, то можно
  задать счёту любой ID, главное, чтобы он отличался от ID других счетов, данные по которым загружает плагин.

- **type** - тип счёта

- **title** - название счёта

- **instrument** - код или символ валюты счёта. К примеру 'USD' или '$'.

- **syncIds** - массив неизменных во времени номеров счёта, по которым данный счёт связывается со счетами в приложении ZenMoney. Обычно тут передаётся номер
  счёта и номер банковских карт, привязанных к счёту.

- **balance** - текущий баланс счёта или null, если он неизвестен.

## Поля для счетов с типом ccard и checking

- **savings** - является ли счёт накопительным. Переводы на такие счета будут считаться сбережениями.

- **creditLimit** - кредитный лимит на счёте. Заполняется как правило в случае кредитных карт. Может быть null, если неизвестен.

- **available** - доступные деньги на счету. Связаны с балансом по формуле `available = balance + creditLimit`. Полезны, когда неизвестен кредитный лимит и
  баланс. В случае если в счёте указан и `balance` и `available` то `available` не учитывается.

- **totalAmountDue** - задолженность за расчётный период

- **gracePeriodEndDate** - срок окончания льготного периода, в который надо погасить задолженность за отчётный период, чтобы избежать начисления процентов.

## Поля для счетов с типом deposit или loan

- **startBalance** - для депозита - сумма открытия, для кредита - тело кредита.

- **capitalization** - для депозита - есть ли капитализация процентов. Для кредита - является ли кредит аннуитетным.

- **percent** - процентная ставка в процентах

- **startDate** - дата открытия депозита / кредита

- **endDateOffset** - срок действия кредита / депозита в промежутках
  `endDateOffsetInterval` начиная с даты открытия

- **endDateOffsetInterval** - промежуток с которым считается срок действия

- **payoffStep** - раз в сколько `payoffInterval` происходят выплаты, начиная со следующей даты `startDate + payoffInterval`. Если
  `payoffInterval === null`, то значение должно быть равно 0.

- **payoffInterval** - промежуток между выплатами. Может быть null, тогда считается, что выплата процентов или погашение кредита происходит в конце срока.


