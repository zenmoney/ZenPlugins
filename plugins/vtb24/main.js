var g_baseurl =  'https://mobile.vtb24.ru/', //"https://online.vtb24.ru/"
	g_url_login = g_baseurl+'content/telebank-client-mobile/ru/login.touch.html',
	g_url_product_select = g_baseurl+'content/telebank-client-mobile/ru/login/telebank/product-details/_jcr_content.product-select.html',
	g_url_product_details = g_baseurl+'content/telebank-client-mobile/ru/login/telebank/product-details.touch.html',
	g_headers = {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36',
		'Pragma': 'no-cache',
		//'Origin': 'https://mobile.vtb24.ru',
		'X-Requested-With': 'XMLHttpRequest'
		//'Referer': g_baseurl + 'content/telebank-client/ru/login.html'
	},
	g_preferences, g_pageToken, g_pageSecurityID, g_browserSessionUid;

/**
 * Основной метод
 */
function main() {
	g_preferences = ZenMoney.getPreferences();
	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в ВТБ24-Онлайн!", null, true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в ВТБ24-Онлайн!", null, true);

	var json = login();
	//ZenMoney.trace('JSON после входа: '+ JSON.stringify(json));

	processAccounts(json);

	ZenMoney.trace('Запрашиваем данные по операциям...');
	processTransactions();

	ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 * @returns {string} JSON ответа от сервера
 */
function login(){
	//var html = ZenMoney.requestGet(g_baseurl + 'content/telebank-client/ru/login.html', g_headers);
	var html = ZenMoney.requestGet(g_url_login, g_headers);

	if (!html) {
		ZenMoney.trace('По адресу "'+ g_url_login +'" банк ничего не вернул.');
		throw new ZenMoney.Error('Не удалось загрузить форму для входа в ВТБ24.', null, true);
	}

	g_pageSecurityID = getParam(html, /page-security-id="([^"]*)/i, null, html_entity_decode);
	//ZenMoney.trace('pageSecurityId: '+g_pageSecurityID);

	g_browserSessionUid = guid();

	var isAlreadyAuthorized = getParamByName(html, 'isMinervaUserAuthenticated');
	//ZenMoney.trace('isAlreadyAuthorized: '+ isAlreadyAuthorized);

	ZenMoney.trace('Пытаемся войти...');
	var dt = new Date(), dtStr = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + " " + dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear();
	var json = requestJson('services/signin', null, {
		post: {
			login: g_preferences.login,
			password: g_preferences.password,
			isMobile: true,
			_charset_: 'utf-8',
			dateTime: dtStr
		},
		noException: true
	}, addHeaders({Referer: g_baseurl + 'content/telebank-client/ru/login.html'}));

	g_pageToken = json.pageToken;
	//ZenMoney.trace('JSON: '+ JSON.stringify(json));

	// проверим, не авторизированы ли уже
	/*if (isAlreadyAuthorized == 'true'){
		ZenMoney.trace('Уже авторизированы. Используем текущую сессию.');

		// ToDO: корректно завершать авторизацию, чтобы при повторном входе можно было воспользоваться текущей сессией
		return;
	}*/

	if (!json.authorized) {
		if (json.accountLocked)
			throw new ZenMoney.Error('Ваш аккаунт заблокирован банком, свяжитесь со службой технической поддержки для разблокирования аккаунта.', null, true);

		if (json.error && json.error.msg) {
			var error = json.error.msg;
			if (error)
				throw new ZenMoney.Error(error, null, /Логин или пароль введены неверно/i.test(error));
		}

		if (json.authConfirmation) {
			ZenMoney.trace('Необходимо ввести SMS-код для входа. Запрашиваем новый код...');
			json = requestJson("services/signin", null, {
				post: {
					action: 'challenge'
				},
				noException: true
			});
			//ZenMoney.trace('JSON: '+ JSON.stringify(json));

			var smsCode = ZenMoney.retrieveCode("Введите код авторизации из СМС для входа в ВТБ24-Онлайн", null, {
				inputType: "number",
				time: 18E4
			});

			if (!smsCode || smsCode == 0 || String(smsCode).trim() == '') {
				ZenMoney.trace('Получен пустой код авторизации. Прекращаем работу.');
				ZenMoney.setResult({success: false});
				return;
			} else
				ZenMoney.trace('Код авторизации получен.');

			json = requestJson('services/signin', null, {
				post: {
					action: 'completeLogon',
					isMobile: true,
					challengeResponse: smsCode
				},
				noException: true
			});
            ZenMoney.trace("СМС-код отправлен.");

            //ZenMoney.trace("JSON: "+ JSON.stringify(json));
			if (json.error) {
				error = json.error.msg;
				if (error)
					throw new ZenMoney.Error(error, null, /Неверный SMS/i.test(error));
			}

			g_pageToken = json.pageToken;
			ZenMoney.trace("Успешно вошли.");
		}

		if (!json.authorized)
			throw new ZenMoney.Error('Не удалось зайти в ВТБ24-Онлайн. Сайт изменен?');
	}
	else
		ZenMoney.trace('Уже авторизованы. Продолжаем...');

	return json;
}

var g_accounts = []; // линки активных счетов, по ним фильтруем обработку операций
/**
 * Обработка счетов
 * @param {string} json 
 */
function processAccounts(json) {
	ZenMoney.trace('Инициализация...');

	// открываем список счетов
	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
				componentId: "MobileAccountsAndCardsHomepage",
				actions: [{
					actionId: "PORTFOLIOS",
					params: {
						portfolioId: "AccountsAndCards",
						isMobile: "true"
					},
					partialResult: true,
					requestId:"8"
				}]
			}]),
			pageInstanceUid: g_browserSessionUid+'.1',
			callId: 2,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({Referer: g_url_login}));

	// загружаем список счетов
	json = requestJson('processor/process/minerva/operation', null, {
		post: {
			action: 'checkAvailability',
			serviceData: 'telebank|RequestCallbackInitData|RequestCallbackScenario',
			callId: 1,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	//ZenMoney.trace('1. JSON checkAvailability: '+ JSON.stringify(json));

	g_pageToken = json.pageToken;

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([
				{
					"componentId" : "SideMenuComponent",
					"actions" : [{
						"actionId" : "REGISTERED_CALLBACK_REQUEST",
						"requestId" : "1"
					}
					]
				}, {
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"params" : {
							"allNotificationsRequired" : true
						},
						"permanent" : true,
						"requestId" : "2"
					}, {
						"actionId" : "PERSONAL_OFFERS",
						"params" : {
							"getIncomeParams" : {
								"isPdaNotifications" : true
							}
						},
						"requestId" : "3"
					}
					]
				}, {
					"componentId" : "COMPLEX_SERVICE_CONTRACT_TOPIC",
					"actions" : [{
						"actionId" : "COMPLEX_SERVICE_CONTRACT",
						"params" : {},
						"requestId" : "4"
					}
					]
				}, {
					"componentId" : "PRODUCT_LIST",
					"actions" : [{
						"actionId" : "PORTFOLIOS",
						"params" : {
							"portfolioId" : "AccountsAndCards",
							"forProductPage" : "true"
						},
						"requestId" : "5"
					}
					]
				}, {
					"componentId" : "mobileHomePageTransactions",
					"actions" : [{
						"actionId" : "TRANSACTIONS",
						"params" : {
							"numberOfTransactions" : "5"
						},
						"requestId" : "6"
					}
					]
				}, {
					"componentId" : "CacheTokenComponent",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"permanent" : true,
						"requestId" : "7"
					}
					]
				}
				]
			),
			pageInstanceUid: g_browserSessionUid+'.1',
			callId: 2,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('JSON списка счетов: '+ JSON.stringify(json));

	var portfolios = getJsonObjectById(json, 'MobileAccountsAndCardsHomepage', 'PORTFOLIOS', false);
	if (portfolios) {
		var accounts = portfolios.result.items[0].products;
		var accDict = [];
		for (var a = 0; a < accounts.length; a++) {
			var account = accounts[a];

			switch (account.id) {
				case 'MasterAccountProduct':
					for (iGr = 0; iGr < account.groups.length; iGr++) {
						group = account.groups[iGr];

						for (iItem = 0; iItem < group.items.length; iItem++) {
							item = group.items[iItem];
							if (!item.hasOwnProperty('number')) continue;

							acc = {
								id: item.id,
								title: item.displayName,
								type: 'ccard',
								syncID: [item.number.substr(5, 3) + item.number.substr(-3)], // в синнкайди добавляем и код валюты, чтобы исключить повторения
								instrument: getInstrument(item.amount.currency),
								balance: item.amount.sum
							};

							ZenMoney.trace('Добавляем мастер счёт: ' + acc.title + ' (#' + acc.id + ')');

							// проверим нет ли карт, прикреплённых к мастер счёту
							if (item.hasOwnProperty('items'))
								for (var i = 0; i < item.items.length; i++)
									acc.syncID.push(item.items[i].number.substr(-4));

							accDict.push(acc);
							g_accounts[acc.id] = {
								id: acc.id,
								title: acc.title,
								type: 'MasterAccount'
							};
						}
					}
					break;

				case 'DebitCardProduct':
				case 'CreditCardProduct':
					for (iGr = 0; iGr < account.groups.length; iGr++) {
						group = account.groups[iGr];

						for (iItem = 0; iItem < group.items.length; iItem++) {
							item = group.items[iItem];
							if (!item.hasOwnProperty('number')) continue;

							acc = {
								id: item.id,
								title: item.displayName,
								type: 'ccard',
								syncID: item.number.substr(-4),
								instrument: getInstrument(item.amount.currency),
								balance: item.amount.sum
							};

							ZenMoney.trace('Добавляем карту: ' + acc.title + ' (#' + acc.id + ')');

							accDict.push(acc);
							g_accounts[acc.id] = {
								id: acc.id,
								title: acc.title,
								type: 'CreditCard'
							};
						}
					}
					break;
			}
		}
	}
	else
		ZenMoney.trace('В ответе банка не найден список счетов.');

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length);
	ZenMoney.trace('JSON: '+ JSON.stringify(accDict));
	ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 */
function processTransactions() {
	var browserId = 2;
	for(var accId in g_accounts) {
		var acc = g_accounts[accId];
		browserId++;

		ZenMoney.trace('Загружаем "' + acc.title + '" (#' + accId + ')');

		var lastSyncTime = ZenMoney.getData('last_sync_' + accId, 0);

		// первоначальная инициализация
		if (!lastSyncTime || lastSyncTime == 0) {
			// по умолчанию загружаем операции за неделю
			var period = !g_preferences.hasOwnProperty('period') || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

			if (period > 100) period = 100;	// на всякий случай, ограничим лимит, а то слишком долго будет

			lastSyncTime = Date.now() - period * 24 * 60 * 60 * 1000;
		}

		// всегда захватываем одну неделю минимум
		lastSyncTime = Math.min(lastSyncTime, Date.now() - 7 * 24 * 60 * 60 * 1000);
		var lastSyncDate = new Date(lastSyncTime);
		var nowSyncDate = new Date();
		var startDate = n2(lastSyncDate.getDate()) + '.' + n2(lastSyncDate.getMonth() + 1) + '.' + lastSyncDate.getFullYear();
		var endDate = n2(nowSyncDate.getDate()) + '.' + n2(nowSyncDate.getMonth() + 1) + '.' + nowSyncDate.getFullYear();

		ZenMoney.trace('Запрашиваем операции с ' + lastSyncDate.toLocaleString());

		json = requestJson('processor/process/minerva/operation', null, {
			post: {
				action: 'checkAvailability',
				serviceData: 'telebank|RequestCallbackInitData|RequestCallbackScenario',
				callId: 1,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, addHeaders({Referer: g_url_login}));

		g_pageToken = json.pageToken;

		json = requestJson('processor/process/minerva/action', null, {
			post: {
				components: JSON.stringify([
					{
						"componentId": "SideMenuComponent",
						"actions": [{
							"actionId": "REGISTERED_CALLBACK_REQUEST",
							"requestId": "1"
						}
						]
					}, {
						"componentId": "MOBILENOTIFICATIONS",
						"actions": [{
							"actionId": "NOTIFICATIONS",
							"params": {
								"allNotificationsRequired": true
							},
							"permanent": true,
							"requestId": "2"
						}, {
							"actionId": "PERSONAL_OFFERS",
							"params": {
								"getIncomeParams": {
									"isPdaNotifications": true
								}
							},
							"requestId": "3"
						}
						]
					}, {
						"componentId": "productsStatement",
						"actions": [{
							"actionId": "STATEMENT",
							"params": {
								"products": [{
									"id": accId,
									"className": acc.type,
									"number": "",
									"dateCreation": ""
								}
								],
								"startDate": startDate,
								"endDate": endDate
							},
							"requestId": "4"
						}
						]
					}, {
						"componentId": "CacheTokenComponent",
						"actions": [{
							"actionId": "CACHE_TOKENS",
							"permanent": true,
							"requestId": "5"
						}
						]
					}
				]),
				pageInstanceUid: g_browserSessionUid + '.' + browserId,
				callId: 2,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, addHeaders({Referer: g_url_login}));
		ZenMoney.trace('1. JSON списка операций: ' + JSON.stringify(json));

		pageToken = json.pageToken;

		json = requestJson('processor/process/minerva/action', null, {
			post: {
				components: '[]',
				pageInstanceUid: g_browserSessionUid + '.' + browserId,
				callId: 3,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, addHeaders({Referer: g_url_login}));
		ZenMoney.trace('2. JSON списка операций: ' + JSON.stringify(json));

		g_pageToken = pageToken;

		var tranDict = [];
		var transactionItems = [];
		var prodStat = getJsonObjectById(json, 'productsStatement', 'STATEMENT');

		// ждём ответа по транзакциям, если не пришли сразу
		if (!prodStat)
			for (var k=0; k<5; k++) {
				json = requestJson('processor/process/minerva/action', null, {
					post: {
						components: '[]',
						pageInstanceUid: g_browserSessionUid + '.' + browserId,
						callId: 4+k,
						pageSecurityID: g_pageSecurityID,
						pageToken: pageToken
					}
				}, addHeaders({Referer: g_url_login}));
				ZenMoney.trace((3+k)+'. JSON списка операций: ' + JSON.stringify(json));

				prodStat = getJsonObjectById(json, 'productsStatement', 'STATEMENT');
				if (prodStat)
					break;
			}

		if (prodStat && prodStat.hasOwnProperty('result') && prodStat.result.hasOwnProperty('items'))
			transactionItems = prodStat.result.items;

		// обрабатываем и добавляем операции
		if (transactionItems.length > 0) {
			var transactions = transactionItems[0].transactions;
			ZenMoney.trace('JSON transactions: ' + JSON.stringify(transactions));

			for (var iTran = 0; iTran < transactions.length; iTran++) {
				var t = transactions[iTran];

				// учитываем только успешные операции
				if (t.failed == "false")
					continue;

				var tran = {};
				ZenMoney.trace('Добавляем операцию #' + iTran + ': ' + t.displayedDate + ' - ' + t.details);

				// ВТБ в качестве идентификатора присылает каждый раз новый GUID !!!
				// tran.id = t.id;

				tran.date = t.transactionDate;
				
				var sum = t.amount.sum;
				var curr = getInstrument(t.amount.currency);
				if (sum > -0.01 && sum < 0.01) continue; // предохранитель

				if (sum < 0) {
					tran.income = 0;
					tran.incomeAccount = acc.id;
					tran.outcome = -sum;
					tran.outcomeAccount = acc.id;
				} else {
					tran.income = sum;
					tran.incomeAccount = acc.id;
					tran.outcome = 0;
					tran.outcomeAccount = acc.id;
				}

				if (t.details.indexOf("нятие в ") > 0 || t.details.indexOf("ополнение в ") > 0){
					// операции наличными
					if (sum > 0) {
						tran.outcome = sum;
						tran.outcomeAccount = "cash#"+curr;
					} else {
						tran.income = -sum;
						tran.incomeAccount = "cash#"+curr;
					}

					tran.comment = t.details;
				}
				else
				{
					switch (acc.type){
						case 'MasterAccount':
							if (retail = /^Операция п.*?\d+\.\s+(.+?)(?:\s+[а-яА-Я].*)?$/.exec(t.details))
								tran.payee = retail[1];
							break;

						case 'CreditCard':
							if (retail = /^[\dX]+\s+Retail\s+(.+)/.exec(t.details))
								tran.payee = retail[1];
							break;
					}

					// удаляем номер транзакции, попадающий в поле получателя
					if (tran.payee != undefined && tran.payee != '')
						tran.payee = String(tran.payee).replace(/(\d{6,})$/, '').trim();

					if (!tran.hasOwnProperty('payee') || !tran.payee)
						tran.comment = t.order && t.order.description ? t.order.description.trim() : t.details.trim();
				}

				tranDict.push(tran);
			}
		}

		ZenMoney.trace('Всего операций добавлено: ' + tranDict.length);
		ZenMoney.trace('JSON: ' + JSON.stringify(tranDict));
		ZenMoney.addTransaction(tranDict);
	}
}

/**
 * Перевод между счетами
 * @param {string} accFrom Идентификатор счёта-источника
 * @param {string} accTo Идентификатор счёта-назначения
 * @param {number} sum Сумма перевода
 */
function makeTransfer_work(accFrom, accTo, sum) {
	g_preferences = ZenMoney.getPreferences();
	login();

	ZenMoney.trace('Перевод ' + sum + ' со счёта ' + accFrom + ' на счёт ' + accTo);
	var callId = 1;

	// Загружаем форму перевода
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: 'editForm',
			operation: 7760,
			ignoreCache: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));

	ZenMoney.trace('Загрузили форму перевода');
	callId++;

	// Выберем счёт-источник
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: 'confirm',
			command: 'AccountDebet@OnChanged',
			inputStageResponseId: -52,
			jsonObj: {
				"inputStageResponseId": -52,
				"stage": "INPUT",
				"elements": [{
					"actualValue": "120DE36346D142A2B632CC74F9298889",
					"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
					"metaData": {
						"titles": {
							"name": "Карта/счет списания",
							"shortName": "Карта/счет",
							"description": "Откуда осуществляется перевод.",
							"placeholder": "Выберите счёт или карту"
						},
						"dependsOn": [],
						"lockOnPostback": "DependentFieldsOnly",
						"postbackNotify": "OnChanged",
						"type": {"tint": "DropDown", "localPart": "Numeric", "namespaceURI": "http://vtb24.ru/minerva", "prefix": "", "nullable": true},
						"checkList": [],
						"dataSource": {"itemType": "AccountDictionaryEntry", "keyField": "Id", "allowNonListValue": false}
					},
					"fieldType": "AccountDebet",
					"value": {
						"id": "17F9D3290454421EA289CF6AEF188444",
						"classType": "AccountDictionaryEntry",
						"number": "40817810210534015636",
						"amount": {"sum": 40404.74, "currency": "₽"},
						"name": "Мастер счет в рублях",
						"displayName": "Мастер счет в рублях",
						"linkedProducts": [{
							"classType": "MasterAccountCard",
							"displayName": "MasterCard Gold",
							"displayedInFavorites": false,
							"number": "549866XXXXXX0138",
							"account": {"displayedInFavorites": false, "number": "40817810210534015636"}
						}]
					},
					"fields": [{
						"id": "17F9D3290454421EA289CF6AEF188444",
						"classType": "AccountDictionaryEntry",
						"number": "40817810210534015636",
						"amount": {"sum": 40404.74, "currency": "₽"},
						"name": "Мастер счет в рублях",
						"displayName": "Мастер счет в рублях",
						"linkedProducts": [{
							"classType": "MasterAccountCard",
							"displayName": "MasterCard Gold",
							"displayedInFavorites": false,
							"number": "549866XXXXXX0138",
							"account": {"displayedInFavorites": false, "number": "40817810210534015636"}
						}]
					}, {
						"id": "120DE36346D142A2B632CC74F9298889",
						"classType": "AccountDictionaryEntry",
						"number": "554386XXXXXX0666",
						"amount": {"sum": 12040.06, "currency": "₽"},
						"name": "MC Standard",
						"displayName": "Карта ВТБ24 (*0666)",
						"productClassType": "CreditCard",
						"brandName": "MasterCard"
					}, {
						"id": "32FBEB4653554A41B89861CA383AD4D0",
						"classType": "AccountDictionaryEntry",
						"number": "40817840810534013493",
						"amount": {"sum": 0, "currency": "$"},
						"name": "Мастер счет в долларах США",
						"displayName": "Мастер счет в долларах США"
					}, {
						"id": "04425783D7BA4C9FA88D66B5F20401D8",
						"classType": "AccountDictionaryEntry",
						"number": "40817978410534013493",
						"amount": {"sum": 0, "currency": "€"},
						"name": "Мастер счет в Евро",
						"displayName": "Мастер счет в Евро"
					}],
					"keyField": "id",
					"listTicket": "-52.SourceAccounts_1070631312"
				}, {
					"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
					"metaData": {
						"titles": {
							"name": "Карта/счет зачисления",
							"shortName": "Карта/счет",
							"description": "Куда зачислить средства.",
							"placeholder": "Выберите счёт или карту"
						},
						"dependsOn": ["AccountDebet"],
						"lockOnPostback": "DependentFieldsOnly",
						"postbackNotify": "OnChanged",
						"type": {"tint": "DropDown", "localPart": "Numeric", "namespaceURI": "http://vtb24.ru/minerva", "prefix": "", "nullable": true},
						"checkList": [],
						"dataSource": {"itemType": "AccountDictionaryEntry", "keyField": "Id", "allowNonListValue": false}
					},
					"fieldType": "AccountCredit",
					"fields": [{
						"id": "17F9D3290454421EA289CF6AEF188444",
						"classType": "AccountDictionaryEntry",
						"number": "40817810210534015636",
						"amount": {"sum": 40404.74, "currency": "₽"},
						"name": "Мастер счет в рублях",
						"displayName": "Мастер счет в рублях",
						"linkedProducts": [{
							"classType": "MasterAccountCard",
							"displayName": "MasterCard Gold",
							"displayedInFavorites": false,
							"number": "549866XXXXXX0138",
							"account": {"displayedInFavorites": false, "number": "40817810210534015636"}
						}]
					}, {
						"id": "32FBEB4653554A41B89861CA383AD4D0",
						"classType": "AccountDictionaryEntry",
						"number": "40817840810534013493",
						"amount": {"sum": 0, "currency": "$"},
						"name": "Мастер счет в долларах США",
						"displayName": "Мастер счет в долларах США"
					}, {
						"id": "04425783D7BA4C9FA88D66B5F20401D8",
						"classType": "AccountDictionaryEntry",
						"number": "40817978410534013493",
						"amount": {"sum": 0, "currency": "€"},
						"name": "Мастер счет в Евро",
						"displayName": "Мастер счет в Евро"
					}],
					"keyField": "id",
					"listTicket": "-52.DestinationAccounts__5543860026540666_1070631312"
				}, {
					"actualValue": "",
					"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
					"metaData": {
						"titles": {"name": "Сумма в валюте списания", "shortName": "Сумма в ва", "description": "Минимальная сумма списания 0.01 единица валюты."},
						"dependsOn": ["AccountDebet", "AccountCredit"],
						"lockOnPostback": "DependentFieldsOnly",
						"postbackNotify": "None",
						"type": {"tint": "Money", "localPart": "double", "namespaceURI": "http://www.w3.org/2001/XMLSchema", "prefix": "xsd", "nullable": false},
						"checkList": [{
							"className": "RangeCheck",
							"checkProperties": {
								"errorMessage": "Введите сумму больше 0",
								"upperBoundType": "null",
								"lowerBound": "0",
								"lowerBoundType": "EXCLUSIVE",
								"upperBound": null
							}
						}],
						"hint": ""
					},
					"fieldType": "SumCur1",
					"value": ""
				}],
				"fieldId": "AccountDebet",
				"command": "AccountDebet@OnChanged"
			},
			ignoreCache: false,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: pageSecurityID,
			pageToken: pageToken
		},
		addHeaders({Referer: g_url_login}));

	ZenMoney.trace('Выбрали счёт-источник');
	callId++;

	// 2. отправляем форму
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: 'confirm',
			command: 'CONTINUE',
			inputStageResponseId: -126,
			jsonObj: {
				"inputStageResponseId": -126,
				"stage": "INPUT",
				"elements": [{
					"actualValue": accFrom,
					"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
					"metaData": {
						"titles": {
							"name": "Карта/счет списания",
							"shortName": "Карта/счет",
							"description": "Откуда осуществляется перевод.",
							"placeholder": "Выберите счёт или карту"
						},
						"dependsOn": [],
						"lockOnPostback": "DependentFieldsOnly",
						"postbackNotify": "OnChanged",
						"type": {
							"tint": "DropDown",
							"localPart": "Numeric",
							"namespaceURI": "http://vtb24.ru/minerva",
							"prefix": "",
							"nullable": true
						},
						"checkList": [],
						"dataSource": {
							"itemType": "AccountDictionaryEntry",
							"keyField": "Id",
							"allowNonListValue": false
						}
					},
					"fieldType": "AccountDebet",
					"value": {
						"id": accFrom,
						"classType": "AccountDictionaryEntry",
						"number": "554386XXXXXX0666",
						"amount": {
							"sum": 15397.03,
							"currency": "?"
						},
						"name": "MC Standard",
						"displayName": "Карта ВТБ24 (*0666)",
						"productClassType": "CreditCard",
						"brandName": "MasterCard"
					},
					"fields": [{
						"id": accTo,
						"classType": "AccountDictionaryEntry",
						"number": "40817810210534015636",
						"amount": {
							"sum": 25146.57,
							"currency": "?"
						},
						"name": "Мастер счет в рублях",
						"displayName": "Мастер счет в рублях",
						"linkedProducts": [{
							"classType": "MasterAccountCard",
							"displayName": "MasterCard Gold",
							"displayedInFavorites": false,
							"number": "549866XXXXXX0138",
							"account": {
								"displayedInFavorites": false,
								"number": "40817810210534015636"
							}
						}]
					},
						{
							"id": accFrom,
							"classType": "AccountDictionaryEntry",
							"number": "554386XXXXXX0666",
							"amount": {
								"sum": 15397.03,
								"currency": "?"
							},
							"name": "MC Standard",
							"displayName": "Карта ВТБ24 (*0666)",
							"productClassType": "CreditCard",
							"brandName": "MasterCard"
						},
						{
							"id": "32FBEB4653554A41B89861CA383AD4D0",
							"classType": "AccountDictionaryEntry",
							"number": "40817840810534013493",
							"amount": {
								"sum": 0,
								"currency": "$"
							},
							"name": "Мастер счет в долларах США",
							"displayName": "Мастер счет в долларах США"
						},
						{
							"id": "04425783D7BA4C9FA88D66B5F20401D8",
							"classType": "AccountDictionaryEntry",
							"number": "40817978410534013493",
							"amount": {
								"sum": 0,
								"currency": "€"
							},
							"name": "Мастер счет в Евро",
							"displayName": "Мастер счет в Евро"
						}],
					"keyField": "id",
					"listTicket": "-126.SourceAccounts_1070631312"
				},
					{
						"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
						"metaData": {
							"titles": {
								"name": "Карта/счет зачисления",
								"shortName": "Карта/счет",
								"description": "Куда зачислить средства.",
								"placeholder": "Выберите счёт или карту"
							},
							"dependsOn": ["AccountDebet"],
							"lockOnPostback": "DependentFieldsOnly",
							"postbackNotify": "OnChanged",
							"type": {
								"tint": "DropDown",
								"localPart": "Numeric",
								"namespaceURI": "http://vtb24.ru/minerva",
								"prefix": "",
								"nullable": true
							},
							"checkList": [],
							"dataSource": {
								"itemType": "AccountDictionaryEntry",
								"keyField": "Id",
								"allowNonListValue": false
							}
						},
						"fieldType": "AccountCredit",
						"value": {
							"id": accTo,
							"classType": "AccountDictionaryEntry",
							"number": "40817810210534015636",
							"amount": {
								"sum": 25146.57,
								"currency": "?"
							},
							"name": "Мастер счет в рублях",
							"displayName": "Мастер счет в рублях",
							"linkedProducts": [{
								"classType": "MasterAccountCard",
								"displayName": "MasterCard Gold",
								"displayedInFavorites": false,
								"number": "549866XXXXXX0138",
								"account": {
									"displayedInFavorites": false,
									"number": "40817810210534015636"
								}
							}]
						},
						"fields": [{
							"id": accTo,
							"classType": "AccountDictionaryEntry",
							"number": "40817810210534015636",
							"amount": {
								"sum": 25146.57,
								"currency": "?"
							},
							"name": "Мастер счет в рублях",
							"displayName": "Мастер счет в рублях",
							"linkedProducts": [{
								"classType": "MasterAccountCard",
								"displayName": "MasterCard Gold",
								"displayedInFavorites": false,
								"number": "549866XXXXXX0138",
								"account": {
									"displayedInFavorites": false,
									"number": "40817810210534015636"
								}
							}]
						},
							{
								"id": "32FBEB4653554A41B89861CA383AD4D0",
								"classType": "AccountDictionaryEntry",
								"number": "40817840810534013493",
								"amount": {
									"sum": 0,
									"currency": "$"
								},
								"name": "Мастер счет в долларах США",
								"displayName": "Мастер счет в долларах США"
							},
							{
								"id": "04425783D7BA4C9FA88D66B5F20401D8",
								"classType": "AccountDictionaryEntry",
								"number": "40817978410534013493",
								"amount": {
									"sum": 0,
									"currency": "€"
								},
								"name": "Мастер счет в Евро",
								"displayName": "Мастер счет в Евро"
							}],
						"keyField": "id",
						"listTicket": "-126.DestinationAccounts__5543860026540666_1070631312"
					},
					{
						"actualValue": "",
						"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
						"metaData": {
							"titles": {
								"name": "Сумма в валюте списания",
								"shortName": "Сумма в ва",
								"description": "Минимальная сумма списания 0.01 единица валюты."
							},
							"dependsOn": ["AccountDebet",
								"AccountCredit"],
							"lockOnPostback": "DependentFieldsOnly",
							"postbackNotify": "None",
							"type": {
								"tint": "Money",
								"localPart": "double",
								"namespaceURI": "http://www.w3.org/2001/XMLSchema",
								"prefix": "xsd",
								"nullable": false
							},
							"checkList": [{
								"className": "RangeCheck",
								"checkProperties": {
									"errorMessage": "Введите сумму больше 0",
									"upperBoundType": "null",
									"lowerBound": "0",
									"lowerBoundType": "EXCLUSIVE",
									"upperBound": null
								}
							}],
							"hint": "?"
						},
						"fieldType": "SumCur1",
						"value": sum
					}],
				"operation": 7760,
				"command": "CONTINUE"
			},
			ignoreCache:false,
			hasTemplate:false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));

	ZenMoney.trace('Отправили форму');
	callId++;

	// 3. подтверждаем перевод
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action:confirm,
			command:CONFIRM,
			inputStageResponseId:-126,
			jsonObj: {
				"inputStageResponseId": -126,
				"stage": "CONFIRMATION",
				"elements": [{
					"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
					"name": "TEMPLATE_PARAMETERS",
					"elements": [{
						"actualValue": "Перевод между своими счетами / обмен валюты",
						"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.TextFieldVO",
						"metaData": {
							"titles": {
								"name": "Название шаблона",
								"shortName": "Название шаблона.",
								"description": "Укажите название шаблона."
							},
							"dependsOn": [],
							"lockOnPostback": "DependentFieldsOnly",
							"postbackNotify": "None",
							"type": {
								"localPart": "string",
								"namespaceURI": "http://www.w3.org/2001/XMLSchema",
								"prefix": "xsd",
								"nullable": true
							},
							"checkList": []
						},
						"fieldType": "_TemplateName_",
						"value": ""
					}]
				},
					{
						"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
						"name": "SPO_PARAMETERS",
						"elements": [{
							"actualValue": "",
							"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.TextFieldVO",
							"metaData": {
								"titles": {
									"name": "Название операции",
									"shortName": "Название операции",
									"description": "Укажите название запланированной операции"
								},
								"dependsOn": [],
								"lockOnPostback": "DependentFieldsOnly",
								"postbackNotify": "None",
								"type": {
									"localPart": "string",
									"namespaceURI": "http://www.w3.org/2001/XMLSchema",
									"prefix": "xsd",
									"nullable": true
								},
								"checkList": []
							},
							"fieldType": "_SpoName_",
							"value": ""
						},
							{
								"actualValue": "EVERY_DAY",
								"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.FrequencyDropDownFieldVO",
								"metaData": {
									"titles": {
										"name": "Периодичность запланированной операции",
										"shortName": "Периодичность запланированной операции",
										"description": "Укажите периодичность запланированной операции"
									},
									"dependsOn": [],
									"lockOnPostback": "DependentFieldsOnly",
									"postbackNotify": "None",
									"type": {
										"tint": "DropDown",
										"localPart": "RepeatFrequency",
										"namespaceURI": "http://vtb24.ru/minerva",
										"prefix": "",
										"nullable": true
									},
									"checkList": [],
									"hint": "Параметры дополнительного действия - периодичность запланированной операции"
								},
								"fieldType": "_SpoScheduleFrequency_",
								"value": {
									"id": "EveryDay",
									"valueKey": "hidden.operations.spo.frequency.EveryDay",
									"name": "EveryDay"
								},
								"fields": [{
									"id": "EveryDay",
									"valueKey": "hidden.operations.spo.frequency.EveryDay",
									"name": "EveryDay"
								},
									{
										"id": "EveryWeek",
										"valueKey": "hidden.operations.spo.frequency.EveryWeek",
										"name": "EveryWeek"
									},
									{
										"id": "Every2Week",
										"valueKey": "hidden.operations.spo.frequency.Every2Week",
										"name": "Every2Week"
									},
									{
										"id": "EveryMonth",
										"valueKey": "hidden.operations.spo.frequency.EveryMonth",
										"name": "EveryMonth"
									},
									{
										"id": "EveryQuarter",
										"valueKey": "hidden.operations.spo.frequency.EveryQuarter",
										"name": "EveryQuarter"
									},
									{
										"id": "EveryYear",
										"valueKey": "hidden.operations.spo.frequency.EveryYear",
										"name": "EveryYear"
									}],
								"keyField": "id"
							},
							{
								"actualValue": "20.01.2017",
								"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.TextFieldVO",
								"metaData": {
									"titles": {
										"name": "Дата начала исполнения запланированной операции",
										"shortName": "Дата начала исполнения запланированной операции",
										"description": "Укажите дату начала исполнения запланированной операции"
									},
									"dependsOn": [],
									"lockOnPostback": "DependentFieldsOnly",
									"postbackNotify": "None",
									"type": {
										"tint": "Date",
										"localPart": "dateTime",
										"namespaceURI": "http://www.w3.org/2001/XMLSchema",
										"prefix": "xsd",
										"nullable": true
									},
									"checkList": [{
										"className": "DateTimeRangeCheck",
										"checkProperties": {
											"errorMessage": "Неверная дата первой операции. Дата первой операции должна быть позднее текущей даты.",
											"upperBoundType": "INCLUSIVE",
											"lowerBound": "2017-01-20T00:00:00+03:00",
											"lowerBoundType": "INCLUSIVE",
											"upperBound": "2037-01-20T00:00:00+03:00"
										}
									}],
									"hint": "Параметры дополнительного действия - дата начала исполнения запланированной операции"
								},
								"fieldType": "_SpoScheduleStartDate_",
								"value": "20.01.2017"
							},
							{
								"actualValue": "",
								"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.TextFieldVO",
								"metaData": {
									"titles": {
										"name": "Дата прекращения исполнения запланированной операции",
										"shortName": "Дата прекращения исполнения запланированной операции",
										"description": "Укажите дату прекращения исполнения запланированной операции"
									},
									"dependsOn": [],
									"lockOnPostback": "DependentFieldsOnly",
									"postbackNotify": "None",
									"type": {
										"tint": "Date",
										"localPart": "dateTime",
										"namespaceURI": "http://www.w3.org/2001/XMLSchema",
										"prefix": "xsd",
										"nullable": true
									},
									"checkList": [],
									"hint": "Параметры дополнительного действия - дата прекращения исполнения запланированной операции"
								},
								"fieldType": "_SpoScheduleEndDate_",
								"value": ""
							},
							{
								"actualValue": "",
								"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.TextFieldVO",
								"metaData": {
									"titles": {
										"name": "Количество повторов",
										"shortName": "Количество повторов",
										"description": "Укажите количество повторов"
									},
									"dependsOn": [],
									"lockOnPostback": "DependentFieldsOnly",
									"postbackNotify": "None",
									"type": {
										"localPart": "int",
										"namespaceURI": "http://www.w3.org/2001/XMLSchema",
										"prefix": "xsd",
										"nullable": true
									},
									"checkList": [{
										"className": "RangeCheck",
										"checkProperties": {
											"errorMessage": "Введите значение от 1 до 1000",
											"upperBoundType": "INCLUSIVE",
											"lowerBound": "1",
											"lowerBoundType": "INCLUSIVE",
											"upperBound": "1000"
										}
									}]
								},
								"fieldType": "_SpoScheduleMaxCount_",
								"value": ""
							}]
					},
					{
						"actualValue": "None",
						"className": "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.SimpleDropDownFieldVO",
						"metaData": {
							"titles": {
								"description": ""
							},
							"dependsOn": [],
							"lockOnPostback": "DependentFieldsOnly",
							"postbackNotify": "OnChanged",
							"type": {
								"tint": "DropDown",
								"localPart": "string",
								"namespaceURI": "http://www.w3.org/2001/XMLSchema",
								"prefix": "xsd",
								"nullable": false
							},
							"checkList": [],
							"dataSource": {
								"itemType": "ListEntry",
								"keyField": "id",
								"allowNonListValue": false
							}
						},
						"fieldType": "AuthorizationType",
						"value": {
							"id": "None",
							"name": "Без подтверждения"
						},
						"fields": [{
							"id": "None",
							"name": "Без подтверждения"
						},
							{
								"id": "SMS",
								"name": "SMS/Push-код"
							},
							{
								"id": "ChallengeResponse",
								"name": "Генератор (режим \"A\")"
							},
							{
								"id": "MAC",
								"name": "Генератор (режим \"Б\")"
							}],
						"keyField": "id"
					}],
				"operation": 7760,
				"command": "CONFIRM"
			},
			ignoreCache:false,
			hasTemplate:false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));

	ZenMoney.trace('Подтвердили перевод');

}

/**
 * Компактный вывод HTML без лишних данных
 * @param {string} html
 * @returns {string}
 */
function clearHtml(html) {
	if (!html)
		return '--- undefined ---';

	if (typeof html != 'string')
		return '--- not string ---';

	//html = getParam(html, /<section[^>]*id="pageContainer"[\s\S]*?\/section>/i);

	return html.replaceAll(
		[	/<head[\s\S]+?\/head>/g, '',
			/<script[\s\S]+?\/script>/g, '',
			/<noscript[\s\S]+?\/noscript>/ig, '',
			/ +[\r\n]+/g, '\r\n',
			/[\r\n]+/g, '\r\n'
		]);
}

/**
 * Получить код валюты
 * @param {string} currency Символ валюты
 * @returns {string} Код валюты
 */
function getInstrument(currency){
	switch (currency){
		case '₽': return 'RUB';
		case '$': return 'USD';
		case '€': return 'EUR';
		default:
			throw new ZenMoney.Error("Обнаружена не обрабатываемая валюта '"+currency+"'");
	}
	return currency;
}

/**
 * Получить значение экшена компонента из JSON 
 * @param {string} json
 * @param {string} componentId Код компонента
 * @param {string} resultActionId Код экшена
 * @param {boolean} throwError Выдавать ошибку, если свойство не найдено
 * @returns {string}
 */
function getJsonObjectById(json, componentId, resultActionId, throwError){
	throwError = throwError || true;

	if (!componentId)
		return json;

	if (!json.components) {
		ZenMoney.trace("В ответе банка не найден компонент " + componentId + ": " + JSON.stringify(json));

		if (throwError)
			throw new ZenMoney.Error("Ошибка распознавания ответа от банка. Возможно, изменилась структура интернет-банка. Обратитесь к разработчикам.");
		else
			return null;
	}

	var components = json.components;
	for(var i=0; i<components.length; i++){
		var component = components[i];
		if (!component.componentId || component.componentId != componentId) continue;
		if (!resultActionId) return component;

		var results = component.results;
		for(var r=0; r<results.length; r++){
			var result = results[r];
			if (!result.actionId || result.actionId != resultActionId) continue;
			return result;
		}

		ZenMoney.trace("В ответе банка не найден объект "+componentId+"."+resultActionId+" : "+ JSON.stringify(json));

		if (throwError)
			throw new ZenMoney.Error("Ошибка распознавания ответа от банка. Возможно, изменилась структура интернет-банка. Обратитесь к разработчикам.");
		else
			return null;
	}
}

/**
 * Получить адрес редиректа
 * @param {string} url
 * @returns {string}
 */
function getRedirect(url) {
	if (url.substr(0, 1) == '/') url = url.substr(1);
	if (url.substr(0, 4) == 'http') return url;
	return g_baseurl + url;
}

/**
 * Разобрать ответ в JSON
 * @param {string} html
 */
function getJson(html) {
	try {
		return JSON.parse(html);
	} catch (e) {
		ZenMoney.trace('Bad json (' + e.message + '): ' + html);
		throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
	}
}

/**
 * Запросить JSON-ответ от сервера
 * @param {string} requestCode
 * @param {String[][]} data
 * @param {Object} parameters
 * @param {String[]} headers
 * @returns {*}
 */
function requestJson(requestCode, data, parameters, headers) {
	var params = [];
	parameters || (parameters = {});

	if (data)
		for (var d in data) params.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
	/*params.push(encodeURIComponent("appVersion") + "=" + encodeURIComponent("3.1.0"));
	params.push(encodeURIComponent("platform") + "=" + encodeURIComponent("android"));
	params.push(encodeURIComponent("origin") + "=" + encodeURIComponent("mobile,ib5,loyalty"));*/

	if (parameters.post)
		data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, headers || g_headers);
	else {
		if (parameters) for (var k in parameters) params.push(encodeURIComponent(k) + "=" + encodeURIComponent(parameters[k]));
		data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), headers || g_headers);
	}

    if (!data)
        ZenMoney.trace('Пришёл пустой ответ во время запроса по адресу "'+ g_baseurl + requestCode + '".');

	data = getJson(data);

	if (data.status && data.status != "OK" && !parameters.noException) {
		ZenMoney.trace('Ошибка запроса данных. Получено: '+ JSON.stringify(data));
		var error = ', '+data.errorMessage || '';
		ZenMoney.trace("Ошибка при запросе данных: " + requestCode + error);
		throw new ZenMoney.Error((parameters.scope ? parameters.scope + ": " : "") + (data.plainMessage || data.errorMessage));
	}

	return data;
}

/**
 * Проверка наличия значения в массиве
 * @param needle
 * @param haystack
 * @returns {boolean}
 */
function in_array(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}

/**
 * Генерация GIUD
 * @returns {string}
 */
function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}
