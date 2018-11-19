## Версия JavaScript

Скомпилированный плагин запускается в изолированном окружении на JavaScript
движке, который точно поддерживает все ECMAScript 5 фичи.

Мы используем [Babel](https://babeljs.io/) для компиляции фич языка JavaScript
издания ECMAScript 2017 в ECMAScript 5.

Однако стоит помнить, что мы не полифиллим появившиеся в окружении функции
(например, `Object.prototype.*`, `Array.prototype.*` расширения) и использовать
стоит только доступные в ECMAScript 5 артефакты.

### async/await

Мы призываем использовать async/await вместо создания цепочек
Promise[.then(onFulfilled, onRejected)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)
вручную https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
