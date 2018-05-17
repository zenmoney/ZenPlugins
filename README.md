# Zenmoney Plugins

Этот репозиторий содержит плагины, позволяющие ZenMoney получать данные о транзакциях из различных банков.
Создать плагин может каждый, для этого важно знать окружение (API) и то, каким и в каком виде должен быть результат работы плагина.

## Какие инструменты нужны для разработки

Понадобятся:
- свежая версия [Node.js](https://nodejs.org/en/download/package-manager/) (>= 8.10.0)
- пакетный менеджер [yarn](https://yarnpkg.com/en/docs/install) (альтернатива npm) (мы знаем, что npm5.x уже работает не хуже yarn, так что мы обязательно на него переедем, чтобы пререквизитов стало меньше!)
- IDE или просто текстовый редактор для JavaScript (мы используем [WebStorm](https://www.jetbrains.com/webstorm/))

## Пример, с которого стоит начать

[Пример плагина, который можно скопировать и начать разработку](src/plugins/example)

Вовсе необязательно идти рассматривать плагин на GitHub, можно запустить локально.

bash:

```
git clone git@github.com:zenmoney/ZenPlugins.git
cd ZenPlugins
PLUGIN=src/plugins/example yarn start
```

windows batch:

```
git clone git@github.com:zenmoney/ZenPlugins.git
cd ZenPlugins
set "PLUGIN=src/plugins/example" && yarn start
```

Останется только открыть корень репозитория в IDE.

## Анатомия плагина

Минимальные требования к плагину - это отдельная папка, в которой присутствуют файлы:

- [ZenmoneyManifest.xml](docs/files/ZenmoneyManifest.xml.md)
- [preferences.xml](docs/files/preferences.xml.md)
- [index.js](docs/files/index.js.md)

## Что стоит еще почитать

* [Документация API](docs/api.md)
* [Браузерный отладчик](docs/browser.md)
* [На каком языке писать](docs/language.md)

## Тестирование

Мы используем [Jest](https://facebook.github.io/jest/) (он клёвый).

Для запуска тестов всех плагинов нужно запустить:

```
yarn test
```

Запуск тестов, находящихся в папке `src/plugins/example`:

```
yarn test src/plugins/example
```

Мы призываем вас, помимо наличия модульных тестов на части плагина, написать хотя бы один интеграционный тест (тестирующий функцию scrape, мокая сеть минимально вариативными данными).

## Интеграция

В `master` ветку изменения попадают через [pull request с fork-а](https://help.github.com/articles/creating-a-pull-request-from-a-fork/).

Любые изменения (создание плагина, фикс багов) проходят [code review](https://github.com/features/code-review).

## Публикация

Делается вручную [Костей](https://github.com/skvav) по факту мержа Pull Request с плагином в `master` ветку.

Развернуть новую версию можно и для конкретного пользователя (к примеру, для тестирования корректной работы небольшой группой бета-тестировщиков на мобильном устройстве, например, вами :) ).

Как только новая версия плагина опубликована, она автоматически обновляется и используется при следующей синхронизации мобильным приложением.

Текущую используемую на мобильном девайсе версию плагина можно увидеть в окошке настроек подключения.
