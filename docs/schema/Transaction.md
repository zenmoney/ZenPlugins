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
    hold: Bool?

    opIncome:            Double? >= 0
    opIncomeInstrument:  Account.instrument?
    opOutcome:           Double? >= 0
    opOutcomeInstrument: Account.instrument?

    latitude:  Double? >= -90  && <= 90
    longitude: Double? >= -180 && <= 180
}
```

-   **id** - уникальный в пределах плагина ID операции. Можно не указывать.
    Если есть префикс `tmp#`, то ID считается временным и допускается
    добавление нескольких операций с таким ID. В противном случае ID считается
    постоянным.

-   **incomeBankID** - ID операции в пределах счета `incomeAccount`.

-   **outcomeBankID** - ID операции в пределах счета `outcomeAccount`. Эти ID
    используются в случае перевода между счетами, когда ID операции разнятся на
    двух счетах.

-   **incomeAccount** - счет-получатель. Значение из ID сущности `Account` либо
    ссылка вида Account.type#Account.instrument

-   **outcomeAccount** - счет-источник. То же самое, что для `incomeAccount`.

-   **income** - сумма операции в валюте счета `incomeAccount`.

-   **outcome** - сумма операции в валюте счета `outcomeAccount`.

-   **opIncomeInstrument**, **opOutcomeInstrument** - непосредственная валюта
    операции. Допустим была операция снятие долларов с рублевого счета. Тогда в
    `outcome` будет сумма в рублях. А действительную сумму в долларах нужно
    записать в `opOutcome`. Данное поле следует использовать только когда
    валюта операции отличается от валюты счета.

-   **opIncome**, **opOutcome** - сумма операции в непосредственной валюте
    операции.

-   **payee** - место совершения операции. "МакДоналдс", "Пятерочка" и т.п.

-   **mcc** - [код места совершения операции](https://ru.wikipedia.org/wiki/Merchant_Category_Code)

-   **hold** - является ли операция холдом.
