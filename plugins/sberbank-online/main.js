var g_headers = {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		'Connection': 'keep-alive',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36'
	},
	g_nodeurl = '',
	g_preferences;

/**
 * Основной метод
 */
function main() {
	//makeTransfer('card:21237288', 'account:12632802', 10);
	//return;

	g_preferences = ZenMoney.getPreferences();

	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);
	if (!g_preferences.pin) throw new ZenMoney.Error("Введите ПИН-код мобильного приложения Сбербанк Онлайн!", null, true);

	loginAPI();

	processApiAccounts();
	processApiTransactions();

	ZenMoney.trace('------------------------------------');
	ZenMoney.trace('Добавлем счета и операции.');
	for (var iAcc in g_accounts) {
		var acc = g_accounts[iAcc];

		if (acc.hasOwnProperty('mainCard') && acc.mainCard) {
			ZenMoney.trace('Счёт дополнительной карты "' + acc.account.title + '" пропускаем. Операции сажаем на основной счёт.');
		} else {
			ZenMoney.trace('JSON "' + acc.account.title + '": ' + JSON.stringify(acc.account));
			ZenMoney.addAccount(acc.account);
		}

		ZenMoney.trace(acc.transactions ? 'JSON операции: ' + JSON.stringify(acc.transactions) : 'Операций нет.');
		ZenMoney.addTransaction(acc.transactions);

	}
	ZenMoney.setResult({success: true});
}

/**
 * Вход через API
 */
function loginAPI() {
	ZenMoney.trace('Входим через API мобильного приложения...');

	var defaultPin = g_preferences.pin;

	// Здесь нужно узнать, нужна ли привязка
	var guid = ZenMoney.getData('guid', '');
	var devid = ZenMoney.getData('devid', '');
	if (!devid) {
		devid = hex_md5(g_preferences.login);
		ZenMoney.setData('devid', devid);
	}
	var pin = ZenMoney.getData('pin', defaultPin);
	ZenMoney.setData('pin', pin);

	if (guid) {
		ZenMoney.trace('Устройство уже привязано!');

		try {
			html = requestApiLogin('login.do', {
				'operation': 'button.login',
				'mGUID': guid,
				'devID': devid,
				'password': pin,
				'mobileSdkData': JSON.stringify(createSdkData())
			});
		} catch (e) {
			if (e.code == 7) {
				ZenMoney.trace(e.message + ": Надо перегенерить guid");
				guid = null;
			} else {
				ZenMoney.trace('Ошибка входа: ' + clearHtml(html));
				throw e;
			}
		}
	}

	if (!guid) {
		ZenMoney.trace('Необходимо привязать устройство!');

		// регистрируем девайс
		var html = requestApiLogin('registerApp.do', {
			'operation': 'register',
			'login': g_preferences.login,
			'devID': devid
		});

		var mGUID = getElement(html, /<mGUID>/i, replaceTagsAndSpaces);
		if (!mGUID) {
			ZenMoney.trace('Ошибка регистрации: ' + clearHtml(html));
			throw new ZenMoney.Error("Не удалось найти токен регистрации, сайт изменен?");
		}

		// ждём смс кода
		var code = ZenMoney.retrieveCode('Введите пароль регистрации из СМС для подключения импорта операций из Сбербанк Онлайн для Android', null, {
			time: 120000,
			inputType: 'number'
		});

		if (!code || code == 0 || String(code).trim() == '')
			throw new ZenMoney.Error('Получен пустой код авторизации устройства', true);
		else
			ZenMoney.trace('Код авторизации получен.');

		html = requestApiLogin('registerApp.do', {
			'operation': 'confirm',
			'mGUID': mGUID,
			'smsPassword': code
		});
		ZenMoney.trace('Успешно привязали устройство.');

		html = requestApiLogin('registerApp.do', {
			'operation': 'createPIN',
			'mGUID': mGUID,
			'password': pin,
			'isLightScheme': 'true',
			'devID': devid,
			'mobileSdkData': JSON.stringify(createSdkData())
		});

		ZenMoney.setData('guid', mGUID);
		ZenMoney.saveData();
	}

	var token = getToken(html);
	if (!token) {
		ZenMoney.trace('Ошибка токена: ' + clearHtml(html));
		throw new ZenMoney.Error('Не удалось получить токен авторизации. Сайт изменен?');
	}

	html = requestApi('postCSALogin.do', {'token': token});
	return token;
}

/**
 * Запрос на вход через API
 * @param action
 * @param params
 * @param ignoreErrors
 */
function requestApiLogin(action, params, ignoreErrors) {
	var baseurl = 'https://online.sberbank.ru:4477/CSAMAPI/';
	return requestApiInner(baseurl + action, params, false, ignoreErrors);
}

/**
 * Запрос метода API
 * @param action
 * @param params
 * @param ignoreErrors
 */
function requestApi(action, params, ignoreErrors) {
	var baseurl = 'https://node1.online.sberbank.ru:4477/mobile9/';
	return requestApiInner(baseurl + action, params, true, ignoreErrors);
}

/**
 * Базовый вызов метода API
 * @param url
 * @param params
 * @param no_default_params
 * @param ignoreErrors
 */
function requestApiInner(url, params, no_default_params, ignoreErrors) {
	var m_headers = {
		'Connection': 'keep-alive',
		'User-Agent': 'Mobile Device'
	}, newParams;

	if (no_default_params) {
		newParams = params;
	} else {
		newParams = joinObjects(params, {
			'version': '9.10',
			'appType': 'android',
			'appVersion': '7.1.0',
			'deviceName': 'ZenMoneyAPI'
		});
	}
	// регистрируем девайс
	var html = ZenMoney.requestPost(url, newParams, m_headers);
	// Проверим на правильность

	var code = getParam(html, /<status>\s*<code>\s*(-?\d+)\s*<\/code>/i, null, parseBalance);

	if (!/<status>\s*<code>\s*0\s*<\/code>/i.test(html)) {
		ZenMoney.trace('Ответ с ошибкой от ' + url + ': ' + clearHtml(html));
		if (!ignoreErrors) {
			var error = getParam(html, /<text>\s*(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?\s*<\/text>/i);
			ZenMoney.trace('error: ' + error);
			var ex = new ZenMoney.Error(error || "Ошибка при обработке запроса к " + url, null, /не может быть|неправильный идентификатор|неправильный пароль/i.test(error));
			ex.code = code;
			throw ex;
		}
	}
	return html;
}

var g_accounts = {};		// список добавленных счетов, по которым будем обрабатывать операции
/**
 * Обработка счетов через API
 */
function processApiAccounts() {
	var xml = requestApi('private/products/list.do', {showProductType: 'cards,accounts,imaccounts,loans'});
	ZenMoney.trace('Запрашиваем данные по всем счетам...');
	ZenMoney.trace('list.do: ' + xml);
	var accDict = [];

	//--- карты ------------------------------
	var cards = getElementsByTag(xml, 'card');
	var additionalCards = [];
	ZenMoney.trace('Получено карт: ' + cards.length);
	for (var i = 0; i < cards.length; i++) {
		var card = cards[i];

		// обрабатываем только активные карты
		var state = getElementByTag(card, 'state');
		if (!state || state != 'active')
			continue;

		id = getElementByTag(card, 'id', replaceTagsAndSpaces);

		if (isAccountSkipped('card:' + id))
			continue;

		balance = getElementByTag(card, 'availableLimit');

		//ZenMoney.trace('id: '+id);
		var acc = {
			id: id,
			title: getElementByTag(card, 'name', replaceTagsAndSpaces),
			type: 'ccard',
			syncID: [],
			instrument: getElementByTag(balance, 'code', replaceTagsAndSpaces),
			balance: getElementByTag(balance, 'amount', replaceFloat, parseToFloat),
			mainCard: ''	// идентификатор основной карты, если эта - дополнительная
		};

		var cardNum = getAccNumber(card);

		// отдельно обрабатываем доп.карты
		var mainCardId = getElementByTag(card, 'mainCardId');
		if (mainCardId) {
			mainCardIdStr = 'card:' + mainCardId;

			// сохраним номер доп.карты у родителя
			var cardMain;
			for (var j = 0; j < accDict.length; j++) {
				cardMain = accDict[j];

				if (cardMain.id != mainCardIdStr) continue;

				if (cardNum && cardNum != '')
					cardMain.syncID.push(cardNum);
				break;
			}

			// отметим, что это доп.карта, чтобы не добавлять её отдельно
			acc.mainCard = mainCardIdStr;
			if (cardMain)
				ZenMoney.trace('Замечена дополнительная карта: ' + acc.title + ' (#' + id + ') к карте ' + cardMain.title + ' (#' + mainCardIdStr + ')');
			else {
				additionalCards[mainCardId] = cardNum;
				ZenMoney.trace('Замечена дополнительная карта: ' + acc.title + ' (#' + id + ') к неизвестной пока карте (#' + mainCardIdStr + ')');
			}
		}
		else {
			// сохраним номер карты
			if (cardNum && cardNum != '')
				acc.syncID.push(cardNum);

			if (getElementByTag(card, 'type', replaceTagsAndSpaces) == 'credit') {
				// обработаем свойства кредитных карт
				var xml2 = requestApi('private/cards/info.do', {id: id}, true);
				var creditLimits = getElementByTag(xml2, ['limit', 'amount'], replaceTagsAndSpaces, parseToFloat);
				if (creditLimits > 0) {
					acc.creditLimit = creditLimits;
					acc.balance = Math.round((acc.balance - acc.creditLimit) * 100) / 100;
				}

				ZenMoney.trace('Добавляем кредитную карту: ' + acc.title + ' (#' + id + ')');
			}
			else {
				// для дебетовок добавим также и syncID лицевого счёта
				var cardAcc = getElementByTag(card, 'cardAccount', replaceTagsAndSpaces);
				if (cardAcc && cardAcc != '') {
					cardAcc = cardAcc.substr(-4);
					acc.syncID.push(cardAcc);
				}

				ZenMoney.trace('Добавляем дебетовую карту: ' + acc.title + ' (#' + id + ')');
			}
		}

		if (acc.syncID.length > 0) {
			acc.id = 'card:' + acc.id; // для переводов необходим тип счёта
			g_accounts[id] = {account: acc};
			accDict.push(acc);
		}
	}

	// обработаем доп.карты, отложенные на потом
	for (var addCard in additionalCards) {
		if (!g_accounts[addCard])
			continue;

		var mainCard = g_accounts[addCard].account;
		mainCard.syncID.push(additionalCards[addCard]);
		ZenMoney.trace('Записали дополнительную карту *'+ additionalCards[addCard] +' к карте ' + mainCard.title + ' (#' + addCard + ')');
	}


	//--- счета ------------------------------
	var accounts = getElementsByTag(xml, 'account');
	ZenMoney.trace('Получено счетов: ' + accounts.length);
	for (var k = 0; k < accounts.length; k++) {
		var account = accounts[k];
		state = getElementByTag(account, 'state');
		if (state != 'OPENED')
			continue;

		id = getElementByTag(account, 'id', replaceTagsAndSpaces);

		if (isAccountSkipped('account:' + id))
			continue;

		balance = getElementByTag(account, 'balance');

		acc = {
			id: id,
			title: getElementByTag(account, 'name', replaceTagsAndSpaces),
			type: 'checking',
			syncID: [],
			instrument: getElementByTag(balance, 'code', replaceTagsAndSpaces),
			balance: getElementByTag(balance, 'amount', replaceFloat, parseToFloat)
		};

		var accNum = getAccNumber(account);
		if (accNum && accNum != '')
			acc.syncID.push(accNum);

		var rate = getElementByTag(account, 'rate', replaceFloat, parseToFloat);
		if (rate > 0) {
			// дополнительная информация по вкладам
			var xml3 = requestApi('private/accounts/info.do', {id: id}, true);
			//ZenMoney.trace('XML-XML: '+xml3);

			acc.type = 'deposit';
			acc.percent = rate;
			acc.capitalization = true;
			acc.startDate = getElementByTag(xml3, 'open', replaceTagsAndSpaces).substr(0, 10);
			acc.endDateOffsetInterval = 'year';
			acc.endDateOffset = 1;
			acc.payoffInterval = 'month';
			acc.payoffStep = 1;
		}

		ZenMoney.trace('Добавляем сберегательный счёт: ' + acc.title + ' (#' + id + ')');

		acc.id = 'account:' + acc.id; // для переводов необходим тип счёта
		g_accounts[id] = {account: acc};
		accDict.push(acc);
	}

	//--- кредиты ------------------------------
	var loans = getElementsByTag(xml, 'loan');
	ZenMoney.trace('Получено кредитов: ' + loans.length);
	for (var l = 0; l < loans.length; l++) {
		var loan = loans[l];

		// у кредитов статус 'undefined'
		/*state = getElementByTag(loan, 'state');
		 if (state != 'OPENED')
		 continue;*/

		id = getElementByTag(loan, 'id', replaceTagsAndSpaces);

		if (isAccountSkipped('loan:' + id))
			continue;

		acc = {
			id: id,
			title: getElementByTag(loan, 'name', replaceTagsAndSpaces),
			type: 'loan',
			instrument: getElementByTag(loan, 'code', replaceTagsAndSpaces),
		};

		// дополнительная информация по кредиту
		var xml4 = requestApi('private/loans/info.do', {id: id}, true);
		ZenMoney.trace('info.do по кредиту: ' + xml4);

		acc.type = 'loan';
		acc.syncID = getElementByTag(xml4, 'accountNumber', replaceTagsAndSpaces).substr(-4);
		acc.percent = getElementByTag(xml4, 'creditingRate', replaceTagsAndSpaces, parseToFloat);
		acc.capitalization = getElementByTag(xml4, 'repaymentMethod', replaceTagsAndSpaces).toLowerCase().indexOf('аннуитетный') >= 0;
		acc.startBalance = getElementByTag(xml4, ['origianlAmount', 'amount'], replaceTagsAndSpaces, parseToFloat);
		/*acc.balance = -(getElementByTag(xml4, ['mainDeptAmount', 'amount'], replaceTagsAndSpaces, parseToFloat) +
		 getElementByTag(xml4, ['interestsAmount', 'amount'], replaceTagsAndSpaces, parseToFloat));*/
		acc.balance = getElementByTag(xml4, ['detail', 'remainAmount', 'amount'], replaceTagsAndSpaces, parseToFloat) * -1;

		var start = getElementByTag(xml4, 'termStart', replaceTagsAndSpaces).substr(0, 10);
		var end = getElementByTag(xml4, 'termEnd', replaceTagsAndSpaces).substr(0, 10);
		var dt1 = new Date(start.substr(6, 4), start.substr(3, 2) - 1, start.substr(0, 2));
		var dt2 = new Date(end.substr(6, 4), end.substr(3, 2) - 1, end.substr(0, 2));
		var days = Math.floor((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
		acc.startDate = start;
		acc.endDateOffsetInterval = 'day';
		acc.endDateOffset = days;
		acc.payoffInterval = 'month';
		acc.payoffStep = 1;

		ZenMoney.trace('Добавляем счёт кредита: ' + acc.title + ' (#' + id + ')');
		ZenMoney.trace('info.do: ' + xml4);

		acc.id = 'loan:' + acc.id; // а для переводов, чтобы они не выделялись на фоне остальных
		g_accounts[id] = {account: acc};
		accDict.push(acc);
	}

	ZenMoney.trace('Всего счетов найдено: ' + accDict.length);
}

/**
 * Получить код счёта (4 последние цифры)
 * @param card
 * @returns {*}
 */
function getAccNumber(card) {
	cardNum = getElementByTag(card, 'smsName', replaceTagsAndSpaces);
	if (cardNum && cardNum != '')
		return cardNum;

	cardNum = getElementByTag(card, 'number', replaceTagsAndSpaces);
	if (cardNum && cardNum != '') {
		cardNum = cardNum.replace(' ', '');
		cardNum = cardNum.substr(-4);
		return cardNum;
	}

	return null;
}

/**
 * Обработка транзакций через API
 */
function processApiTransactions() {
	var createSyncTime = ZenMoney.getData('create_sync', 0);

	// первый запуск, загружать операции не нужно
	if (createSyncTime == 0 && g_preferences.loadOperations < 1) {
		ZenMoney.trace('Подключение без операций. Первый запуск. Операции пропускаем.');
		createSyncTime = Date.now();
		ZenMoney.setData('create_sync', createSyncTime);
		ZenMoney.saveData();
		return;
	}

	ZenMoney.trace('------------------------------------------------');

	if (createSyncTime > 0) {
		var dtCr = new Date(createSyncTime);
		ZenMoney.trace('Дата создания подключения: ' + dtCr.toLocaleString());
	}

	ZenMoney.trace('Запрашиваем данные API по последним операциям...');

	var tranDict = [];
	for (var g_accID in g_accounts) {
		var acc = g_accounts[g_accID].account, xml, operations, tran, dtTran, dtStr, sum, description, tranInstrument = false;
		ZenMoney.trace(acc.title + ': ' + g_accID);

		var dtPatch, parsingPatch, instrument;
		switch (acc.type) {
			//--- карты ----------------------
			case 'ccard':
				ZenMoney.trace('Запрашиваем последние 10 операций по карте "' + acc.title + '"');
				xml = requestApi('private/cards/abstract.do', {
					id: g_accID,
					count: 100,
					paginationSize: 100
				}, true);
				ZenMoney.trace('XML: ' + xml);

				// Если доступа в API нет, пытаемся загрузить из веба
				if (xml.indexOf("АБС временно недоступна") >= 0) {
					ZenMoney.trace('Информация из АБС временно недоступна. Попытаемся загрузить с сайта веб-версии..');
					tranInstrument = true;
					xml = '';
				}

				operations = getElementsByTag(xml, 'operation');

				for (var i = 0; i < operations.length; i++) {
					var operation = operations[i];
					//ZenMoney.trace('Operation: '+ operation);

					dtStr = getElementByTag(operation, 'date', replaceTagsAndSpaces);
					tran = {
						date: dtStr.substr(0, 10)
					};

					sumElem = getElementByTag(operation, 'sum');
					instrument = getElementByTag(sumElem, ['currency', 'code'], replaceTagsAndSpaces);

					//if (true) { // ToDO: DEBUG
					if (instrument.toLocaleLowerCase() != acc.instrument.toLocaleLowerCase()) {
						if (!tranInstrument)
							ZenMoney.trace('Обнаружена валютная операция! Необходима подгрузка данных через веб-версию Сбербанк Онлайн.');

						tranInstrument = true;
						break;
					}

					sum = getElementByTag(sumElem, 'amount', replaceTagsAndSpaces, parseToFloat);
					if (!sum || Math.abs(sum) < 0.01)
						continue;
					else {
						var accId = acc.mainCard != '' ? acc.mainCard : acc.id;

						if (sum > 0) {
							tran.income = sum;
							tran.incomeAccount = accId;
							tran.outcome = 0;
							tran.outcomeAccount = accId;
						} else {
							tran.income = 0;
							tran.incomeAccount = accId;
							tran.outcome = -sum;
							tran.outcomeAccount = accId;
						}
					}

					// пропускаем операции до времени создания подключения, если операции загружать не нужно
					dtTran = Date.parse(dtStr.substr(6, 4)+'-'+dtStr.substr(3, 2)+'-'+dtStr.substr(0, 2));
					//ZenMoney.trace('Дата операции: '+ dtStr);
					if (createSyncTime > 0 && dtTran < createSyncTime) {
						ZenMoney.trace('Пропускаем операцию до времени создания подключения: ' + dtStr.substr(0, 10) + ', сумма ' + sum);
						continue;
					}

					description = getElementByTag(operation, 'description').trim();
					if (description) {
						if (description.substr(0, 9) == '<![CDATA[')
							description = description.substring(9, description.length - 3);

						dtPatch = getWebDate(tran.date, true);
						//ZenMoney.trace("dtPatch: "+ dtPatch);

						// с 16 февраля анализ получателей в вебе по Retail
						parsingPatch = Date.UTC(dtPatch.getFullYear(), dtPatch.getMonth(), dtPatch.getDate()) >= Date.UTC(2017, 1, 16);
						instrument = getElementByTag(operation, ['currency', 'code'], replaceTagsAndSpaces);
						if (parsingPatch)
						// новая схема обработки описания (после 16 февраля)
							parseTransactionDescription(description, sum, instrument, tran);

						else {
							if (/^Note\s+acceptance\s+/i.test(description) && sum > 0) {
								tran.outcome = sum;
								tran.outcomeAccount = 'cash#' + instrument;
							}
							else if (/^(?:ATM|ITT)\s+/i.test(description) && sum < 0) {
								tran.income = -sum;
								tran.incomeAccount = 'cash#' + instrument;
							}
							else {
								description = description.replace(/^Retail\s+/i, '');
								if (retail = /^Retail\s+(.*)/i.exec(description))
									tran.payee = retail[1];
								else
									tran.comment = description;
							}
						}
					}

					if (!g_accounts[g_accID].transactions) g_accounts[g_accID].transactions = [];
					g_accounts[g_accID].transactions.push(tran);
				}

				break;

			//--- счета ----------------------
			case 'deposit':
				var dt = new Date();
				var dtFrom = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
				ZenMoney.trace('Запрашиваем операции по счёту "' + acc.title + '" с ' + dtFrom.toLocaleString());

				xml = requestApi('private/accounts/abstract.do', {
					id: g_accID,
					from: fmtDate(dtFrom),
					to: fmtDate(dt),
					paginationSize: 1000,
					paginationOffset: 0
				});
				ZenMoney.trace('XML: ' + xml);

				operations = getElementsByTag(xml, 'operation');
				for (var k = 0; k < operations.length; k++) {
					operation = operations[k];
					dtStr = getElementByTag(operation, 'date', replaceTagsAndSpaces);
					tran = {
						date: dtStr.substr(0, 10)
					};

					sum = getElementByTag(operation, ['sum', 'amount'], replaceTagsAndSpaces, parseToFloat);
					if (!sum || Math.abs(sum) < 0.01)
						continue;
					else if (sum > 0) {
						tran.income = sum;
						tran.incomeAccount = acc.id;
						tran.outcome = 0;
						tran.outcomeAccount = acc.id;
					} else {
						tran.income = 0;
						tran.incomeAccount = acc.id;
						tran.outcome = -sum;
						tran.outcomeAccount = acc.id;
					}

					// пропускаем операции до времени создания подключения, если операции загружать не нужно
					dtTran = Date.parse(dtStr.substr(6, 4)+'-'+dtStr.substr(3, 2)+'-'+dtStr.substr(0, 2));
					//ZenMoney.trace('Дата операции: '+ dtStr);
					if (createSyncTime > 0 && dtTran < createSyncTime) {
						ZenMoney.trace('Пропускаем операцию до времени создания подключения: ' + dtStr.substr(0, 10) + ', сумма ' + sum);
						continue;
					}

					description = getElementByTag(operation, 'description').trim();
					if (description) {
						if (description.substr(0, 9) == '<![CDATA[')
							description = description.substring(9, description.length - 3);

						dtPatch = getWebDate(tran.date, true);
						//ZenMoney.trace("dtPatch: "+ dtPatch);

						// с 16 февраля анализ получателей в вебе по Retail
						parsingPatch = Date.UTC(dtPatch.getFullYear(), dtPatch.getMonth(), dtPatch.getDate()) >= Date.UTC(2017, 1, 16);
						instrument = getElementByTag(operation, ['currency', 'code'], replaceTagsAndSpaces);
						if (parsingPatch)
						// новая схема обработки описания (после 16 февраля)
							parseTransactionDescription(description, sum, instrument, tran);

						else {
							if (/^Note\s+acceptance\s+/i.test(description) && sum > 0) {
								tran.outcome = sum;
								tran.outcomeAccount = 'cash#' + instrument;
							}
							else if (/^(?:ATM|ITT)\s+/i.test(description) && sum < 0) {
								tran.income = -sum;
								tran.incomeAccount = 'cash#' + instrument;
							}
							else {
								description = description.replace(/^Retail\s+/i, '');
								if (retail = /^Retail\s+(.*)/i.exec(description))
									tran.payee = retail[1];
								else
									tran.comment = description;
							}
						}
					}

					if (!g_accounts[g_accID].transactions) g_accounts[g_accID].transactions = [];
					g_accounts[g_accID].transactions.push(tran);
				}
				break;

			//--- кредиты ----------------------
			case 'loan':
				// похоже, по кредитам операций нет
				ZenMoney.trace('Запрашиваем операции по кредиту "' + acc.title + '"');
				xml = requestApi('private/loans/abstract.do', {
					id: g_accID,
					count: 100,
					paginationSize: 100
				}, true);
				ZenMoney.trace('abstract.do: ' + xml);

				break;
		}

		// валютные операции смотрим в вебе
		if (tranInstrument) {
			html = loginWeb();

			var trans = processWebTransactions(g_accID, acc);
			if (trans && trans.length > 0)
				g_accounts[g_accID].transactions = trans;
		}

		if (g_accounts[g_accID].transactions) {
			ZenMoney.trace('Операций по счёту найдено: ' + g_accounts[g_accID].transactions.length);
			ZenMoney.trace('JSON: ' + JSON.stringify(g_accounts[g_accID].transactions));
		} else
			ZenMoney.trace('Операций по счёту не найдено.');
	}
}

/**
 * Перевод свободных денег в сбережения
 * @param fromAcc
 * @param toAcc
 * @param sum
 */
function makeTransfer(fromAcc, toAcc, sum) {
	g_preferences = ZenMoney.getPreferences();
	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);
	if (!g_preferences.pin) throw new ZenMoney.Error("Введите ПИН-код мобильного приложения Сбербанк Онлайн!", null, true);

	ZenMoney.trace('Перевод ' + sum + ' со счёта ' + fromAcc + ' на счёт ' + toAcc);

	// совершаем перевод между счетами через API
	var token = loginAPI();
	doTransferAPI(token, fromAcc, toAcc, sum);

	//loginWeb();
	//doTransferWeb(fromAcc, toAcc, sum);
}

/**
 * Перевод между своими счетами через API
 * @param token - токен соединения
 * @param fromAcc = 'card:12345678' (со счёта карты)
 * @param toAcc = 'account:12345678' (на счёт вклада)
 * @param sum - сумма перевода
 */
function doTransferAPI(token, fromAcc, toAcc, sum) {
	var xml = requestApi('private/payments/payment.do', {
		'transactionToken': token,
		'form': 'InternalPayment',
		'fromResource': fromAcc,
		'toResource': toAcc,
		'sellAmount': sum,
		'exactAmount': 'charge-off-field-exact',
		'operation': 'save'
	}, true);
	//ZenMoney.trace('Реквизиты перевода: '+ xml);

	if (!/<status>\s*<code>\s*0\s*<\/code>/i.test(xml))
		throw new ZenMoney.Error('Не удалось создать перевод.');

	token = getElementByTag(xml, 'transactionToken');
	//ZenMoney.trace('Токен: '+ token);

	var docNum = getElementByTag(xml, 'id');
	ZenMoney.trace('Номер документа: ' + docNum);

	if (docNum < 0) { // новый документ
		xml = requestApi('private/payments/confirm.do', {
			'mobileSdkData': JSON.stringify(createSdkData()),
			'transactionToken': token,
			'id': docNum,
			'operation': 'confirm'
		});

		//ZenMoney.trace('Запуск перевода: '+ xml);
		ZenMoney.trace('Перевод осуществлён.')
	}
	else
		throw new ZenMoney.Error("Не удалось выполнить перевод. Пожалуйста, обратитесь к разработчикам плагина.");
}


/**
 * Вход через web-интерфейс
 */
function loginWeb() {
	var baseurl = "https://online.sberbank.ru/CSAFront/login.do";

	var html = getLoggedInHtml();
	if (html) {
		ZenMoney.trace("В вебе уже залогинены, используем текущую сессию.");
		return html;
	}

	// Входим
	ZenMoney.setDefaultCharset('windows-1251');
	html = ZenMoney.requestPost(baseurl, {
		'field(login)': g_preferences.login,
		'field(password)': g_preferences.password,
		operation: 'button.begin'
	}, addHeaders({Referer: baseurl, 'X-Requested-With': 'XMLHttpRequest', Origin: 'https://online.sberbank.ru'}));
	ZenMoney.setDefaultCharset('utf-8');
	ZenMoney.trace('Пытаемся войти...');

	var error = getParam(html, /<h1[^>]*>О временной недоступности услуги[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i, replaceTagsAndSpaces, html_entity_decode);
	if (error)
		throw new ZenMoney.Error(error);

	error = getParam(html, /в связи с ошибкой в работе системы[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i, replaceTagsAndSpaces, html_entity_decode);
	if (error)
		throw new ZenMoney.Error(error);

	if (/\$\$errorFlag/i.test(html)) {
		error = getParam(html, /([\s\S]*)/, [replaceTagsAndSpaces, /^:/, ''], html_entity_decode);
		throw new ZenMoney.Error(error, null, /Ошибка идентификации/i.test(error));
	}

	var page = getParam(html, /value\s*=\s*["'](https:[^'"]*?AuthToken=[^'"]*)/i);
	if (!page)
		throw new ZenMoney.Error('Не удаётся пройти авторизацию.');

	if (/online.sberbank.ru\/PhizIC/.test(page)) {
		html = loginWebAccount(page);
	} else if (/Off_Service/i.test(page))
		throw new ZenMoney.Error("В настоящее время услуга Сбербанк Онлайн временно недоступна по техническим причинам. Сбербанк приносит свои извинения за доставленные" +
			" неудобства.");
	else {
		ZenMoney.trace('Текущий вариант Сбербанк Онлайн не поддерживается: ' + html);
		throw new ZenMoney.Error("К сожалению, текущий вариант Сбербанк-онлайн пока не поддерживается. Пожалуйста, обратитесь к разработчикам для исправления.");
	}

	return html;
}

/**
 * Регистрация для входа через web-интерфейс
 * @param page
 */
function loginWebAccount(page) {
	var baseurl = getParam(page, /^(https?:\/\/.*?)\//i);
	var html = ZenMoney.requestGet(page, addHeaders({Referer: baseurl}));
	g_nodeurl = baseurl;

	if (!html) {
		ZenMoney.trace('Почему-то получили пустую страницу... Попробуем ещё раз');
		html = ZenMoney.requestGet(page, addHeaders({Referer: baseurl}));
	}

	if (/StartMobileBankRegistrationForm/i.test(html)) {
		//Сбербанк хочет, чтобы вы приняли решение о подключении мобильного банка. Откладываем решение.
		var pageToken = getParamByName(html, 'PAGE_TOKEN');
		checkEmpty(pageToken, 'Попытались отказаться от подключения мобильного банка, но не удалось найти PAGE_TOKEN!', true);

		html = ZenMoney.requestPost(g_nodeurl + '/PhizIC/login/register-mobilebank/start.do', {
			PAGE_TOKEN: pageToken,
			operation: 'skip'
		}, addHeaders({Referer: baseurl}));
	}

	// Другой кейс, пользователь сменил идентификатор на логин
	if (/Ранее вы[^<]*уже создали свой собственный логин для входа/i.test(html)) {
		var err = getParam(html, /Ранее вы[^<]*уже создали свой собственный логин для входа[^<]*/i, replaceTagsAndSpaces);
		throw new ZenMoney.Error(err, null, true);
	}

	if (/PhizIC/.test(html)) {
		ZenMoney.trace('Заходим по адресу ' + baseurl);
		if (/confirmTitle/.test(html)) {
			var origHtml = html;

			// проверяем сначала тип подтверждения и переключаем его на смс, если это чек
			var active = getElement(html, /<div[^>]+clickConfirm[^>]+buttonGreen[^>]*>/i) || '';
			if (/confirmSMS/i.test(active)) {
				ZenMoney.trace('Запрошен смс-пароль...');
			} else if (/confirmCard/i.test(active)) {
				ZenMoney.trace('Запрошен пароль с чека. Это неудобно, запрашиваем пароль по смс.');
				html = ZenMoney.requestPost(baseurl + '/PhizIC/async/confirm.do', {
					'PAGE_TOKEN': getParamByName(origHtml, 'PAGE_TOKEN'),
					'operation': 'button.confirmSMS'
				}, addHeaders({Referer: baseurl, 'X-Requested-With': 'XMLHttpRequest'}));
			} else {
				ZenMoney.trace('Неизвестное подтверждение: ' + active + '. Надеемся, это смс.');
			}

			var pass = ZenMoney.retrieveCode('Введите пароль для входа в Сбербанк Онлайн из СМС.\n\nЕсли вы не хотите постоянно вводить СМС-пароли при входе, вы можете отменить' +
				' их в настройках вашего Сбербанк-онлайн. Это безопасно - для совершения денежных операций требование одноразового пароля всё равно останется.', null, {
				time: 300000,
				inputType: 'number'
			});

			if (!pass || pass == 0 || String(pass).trim() == '')
				throw new ZenMoney.Error('Получен пустой код для входа в веб-версию Сбербанк Онлайн', true);

			html = ZenMoney.requestPost(baseurl + '/PhizIC/async/confirm.do', {
				'receiptNo': '',
				'passwordsLeft': '',
				'passwordNo': '',
				'SID': '',
				'$$confirmSmsPassword': pass,
				'PAGE_TOKEN': getParamByName(origHtml, 'PAGE_TOKEN'),
				'operation': 'button.confirm'
			}, addHeaders({Referer: baseurl, 'X-Requested-With': 'XMLHttpRequest'}));

			//ZenMoney.trace('Ответ сразу после входа: '+ clearHtml(html));

			html = checkNext(html);
		}

		if (!isLoggedIn(html)) {
			var error = getElement(html, /<div[^>]+warningMessages[^>]*>/i, [replaceTagsAndSpaces, /Получите новый пароль, нажав.*/i, '']);
			if (error)
				throw new ZenMoney.Error(error);
		}

		checkAdditionalQuestions(html, baseurl);

		if (!isLoggedIn(html)) {
			var html1 = getLoggedInHtml(true);

			if (!isLoggedIn(html1)) {
				ZenMoney.trace('Не удалось войти в веб-версию Сбербанк Онлайн: ' + clearHtml(html1));
				throw new ZenMoney.Error('Не удалось войти в Cбербанк-онлайн. Сайт изменен?');
			}

			html = html1;
		}

	} else if (ZenMoney.getLastStatusCode() >= 400) {
		ZenMoney.trace(html);
		throw new ZenMoney.Error('Временные технические проблемы в Сбербанк-онлайн. Пожалуйста, попробуйте ещё раз позже.');
	} else {
		ZenMoney.trace(html);
		throw new ZenMoney.Error('Ваш тип личного кабинета не поддерживается. Свяжитесь, пожалуйста, с разработчиками.');
	}

	return html;
}

function processWebTransactions(id, acc) {
	if (!g_accounts[id])
		throw new ZenMoney.Error('Ошибка загрузки данных по счёту ' + id + ': нет такого счёта');

	if (acc.type == 'ccard') {
		ZenMoney.trace('Запрашиваем данные Web по последним операциям на карте "' + acc.title + '" (#' + id + ')');
		html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/cards/info.do?id=' + id);
	}
	else {
		ZenMoney.trace('Запрашиваем данные Web по последним операциям на счету "' + acc.title + '" (#' + id + ')');
		html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/accounts/operations.do?id=' + id);
	}

	// ToDo: DEBUG
	// html = '<div class="message">несуществующий счёт</div>';

	var tableElem = getParam(html, /<table[^>]*class="tblInf"[\s\S]*?\/table>/i);
	if (tableElem)
		ZenMoney.trace('HTML-таблица операций: ' + clearHtml(tableElem));
	else {
		var message = getParam(html, /<div[^>]*class="message"[\s\S]*?\/div>/i);
		if (message) {
			if (message.indexOf("несуществующ") >= 0) {
				// Если ID счёта из API не подошёл для веба, попытаемся определить ID по имени и номеру счёта
				ZenMoney.trace('Счёт API не существует. Пытаемся определить счёт в списке web-версии..');

				if (acc.type == 'ccard' || acc.type == 'checking') {

					// Запросим список карт/счетов на сайте
					if (acc.type == 'ccard') {
						html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/cards/list.do');
						ZenMoney.trace('Получили HTML списка карт: ' + clearHtml(html));
					}
					else {
						html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/accounts/list.do');
						ZenMoney.trace('Получили HTML списка счетов: ' + clearHtml(html));
					}

					// Отыщем нужную карту/счёт в списке
					var productRegex = /<div[^>]*class="productTitleText[\s\S]*?<span[^>]*class="mainProductTitle[\s\S]*?(?:info|operations)\.do\?id=(\d+)[^>]+>\s*([\s\S]*?)\s*<\/span>[\s\S]*?<div[^>]*class="(?:account|product)Number[\s\S]*?(\d{4})\b,/ig;
					var productID = 0;
					var productElem;
					while (productID == 0 && (productElem = productRegex.exec(html)) !== null) {
						if (productElem[2] == acc.title) {
							for (var k = 0; k < acc.syncID.length; k++) {
								if (productElem[3] == acc.syncID[k]) {
									productID = productElem[1];
									break;
								}
							}
						}
					}

					if (productID > 0) {
						// Снова пытаемся загрузить операции уже по новому ID
						ZenMoney.trace('Обнаружен новый ID счёта "' + acc.title + '" (#' + acc.id + ') = ' + productID + '. Снова запрашиваем данные по последним операциям..');
						if (acc.type == 'ccard')
							html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/cards/info.do?id=' + productID);
						else
							html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/accounts/operations.do?id=' + productID);

						tableElem = getParam(html, /<table[^>]*class="tblInf"[\s\S]*?\/table>/i);
						if (tableElem) {
							ZenMoney.trace('HTML-таблица операций: ' + clearHtml(tableElem));
							message = '';
						}
						else {
							message = getParam(html, /<div[^>]*class="message"[\s\S]*?\/div>/i);
							if (message) {
								ZenMoney.trace('Таблица операций всё равно не найдена, пропускаем счёт. Получено сообщение: ' + clearHtml(message));
								return;
							}
							else {
								ZenMoney.trace('Таблица операций всё равно не найдена, пропускаем счёт. Нужно проверить HTML: ' + clearHtml(html));
								return;
							}
						}
					}
					else
						ZenMoney.trace('Cчёт "' + acc.title + '" в списке на сайте веб-версии не обнаружен.');
				}
			}

			if (message != '') {
				ZenMoney.trace('Таблица операций не найдена, пропускаем счёт. Получено сообщение: ' + clearHtml(message));
				return;
			}
		}
		else {
			ZenMoney.trace('Таблица операций не найдена, пропускаем счёт. Нужно проверить HTML: ' + clearHtml(html));
			return;
		}
	}


	var createSyncTime = ZenMoney.getData('create_sync', 0);

	// первый запуск, загружать операции не нужно
	if (createSyncTime == 0 && g_preferences.loadOperations < 1) {
		ZenMoney.trace('Подключение без операций. Первый запуск. Операции пропускаем.');
		createSyncTime = Date.now();
		ZenMoney.setData('create_sync', createSyncTime);
		ZenMoney.saveData();
		return;
	}

	if (createSyncTime > 0) {
		var dtCr = new Date(createSyncTime);
		ZenMoney.trace('Дата создания подключения: ' + dtCr.toLocaleString());
	}


	var operations = getParams(tableElem, /<tr[^>]*class="ListLine\d+">[\s\S]*?<\/tr>/ig), tranDict = [];
	ZenMoney.trace('Получено ' + operations.length + ' операций');

	for (var i = 0; i < operations.length; i++) {
		var operation = operations[i];
		//ZenMoney.trace('Operation: '+ operation);

		var td = getParams(operation, /<td[\s\S]+?\/td>/ig, replaceTagsAndSpaces);

		tran = {
			date: getWebDate(td[1])
		};


		sum = getWebSum(td[2]);

		// пропускаем операции до времени создания подключения, если операции загружать не нужно
		dtTran = Date.parse(tran.date.substr(6, 4)+'-'+tran.date.substr(3, 2)+'-'+tran.date.substr(0, 2));
		//ZenMoney.trace('Дата операции: '+ dtStr);
		if (createSyncTime > 0 && dtTran < createSyncTime) {
			ZenMoney.trace('Пропускаем операцию до времени создания подключения: ' + tran.date + ', сумма ' + sum.summa);
			continue;
		}

		if (sum.summa == 0)
			continue;
		else if (sum.summa > 0) {
			tran.income = sum.summa;
			tran.incomeAccount = acc.id;
			tran.outcome = 0;
			tran.outcomeAccount = acc.id;
		} else {
			tran.income = 0;
			tran.incomeAccount = acc.id;
			tran.outcome = -sum.summa;
			tran.outcomeAccount = acc.id;
		}

		if (sum.opSumma) {
			if (sum.opSumma > 0) {
				tran.opIncome = sum.opSumma;
				tran.opIncomeInstrument = sum.opInstrument;
			} else {
				tran.opOutcome = -sum.opSumma;
				tran.opOutcomeInstrument = sum.opInstrument;
			}
		}

		description = td[0];
		if (description) {
			var dt = getWebDate(tran.date, true);
			//ZenMoney.trace("dt: "+ dt);

			// с 16 февраля анализ получателей в вебе по Retail
			var parsingPatch = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) >= Date.UTC(2017, 1, 16);

			if (parsingPatch)
			// новая схема обработки описания (после 16 февраля)
				parseTransactionDescription(description, sum.summa, sum.instrument, tran);

			else {
				// старая ОЩИБОЧНАЯ схема обработки (до 16 февраля)

				// взнос наличными
				if (/^Note\s+acceptance\s+/i.test(description) && sum > 0) {
					tran.outcome = sum;
					tran.outcomeAccount = 'cash#' + (tran.opOutcomeInstrument || tran.outcomeInstrument);
				}
				// снятие наличных
				else if (/^(?:ATM|ITT)\s+/i.test(description) && sum < 0) {
					tran.income = -sum;
					tran.incomeAccount = 'cash#' + (tran.opOutcomeInstrument || tran.outcomeInstrument);
				}
				else {
					// ошибочный алгоритм
					dt = new Date(tran.date);
					var payeePatch = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) >= Date.UTC(2017, 1, 3);
					if (payeePatch) {
						if (retail = /\bRetail\s+(.*)/i.exec(description))
							tran.payee = retail[1];
					} else
						tran.comment = description;
				}
			}
		}

		tranDict.push(tran);
	}

	//ZenMoney.trace('JSON: '+ JSON.stringify(tranDict));
	return tranDict;
}

/**
 * Обработать описание операции
 * @param {string} description Описание операции
 * @param {number} sum Сумма операции
 * @param {string} instrument Код валюты
 * @param {object} tran Транзакция
 * @returns {object} tran
 */
function parseTransactionDescription(description, sum, instrument, tran) {

	// оплата по карте
	var str = null;
	if (str = getWebDescriptionValue(description, 'Retail'))
		tran.payee = str;

	// оплата в кредит
	else if (str = getWebDescriptionValue(description, 'Credit'))
		tran.comment = str;

	// поступление
	else if (str = getWebDescriptionValue(description, 'CH Debit'))
		tran.comment = str;

	// списание
	else if (str = getWebDescriptionValue(description, 'CH Payment'))
		tran.comment = str;

	// платёж в Сбербанк Онлайн
	else if (str = getWebDescriptionValue(description, 'BP Billing Transfer'))
		tran.comment = str;

	// unique
	else if (str = getWebDescriptionValue(description, 'Unique'))
		tran.payee = str;

	// взнос наличными
	else if (str = getWebDescriptionValue(description, 'Note Acceptance') && sum > 0) {
		ZenMoney.trace('Перевод на сумму: ' + sum);
		tran.outcome = sum;
		tran.outcomeAccount = 'cash#' + instrument;
	}

	// снятие наличных
	else if (str = getWebDescriptionValue(description, 'ATM', 'ITT') && sum < 0) {
		tran.income = -sum;
		tran.incomeAccount = 'cash#' + instrument;
	}

	// переводы между счетами
	else if (str = getWebDescriptionValue(description, ' BP '))
		tran.comment = str;

	// значение по умолчанию - оставляем описание как есть
	else
		tran.comment = description;

	return tran;
}

/**
 * Перевод между своими счетами через web-интерфейс
 * @param fromAcc = 'card:12345678' (со счёта карты)
 * @param toAcc = 'account:12345678' (на счёт вклада)
 * @param sum - сумма перевода
 */
function doTransferWeb(fromAcc, toAcc, sum) {
	ZenMoney.trace('Загружаем форму перевода...');
	html = ZenMoney.requestGet(g_nodeurl + '/PhizIC/private/payments/payment.do?form=InternalPayment');
	//ZenMoney.trace('html: '+html);

	// инициализация формы
	var apacheToken = getParamByName(html, 'org.apache.struts.taglib.html.TOKEN');
	var docNum = getParamByName2(html, 'documentNumber');
	var pageToken = getParamByName(html, 'PAGE_TOKEN');
	//ZenMoney.trace('apacheToken: '+apacheToken);
	ZenMoney.trace('docNum: ' + docNum);
	//ZenMoney.trace('pageToken: '+pageToken);

	// заполняем поля перевода
	ZenMoney.trace('Заполняем форму...');
	html = ZenMoney.requestPost(g_nodeurl + '/PhizIC/private/payments/payment.do?form=InternalPayment', {
		'org.apache.struts.taglib.html.TOKEN': apacheToken,
		'form': 'InternalPayment',
		'exactAmount': 'charge-off-field-exact',
		'documentNumber': docNum,
		'fromResource': fromAcc,
		'toResource': toAcc,
		'sellAmount': sum,
		'PAGE_TOKEN': pageToken,
		'operation': 'button.save'
	}, addHeaders({Referer: g_nodeurl, 'X-Requested-With': 'XMLHttpRequest'}));
	ZenMoney.trace('Отослали форму.');

	var url = ZenMoney.getLastUrl();
	var locPos = url.indexOf('confirm.do');
	if (locPos < 0)
		throw new ZenMoney.Error('Не удалось совершить перевод между счетами');

	var paymentId = url.substr(locPos + 14);
	if (!paymentId)
		throw new ZenMoney.Error('Не удалось определить идентификатор платежа');
	ZenMoney.trace('paymentId: ' + paymentId);

	apacheToken = getParamByName(html, 'org.apache.struts.taglib.html.TOKEN');
	if (!apacheToken)
		throw new ZenMoney.Error('Не удалось определить токен');
	//ZenMoney.trace('apacheToken: '+apacheToken);

	// подтверждение перевода
	ZenMoney.trace('Подтвердите перевод...');
	html = ZenMoney.requestPost(g_nodeurl + '/PhizIC/private/payments/confirm.do?id=' + paymentId, {
		'org.apache.struts.taglib.html.TOKEN': apacheToken,
		'documentNumber': docNum,
		'PAGE_TOKEN': pageToken,
		'operation': 'button.dispatch'
	}, addHeaders({Referer: g_nodeurl, 'X-Requested-With': 'XMLHttpRequest'}));
	ZenMoney.trace('Перевод отправлен.');
}


/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) {
	return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

/**
 * Получить токен страницы web-интерфейса
 * @param html
 * @returns {*}
 */
function getToken(html) {
	var token = getParam(html, /<token>([^<]+)<\/token>/i);
	if (!token) {
		ZenMoney.trace('Ошибочный токен от сервера: ' + clearHtml(html));
		throw new ZenMoney.Error("Не удалось найти токен авторизации, сайт изменен?");
	}
	return token;
}

/**
 * Сгенерировать HEX
 * @param mask
 * @param digits
 * @returns {string|void|XML}
 */
function generateHex(mask, digits) {
	var i = 0;
	return mask.replace(/x/ig, function () {
		return digits[i++];
	});
}

/**
 * Сгенерировать параметры устройства
 * @returns {{TIMESTAMP: string, HardwareID: string, SIM_ID: string, PhoneNumber: string, GeoLocationInfo: *[], DeviceModel: string, MultitaskingSupported: boolean, DeviceName: string, DeviceSystemName: string, DeviceSystemVersion: string, Languages: string, WiFiMacAddress: (string|void|XML), WiFiNetworksData: {BBSID: (string|void|XML), SignalStrength: string, Channel: string, SSID: string}, CellTowerId: string, LocationAreaCode: string, ScreenSize: string, RSA_ApplicationKey: string, MCC: string, MNC: string, OS_ID: string, SDK_VERSION: string, Compromised: number, Emulator: number}}
 */
function createSdkData() {
	var dt = new Date(), prefs = ZenMoney.getPreferences();
	var hex = hex_md5(prefs.login + 'sdk_data');
	var rsa_app_key = hex_md5(prefs.login + 'rsa app key').toUpperCase();

	var imei = ZenMoney.getData('imei', '');
	if (imei == '')
		imei = generateImei(prefs.login, '35472406******L');

	var simId = ZenMoney.getData('simId', '');
	if (simId == '')
		simId = generateSimSN(prefs.login, '2500266********L');

	var obj = {
		"TIMESTAMP": dt.getUTCFullYear() + '-' + n2(dt.getUTCMonth()) + '-' + n2(dt.getUTCDate()) + 'T' + dt.getUTCHours() + ':' + dt.getUTCMinutes() + ':' + dt.getUTCSeconds() + 'Z',
		"HardwareID": imei,
		"SIM_ID": simId,
		"PhoneNumber": "",
		"GeoLocationInfo": [
			{
				"Longitude": "" + (37 + Math.random()),
				"Latitude": "" + (55 + Math.random()),
				"HorizontalAccuracy": "5",
				"Altitude": "" + (150 + Math.floor(Math.random() * 20)),
				"AltitudeAccuracy": "5",
				"Timestamp": "" + (dt.getTime() - Math.floor(Math.random() * 1000000)),
				"Heading": "" + (Math.random() * 90),
				"Speed": "3",
				"Status": "3"
			}
		],
		"DeviceModel": "D6503",
		"MultitaskingSupported": true,
		"DeviceName": "Xperia Z2",
		"DeviceSystemName": "Android",
		"DeviceSystemVersion": "22",
		"Languages": "ru",
		"WiFiMacAddress": generateHex('44:d4:e0:xx:xx:xx', hex.substr(0, 6)),
		"WiFiNetworksData": {
			"BBSID": generateHex('5c:f4:ab:xx:xx:xx', hex.substr(6, 12)),
			"SignalStrength": "" + Math.floor(-30 - Math.random() * 20),
			"Channel": "null",
			"SSID": "TPLink"
		},
		"CellTowerId": "" + (12875 + Math.floor(Math.random() * 10000)),
		"LocationAreaCode": "9722",
		"ScreenSize": "1080x1776",
		"RSA_ApplicationKey": rsa_app_key,
		"MCC": "250",
		"MNC": "02",
		"OS_ID": hex.substring(12, 16),
		"SDK_VERSION": "2.0.1",
		"Compromised": 0,
		"Emulator": 0
	};

	ZenMoney.setData('imei', imei);
	ZenMoney.setData('simId', simId);

	return obj;
}

/**
 * Сгенерировать IMEI-устроства
 * @param val
 * @param mask
 * @returns {string|XML|*}
 */
function generateImei(val, mask) {
	var g_imei_default = '35374906******L'; //Samsung
	var serial = (Math.abs(crc32(val) % 1000000)) + '';

	if (!mask)
		mask = g_imei_default;

	mask = mask.replace(/\*{6}/, serial);
	mask = mask.replace(/L/, luhnGet(mask.replace(/L/, '')));

	return mask;
}

/**
 * Сгенерировать серийный номер SIM
 * @param val
 * @param mask
 * @returns {string|XML|*}
 */
function generateSimSN(val, mask) {
	var g_simsn_default = '897010266********L'; //билайн
	var serial = (Math.abs(crc32(val + 'simSN') % 100000000)) + '';

	if (!mask)
		mask = g_simsn_default;

	mask = mask.replace(/\*{8}/, serial);
	mask = mask.replace(/L/, luhnGet(mask.replace(/L/, '')));

	return mask;
}

/**
 * Проверить залогинены ли в web-интерфейсе
 */
function getLoggedInHtml() {
	var nurl = (g_nodeurl || 'https://node1.online.sberbank.ru');
	var html = ZenMoney.requestGet(nurl + '/PhizIC/private/userprofile/userSettings.do', g_headers);
	if (isLoggedIn(html)) {
		g_nodeurl = nurl;
		return html;
	}
}

/**
 * Проверить авторизацию в web-интерфейсе
 * @param html
 * @returns {boolean}
 */
function isLoggedIn(html) {
	return /accountSecurity.do/i.test(html);
}

/**
 * Проверить наличие вопросво в web-интерфейсе, чтобы пропустить их
 * @param html
 * @param baseurl
 */
function checkAdditionalQuestions(html, baseurl) {
	if (/internetSecurity/.test(html)) {
		ZenMoney.trace('Требуется принять соглашение о безопасности... Принимаем...');

		html = ZenMoney.requestPost(baseurl + '/PhizIC/internetSecurity.do', {
			'field(selectAgreed)': 'on',
			'PAGE_TOKEN': getParamByName(html, 'PAGE_TOKEN'),
			'operation': 'button.confirm'
		}, addHeaders({Referer: baseurl, 'X-Requested-With': 'XMLHttpRequest'}));
	}
	html = checkNext(html);

	if (/Откроется справочник регионов, в котором щелкните по названию выбранного региона/.test(html)) {
		ZenMoney.trace('Выбираем все регионы оплаты...');
		//Тупой сбер предлагает обязательно выбрать регион оплаты. Вот навязчивость...
		//Ну просто выберем все регионы
		html = ZenMoney.requestPost(baseurl + '/PhizIC/region.do', {
			id: -1,
			operation: 'button.save'
		}, addHeaders({Referer: baseurl, 'X-Requested-With': 'XMLHttpRequest'}));
	}
	html = checkNext(html);
}

/**
 * Проверить наличие запроса на переход к следующему шагу в web-интерфейсе
 * @param html
 * @returns {*}
 */
function checkNext(html) {
	if ((html || '').trim() == 'next') {
		ZenMoney.trace('У нас next, обновляем страницу.');
		html = getLoggedInHtml();
	}
	return html;
}

/**
 * Получить удобочитаемый HTML без лишних шапок и мусора
 * @param html
 * @returns {*}
 */
function clearHtml(html) {
	if (!html)
		return '--- undefined ---';

	if (typeof html != 'string')
		return '--- not string ---';

	return html.replaceAll(
		[/<head[\s\S]+?\/head>/g, '',
			/<script[\s\S]+?\/script>/g, '',
			/<noscript[\s\S]+?\/noscript>/ig, '',
			/ +[\r\n]+/g, '\r\n',
			/[\r\n]+/g, '\r\n'
		]);
}

/**
 * Получить дату в формате ДД.ММ.ГГГГ
 * @param {string} str Дата из веб-версии Сбербанк Онлайн
 * @param {boolean} dtFormat Возвращать ли дату в формате Date или строкой (по умолчанию)
 * @returns {*}
 */
function getWebDate(str, dtFormat) {
	dtFormat = dtFormat || false;

	if (str.toLowerCase().indexOf("сегодня") >= 0)
		return getFormattedDate();

	if (str.toLowerCase().indexOf("вчера") >= 0)
		return getFormattedDate({offsetDay: 1});

	if (str.length == 5 && str[2] == '.') {
		var dt = new Date();
		var month = parseInt(str.substr(3, 2)) - 1;
		var year = dt.getFullYear();
		if (month > dt.getMonth())
			year -= 1;
		if (dtFormat) {
			var day = parseInt(str.substr(0, 2));
			dt.setFullYear(year, month, day);
			return dt;
		}
		return str + '.' + year;
	}
	else if (str.length == 10 && str[2] == '.' && str[5] == '.') {
		if (dtFormat)
			return new Date(parseInt(str.substr(6, 4)), parseInt(str.substr(3, 2)) - 1, parseInt(str.substr(0, 2)))
		return str;
	}

	throw new ZenMoney.Error('Некорректная дата операции в web-версии: ' + str);
}

/**
 * Получить сумму операции в web-интерфейсе
 * @param {string} str Сумма из веб-версии Сбербанк Онлайн
 * @returns {{}}
 */
function getWebSum(str) {
	str = str.replace('&minus;', '-');

	var result = {};
	var match = str.match(/(.+)\((.+)\)/i);
	//ZenMoney.trace(JSON.stringify(match));
	if (match && match.length == 3 &&
		match[1].length > 0 && match[2].length > 0) {
		result.opSumma = parseToFloat(parseBalance(match[1]));
		result.opInstrument = parseCurrency(match[1]);
		result.summa = parseToFloat(parseBalance(match[2]));
		if (result.opSumma < 0) result.summa = -result.summa;
		result.instrument = parseCurrency(match[2]);
	} else {
		result.summa = parseToFloat(parseBalance(str));
		result.instrument = parseCurrency(str);
	}
	return result;
}

/**
 * Получить значение описания операции
 * @param {string} description ОПисание
 * @param {string} str Искомая строка
 * @param {string} str2 Вторая искомая строка
 * @returns {string}
 */
function getWebDescriptionValue(description, str, str2) {
	var pos = description.lastIndexOf(str);
	var pos2 = !str2 ? -1 : description.lastIndexOf(str2);
	if (pos >= 0 || pos2 >= 0)
		return description.substr(pos >= 0 ? pos + str.length : pos2 + str2.length).trim();
	return null;
}