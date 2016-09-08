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
	g_preferences, g_pageToken, g_pageSecurityID;

function main() {
	g_preferences = ZenMoney.getPreferences();
	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);

	var json = login();
	//ZenMoney.trace('JSON после входа: '+ JSON.stringify(json));

	processAccounts(json);

	ZenMoney.trace('Запрашиваем данные по последним операциям...');
	for(var accId in g_accounts)
		processTransactions(accId);
}

function login(){
	//var html = ZenMoney.requestGet(g_baseurl + 'content/telebank-client/ru/login.html', g_headers);
	var html = ZenMoney.requestGet(g_url_login, g_headers);
	g_pageSecurityID = getParam(html, /page-security-id="([^"]*)/i, null, html_entity_decode);
	ZenMoney.trace('pageSecurityId: '+g_pageSecurityID);

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
			//logParams: {ScreenResolution: '1920x1080' },
			//callId: 2,
			//pageSecurityID: g_pageSecurityID,
			//timezone: -(new Date).getTimezoneOffset()
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
			//throw new ZenMoney.Error('Телебанк требует ввести одноразовый смс-код. Для использования данного провайдера, проверку кода необходимо отключить. Если это' +
			//' невозможно, поставьте в настройках провайдера источник данных Мобильное приложение, код будет запрашиваться.');
			ZenMoney.trace('Необходимо ввести SMS-код для входа. Запрашиваем новый код...');
			json = requestJson("services/signin", null, {
				post: {
					action: 'challenge'
					// _charset_: 'utf-8',
					// callId: 3,
					// pageSecurityID: g_pageSecurityID,
					// pageToken: g_pageToken
				},
				noException: true
			});
			//ZenMoney.trace('JSON: '+ JSON.stringify(json));

			var smsCode = ZenMoney.retrieveCode("Введите код авторизации из СМС для входа в ВТБ24-Онлайн", null, {
				inputType: "number",
				time: 18E4
			});
			ZenMoney.trace("СМС-код получен.");

			json = requestJson('services/signin', null, {
				post: {
					action: 'completeLogon',
					isMobile: true,
					challengeResponse: smsCode
					// callId: 4,
					// pageSecurityID: g_pageSecurityID,
					// pageToken: g_pageToken
				},
				noException: true
			});

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

function processAccounts(json){
	ZenMoney.trace('Инициализация...');

	json = requestJson('processor/process/minerva/operation', null, {
		post: {
			action: 'checkAvailability',
			serviceData: 'telebank|RequestCallbackInitData|RequestCallbackScenario',
			callId: 1,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('1. JSON checkAvailability: '+ JSON.stringify(json));

	var pageToken = json.pageToken;

	json = requestJson('services/news/unreaded', null, {
		post: {
			callId: 2,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('2. JSON unreaded: '+ JSON.stringify(json));

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "SIDEMENUCOMPONENT",
					"actions" : [{
						"actionId" : "REGISTERED_CALLBACK_REQUEST",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}, {
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : true
						},
						"requestId" : "-1308964054"
					}, {
						"actionId" : "PERSONAL_OFFERS",
						"callbacks" : {},
						"params" : {
							"getIncomeParams" : {
								"isPdaNotifications" : true
							}
						},
						"requestId" : "-618543480"
					}
					]
				}, {
					"componentId" : "CRMHomepage",
					"actions" : [{
						"actionId" : "PERSONAL_OFFERS",
						"requestId" : "0"
					}
					]
				}, {
					"componentId" : "MobileTemplatesHomepage",
					"actions" : [{
						"actionId" : "USER_TEMPLATES",
						"params" : {
							"showOnMainPage" : "true"
						},
						"requestId" : "1943761352"
					}
					]
				}, {
					"componentId" : "recurringPayments",
					"actions" : [{
						"actionId" : "REGULAR_OPERATION_OCCURRENCES",
						"params" : {
							"occurrenceStatuses" : [{
								"status" : "Planned"
							}, {
								"status" : "InProgressAtPlannedDate"
							}, {
								"status" : "InProgressAtNotPlannedDate"
							}
							],
							"count" : "3"
						},
						"requestId" : "747569390"
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}
				]
			),
			ignoreCache: false,
			callId: 3,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('3. JSON action: '+ JSON.stringify(json));

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "SIDEMENUCOMPONENT",
					"actions" : [{
						"actionId" : "REGISTERED_CALLBACK_REQUEST",
						"callbacks" : {},
						"params" : {},
						"requestId" : getJsonObjectById(json, 'SIDEMENUCOMPONENT', 'REGISTERED_CALLBACK_REQUEST').executeId, //json.components[0].results[0].executeId,
						"executeId" : getJsonObjectById(json, 'SIDEMENUCOMPONENT', 'REGISTERED_CALLBACK_REQUEST').executeId
					}]
				}, {
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : { "allNotificationsRequired" : false },
						"requestId" : "-1308964054"
					}, {
						"actionId" : "PERSONAL_OFFERS",
						"callbacks" : {},
						"params" : {
							"getIncomeParams" : { "isPdaNotifications" : true }
						},
						"requestId" : getJsonObjectById(json, 'MOBILENOTIFICATIONS', 'PERSONAL_OFFERS').executeId, //json.components[1].results[1].executeId,
						"executeId" : getJsonObjectById(json, 'MOBILENOTIFICATIONS', 'PERSONAL_OFFERS').executeId
					}]
				}, {
					"componentId" : "CRMHomepage",
					"actions" : [{
						"actionId" : "PERSONAL_OFFERS",
						"requestId" : getJsonObjectById(json, 'CRMHomepage', 'PERSONAL_OFFERS').executeId, //json.components[2].results[0].executeId,
						"executeId" : getJsonObjectById(json, 'CRMHomepage', 'PERSONAL_OFFERS').executeId
					}]
				},
				{
					"componentId" : "MobileTemplatesHomepage",
					"actions" : [{
						"actionId" : "USER_TEMPLATES",
						"params" : {
							"showOnMainPage" : "true"
						},
						"requestId" : getJsonObjectById(json, 'MobileTemplatesHomepage', 'USER_TEMPLATES').executeId,
						"executeId" : getJsonObjectById(json, 'MobileTemplatesHomepage', 'USER_TEMPLATES').executeId
					}
					]
				}, {
					"componentId" : "recurringPayments",
					"actions" : [{
						"actionId" : "REGULAR_OPERATION_OCCURRENCES",
						"params" : {
							"occurrenceStatuses" : [{
								"status" : "Planned"
							}, {
								"status" : "InProgressAtPlannedDate"
							}, {
								"status" : "InProgressAtNotPlannedDate"
							}
							],
							"count" : "3"
						},
						"requestId" : getJsonObjectById(json, 'recurringPayments', 'REGULAR_OPERATION_OCCURRENCES').executeId,
						"executeId" : getJsonObjectById(json, 'recurringPayments', 'REGULAR_OPERATION_OCCURRENCES').executeId
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}]
				}
			]),
			ignoreCache: false,
			callId: 4,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('4. JSON action: '+ JSON.stringify(json));

	// открываем список счетов, отмеченных для показа на главной
	ZenMoney.trace('Открываем список счетов..');
	pageToken = json.pageToken;
	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : false
						},
						"requestId" : "-1308964054"
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}, {
					"componentId" : "MobileAccountsAndCardsHomepage",
					"actions" : [{
						"actionId" : "PORTFOLIOS",
						"params" : {
							"portfolioId" : "AccountsAndCards",
							"isMobile" : "true"
						},
						"partialResult" : true,
						"requestId" : "426051343"
					}
					]
				}
			]),
			ignoreCache: false,
			callId: 5,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('5. JSON action: '+ JSON.stringify(json));

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : false
						},
						"requestId" : "-1308964054"
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}, {
					"componentId" : "MobileAccountsAndCardsHomepage",
					"actions" : [{
						"actionId" : "PORTFOLIOS",
						"params" : {
							"portfolioId" : "AccountsAndCards",
							"isMobile" : "true"
						},
						"partialResult" : true,
						"requestId" : getJsonObjectById(json, 'MobileAccountsAndCardsHomepage', 'PORTFOLIOS').executeId, //json.components[2].results[0].executeId,
						"executeId" : getJsonObjectById(json, 'MobileAccountsAndCardsHomepage', 'PORTFOLIOS').executeId
					}
					]
				}
			]),
			ignoreCache: false,
			callId: 6,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('6. JSON action: '+ JSON.stringify(json));

	g_pageToken = json.pageToken;

	var accounts = getJsonObjectById(json, 'MobileAccountsAndCardsHomepage', 'PORTFOLIOS').result.items[0].products;
	ZenMoney.trace('Получено счетов (JSON): '+JSON.stringify(accounts));
	var accDict = [];
	for(var a=0; a<accounts.length; a++){
		var account = accounts[a];
		switch (account.id){
			case 'CreditCardProduct':
				// кредитные карты
				for(var iGr=0; iGr<account.groups.length; iGr++){
					var group = account.groups[iGr];

					for(var iItem=0; iItem<group.items.length; iItem++) {
						var item = group.items[iItem];

						var acc = {
							id: item.id,
							title: item.name,
							type: 'ccard',
							syncID: item.number.substring(item.number.length - 4),
							instrument: getInstrument(item.amount.currency),
							balance: item.amount.sum
						};

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

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length);
	ZenMoney.trace('JSON: '+ JSON.stringify(accDict));
	ZenMoney.addAccount(accDict);
}

function processTransactions(accId){
	var acc = g_accounts[accId];

	ZenMoney.trace('Загружаем "'+acc.title+'" (#'+accId+')');

	var lastSyncTime = ZenMoney.getData('last_sync_'+accId, 0);

	// первоначальная инициализация
	if (lastSyncTime == 0) {
		// по умолчанию загружаем операции за неделю
		var period = !g_preferences.hasOwnProperty('period') || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

		if (period > 100) period = 100;	// на всякий случай, ограничим лимит, а то слишком долго будет

		lastSyncTime = Date.now() - period*24*60*60*1000;
	}

	// всегда захватываем одну неделю минимум
	lastSyncTime = Math.min(lastSyncTime, Date.now() - 7*24*60*60*1000);
	var lastSyncDate = new Date(lastSyncTime);
	var nowSyncDate = new Date();
	var startDate = n2(lastSyncDate.getDate())+'.'+n2(lastSyncDate.getMonth()+1)+'.'+lastSyncDate.getFullYear();
	var endDate = n2(nowSyncDate.getDate())+'.'+n2(nowSyncDate.getMonth()+1)+'.'+nowSyncDate.getFullYear();

	ZenMoney.trace('Запрашиваем операции с '+ lastSyncDate.toLocaleString());
	
	ZenMoney.requestPost(g_baseurl + g_url_product_select, {
		portfolioId: "AccountsAndCards",
		_charset_: "UTF-8",
		productId: acc.id,
		productClass: acc.type,
		productTitle: acc.title
	}, g_headers);

	html = ZenMoney.requestGet(g_url_product_details, g_headers);
	g_pageSecurityID = getParam(html, /page-security-id="([^"]*)/i, null, html_entity_decode);

	json = requestJson('processor/process/minerva/operation', null, {
		post: {
			action: 'checkAvailability',
			serviceData: 'telebank|RequestCallbackInitData|RequestCallbackScenario',
			callId: 1,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('1. JSON checkAvailability: '+ JSON.stringify(json));

	var pageToken = json.pageToken;

	json = requestJson('services/news/unreaded', null, {
		post: {
			callId: 2,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('2. JSON unreaded: '+ JSON.stringify(json));

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "SIDEMENUCOMPONENT",
					"actions" : [{
						"actionId" : "REGISTERED_CALLBACK_REQUEST",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}, {
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : true
						},
						"requestId" : "-1308964054"
					}, {
						"actionId" : "PERSONAL_OFFERS",
						"callbacks" : {},
						"params" : {
							"getIncomeParams" : {
								"isPdaNotifications" : true
							}
						},
						"requestId" : "-618543480"
					}
					]
				}, {
					"componentId" : "productsStatement",
					"actions" : [{
						"actionId" : "STATEMENT",
						"params" : {
							"products" : [{
								"id" : acc.id,
								"className" : acc.type,
								"number" : "",
								"dateCreation" : ""
							}
							],
							"startDate" : startDate,
							"endDate" : endDate
						},
						"requestId" : "1604044926"
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}
				]
			),
			ignoreCache: false,
			callId: 3,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('3. JSON action: '+ JSON.stringify(json));

	var pageToken2 = json.pageToken;

	var prodStat = getJsonObjectById(json, 'productsStatement', 'STATEMENT').executeId;
	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "SIDEMENUCOMPONENT",
					"actions" : [{
						"actionId" : "REGISTERED_CALLBACK_REQUEST",
						"callbacks" : {},
						"params" : {},
						"requestId" : getJsonObjectById(json, 'SIDEMENUCOMPONENT', 'REGISTERED_CALLBACK_REQUEST').executeId,
						"executeId" : getJsonObjectById(json, 'SIDEMENUCOMPONENT', 'REGISTERED_CALLBACK_REQUEST').executeId
					}
					]
				}, {
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : false
						},
						"requestId" : "-1308964054"
					}, {
						"actionId" : "PERSONAL_OFFERS",
						"callbacks" : {},
						"params" : {
							"getIncomeParams" : {
								"isPdaNotifications" : true
							}
						},
						"requestId" : getJsonObjectById(json, 'MOBILENOTIFICATIONS', 'PERSONAL_OFFERS').executeId,
						"executeId" : getJsonObjectById(json, 'MOBILENOTIFICATIONS', 'PERSONAL_OFFERS').executeId
					}
					]
				}, {
					"componentId" : "productsStatement",
					"actions" : [{
						"actionId" : "STATEMENT",
						"params" : {
							"products" : [{
								"id" : "120DE36346D142A2B632CC74F9298889",
								"className" : "CreditCard",
								"number" : "",
								"dateCreation" : ""
							}
							],
							"startDate" : "06.08.2016",
							"endDate" : "06.09.2016"
						},
						"requestId" : prodStat,
						"executeId" : prodStat
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}
				]
			),
			ignoreCache: false,
			callId: 4,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('4. JSON action: '+ JSON.stringify(json));


	// запрашиваем операции по счёту
	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : false
						},
						"requestId" : "-1308964054"
					}
					]
				}, {
					"componentId" : "productsStatement",
					"actions" : [{
						"actionId" : "STATEMENT",
						"params" : {
							"products" : [{
								"id" : acc.id,
								"className" : acc.type,
								"number" : "",
								"dateCreation" : ""
							}
							],
							"startDate" : startDate,
							"endDate" : endDate
						},
						"requestId" : prodStat,
						"executeId" : prodStat
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}
				]
			),
			ignoreCache: false,
			callId: 5,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken2
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('5. JSON action: '+ JSON.stringify(json));

	// обрабатываем и добавляем операции
	var tranDict = [];
	var transactionItems = getJsonObjectById(json, 'productsStatement', 'STATEMENT').result.items;
	if (transactionItems.length > 0){
		var transactions = transactionItems[0].transactions;
		ZenMoney.trace('JSON transactions: '+ JSON.stringify(transactions));

		for(var iTran=0; iTran<transactions.length; iTran++){
			var t = transactions[iTran];

			// учитываем только успешные операции
			if (t.failed == "false")
				continue;

			var tran = {};
			ZenMoney.trace('Добавляем операцию #'+iTran+': '+ t.displayedDate +' - '+ t.details);

			tran.date = n2(t.date.day)+'.'+n2(t.date.monthAsInt)+'.'+t.date.year;

			var sum = t.amount.sum;
			if (sum > -0.01 && sum < 0.01) continue; // предохранитель

			if (sum < 0){
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

			tran.comment = t.details;

			tranDict.push(tran);
		}
	}

	ZenMoney.trace('Всего операций добавлено: '+ tranDict.length);
	ZenMoney.trace('JSON: '+ JSON.stringify(tranDict));
	ZenMoney.addTransaction(tranDict);

	// в этом блоке нет необходимости
	/*json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId" : "MOBILENOTIFICATIONS",
					"actions" : [{
						"actionId" : "NOTIFICATIONS",
						"callbacks" : {},
						"params" : {
							"allNotificationsRequired" : false
						},
						"requestId" : "-1308964054"
					}
					]
				}, {
					"componentId" : "CACHETOKENCOMPONENT",
					"actions" : [{
						"actionId" : "CACHE_TOKENS",
						"callbacks" : {},
						"params" : {},
						"requestId" : "3938"
					}
					]
				}
				]
			),
			ignoreCache: false,
			callId: 6,
			pageSecurityID: g_pageSecurityID,
			pageToken: pageToken2
		}
	}, addHeaders({ Referer: g_url_login }));
	ZenMoney.trace('6. JSON action: '+ JSON.stringify(json));*/
}



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

function getInstrument(currency){
	switch (currency){
		case '₽': return 'RUB';
		case '$': return 'USD';
		case '€': return 'EUR';
	}
	return currency;
}

function getJsonObjectById(json, componentId, resultActionId){
	if (!componentId)
		return json;

	if (!json.components)
		return null;

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

		return null;
	}
}

function getRedirect(url) {
	if (url.substr(0, 1) == '/') url = url.substr(1);
	if (url.substr(0, 4) == 'http') return url;
	return g_baseurl + url;
}

function getJson(html) {
	try {
		return JSON.parse(html);
	} catch (e) {
		ZenMoney.trace('Bad json (' + e.message + '): ' + html);
		throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
	}
}

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

	data = getJson(data);

	if (data.status && data.status != "OK" && !parameters.noException) {
		ZenMoney.trace('Ошибка запроса данных. Получено: '+ JSON.stringify(data));
		var error = ', '+data.errorMessage || '';
		ZenMoney.trace("Ошибка при запросе данных: " + requestCode + error)
		throw new ZenMoney.Error((parameters.scope ? parameters.scope + ": " : "") + (data.plainMessage || data.errorMessage));
	}

	return data;
}

function in_array(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}