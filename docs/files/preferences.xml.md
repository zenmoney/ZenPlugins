# preferences.xml

[Пример файла](../../src/plugins/example/preferences.xml)

Структура файла повторяет структуру [Preferences в Android](https://developer.android.com/guide/topics/ui/settings.html?hl=ru) (пространство имен `android:` мы не указываем).

Наличие поля `startDate` в настройках является обязательным:

```
<EditTextPreference
    key="startDate"
    obligatory="true"
    inputType="date"
    title="С какой даты загружать операции"
    defaultValue="2018-01-01T00:00:00.000Z"
    dialogTitle="Дата начала загрузки"
    dialogMessage="Введите дату, с которой загружать операции"
    positiveButtonText="ОК"
    negativeButtonText="Отмена"
    summary="|startDate|{@s}"
/>
```

Значение поля `startDate` будет передано аргументом типа Date `fromDate` в функцию [scrape()](./index.js.md) при первом запуске.

Поддерживаются `EditTextPreference`, `ListPreference`, `CheckBoxPreference`.

О том, как получить введённые пользователем, можно прочесть в [документации API](../api.md#Получение-введённых-пользователем-настроек).
