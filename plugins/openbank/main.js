var g_headers = {
	'User-Agent': 'okhttp/3.4.2'
	},
	g_baseurl =  'https://api1.open.ru/2-37/',
	g_accesstoken,
	g_preferences,
	g_accounts = [];

function main() {
	ZenMoney.setDefaultCharset('utf-8');
	g_preferences = ZenMoney.getPreferences();
	checkForAuth();
	processAccounts();
	processTransactions();
	ZenMoney.setResult({success: true});
}

function checkForAuth() {
	var pincode = ZenMoney.getData('pincode', null);
	var installid = ZenMoney.getData('installid', null);
	var deviceinfo = ZenMoney.getData('deviceinfo', null);
	if (!pincode || !installid || !deviceinfo) {
		ZenMoney.trace('Требуется привязка приложения.', 'check_for_auth');
		authDevice();
	}
	ZenMoney.trace('Приложение уже привязано. Используем PIN для входа.', 'check_for_auth');
	authWithPin();
}

function authDevice() {

	ZenMoney.trace('Запрашиваем номер карты у пользователя...', 'input');

	var cardNum = ZenMoney.retrieveCode('Введите номер карты банка Открытие, к которой привязан Мобильный банк', null, {
		inputType: 'number',
		time: 180000 // 3 минуты
	});
	if (!cardNum || cardNum.length != 16) {
		ZenMoney.trace('Номер карты должен состоять из 16 цифр. Получено: ' + cardNum.length, 'input');
		throw new ZenMoney.Error('Ошибка: номер карты должен состоять из 16 цифр!', true);
	}

	ZenMoney.trace('Генерируем device_info...', 'auth_device');

	var imei = imei_gen();
	var deviceinfo = JSON.stringify({
		'device_id': imei,
		'device_locale': 'ru',
		'device_os_version': '4.4.2',
		'device_root': '0',
		'app_version': '311',
		'device_os': '2'
	});

	ZenMoney.trace('Сгенерирован device_info: ' + deviceinfo, 'auth_device');
	ZenMoney.trace('Запрашиваем отправку СМС-кода пользователю...', 'auth_device');

	var auth_card = requestJson('auth/card', null, 'card_no=' + cardNum + '&device_info=' + deviceinfo);
	if (auth_card.error || !auth_card.data) {
		errorResponse(auth_card, 'Ошибка при запросе СМС-кода', 'auth_device');
	}

	ZenMoney.trace('Запрашиваем СМС-код у пользователя...', 'input');

	var smsCode = ZenMoney.retrieveCode('Введите код из СМС, отправленный на номер ' + auth_card.data.phone, null, {
		inputType: 'number',
		time: 60000 // 1 минута
	});
	if (!smsCode || smsCode.length != 5) {
		ZenMoney.trace('СМС-код должен состоять из 5 цифр. Получено: ' + smsCode.length, 'input');
		throw new ZenMoney.Error('Ошибка: СМС-код должен состоять из 5 цифр!', true);
	}

	ZenMoney.trace('Пытаемся авторизоваться по СМС-коду...', 'auth_device');

	var auth_tempcode = requestJson('auth/tempcode', null, 'attempt_id=' + auth_card.data.attempt_id + '&code=' + smsCode);
	if (auth_tempcode.error || !auth_tempcode.data) {
		errorResponse(auth_tempcode, 'Ошибка при проверке СМС-кода', 'auth_device');
	}
	var accesstoken = auth_tempcode.data.access_token;
	var installid = auth_tempcode.data.install_id;

	ZenMoney.trace('Генерируем PIN-код и передаем его банку...', 'auth_device');

	var shaObj = new jsSHA('SHA-1', 'TEXT');
	shaObj.update(Math.random().toString() + '_' + imei);
	var pincode = shaObj.getHash('HEX');

	var auth_pin = requestJson('auth/pin', null, 'pin_code=' + pincode + '&device_info=' + deviceinfo, accesstoken);
	if (auth_pin.error || !auth_pin.data || auth_pin.data != 'success') {
		errorResponse(auth_pin, 'Ошибка при сохранении PIN-кода', 'auth_device');
	}

	ZenMoney.trace('Сохраняем все данные об устройстве и PIN-код в локальном хранилище...', 'auth_device');

	ZenMoney.setData('pincode', pincode);
	ZenMoney.setData('installid', installid);
	ZenMoney.setData('deviceinfo', deviceinfo);
	ZenMoney.saveData();

	ZenMoney.trace('Приложение успешно привязано!', 'auth_device');
	return;
}

function authWithPin() {
	var pincode = ZenMoney.getData('pincode', null);
	var installid = ZenMoney.getData('installid', null);
	var deviceinfo = ZenMoney.getData('deviceinfo', null);

	var auth_login = requestJson('auth/login', null, 'pin_code=' + pincode + '&device_info=' + deviceinfo + '&install_id=' + installid);
	if (auth_login.error || !auth_login.data.access_token) {
		errorResponse(auth_login, 'Ошибка при авторизации по PIN-коду', 'auth_with_pin');
	}
	g_accesstoken = auth_login.data.access_token;
	ZenMoney.trace('Успешно вошли по PIN-коду: ' + JSON.stringify(auth_login), 'auth_with_pin');
}

function errorResponse(response, text, tag = 'trace', text_for_user = 'Ошибка') {
	if (response.error.code && response.error.error_message) {
		ZenMoney.trace(text + ': #' + response.error.code + ', ' + response.error.error_message, tag);
		throw new ZenMoney.Error(text_for_user + ': ' + response.error.error_message, true);
	}
	ZenMoney.trace(text + ': ' + JSON.stringify(response), tag);
	throw new ZenMoney.Error(text_for_user + ': неизвестная ошибка!', true);
}

function processAccounts() {

	ZenMoney.trace('Запрашиваем информацию по счетам...', 'process_accounts');

	var accounts = requestJson('accounts', {'use_cached_data': 0}, null, g_accesstoken);
	if (accounts.error || !accounts.data.account_list) {
		errorResponse(accounts, 'Ошибка при получении счетов', 'process_accounts');
	}

	ZenMoney.trace('Успешно получили счета: ' + JSON.stringify(accounts), 'process_accounts');

	var accDict = [];
	accounts = accounts.data.account_list;
	for (var i = 0; i < accounts.length; i++) {
		var a = accounts[i];
		if (isAccountSkipped(a.account_id) || a.is_blocked == 1 || a.account_id < 2 || a.type > 5) {
			ZenMoney.trace('Пропускаем карту/счет: ' + a.title + ' (#' + a.account_id + ')', 'process_accounts');
			continue;
		}

		if (a.type == 1) {
			// Дебетовая карта
			ZenMoney.trace('Добавляем дебетовую карту: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');

			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'ccard',
				balance: a.balance
			});
			g_accounts.push(a.account_id);

		} else if (a.type == 2) {
			// Кредитная карта (пока неизвестно, как посмотреть кредитный лимит)
			ZenMoney.trace('Добавляем кредитную карту: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');

			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'ccard',
				balance: a.balance
			});
			g_accounts.push(a.account_id);

		} else if (a.type == 3) {
			// Вклад (депозит)
			ZenMoney.trace('Добавляем вклад: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');
			var date = new Date(a.open_date);
			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'deposit',
				balance: a.balance,
				capitalization: true,
    		percent: a.annual_interest,
    		startDate: date.getTime(),
    		endDateOffset: monthDiff(a.open_date, a.closing_date),
    		endDateOffsetInterval: 'month',
    		payoffStep: 1,
    		payoffInterval: 'month'
			});
			g_accounts.push(a.account_id);

		} else if (a.type == 4) {
			// Кредит
			ZenMoney.trace('Добавляем кредит: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');
			var date = new Date(a.open_date);
			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'loan',
				balance: a.balance,
				startBalance: a.loan_amount,
				capitalization: true,
    		percent: a.annual_interest,
    		startDate: date.getTime(),
    		endDateOffset: Math.ceil(a.full_payment / a.next_payment),
    		endDateOffsetInterval: 'month',
    		payoffStep: 1,
    		payoffInterval: 'month'
			});
			g_accounts.push(a.account_id);

		} else if (a.type == 5 && a.kopilka && a.kopilka == 1) {
			// Счет-копилка
			ZenMoney.trace('Добавляем копилку: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');
			var date = new Date(a.open_date);
			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'deposit',
				balance: a.balance,
				capitalization: true,
    		percent: a.annual_interest,
    		startDate: date.getTime(),
    		endDateOffset: 1,
    		endDateOffsetInterval: 'month',
    		payoffStep: 1,
    		payoffInterval: 'month'
			});
			g_accounts.push(a.account_id);

		} else if (a.type == 5) {
			// Банковский счет
			ZenMoney.trace('Добавляем банковский счет: '+ a.title +' (#'+ a.account_id +')', 'process_accounts');

			accDict.push({
				id: a.account_id.toString(),
				title: a.title,
				syncID: a.pan.substring(a.pan.length-4),
				instrument: a.currency,
				type: 'checking',
				balance: a.balance
			});
			g_accounts.push(a.account_id);

		}
	}

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length, 'process_accounts');
	ZenMoney.trace('JSON: '+ JSON.stringify(accDict), 'process_accounts');
	ZenMoney.addAccount(accDict);
}

function processTransactions() {
	var createSyncTime = ZenMoney.getData('createSync', 0);
	if (!createSyncTime) {
		var period = !g_preferences.hasOwnProperty('periodNew') || isNaN(period = parseInt(g_preferences.periodNew)) ? 1 : period;
		if (period > 3) period = 3;

		ZenMoney.trace('Начальный период загрузки операций: '+ period, 'process_transactions');

		if (period > 0) {
			var dtNow = new Date();
			var year = dtNow.getFullYear();
			var month = dtNow.getMonth() - (period - 1);
			if (month < 0) {
				month = 12 + month;
				year--;
			}

			var dtSync = new Date(year, month, 1);
			ZenMoney.trace('CalcSyncTime: '+ dtSync);

			createSyncTime = dtSync.getTime();
		} else {
			createSyncTime = Date.now();
		}

		ZenMoney.setData('createSync', createSyncTime);

		if (period <= 0) {
			ZenMoney.trace('Подключение без операций. Первый запуск. Операции пропускаем.', 'process_transactions');
			ZenMoney.saveData();
			return;
		}
	}

	var lastSyncTime = ZenMoney.getData('lastSync', 0);
	ZenMoney.trace('LastSyncTime: '+ new Date(lastSyncTime) +' ('+ lastSyncTime +')', 'process_transactions');

	// всегда захватываем одну неделю минимум для обработки hold-операций
	if (lastSyncTime) {
		lastSyncTime -= 7 * 24 * 60 * 60 * 1000;
		ZenMoney.trace('NeedSyncTime: ' + new Date(lastSyncTime) + ' (' + lastSyncTime + ')', 'process_transactions');
	} else {
		lastSyncTime = createSyncTime;
	}

	ZenMoney.trace('WorkSyncTime: ' + new Date(lastSyncTime) + ' (' + lastSyncTime + ')', 'process_transactions');
	var lastSyncDate = new Date(lastSyncTime);
	var startDate = n2(lastSyncDate.getDate()) +'.'+ n2(lastSyncDate.getMonth() + 1) +'.'+ lastSyncDate.getFullYear() +' '+ n2(lastSyncDate.getHours()) +':'+ n2(lastSyncDate.getMinutes());
	ZenMoney.trace('Запрашиваем операции с ' + startDate, 'process_transactions');

	var tranDict = {};      // список найденных операций

	for (var i = 0; i < g_accounts.length; i++) {
		acc = g_accounts[i];
		var transactions = requestJson('accounts/' + acc + '/transactions', {'date_start': lastSyncDate.toISOString()}, null, g_accesstoken);
		if (transactions.error || !transactions.data) {
			errorResponse(transactions, 'Ошибка при получении транзакций по счету #' + acc, 'process_transactions');
		}
		transactions = transactions.data.transaction_list;

		ZenMoney.trace('Получены операции по счету #' + acc + ': ' + JSON.stringify(transactions), 'process_transactions');

		for (var j = 0; j < transactions.length; j++) {
			var t = transactions[j];
			var tran = {};
			var payee = '';
			tran.hold = (t.transaction_status == 1) ? false : true;
			var forHash = t.description.replace(/\s+/g,'') + t.short_transaction_date.substring(0, 10);
			var shaObj = new jsSHA('SHA-1', 'TEXT');
			shaObj.update(forHash);
			var tranKey = ':' + shaObj.getHash('HEX');
			var opTranKey = (t.transaction_type == 2 ? 'out' : 'in') + tranKey;
			tranKey = (t.transaction_type == 2 ? 'in' : 'out') + tranKey;
			var foreignCurrency = (t.original_currency && t.original_currency != t.transaction_currency);
			/*
			 *	TODO: hold валютной операции, снятие наличных
			 */
			tran.payee = t.title.substring(0, t.title.lastIndexOf('/'));
			var date = new Date(t.transaction_date ? t.transaction_date : t.short_transaction_date);
			tran.date = date.getTime();
			tran.income = 0;
			tran.outcome = 0;
			tran.outcomeAccount = acc.toString();
			tran.incomeAccount = acc.toString();
			if (t.transaction_type == 1) {
				// расходная операция
				tran.outcomeBankID = t.transaction_id.toString();
				if (foreignCurrency) {
					tran.opOutcomeInstrument = t.original_currency;
					tran.opOutcome = t.original_amount;
				}
				if (tran.hold) {
					payee = t.title.substring(12);
					tran.payee = payee.substring(0, payee.lastIndexOf(' '));
					tran.outcome = t.value_transaction_currency;
				} else {
					payee = t.title.substring(0, t.title.lastIndexOf('/'));
					tran.payee = payee.substring(0, payee.lastIndexOf('/'));
					tran.outcome = -t.value_transaction_currency;
				}
				if (t.title.toLowerCase().indexOf('card2card') > -1) {
					// исходящий c2c
					tran.incomeAccount = 'ccard#' + t.transaction_currency;
					tran.income = tran.outcome;
				}
			} else if (t.transaction_type == 2) {
				// доходная операция
				tran.incomeBankID = t.transaction_id.toString();
				tran.payee = '';
				tran.comment = t.title;
				if (foreignCurrency) {
					tran.opIncomeInstrument = t.original_currency;
					tran.opIncome = t.original_amount;
				}
				tran.income = t.value_transaction_currency;
				if (t.description.indexOf('Приём денежных') > -1 || t.description.indexOf('Внесение на') > -1) {
					// внесение наличных
					tran.outcomeAccount = 'cash#' + t.transaction_currency;
					tran.outcome = tran.income;
				}
			} else {
				ZenMoney.trace('Неизвестный тип транзакции! JSON: ' + JSON.stringify(t), 'process_transactions');
				continue;
			}

			if (tranDict[opTranKey]) {
				ZenMoney.trace('Найден перевод (1/2): ' + JSON.stringify(tran), 'process_transactions');
				ZenMoney.trace('Найден перевод (2/2): ' + JSON.stringify(tranDict[opTranKey]), 'process_transactions');
				if (t.transaction_type == 1 && tranDict[opTranKey].outcome == 0) {
					// текущая транзакция доходная, добавим расходную часть
					tranDict[opTranKey].outcomeBankID = tran.outcomeBankID;
					tranDict[opTranKey].outcomeAccount = tran.outcomeAccount;
					tranDict[opTranKey].outcome = tran.outcome;
				}
				if (t.transaction_type == 2 && tranDict[opTranKey].income == 0) {
					// текущая транзакция расходная, добавим доходную часть
					tranDict[opTranKey].incomeBankID = tran.incomeBankID;
					tranDict[opTranKey].incomeAccount = tran.incomeAccount;
					tranDict[opTranKey].income = tran.income;
				}
				tranDict['xint:' + opTranKey.substring(opTranKey.indexOf(':') + 1)] = tranDict[opTranKey];
				delete tranDict[opTranKey];
			} else {
				tranDict[tranKey] = tran;
			}
		}
	}
	ZenMoney.trace('JSON операций: ' + JSON.stringify(tranDict), 'process_transactions');
	for (var k in tranDict) {
		ZenMoney.addTransaction(tranDict[k]);
	}

	var nextSyncTime = Date.now();
	ZenMoney.setData('lastSync', nextSyncTime);
	ZenMoney.saveData();

	ZenMoney.trace('NextSyncTime: ' + new Date(nextSyncTime) + ' (' + nextSyncTime + ')');
}

function isAccountSkipped(id) {
	return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

function monthDiff(d1, d2) {
    var months;
		d1 = new Date(d1);
		d2 = new Date(d2);
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function getJson(html) {
	try {
		return JSON.parse(html);
	} catch (e) {
		ZenMoney.trace('Bad json (' + e.message + '): ' + html);
		throw new ZenMoney.Error('Сервер банка вернул ошибочные данные: ' + e.message);
	}
}

function requestJson(requestCode, getparams, postbody, access_token = null) {

	var params = [];

	if (getparams)
	{
		for (var param in getparams)

			params.push(encodeURIComponent(param) + "=" + encodeURIComponent(getparams[param]));
	}

	var url = g_baseurl + requestCode + "?" + params.join("&");

	if (access_token) {
		g_headers['Cookie'] = 'access_token=' + access_token;
	}

	if (postbody !== null) {
		var data = ZenMoney.requestPost(url, postbody, g_headers);
	} else {
		var data = ZenMoney.requestGet(url, g_headers);
	}

	if (ZenMoney.getLastStatusCode() != 200) {
		ZenMoney.trace('Получен ответ со статусом != 200. Ошибка!');
    g_sessionid = undefined;
    return;
  }

	if (!data) {
		ZenMoney.trace('Пустой ответ с url "' + url + '". Попытаемся ещё раз...');
		data = ZenMoney.requestPost(url, postbody, g_headers);
	}

	return getJson(data);
}

function n2(n) {
	return n < 10 ? '0' + n : '' + n;
}
