//

var g_headers = {
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding":"gzip, deflate, br",
      "Accept-Language":"ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4",
      "Cache-Control":"no-cache",
      "Connection":"keep-alive",
      "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
      "DNT":"1",
      "Pragma":"no-cache",
      "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
      "X-Requested-With":"XMLHttpRequest"
    },
  g_baseurl =  "https://investpay.ru",
  g_login_url = g_baseurl + "/session",
  g_logincheck_url = g_baseurl + "/front/users/current",
  g_cards_url = g_baseurl + "/front/accounts/extended",
  g_deposits_url = g_baseurl + "/front/products/deposits",
  g_credits_url = g_baseurl + "/front/products/credits",
  g_trans_pref = g_baseurl + "/front/accounts/",
  g_trans_suf = "/transactions?with_blocked=1",
  g_sessionid,
  g_preferences;

var currency = {
  "rur": "RUB",
  "usd": "USD",
  "eur": "EUR",
  "gbp": "GBP"
};


// Основной метод
function main(){

  g_preferences = ZenMoney.getPreferences();

  login();

  var accList = processAccounts();
  processTransactions(accList);

  ZenMoney.setResult({success: true});
  // ZenMoney.request("DELETE", g_login_url, g_headers)  // Выход
}


// Авторизация
function login() {

  if (!g_preferences.login)

    throw new ZenMoney.Error("Введите логин для Инвестпей.", false, true);

  if (!g_preferences.password)

    throw new ZenMoney.Error("Введите пароль для Инвестпей.", false, true);

  if (!g_preferences.period)

    throw new ZenMoney.Error("Введите начальный период для синхронизации.", false, true);

  ZenMoney.requestGet(g_logincheck_url, g_headers);
  if (ZenMoney.getLastStatusCode() == 200) {
    ZenMoney.trace("Уже авторизованы.", "auth");
    return;
  }

  ZenMoney.trace("Авторизуемся.", "auth")
  var code = ZenMoney.requestPost(g_login_url, {
    "email": g_preferences.login,
    "password": g_preferences.password,
    "confirmation_type": g_preferences.confirmation_type,
  }, g_headers);

  if (ZenMoney.getLastStatusCode() != 200) {
    throw new ZenMoney.Error("Неверное имя пользователя или пароль.", false, true);
  }

  if (g_preferences.confirmation_type != "none"){
    ZenMoney.trace("Вводим код")
    var smsCode = ZenMoney.retrieveCode("Введите код подтверждения из смс для авторизации приложения в Инвестпей.", null, {
      inputType: "number",
      time: 60000
    });

    ZenMoney.trace("СМС-код получен.", "auth");

    getJson(ZenMoney.requestPost(g_login_url, {
      "login_confirmation": smsCode,
      "email": "undefined",
    }, g_headers))

    if (ZenMoney.getLastStatusCode() != 200) {
      throw new ZenMoney.Error("Неверный код подтверждения.", "auth");
    }
  };

}


// Обработка счетов
function processAccounts() {

  ZenMoney.trace("Запрашиваем данные по счетам.", "account");

  var accList = [];

  var accounts = getJson(ZenMoney.requestGet(g_cards_url, g_headers)).accounts;
  var deposits = getJson(ZenMoney.requestGet(g_deposits_url, g_headers)).deposits;
  var credits = getJson(ZenMoney.requestGet(g_credits_url, g_headers)).singleCredits;

  ZenMoney.trace("Всего счетов " + accounts.length, "account");

  for (var i = 0; i < accounts.length; i++) {
    var account = accounts[i];

    if (isAccountSkipped(String(account.id)) || account.hidden || account.closed) {
      ZenMoney.trace("Пропускаем карту/счёт: '" + account.displayTitle + "'", "skip");
      continue;
    }

    ZenMoney.trace("Обрабатываем карту/счёт: '" + account.displayTitle + "', id " + account.id, "account");

    // Карта
    if (account.productType == null) {
        accList.push({
          id: String(account.id),
          title: account.displayTitle,
          syncID: cardPan(account),
          instrument: currency[account.currencyIsoCode],
          type: "ccard",
          balance: parseFloat(account.balance),
          creditLimit: parseFloat(account.loanAmount)
        });
    }

    // Кредитная карта
    else if (account.productType == "Products::RevolverCredit") {
      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: "ccard",
        balance: parseFloat(account.creditAmount) > 0 ? parseFloat(account.creditAmount) * (-1) : parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
      });
    }

    // Вклад
    else if (account.productType == "Products::Deposit") {
      var deposit = findDeposit(deposits, account.id);
      var offset = 36500;  // Вклад до востребования на 100 лет

      // Определяем срок вклада
      if (deposit.closingDate) {
        offset = (new Date(deposit.closingDate) - new Date(deposit.openingDate)) / 86400000;
      }

      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: "deposit",
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
        capitalization: true,
        startDate: deposit.openingDate,
        endDateOffset: offset,
        endDateOffsetInterval: "day",
        payoffStep: 1,
        payoffInterval: "month",
        percent: parseFloat(deposit.interestRate)
      });
    }

    // Кредит
    else if (account.productType == "Products::SingleCredit") {
      var credit = findCredit(credits, account.id);
      var endDate = new Date()

      // Определяем дату последнего платежа по кредиту
      for (var j = 0; j < credit.payments.length; j++) {
        var payment = credit.payments[j]

        if (new Date(payment.date) > endDate) {
          endDate = new Date(payment.date)
        }
      }

      offset = (endDate - new Date(credit.openingDate)) / 86400000;

      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: "loan",
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
        capitalization: true,
        startDate: credit.openingDate,
        endDateOffset: offset,
        endDateOffsetInterval: "day",
        payoffStep: 1,
        payoffInterval: "month",
        percent: parseFloat(credit.interest)
      });
    }

    else {
      ZenMoney.trace("Неизвестный тип карты/счёта", "skip");
    }
  }

  // ZenMoney.trace(accList);
  ZenMoney.addAccount(accList);
  ZenMoney.trace("Создано счетов: " + accList.length, "account");

  return accList;
}


// Обработка операций
function processTransactions(accList) {

  var tranList = [];
  var lastSyncTime = ZenMoney.getData("lastSync", 0);
  var g_tran_time = "";
  var start;
  var finish = Date.now();

  if (lastSyncTime == 0) {
    var period = g_preferences.period;
    start = finish - period * 86400000;
  }
  else {
    start = lastSyncTime;
  }

  start = start - 7 * 86400000; // всегда захватываем ещё 7 дней для обработки холдов

  g_tran_time = "&start=" + dateFormat(start) + "&finish=" + dateFormat(finish);

  ZenMoney.trace("Запрашиваем транзакции с " + dateFormat(start) + " по " + dateFormat(finish), "transac")

  for (var i = 0; i < accList.length; i++) {
    var account = accList[i];
    var trans_url = g_trans_pref + account.id + g_trans_suf + g_tran_time

    var trans = getJson(ZenMoney.requestGet(trans_url, g_headers)).transactions;

    ZenMoney.trace("Обрабатываем операции по аккаунту: '" + account.title + "', всего " + trans.length, "transac")
    var count = trans.length;

    for (var j = 0; j < trans.length; j++) {
      var tran = trans[j]
      var t = {};

      // ZenMoney.trace("Обрабатываем операцию: " + tran.operation)

      t.id = String(tran.id);
      var amount = parseFloat(tran.amount);
      t.date = new Date(tran.date) / 1000;
      t.incomeBankID = t.id;
      t.outcomeBankID = t.id;

      /* if (lastSyncTime / 1000 > t.date) {
        ZenMoney.trace("Пропускаем транзакцию: #" + t.id, "skip")
        count = count - 1
        continue;
      } */  // Защита от дублирования транзакций не нужна

      var re = /(\d+|\d+\.\d+) (USD|EUR|RUB|GBP) = (\d+|\d+\.\d+) (USD|EUR|RUB|GBP)/;
      var exch = tran.event.description.match(re);  // Конвертация валют

      re = /Пополнение(.|[\r\n])+Пункт/m;
      var cashIn = tran.event.description.match(re);  // Пополнение наличными

      re = /ВЫДАЧА НАЛИЧНЫХ/;
      var cashOut = tran.event.description.match(re);  // Выдача наличных

      if (amount < 0) {
        amount = Math.abs(amount);

        if (exch) {
          t.opOutcome = Number((amount * exch[3] / exch[1]).toFixed(2));
          t.opOutcomeInstrument = exch[4];
        }

        // Перевод между счетами?
        if (tran.event.destinationCardOrAccount) {
          t.incomeAccount = String(tran.event.destinationCardOrAccount.id)
          t.income = t.opOutcome ? t.opOutcome : amount
        }
        else if (cashOut) {  // Снятие наличных?
          t.incomeAccount = 'cash#' + (exch ? t.opOutcomeInstrument : currency[tran.account.currencyIsoCode])
          t.income = amount
        }
        else {
          t.incomeAccount = account.id;
          t.income = 0;
        }

        t.outcomeAccount = account.id;
        t.outcome = amount;

      }
      else {
        t.incomeAccount = account.id;
        t.income = amount

        if (exch) {
          t.opIncome = Number((amount * exch[1] / exch[3]).toFixed(2));
          t.opIncomeInstrument = exch[2];
        }

        // Перевод между счетами?
        if (tran.event.destinationCardOrAccount) {
          t.outcomeAccount = String(tran.event.destinationCardOrAccount.id)
          t.outcome = t.opIncome ? t.opIncome : amount;
        }
        else if (cashIn) { // Пополнение наличными?
          t.outcomeAccount = 'cash#' + (exch ? t.opIncomeInstrument : currency[tran.account.currencyIsoCode])
          t.outcome = amount
        }
        else {
          t.outcomeAccount = account.id;
          t.outcome = 0;
        }
      }

      tranList.push(t)
    }

    ZenMoney.trace("По аккаунту '" + account.title + "' обработано " + count + " из " + trans.length + " транзакцияй", "transac")

  }

  ZenMoney.addTransaction(tranList);
  ZenMoney.trace("Cоздано операций: " + tranList.length)

  ZenMoney.setData('lastSync', finish);
  ZenMoney.saveData();

}


// Заполенине SyncID
function cardPan(account) {
  var pan = [];
  var cards = account.cards;

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];

    if ("active" == card.state) {
      pan.push(card.number.substr(-4))
    }
  }

  if (pan.length == 0) {
    pan = [account.number.substr(-4)]
  }

  return pan;
};


// Поиск депозита в массиве депозитов
function findDeposit(its, id) {
  for (var i = 0; i < its.length; i++){
    var it = its[i];

    if (it.account.id == id) {
      return it
    }
  }
}


// Поиск кредита в массиве кредитов
function findCredit(its, id) {
  for (var i = 0; i < its.length; i++){
    var it = its[i];

    if (it.accounts.id == id) {  // WTF: accountS
      return it
    }
  }
}


// Юникстайм в ДД.ММ.ГГГГ
function dateFormat(d) {
  d = new Date(d);

  var dd = d.getDate()
  if (dd < 10) {dd = "0" + dd}

  var mm = d.getMonth() + 1
  if (mm < 10) {mm = "0" + mm}

  var yyyy = d.getFullYear()

  return yyyy + "." + mm + "." + dd;
}


// Пропскаем?
function isAccountSkipped(id) { return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id); }


// Обработка JSON-строки в объект
function getJson(html) {

  try { return JSON.parse(html); } catch (e) {

    ZenMoney.trace("Bad json (" + e.message + "): " + html);
    throw new ZenMoney.Error("Сервер вернул ошибочные данные: " + e.message);
  }
}
