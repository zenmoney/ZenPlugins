var g_headers = {
		"User-Agent": "User-Agent: Sony D6503/android: 5.1.1/TCSMB/3.1.0",
		"Referrer": "https://www.tinkoff.ru/mybank/"
	},
	g_baseurl =  "https://www.tinkoff.ru/api/v1/",
	g_deviceid,
	g_sessionid,
	g_preferences;

/**
 * Основной метод
 */
function main(){
	g_preferences = ZenMoney.getPreferences();
	login();

	processAccounts();
	processTransactions();
	ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 * @returns {String} Идентификатор сессии
 */
function login() {
	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", true);

	if (g_sessionid)
		ZenMoney.trace("Cессия уже установлена. Используем её.");
	else {
		var deviceId = ZenMoney.getData('device_id', 0), deviceNew = false;
		if (deviceId == 0){
			ZenMoney.trace('Первый запуск.');
			deviceId = hex_md5(Math.random().toString() + '_' + g_preferences.login);
			deviceNew = true;
		}

		var json = requestJson("session", {
			deviceId: deviceId
		}, {
			post: {
				username: g_preferences.login,
				password: g_preferences.password,
				//origin: "web,ib5",
				//wuid: md5id,
				screen_size: "1080x1920x32",
				timezone: -(new Date).getTimezoneOffset()
			},
			noException: true
		});
		g_deviceid = deviceId;
		if (deviceNew)
			ZenMoney.setData('device_id', deviceId);

		ZenMoney.trace('Пытаемся войти...');

		if ("DEVICE_LINK_NEEDED" == json.resultCode) {
			ZenMoney.trace("Необходимо привязать устройство...");
			var sessionId = json.payload.sessionid;
			var smsCode = ZenMoney.retrieveCode("Введите код подтверждения из смс для авторизации приложения в интернет-банке Тинькофф", null, {
				inputType: "number",
				time: 18E4
			});
			ZenMoney.trace("Получили код");
			var json2 = requestJson("confirm", {
				initialOperationTicket: json.payload.confirmationData.operationTicket,
				confirmationData: '{"SMSBYID":"' + smsCode + '"}',
				initialOperation: "mobile_link_device",
				sessionid: sessionId
			});
			g_sessionid = sessionId;
			ZenMoney.trace('Привязали устройство.');
		} else {
			if ("OK" == json.resultCode) {
				g_sessionid = json.payload.sessionid;
			}
			else {
				var authFailed = "AUTHENTICATION_FAILED" == json.resultCode;
				throw new ZenMoney.Error(json.plainMessage || json.errorMessage, authFailed, authFailed);
			}
		}

		if (g_sessionid)
			ZenMoney.trace('Создали новую сессию.');

		if (deviceNew)
			ZenMoney.saveData();
	}
	return g_sessionid
}

var g_accounts = []; // линки активных счетов, по ним фильтруем обработку операций
/**
 * Обработка счетов
 */
function processAccounts() {
	ZenMoney.trace('Запрашиваем данные по счетам...');
	var accounts = requestJson("accounts_flat");
	ZenMoney.trace('Получено счетов: '+ accounts.payload.length);
	ZenMoney.trace('JSON: '+JSON.stringify(accounts.payload));

	var accDict = [];
	for (var i = 0; i < accounts.payload.length; i++) {
		var a = accounts.payload[i];
		if (isAccountSkipped(a.id)) {
			ZenMoney.trace('Пропускаем карту/счёт: '+ a.name +' (#'+ a.id +')');
			continue;
		}

		var creditLimit = a.creditLimit ? a.creditLimit.value : 0;

		// дебетовые карты ------------------------------------
		if (a.accountType == 'Current' && a.status == 'NORM') {
			ZenMoney.trace('Добавляем дебетовую карту: '+ a.name +' (#'+ a.id +')');
			var acc1 = {
				id:				a.id,
				title:			a.name,
				type:			'ccard',
				syncID:			[],
				instrument:		a.moneyAmount.currency.name,
				balance:		a.moneyAmount.value - creditLimit
			};

			if (creditLimit > 0)
				acc1.creditLimit = creditLimit;

			// номера карт
			for (var k1 = 0; k1 < a.cardNumbers.length; k1++) {
				var card1 =  a.cardNumbers[k1];
				if (card1.activated)
					acc1.syncID.push(card1.value.substring(card1.value.length-4))
			}

			if (acc1.syncID.length > 0) {
				// добавим ещё и номер счёта карты
				acc1.syncID.push(a.id.substring(a.id.length-4));

				accDict.push(acc1);
				g_accounts.push(a.id);
			}
		}
		// кредитные карты ----------------------------------------
		else if (a.accountType == 'Credit' && a.status == 'NORM') {
			ZenMoney.trace("Добавляем кредитную карту: "+ a.name +' (#'+ a.id +')');

			var acc2 = {
				id:				a.id,
				title:			a.name,
				type:			'ccard',
				syncID:			[],
				creditLimit:	creditLimit,
				instrument:		a.moneyAmount.currency.name,
				balance:		a.moneyAmount.value - creditLimit
			};

			// пересчитаем остаток, если провалились в минус сверх кредитного лимита
			if (a.moneyAmount.value == 0 && a.debtAmount) {
				ZenMoney.trace('Пересчитаем остаток на карте, так как провалились ниже лимита...');
				acc2.balance = -a.debtAmount.value;
			}

			// номера карт
			for (var k2 = 0; k2 < a.cardNumbers.length; k2++) {
				var card2 =  a.cardNumbers[k2];
				if (card2.activated)
					acc2.syncID.push(card2.value.substring(card2.value.length-4))
			}

			if (acc2.syncID.length > 0) {
				// добавим ещё и номер счёта карты
				acc2.syncID.push(a.id.substring(a.id.length-4));

				accDict.push(acc2);
				g_accounts.push(a.id);
			}
		}
		// накопительные счета ------------------------------------
		else if (a.accountType == 'Saving' && a.status == 'NORM') {
			ZenMoney.trace("Добавляем накопительный счёт: "+a.name +' (#'+ a.id +')');
			accDict.push({
				id:				a.id,
				title:			a.name,
				type:			'deposit', //'checking'
				syncID:			a.id.substring(a.id.length-4),
				instrument:		a.moneyAmount.currency.name,
				balance:		a.moneyAmount.value,
				// пока создаём накопительные счета как вклады
				percent:		0,
				capitalization:	true,
				startDate:		a.creationDate.milliseconds,
				endDateOffsetInterval: 'month',
				endDateOffset:	1,
				payoffInterval:	'month',
				payoffStep:		1
			});
			g_accounts.push(a.id);
		}
		// депозиты --------------------------------------------------
		else if (a.accountType == 'Deposit' && a.status == 'ACTIVE') {
			ZenMoney.trace("Добавляем депозит: "+a.name +' (#'+ a.id +')');
			accDict.push({
				id:				a.id,
				title:			a.name,
				type:			'deposit',
				syncID:			a.id.substring(a.id.length-4),
				instrument:		a.moneyAmount.currency.name,
				balance:		a.moneyAmount.value,
				percent:		a.depositRate,
				capitalization:	a.typeOfInterest == 'TO_DEPOSIT',
				startDate:		a.openDate.milliseconds,
				endDateOffsetInterval: 'month',
				endDateOffset:	a.period,
				payoffInterval:	'month',
				payoffStep:		1
			});
			g_accounts.push(a.id);
		}
	}

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length);
	ZenMoney.trace('JSON: '+ JSON.stringify(accDict));
	ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 * @param data
 */
function processTransactions(data) {
	var createSyncTime = ZenMoney.getData('createSync', 0);

	// инициализация начального времени
	if (!createSyncTime) {
		// период загрузки данных в месяцах (с начала календарного месяца)
		ZenMoney.trace("periodNew: "+ g_preferences.periodNew);

		var period = !g_preferences.hasOwnProperty('periodNew') || isNaN(period = parseInt(g_preferences.periodNew)) ? 1 : period;
		if (period > 3) period = 3;

		ZenMoney.trace('Начальный период загрузки операций: '+ period);

		// загружать операции нужно
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
		}
		else
			createSyncTime = Date.now();

		ZenMoney.setData('createSync', createSyncTime);

		if (period <= 0) {
			ZenMoney.trace('Подключение без операций. Первый запуск. Операции пропускаем.');
			ZenMoney.saveData();
			return;
		}
	}

	var lastSyncTime = ZenMoney.getData('last_sync', 0);
	ZenMoney.trace('LastSyncTime: '+ new Date(lastSyncTime) +' ('+ lastSyncTime +')');

	// всегда захватываем одну неделю минимум для обработки hold-операций
	if (lastSyncTime) {
		lastSyncTime -= 7 * 24 * 60 * 60 * 1000;
		ZenMoney.trace('NeedSyncTime: ' + new Date(lastSyncTime) + ' (' + lastSyncTime + ')');

		// если есть время последней синхронизации, то всегда работаем от него
		// lastSyncTime = Math.max(lastSyncTime, createSyncTime);
	} else
		lastSyncTime = createSyncTime;

	ZenMoney.trace('WorkSyncTime: ' + new Date(lastSyncTime) + ' (' + lastSyncTime + ')');

	if (lastSyncTime <= 0)
		throw new ZenMoney.Error('Ошибка инициализации плагина 2.');

	var lastSyncDate = new Date(lastSyncTime);
	var startDate = n2(lastSyncDate.getDate()) +'.'+ n2(lastSyncDate.getMonth() + 1) +'.'+ lastSyncDate.getFullYear() +' '+ n2(lastSyncDate.getHours()) +':'+ n2(lastSyncDate.getMinutes());
	ZenMoney.trace('Запрашиваем операции с ' + startDate);

	var transactions = requestJson("operations", null, {
		"start": 	lastSyncTime
		//"start":    Date.parse('2017-08-27T00:00'),
		//"end":      Date.parse('2017-08-27T23:00')
	});
	ZenMoney.trace('Получено операций: '+transactions.payload.length);
	ZenMoney.trace('JSON: '+JSON.stringify(transactions.payload));

	var tranDict = {};      // список найденных оперций
	var tranDictHold = {};  // список ключей операций для контроля холдов и акцептов в одной выписке
	var paymentsDict = {};  // список идентификаторов переводов


	for (var i = 0; i < transactions.payload.length; i++) {
		var t = transactions.payload[i];

		if (t.operationTime.milliseconds > lastSyncTime)
			lastSyncTime = t.operationTime.milliseconds;

		// работаем только по активным счетам
		if (!in_array(t.account, g_accounts))
			continue;

		// учитываем только успешные операции
		if (t.status && t.status == 'FAILED')
			continue;

		var tran = {};
		var dt = new Date(t.operationTime.milliseconds);
		tran.date = n2(dt.getDate()) + '.' + n2(dt.getMonth() + 1) + '.' + dt.getFullYear();
		tran.time = n2(dt.getHours()) + ':' + n2(dt.getMinutes() + 1) + ':' + n2(dt.getSeconds()); // для внутреннего использования
		tran.created = t.operationTime.milliseconds;

		if (t.accountAmount.value == 0) {
			ZenMoney.trace('Пропускаем пустую операцию #' + i + ': ' + tran.date + ', ' + tran.time + ', ' + t.description + ', '
				+ (t.type == "Credit" ? '+' : (t.type == "Debit" ? '-' : '')) + t.accountAmount.value);
			continue;
		}

		// ИТОГИ АНАЛИЗА:
		//   id - уникальный идентификатор операции (технический идетификатор)
		//   paymentId - идентификатор финансового документа/проводки
		//   ucid - не понятная и не уникальная фигня :(

		// Внутренний ID операции
		var tranId = t.payment && t.payment.paymentId
			// если есть paymentId, объединяем по нему, отделяя комиссии от переводов
			? (t.group == 'CHARGE' ? 'f' : 'p') + t.payment.paymentId
			// либо работаем просто как с операциями, разделяя их на доходы и расходы
			: t.id;

		// отделяем акцепт от холда временем дебетового списания
		tran.id = t.debitingTime ? t.id : 'tmp#' + t.id;

		ZenMoney.trace('Добавляем операцию #' + i + ': ' + tran.date + ', ' + tran.time + ', ' + t.description + ', '
			+ (t.type == "Credit" ? '+' : (t.type == "Debit" ? '-' : '')) + t.accountAmount.value
			+ ' [' + tranId + '] acc:' + t.account);
		//ZenMoney.trace('JSON: '+JSON.stringify(t));

		// флаг операции в валюте
		var foreignCurrency = t.accountAmount.currency.name != t.amount.currency.name;

		// ключ для поиска дублей по идентификатору
		var tranKey = t.type + ':' + tranId;
		// обратный ключ для второй половины перевода
		var tranKey2 = (t.type == 'Debit' ? 'Credit' : 'Debit') + ':' + tranId;

		// ключ контроля дублей по холду
		var payee = '-payee-';
		if (t.payment && t.payment.fieldsValues) {
			if (t.payment.fieldsValues.addressee)
				payee = t.payment.fieldsValues.addressee;
			else if (t.payment.fieldsValues.lastName)
				payee = t.payment.fieldsValues.lastName;
		} else if (t.merchant)
			payee = t.merchant.name;
		else if (t.brand)
			payee = t.brand.name;
		var tranKeyHold = tran.created+':'+t.accountAmount.value+':'+t.account+':'+payee;
		//ZenMoney.trace('tranKeyHold: '+tranKeyHold);

		// холд пропускаем ----------------------------------------------------------------
		if (!t.debitingTime && (tranDict[tranKey] || tranDictHold[tranKeyHold]))
			continue;

		// перевод ------------------------------------------------------------------------
		if (tranDict[tranKey2])
		{
			// доходная часть перевода ---
			if (t.type == 'Credit' && tranDict[tranKey2].income == 0 && tranDict[tranKey2].incomeAccount != t.account)
			{
				tranDict[tranKey2].income = t.accountAmount.value;
				tranDict[tranKey2].incomeAccount = t.account;

				// операция в валюте
				if (foreignCurrency) {
					tranDict[tranKey2].opOutcome = t.amount.value;
					tranDict[tranKey2].opOutcomeInstrument = t.amount.currency.name;
				}

				tranDict[tranKey2].incomeBankID = tran.id;
				tranDict[tranKey2].outcomeBankID = tranDict[tranKey2].id;
				delete tranDict[tranKey2].id;

				tranDict['Transfer:'+tranId] = tranDict[tranKey2];
				delete tranDict[tranKey2];

				ZenMoney.trace('Объединили операцию в перевод с имеющейся ID '+ tranId);
				continue;
			}

			// расходная часть перевода ----
			if (t.type == 'Debit' && tranDict[tranKey2].outcome == 0 && tranDict[tranKey2].outcomeAccount != t.account)
			{
				tranDict[tranKey2].outcome = t.accountAmount.value;
				tranDict[tranKey2].outcomeAccount = t.account;

				// операция в валюте
				if (foreignCurrency) {
					tranDict[tranKey2].opOutcome = t.amount.value;
					tranDict[tranKey2].opOutcomeInstrument = t.amount.currency.name;
				}

				// при объединении в перевод всегда берём комментарий из расходной части
				if (t.operationPaymentType == 'TEMPLATE')
					tranDict[tranKey2].comment = t.description; // наименование шаблона
				else {
					// добавим в перевод коммент из расходной части
					tranDict[tranKey2].comment = '';
					if (t.merchant)
						tranDict[tranKey2].comment = t.merchant.name + ": ";
					tranDict[tranKey2].comment += t.description;
				}

				tranDict[tranKey2].incomeBankID = tranDict[tranKey2].id;
				tranDict[tranKey2].outcomeBankID = tran.id;
				delete tranDict[tranKey2].id;

				tranDict['Transfer:'+tranId] = tranDict[tranKey2];
				delete tranDict[tranKey2];

				ZenMoney.trace('Объединили операцию в перевод с имеющейся ID '+ tranId);
				continue;
			}
		}

		// акцепт холда ------------------------------------------------------------------
		if (tranDictHold[tranKeyHold])
		{
			var t2 = tranDict[tranDictHold[tranKeyHold]];
			ZenMoney.trace('Обнаружили акцепт холда: #'+ t2.id + ' => #'+ t.id);
			t2.id = t.id;
			continue;
		}

		// доход -------------------------------------------------------------------------
		if (t.type == "Credit")
		{
			tran.income = t.accountAmount.value;
			tran.incomeAccount = t.account;
			tran.outcome = 0;
			tran.outcomeAccount = tran.incomeAccount;

			if (t.group) {
				switch (t.group) {
					// Пополнение наличными
					case "CASH":
						if (!t.partnerType || t.partnerType != "card2card") {
							tran.outcomeAccount = "cash#" + t.amount.currency.name;
							tran.outcome = t.amount.value;
						}
						break;

					// Если совсем ничего не подошло
					default:
						if (t.subgroup) {
							switch (t.subgroup.id) {
								// перевод от другого клиента банка
								case "C4":
									tran.payee = t.description;
									break;
							}
						}

						if (!tran.payee) {
							if (t.operationPaymentType == 'TEMPLATE')
								tran.comment = t.description; // наименование шаблона
							else {
								tran.comment = '';
								if (t.merchant)
									tran.comment = t.merchant.name + ": ";
								tran.comment += t.description;
							}
						}
						else {
							// если получатель определился, то нет необходимости писать его и в комментарии
							if (t.merchant)
								tran.comment = t.merchant.name;
						}
				}
			} else {
				tran.comment = '';
				if (t.merchant)
					tran.comment = t.merchant.name + ": ";
				tran.comment += t.description;
			}

			// операция в валюте
			if (foreignCurrency) {
				tran.opIncome = t.amount.value;
				tran.opIncomeInstrument = t.amount.currency.name;
			}
		}
		// расход -----------------------------------------------------------------
		else if (t.type == "Debit")
		{
			tran.outcome = t.accountAmount.value;
			tran.outcomeAccount = t.account;
			tran.income = 0;
			tran.incomeAccount = tran.outcomeAccount;

			if (t.group) {
				switch (t.group)
				{
					// Снятие наличных
					case "CASH":
						if (!t.partnerType || t.partnerType != "card2card") {
							tran.incomeAccount = "cash#" + t.amount.currency.name;
							tran.income = t.amount.value;
						}
						break;

					// Перевод
					case "TRANSFER":
						if (t.payment && t.payment.fieldsValues)
						{
							if (t.payment.fieldsValues.addressee)
								tran.payee = t.payment.fieldsValues.addressee;
							else if (t.payment.fieldsValues.lastName)
								tran.payee = t.payment.fieldsValues.lastName;
						}

						if (t.operationPaymentType == 'TEMPLATE')
							tran.comment = t.description; // наименование шаблона
						else {
							tran.comment = '';
							if (t.merchant)
								tran.comment = t.merchant.name + ": ";
							tran.comment += t.description;
						}
						break;

					// Плата за обслуживание
					case "CHARGE":
						tran.comment = t.description;
						break;

					// Платеж
					case "PAY":
						if (t.operationPaymentType && t.operationPaymentType == "REGULAR") {
							tran.payee = t.brand ? t.brand.name : t.description;
						} else {
							tran.payee = t.merchant ? t.merchant.name : t.description;
						}

						// MCC
						if (t.mcc && !isNaN(mcc = parseInt(t.mcc)) && mcc > 99) {
							tran.mcc = mcc; // у Тинькова mcc-коды используются для своих нужд
						}

						break;

					// Если совсем ничего не подошло
					default:
						tran.comment = t.description;
				}
			}

			// операция в валюте
			if (foreignCurrency) {
				tran.opOutcome = t.amount.value;
				tran.opOutcomeInstrument = t.amount.currency.name;
			}

			// местоположение
			if (t.locations && is_array(t.locations) && t.locations.length > 0) {
				tran.latitude = t.locations[0].latitude;
				tran.longitude = t.locations[0].longitude;
			}
		}


		//ZenMoney.trace('Операция!!! ' + tranId);
		tranDict[tranKey] = tran;
		tranDictHold[tranKeyHold] = tranKey;
	}

	ZenMoney.trace('Всего операций добавлено: '+ Object.getOwnPropertyNames(tranDict).length);
	ZenMoney.trace('JSON: '+ JSON.stringify(tranDict));
	for (var k in tranDict)
		ZenMoney.addTransaction(tranDict[k]);

	//ZenMoney.setData('last_sync', lastSyncTime);
	//ZenMoney.trace('LastSyncTime: '+ lastSyncTime);
	//ZenMoney.trace('Следующий период синхронизации с '+ new Date(lastSyncTime));

	var nextSyncTime = Date.now();
	ZenMoney.setData('last_sync', nextSyncTime);
	ZenMoney.saveData();

	ZenMoney.trace('NextSyncTime: ' + new Date(nextSyncTime) + ' (' + nextSyncTime + ')');
}

/**
 * Перевод между счетами
 * @param {String} fromAcc Идентификатор счёта-источника
 * @param {String} toAcc Идентификатор счёта-назначения
 * @param {Number} sum Сумма перевода
 */
function makeTransfer(fromAcc, toAcc, sum){
	g_preferences = ZenMoney.getPreferences();
	login();

	ZenMoney.trace('Перевод ' + sum + ' со счёта ' + fromAcc + ' на счёт ' + toAcc);

	// определим валюту счёта-источника
	var fromCurr = ZenMoney.getData('accCurrency'+fromAcc, '');
	if (!fromCurr) {
		// определим валюту счёта
		ZenMoney.trace('Запрашиваем данные по счетам...');

		var accounts = requestJson("accounts_flat");
		//ZenMoney.trace('JSON счетов: '+JSON.stringify(accounts.payload));

		for (var iAcc = 0; iAcc < accounts.payload.length; iAcc++) {
			var acc = accounts.payload[iAcc];
			if (acc.id != fromAcc)
				continue;

			fromCurr = acc.moneyAmount.currency.name;

			ZenMoney.trace('Нашли счёт '+ fromAcc +' и определили валюту как '+ fromCurr);

			ZenMoney.setData('accCurrency'+ fromAcc, fromCurr);
			ZenMoney.saveData();

			break;
		}
	}

	if (!fromCurr)
		throw new ZenMoney.Error('Не удалось определить валюту счёта-источника');

	// если во время перевода произойдёт ошибка, будет выброшен эксепшен
	var payment = requestJson("pay", null, {
		"payParameters": JSON.stringify({
			"account": fromAcc,
			"provider": "transfer-inner",
			"currency": fromCurr,
			"moneyAmount": sum,
			"moneyCommission": sum,
			"providerFields": {
				"bankContract": toAcc
			}
		})
	});

	//ZenMoney.trace('JSON перевода: '+ JSON.stringify(payment));
}

/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) {
	return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

/**
 * Обработка JSON-строки в объект
 * @param html
 */
function getJson(html) {
	try {
		return JSON.parse(html);
	} catch (e) {
		ZenMoney.trace('Bad json (' + e.message + '): ' + html);

		// попытаемся представить, что это html
		if (/технические\s+работы/i.exec(html))
			throw new ZenMoney.Error('Сервер банка сообщает о технических работах. Попробуйте повторить позднее.');

		throw new ZenMoney.Error('Сервер банка вернул ошибочные данные: ' + e.message);
	}
}

/**
 * Выполнение запроса с получением JSON-результата
 * @param requestCode
 * @param data
 * @param parameters
 * @returns {*}
 */
function requestJson(requestCode, data, parameters) {
	var params = [];
	parameters || (parameters = {});
	g_sessionid && params.push(encodeURIComponent("sessionid") + "=" + encodeURIComponent(g_sessionid));

	if (data)
		for (var d in data) params.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
	params.push(encodeURIComponent("appVersion") + "=" + encodeURIComponent("3.1.0"));
	params.push(encodeURIComponent("platform") + "=" + encodeURIComponent("android"));
	params.push(encodeURIComponent("origin") + "=" + encodeURIComponent("mobile,ib5,loyalty"));
	g_deviceid && params.push(encodeURIComponent("deviceId") + "=" + encodeURIComponent(g_deviceid));

	if (parameters.post)
		data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
	else {
		if (parameters) for (var k in parameters) params.push(encodeURIComponent(k) + "=" + encodeURIComponent(parameters[k]));
		data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
	}

	if (!data) {
		ZenMoney.trace('Пришёл пустой ответ во время запроса по адресу "'+ g_baseurl + requestCode + '". Попытаемся ещё раз...');

		if (parameters.post)
			data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
		else {
			if (parameters) for (var k2 in parameters) params.push(encodeURIComponent(k2) + "=" + encodeURIComponent(parameters[k2]));
			data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
		}
	}

	data = getJson(data);

	if ("OK" != data.resultCode && !parameters.noException) {
		ZenMoney.trace("Ошибка: " + requestCode + ", " + data.errorMessage);
		throw new ZenMoney.Error((parameters.scope ? parameters.scope + ": " : "") + (data.plainMessage || data.errorMessage));
	}
	return data
}

function in_array(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}

function is_array(arr) {
	return Object.prototype.toString.call(arr) === '[object Array]';
}

function n2(n) {
	return n < 10 ? '0' + n : '' + n;
}