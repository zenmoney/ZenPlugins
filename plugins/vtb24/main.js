var g_baseurl = 'https://online.vtb.ru/',
    g_url_login = g_baseurl + 'content/v/ru/login.html',
    g_headers2 = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8,de;q=0.7,pl;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Host': 'online.vtb.ru',
        'Origin': g_baseurl,
        'Referer': g_baseurl + 'content/v/ru/login.html',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
    };
var g_preferences, g_pageToken, g_pageSecurityID, g_browserSessionUid;

/**
 * Основной метод
 */
function main() {

	g_preferences = ZenMoney.getPreferences();
	if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в ВТБ!", true, true);
	if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в ВТБ!", true, true);

	// тест переводов
	// makeTransfer('17F9D3290454421EA289CF6AEF1884440', '33EB7DE0D82643FCA680B5D2B81888550', 5.1);		// тест на счёт
	// makeTransfer('17F9D3290454421EA289CF6AEF1884440', '120DE36346D142A2B632CC74F92988890', 7);		// тест между картами
	// return;

    var json = login();
    //ZenMoney.trace('JSON после входа: '+ JSON.stringify(json));

	processAccounts(json);
    ZenMoney.trace('JSON счета: '+ JSON.stringify(json));

	ZenMoney.trace('Запрашиваем данные по операциям...');
	processTransactions();

	ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 * @returns {string} JSON ответа от сервера
 */
function login(){

    var html = ZenMoney.requestGet(g_url_login, g_headers2);
    if (!html) {
        ZenMoney.trace('По адресу "'+ g_url_login +'" банк ничего не вернул.');
        throw new ZenMoney.Error('Не удалось загрузить форму для входа в ВТБ.');
    }
    ZenMoney.trace('Загрузили форму логина.');


	//var isAlreadyAuthorized = getParamByName(html, 'isMinervaUserAuthenticated');
	//ZenMoney.trace('isAlreadyAuthorized: '+ isAlreadyAuthorized);

	//g_signinYXTW = getParam(html, /div[^>]+id="loginForm"[^>]+data-action=["'].*?yxtw=([^"']*)/i, null, html_entity_decode);
	//ZenMoney.trace('signinYXTW: '+g_signinYXTW);

    g_browserSessionUid = guid();
    var pageInstanceUidSeq = 1;
    var prevPage = '/content/v/ru/login.html';
    var callId = 4;

    ZenMoney.trace('Пытаемся войти...');
    var json = requestJson('services/signin', null, {
        post: {
            action: 'loginMode',
            login: g_preferences.login,
            _charset_: 'utf-8',
            callId: callId + '+' + g_browserSessionUid
        },
        noException: true
    }, g_headers2);
    callId++;
    ZenMoney.trace('Ввели логин.');
    //ZenMoney.trace('JSON логин: '+ JSON.stringify(json));
    //return;

    var dt = new Date(), dtStr = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + " " + dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear();
    json = requestJson('services/signin', null, {
        post: {
            login: g_preferences.login,
            password: g_preferences.password,
            dateTime: dtStr,
            logParams:'{"ScreenResolution":"1280x800"}',
            _charset_: 'utf-8',
            callId: callId + '+' + g_browserSessionUid
        },
        noException: true
    }, g_headers2);
    callId++;
    ZenMoney.trace('Ввели пароль.');

    g_pageToken = json.pageToken;
    //ZenMoney.trace('JSON пароль: '+ JSON.stringify(json));

    // проверим, не авторизированы ли уже isAlreadyAuthorized = json.authorized;
    /*if (isAlreadyAuthorized == 'true'){
        ZenMoney.trace('Уже авторизированы. Используем текущую сессию.');

        // ToDO: корректно завершать авторизацию, чтобы при повторном входе можно было воспользоваться текущей сессией
        return;
     }*/

	if (!json.authorized) {
		if (json.accountLocked)
			throw new ZenMoney.Error('Ваш аккаунт заблокирован банком, свяжитесь со службой технической поддержки для разблокирования аккаунта.', true, false);

		if (json.error && json.error.msg) {
            var error = json.error.msg;
            if (error) {
                var wrongLogin = /Логин или пароль введены неверно/i.test(error);
                throw new ZenMoney.Error(error, wrongLogin, wrongLogin);
			}
		}

		if (json.authConfirmation) {
			ZenMoney.trace('Необходимо ввести SMS/PUSH-код для входа. Запрашиваем новый код...');
			json = requestJson('services/signin', null, {
				post: {
					action: 'challenge',
                    callId: callId + '-' + g_browserSessionUid,
                    _charset_: 'utf-8',
                    pageToken: g_pageToken
				},
				noException: true
			}, g_headers2);
            callId++;
			//ZenMoney.trace('JSON sms: '+ JSON.stringify(json));

			var smsCode = ZenMoney.retrieveCode("Введите код авторизации из СМС/PUSH для входа в ВТБ", null, {
				inputType: "number",
				time: 5*60*1000
			});

			if (!smsCode || smsCode == 0 || String(smsCode).trim() == '')
				throw new ZenMoney.Error('Получен пустой код авторизации', true, false);
			else
				ZenMoney.trace('Код авторизации получен.');

			json = requestJson('services/signin', null, {
				post: {
					action: 'completeLogon',
					challengeResponse: smsCode,
                    callId: callId + '-' + g_browserSessionUid,
                    _charset_: 'utf-8',
                    pageToken: g_pageToken
				},
				noException: true
			}, g_headers2);
            callId++;
			ZenMoney.trace("СМС-код отправлен.");

			//ZenMoney.trace("JSON: "+ JSON.stringify(json));
			if (json.error) {
				error = json.error.msg;
				if (error) {
                    var wrongSms = /Неверный SMS/i.test(error);
                    throw new ZenMoney.Error("Ответ от банка: "+error, wrongSms, false);
				}
			}

			g_pageToken = json.pageToken;
			ZenMoney.trace("Успешно вошли.");
		}

		if (!json.authorized)
			throw new ZenMoney.Error('Не удалось зайти в ВТБ. Сайт изменен?');
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

    ZenMoney.trace('Инициализация запроса счетов...');
    var callId = 1;

    // открываем список карточных счетов
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
					partialResult: false,
					requestId:"8"
				}]
			}]),
			pageInstanceUid: g_browserSessionUid+'.1',
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, g_headers2);
	g_pageToken = json.pageToken;
	callId++;

	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: '[]',
			pageInstanceUid: g_browserSessionUid+'.1',
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, g_headers2);
	ZenMoney.trace('JSON списка карточных счетов: '+ JSON.stringify(json));
	g_pageToken = json.pageToken;
	callId++;

    var do_accounts = [];   // данные для запроса детальной информации по счетам
    var accMap = {};       // хэш для ускоренного сопоставления accDict и productsDetails для определения кредитного лимита
    var accDict = [];
    var portfolios = getJsonObjectById(json, 'MobileAccountsAndCardsHomepage', 'PORTFOLIOS', false);
    if (portfolios) {
        var accounts = portfolios.result.items[0].products;
        for (var a = 0; a < accounts.length; a++) {
			var account = accounts[a];

			switch (account.id) {
				// мастер-счета с картами, прикреплёнными к ним
				case 'MasterAccountProduct':
					for (var iGr = 0; iGr < account.groups.length; iGr++) {
						var group = account.groups[iGr];

						for (var iItem = 0; iItem < group.items.length; iItem++) {
							var item = group.items[iItem];
							if (!item.hasOwnProperty('number')) continue;

							if (isAccountSkipped(item.id)) {
								ZenMoney.trace('Пропускаем мастер счёт: '+ item.displayName +' (#'+ item.id +')');
								continue;
							}

							var acc = {
								id: 'master:'+ item.id,
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
							g_accounts[item.id] = {
								id: acc.id,
								title: acc.title,
								type: 'MasterAccount'
							};
						}
					}
					break;

				// дебетовые и кредитные карты без мастер-счёта
				case 'DebitCardProduct':
				case 'CreditCardProduct':
					for (var iGr = 0; iGr < account.groups.length; iGr++) {
						group = account.groups[iGr];

						for (var iItem = 0; iItem < group.items.length; iItem++) {
							item = group.items[iItem];
							if (!item.hasOwnProperty('number')) continue;

							if (isAccountSkipped(item.id)) {
								ZenMoney.trace('Пропускаем карту: '+ item.displayName +' (#'+ item.id +')');
								continue;
							}

							acc = {
								id: 'card:'+ item.id,
								title: item.displayName,
								type: 'ccard',
								syncID: item.number.substr(-4),
								instrument: getInstrument(item.amount.currency),
								balance: item.amount.sum
							};

							ZenMoney.trace('Добавляем карту: ' + acc.title + ' (#' + acc.id + ')');

							accDict.push(acc);
							g_accounts[item.id] = {
								id: acc.id,
								title: acc.title,
								type: 'CreditCard'
							};

							if (account.id = 'CreditCardProduct') {
                                var detail = {
                                    id: item.id,
                                    className: item.classType,
                                    title: item.name
                                };
                                do_accounts.push(detail);
                                accMap[item.id] = accDict.length - 1;
                            }
						}
					}
					break;
			}
		}
	}
	else
		ZenMoney.trace('В ответе банка не найден список карточных счетов.');


	if (do_accounts.length > 0) {
        ZenMoney.trace('Загружаем детальную информацию по кредитным картам...');
        json = requestJson('processor/process/minerva/action', null, {
            post: {
                components: JSON.stringify([{
                    componentId: "productsDetails",
                    actions: [{
                        actionId: "DETAILS",
                        params: {
                            objects: do_accounts
                        },
                        partialResult: false,
                        requestId: "6"
                    }]
                }]),
                pageInstanceUid: g_browserSessionUid + '.1',
                callId: callId,
                pageSecurityID: g_pageSecurityID,
                pageToken: g_pageToken
            }
        }, g_headers2);
        g_pageToken = json.pageToken;
        callId++;

        json = requestJson('processor/process/minerva/action', null, {
            post: {
                components: '[]',
                pageInstanceUid: g_browserSessionUid + '.1',
                callId: callId,
                pageSecurityID: g_pageSecurityID,
                pageToken: g_pageToken
            }
        }, g_headers2);
        ZenMoney.trace('JSON детальной информации по счетам: ' + JSON.stringify(json));
        g_pageToken = json.pageToken;
        callId++;

        var details = getJsonObjectById(json, 'productsDetails', 'DETAILS', false);
        if (details) {
            var accounts = details.result.items;
            for (var a = 0; a < accounts.length; a++) {
                var account = accounts[a];

                // Игнорируем если нет такого объекта
                if (!(account.id in accMap))
                    continue;

                var i = accMap[account.id];

                // Ставим настоящие лимиты счета
                if ("balance" in account && "amountSum" in account.balance) {
                    accDict[i].balance = account.balance.amountSum;
                }
                if ("cardAccount" in account && "creditLimit" in account.cardAccount) {
                    accDict[i].creditLimit = account.cardAccount.creditLimit;
                }
            }
        }
    }


	ZenMoney.trace('Загружаем накопительные счета...');
	// открываем список накопительных счетов и вкладов
	json = requestJson('processor/process/minerva/action', null, {
		post: {
			components: JSON.stringify([{
					"componentId": "MobileSavingsAndInvestmentsHomepage",
					"actions": [{
						"actionId": "PORTFOLIOS",
						"params": {
							"portfolioId": "InvestmentsAndSavings",
							"isMobile": "true"
						},
						"partialResult": true,
						"requestId": callId-1
					}]
				}]
			),
			pageInstanceUid: g_browserSessionUid+'.1',
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		}
	}, g_headers2);
	ZenMoney.trace('JSON ответа: '+ JSON.stringify(json));
	g_pageToken = json.pageToken;
	callId++;

	var deposits = getJsonObjectById(json, 'MobileSavingsAndInvestmentsHomepage', 'PORTFOLIOS', false);
	if (!deposits) {
		// пытаемся запросить повторно
		json = requestJson('processor/process/minerva/action', null, {
			post: {
				components: '[]',
				pageInstanceUid: g_browserSessionUid + '.1',
				callId: callId,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, g_headers2);
		ZenMoney.trace('JSON повторного запроса: ' + JSON.stringify(json));
		deposits = getJsonObjectById(json, 'MobileSavingsAndInvestmentsHomepage', 'PORTFOLIOS', false);
	}

	if (deposits && deposits.result) {
		ZenMoney.trace('items: '+JSON.stringify(deposits.result.items));
		var accounts = deposits.result.items[0].products;
		for (var a2 = 0; a2 < accounts.length; a2++) {
			var account2 = accounts[a2];
			switch (account2.id) {
				// накопительные счета
				case 'SavingsAccountProduct':
					for (var iGr = 0; iGr < account2.groups.length; iGr++) {
						group = account2.groups[iGr];

						for (var iItem = 0; iItem < group.items.length; iItem++) {
							item = group.items[iItem];
							if (!item.hasOwnProperty('number')) continue;

							if (isAccountSkipped(item.id)) {
								ZenMoney.trace('Пропускаем накопительнй счёт: '+ item.displayName +' (#'+ item.id +')');
								continue;
							}

							acc = {
								id: 'saving:'+ item.id,
								title: item.displayName,
								type: 'checking',
								syncID: [item.number.substr(-4)],
								instrument: getInstrument(item.amount.currency),
								balance: item.amount.sum
							};

							ZenMoney.trace('Добавляем накопительный счёт: ' + acc.title + ' (#' + acc.id + ')');

							// проверим нет ли карт, прикреплённых к мастер счёту
							if (item.hasOwnProperty('items'))
								for (var i = 0; i < item.items.length; i++)
									acc.syncID.push(item.items[i].number.substr(-4));

							accDict.push(acc);
							g_accounts[item.id] = {
								id: acc.id,
								title: acc.title,
								type: 'SavingsAccount'
							};
						}
					}
					break;

				// вклады (пока обрабатываем как обычные счета, так как не знаю как получить свойства вклада)
				case 'DepositProduct':
                    for (var iGr = 0; iGr < account2.groups.length; iGr++) {
                        group = account2.groups[iGr];

                        for (var iItem = 0; iItem < group.items.length; iItem++) {
                            item = group.items[iItem];
                            if (!item.hasOwnProperty('number')) continue;

                            if (isAccountSkipped(item.id)) {
                                ZenMoney.trace('Пропускаем вклад: '+ item.displayName +' (#'+ item.id +')');
                                continue;
                            }

                            acc = {
                                id: 'saving:'+ item.id,
                                title: item.displayName,
                                type: 'checking',
                                syncID: [item.number.substr(-4)],
                                instrument: getInstrument(item.amount.currency),
                                balance: item.amount.sum
                                // startDate: item.properties.dateCreation - это единственное, что доступно в выписке по умолчанию
                            };

                            ZenMoney.trace('Добавляем вклад: ' + acc.title + ' (#' + acc.id + ')');

                            // проверим нет ли карт, прикреплённых к мастер счёту
                            if (item.hasOwnProperty('items'))
                                for (var i = 0; i < item.items.length; i++)
                                    acc.syncID.push(item.items[i].number.substr(-4));

                            accDict.push(acc);
                            g_accounts[item.id] = {
                                id: acc.id,
                                title: acc.title,
                                type: 'Deposit'
                            };
                        }
                    }
                    break;
			}
		}
	} else
		ZenMoney.trace('В ответе банка не найден список накопительных счетов.');

	if (accDict.length === 0)
		throw new ZenMoney.Error('Не удалось загрузить список счетов. Это может быть временной ошибкой связи с банком. Попробуйте повторить позднее.', true);

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length);
	ZenMoney.trace('JSON: '+ JSON.stringify(accDict));
	ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 */
function processTransactions() {
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
	}

	if (createSyncTime <= 0)
		throw new ZenMoney.Error('Ошибка инициализации плагина.');

	ZenMoney.trace('CreateSyncTime: '+ new Date(createSyncTime) +' ('+ createSyncTime +')');

	var browserId = 2;
	var json;
	for(var accId in g_accounts) {
		var acc = g_accounts[accId];
		browserId++;

		ZenMoney.trace('Загружаем "' + acc.title + '" (#' + acc.id + ')');

		var lastSyncTimeVar = 'last_sync_'+ accId;
		var lastSyncTime = ZenMoney.getData(lastSyncTimeVar, 0);
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
		var nowSyncDate = new Date();
		var startDate = n2(lastSyncDate.getDate()) + '.' + n2(lastSyncDate.getMonth() + 1) + '.' + lastSyncDate.getFullYear();
		var endDate = n2(nowSyncDate.getDate()) + '.' + n2(nowSyncDate.getMonth() + 1) + '.' + nowSyncDate.getFullYear();

		ZenMoney.trace('Запрашиваем операции с ' + startDate);

		json = requestJson('processor/process/minerva/operation', null, {
			post: {
				action: 'checkAvailability',
				serviceData: 'telebank|RequestCallbackInitData|RequestCallbackScenario',
				callId: 1,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, g_headers2);

		g_pageToken = json.pageToken;

		json = requestJson('processor/process/minerva/action', null, {
			post: {
				components: JSON.stringify([
					{
						componentId:  "SideMenuComponent",
						actions:  [{
							actionId:  "REGISTERED_CALLBACK_REQUEST",
							requestId:  "1"
						}
						]
					}, {
						componentId:  "MOBILENOTIFICATIONS",
						actions:  [{
							actionId:  "NOTIFICATIONS",
							params:  {
								allNotificationsRequired:  true
							},
							permanent:  true,
							requestId:  "2"
						}, {
							actionId:  "PERSONAL_OFFERS",
							params:  {
								getIncomeParams:  {
									isPdaNotifications:  true
								}
							},
							requestId:  "3"
						}
						]
					}, {
						componentId:  "productsStatement",
						actions:  [{
							actionId:  "STATEMENT",
							params:  {
								products:  [{
									id:  accId,
									className:  acc.type,
									number:  "",
									dateCreation:  ""
								}
								],
								startDate:  startDate,
								endDate:  endDate
							},
							requestId:  "4"
						}
						]
					}, {
						componentId:  "CacheTokenComponent",
						actions:  [{
							actionId:  "CACHE_TOKENS",
							permanent:  true,
							requestId:  "5"
						}
						]
					}
				]),
				pageInstanceUid: g_browserSessionUid + '.' + browserId,
				callId: 2,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, g_headers2);
		//ZenMoney.trace('1. JSON списка операций: ' + JSON.stringify(json));

		if (!json) {

			ZenMoney.trace('Не удалось загрузить операции по счёту "'+ acc.title +'"');
			continue;
		}

		var pageToken = json.pageToken;

		json = requestJson('processor/process/minerva/action', null, {
			post: {
				components: '[]',
				pageInstanceUid: g_browserSessionUid + '.' + browserId,
				callId: 3,
				pageSecurityID: g_pageSecurityID,
				pageToken: g_pageToken
			}
		}, g_headers2);
		//ZenMoney.trace('2. JSON списка операций: ' + JSON.stringify(json));

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
				}, g_headers2);
				//ZenMoney.trace((3+k)+'. JSON списка операций: ' + JSON.stringify(json));

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

				// ВТБ в качестве идентификатора присылает каждый раз новый GUID !!!
				// tran.id = t.id;

				tran.date = t.transactionDate;

				var sum = t.amount.sum;
				var curr = getInstrument(t.amount.currency);
				if (sum > -0.01 && sum < 0.01) continue; // предохранитель

				ZenMoney.trace('Добавляем операцию #'+ iTran +': '+ t.displayedDate +' - '+ t.details +' ('+ tran.date +') '+ (sum > 0 ? '+' : '') + sum);

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

				if (t.details && (t.details.indexOf("нятие в ") > 0 || t.details.indexOf("ополнение в ") > 0 || t.details.indexOf("банкомат") > 0)){
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
							// обработка получателя при оплате через PayPass (с 27 мая)
							var dtYear = parseInt(t.transactionDate.substr(6, 4));
							var dtMonth = parseInt(t.transactionDate.substr(3, 2)) - 1;
							var dtDay = parseInt(t.transactionDate.substr(0, 2));
							var payeePatch = Date.UTC(dtYear, dtMonth, dtDay) >= Date.UTC(2017, 4, 27);

							var retail;
							if (retail = /^Операция п.*?\d+\.\s+(.+?)(?:\s+[а-яА-Я].*)?$/.exec(t.details))
								tran.payee = retail[1];
							if (payeePatch) if (retail = /^Карта \*\d{4}\s+(.*)/.exec(t.details)) {
                                if (t.details.indexOf('еревод') > 0)
                                    tran.description = retail[1];
                                else
                                    tran.payee = retail[1];
                            }
							break;

						case 'CreditCard':
							var dt = getDateFromStr(tran.date);
							// с 20 февраля скорректированный анализ получателей из комментариев
							var retailPatch = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) >= Date.UTC(2017, 1, 20);
							if ((!retailPatch && (retail = /^[\dX]+\s+Retail\s+(.+)/.exec(t.details)))                  // старый формат
								|| (retailPatch && (retail = /^(?:[\dX]+\s+Retail|\S+\s+\*\d{4})\s+(.+)/.exec(t.details)))) // новый формат
                            {
                                if (t.details.indexOf('еревод') > 0)
                                    tran.description = retail[1];
                                else
                                    tran.payee = retail[1];
                            }
							break;
					}

					// удаляем номер транзакции, попадающий в поле получателя
					if (tran.payee != undefined && tran.payee != '')
						tran.payee = String(tran.payee).replace(/(\d{6,})$/, '').trim();

					if (!tran.hasOwnProperty('payee') || !tran.payee)
						tran.comment = t.order && t.order.description ? t.order.description.trim() : t.details.trim();

					// добавим признак холда
					
				}

				tranDict.push(tran);
			}
		}

		ZenMoney.trace('Всего операций добавлено: ' + tranDict.length);
		ZenMoney.trace('JSON: ' + JSON.stringify(tranDict));
		ZenMoney.addTransaction(tranDict);

		var nextSyncTime = Date.now();
		ZenMoney.setData(lastSyncTimeVar, nextSyncTime);
		ZenMoney.trace('NextSyncTime: ' + new Date(nextSyncTime) + ' (' + nextSyncTime + ')');
	}

	ZenMoney.saveData();
}

/**
 * Перевод между счетами
 * @param {string} accFrom Идентификатор счёта-источника
 * @param {string} accTo Идентификатор счёта-назначения
 * @param {number} sum Сумма перевода
 */
function makeTransfer(accFrom, accTo, sum) {
	if (!accFrom || !accTo  || !sum) {
		ZenMoney.trace('Не корректные данные для перевода');
		return;
	}

	ZenMoney.trace('Перевод ' + sum + ' со счёта ' + accFrom + ' на счёт ' + accTo);

	var accFromType = '';
	var pos = accFrom.indexOf(':');
	if (pos > 0) {
		accFromType = accFrom.substr(0, pos);
		accFrom = accFrom.substr(pos+1);
	}

	var accToType = '';
	pos = accTo.indexOf(':');
	if (pos > 0) {
		accToType = accTo.substr(0, pos);
		accTo = accTo.substr(pos+1);
	}

	// проверка доступности перевода между счетами
	var transferAllowed = false;
	var transferType = accFromType +':'+ accToType;
	if (accFromType != '' && accToType != '') {
		switch (transferType){
			case 'master:saving':
			case 'master:deposit':
			case 'card:deposit':
			case 'master:card':
			case 'card:master':
			case 'master:master':
			case 'card:card':
				transferAllowed = true;
				break;
		}
	}

	if (!transferAllowed)
		ZenMoney.Error('Данный тип перевода не поддерживается. Возможные варианты переводов: мастер счёт - вклад/накопительный, карта - вклад.', true);

	g_preferences = ZenMoney.getPreferences();
	login();

	switch (transferType) {
		case 'master:saving':
		case 'master:deposit':
		case 'card:deposit':
			makeTransferToAcc(accFrom, accTo, sum);
			break;

		case 'master:card':
		case 'card:master':
		case 'master:master':
		case 'card:card':
			makeTransferToCard(accFrom, accTo, sum);
	}

}

function makeTransferToCard(accFrom, accTo, sum) {
	var callId = 1;

	// 1. Загружаем форму перевода
	var data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "editForm",
			operation: 7760,	// переводы на карточные счета
			ignoreCache: true,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось загрузить форму перевода');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('1. Загрузили форму перевода');
	//ZenMoney.trace('Получили ответ: '+ JSON.stringify(data));
	callId++;

	// 2. Выберем счёт-источник
	var sourceAccountListTicket = getJsonListTicket(data, 'AccountDebet');
	var destinationAccountListTicket = getJsonListTicket(data, 'AccountCredit');
	//ZenMoney.trace('AccountDebet listTicket: '+ sourceAccountListTicket);
	//ZenMoney.trace('AccountCredit listTicket: '+ destinationAccountListTicket);
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "AccountDebet@OnChanged",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
					inputStageResponseId:  data.inputStageResponseId,
					stage:  "INPUT",
					elements:  [
						{
							className:  "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType:  "AccountDebet",
							value: {
								id: accFrom,
								classType: "AccountDictionaryEntry"
							},
							keyField:  "id",
							listTicket:  sourceAccountListTicket
						},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "AccountCredit",
							keyField: "id",
							listTicket: destinationAccountListTicket
						},
						{
							actualValue: "",
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
							fieldType: "SumCur1",
							value: ""
						}],
					fieldId:  "AccountDebet",
					command:  "AccountDebet@OnChanged"
				}
			),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось выбрать счёт источник');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('2. Выбрали счёт-источник');
	callId++;

	// 3. Выберем счёт-назначения
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "AccountCredit@OnChanged",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
					inputStageResponseId: data.inputStageResponseId,
					stage: "INPUT",
					elements: [{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
						fieldType: "AccountDebet",
						value: {
							id: accFrom,
							classType: "AccountDictionaryEntry"
						},
						keyField: "id",
						listTicket: sourceAccountListTicket
					},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "AccountCredit",
							value: {
								id: accTo,
								classType: "AccountDictionaryEntry"
							},
							keyField: "Id",
							listTicket: destinationAccountListTicket
						},
						{
							actualValue: "",
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
							fieldType: "SumCur1",
							value: ""
						}],
					fieldId: "AccountCredit",
					command: "AccountCredit@OnChanged"
				}
			),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось выбрать счёт назначения');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('3. Выбрали счёт-назначения');
	callId++;

	// 4. отправляем форму
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "CONTINUE",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "INPUT",
				elements: [{
					className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
					fieldType: "AccountDebet",
					value: {
						id: accFrom,
						classType: "AccountDictionaryEntry"
					},
					keyField: "id",
					listTicket: sourceAccountListTicket
				},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
						fieldType: "AccountCredit",
						value: {
							id: accTo,
							classType: "AccountDictionaryEntry"
						},
						keyField: "id",
						listTicket: destinationAccountListTicket
					},
					{
						actualValue: "",
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
						fieldType: "SumCur1",
						value: sum
					}],
				operation: 7760,
				command: "CONTINUE"
			}),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось отправить форму');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('4. Отправили форму');
	callId++;

	// 5. Готовимся подтвердить перевод
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "CONFIRM",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "CONFIRMATION",
				elements: [{
					className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
					name: "TEMPLATE_PARAMETERS_FULL",
					elements: [{
						actualValue: false,
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
						fieldType: "_TemplateToggle_",
						value: false
					}
					]
				},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
						name: "SPO_PARAMETERS_FULL",
						elements: [{
							actualValue: false,
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
							fieldType: "_SpoToggle_",
							value: false
						}
						]
					},
					{
						actualValue: "None",
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.SimpleDropDownFieldVO",
						fieldType: "AuthorizationType",
						value: {
							id: "None",
							name: "Без подтверждения"
						},
						fields: [{
							id: "None",
							name: "Без подтверждения"
						}, {
							id: "SMS",
							name: "SMS/Push-код"
						}, {
							id: "ChallengeResponse",
							name: "Генератор (режим \"A\")"
						}, {
							id: "MAC",
							name: "Генератор (режим \"Б\")"
						}
						],
						keyField: "id"
					}
				],
				operation: 7760,
				command: "CONFIRM"
			}),
			ignoreCache: false,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось подготовиться к подтверждению перевода');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('5. Готовимся подтвердить перевод');
	callId++;

	// 6. Подтверждаем перевод
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "DONE",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "NOTIFICATION",
				elements: [],
				operation: 7760,
				command: "DONE"
			}),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось подтвердить перевод');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('6. Подтверждаем перевод');
}

function makeTransferToAcc(accFrom, accTo, sum) {
	var callId = 1;

	// 1. Загружаем форму перевода
	var data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "editForm",
			operation: 9210, // перевод на накопительные счета и вклады
			ignoreCache: true,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось загрузить форму перевода');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('1. Загрузили форму перевода');
	//ZenMoney.trace('Получили ответ: '+ JSON.stringify(data));
	callId++;

	// 2. Выберем счёт-источник
	var sourceAccountListTicket = getJsonListTicket(data, 'SourceAccountOrCard');
	var destinationAccountListTicket = getJsonListTicket(data, 'DestAccountOrCard');
	//ZenMoney.trace('AccountDebet listTicket: '+ sourceAccountListTicket);
	//ZenMoney.trace('AccountCredit listTicket: '+ destinationAccountListTicket);
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "SourceAccountOrCard@OnChanged",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
					inputStageResponseId: data.inputStageResponseId,
					stage: "INPUT",
					elements: [
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "SourceAccountOrCard",
							value: {
								id: accFrom,
								classType: "AccountDictionaryEntry"
							},
							keyField: "id",
							listTicket: sourceAccountListTicket
						},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "DestAccountOrCard",
							keyField: "id",
							listTicket: destinationAccountListTicket
						},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
							fieldType: "Sum",
							value: ""
						}],
					"fieldId": "SourceAccountOrCard",
					"command": "SourceAccountOrCard@OnChanged"
				}
			),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось выбрать счёт источник');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('2. Выбрали счёт-источник');
	callId++;

	// 3. Выберем счёт-назначения
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "DestAccountOrCard@OnChanged",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
					inputStageResponseId: data.inputStageResponseId,
					stage: "INPUT",
					elements: [
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "SourceAccountOrCard",
							value: {
								id: accFrom,
								classType: "AccountDictionaryEntry"
							},
							keyField: "id",
							listTicket: sourceAccountListTicket
						},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
							fieldType: "DestAccountOrCard",
							value: {
								id: accTo,
								classType: "AccountDictionaryEntry"
							},
							keyField: "Id",
							listTicket: destinationAccountListTicket
						},
						{
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
							fieldType: "Sum",
							value: ""
						}],
					"fieldId": "DestAccountOrCard",
					"command": "DestAccountOrCard@OnChanged"
				}
			),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось выбрать счёт назначения');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('3. Выбрали счёт-назначения');
	callId++;

	// 4. отправляем форму
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "CONTINUE",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "INPUT",
				elements: [
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
						fieldType: "SourceAccountOrCard",
						value: {
							id: accFrom,
							classType: "AccountDictionaryEntry"
						},
						keyField: "id",
						listTicket: sourceAccountListTicket
					},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.modelbased.AccountDictionaryDropDownVO",
						fieldType: "DestAccountOrCard",
						value: {
							id: accTo,
							classType: "AccountDictionaryEntry"
						},
						keyField: "id",
						listTicket: destinationAccountListTicket
					},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.SumFieldVO",
						fieldType: "Sum",
						value: sum
					}],
				operation: 9210,
				command: "CONTINUE"
			}),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось отправить форму');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('4. Отправили форму');
	callId++;

	// 5. Выбраем способ подтверждения без СМС
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "AuthorizationType@OnChanged",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "CONFIRMATION",
				elements: [
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
						name: "TEMPLATE_PARAMETERS_FULL",
						elements: [{
							actualValue: false,
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
							fieldType: "_TemplateToggle_",
							value: false
						}]
					},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
						name: "SPO_PARAMETERS_FULL",
						elements: [{
							actualValue: false,
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
							fieldType: "_SpoToggle_",
							value: false
						}]
					},
					{
						actualValue: "None",
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.SimpleDropDownFieldVO",
						fieldType: "AuthorizationType",
						value: {
							id: "None",
							name: "Без подтверждения"
						},
						fields: [
							{
								id: "None",
								name: "Без подтверждения"
							}, {
								id: "SMS",
								name: "SMS/Push-код"
							}, {
								id: "ChallengeResponse",
								name: "Генератор (режим \"A\")"
							}, {
								id: "MAC",
								name: "Генератор (режим \"Б\")"
							}
						],
						keyField: "id"
					}
				],
				fieldId: "AuthorizationType",
				command: "AuthorizationType@OnChanged"
			}),
			ignoreCache: false,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось подготовиться к подтверждению перевода');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('5. Выбираем способ подтверждения без СМС');
	callId++;

	// 6. Готовимся подтвердить перевод
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "CONFIRM",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "CONFIRMATION",
				elements: [{
					className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
					name: "TEMPLATE_PARAMETERS_FULL",
					elements: [{
						actualValue: false,
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
						fieldType: "_TemplateToggle_",
						value: false
					}
					]
				},
					{
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.StageGroupVO",
						name: "SPO_PARAMETERS_FULL",
						elements: [{
							actualValue: false,
							className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.CheckboxFieldVO",
							fieldType: "_SpoToggle_",
							value: false
						}
						]
					},
					{
						actualValue: "None",
						className: "com.vtb.telebank.client.shared.minerva.transfers.operations.confirmoperations.base.listentrys.SimpleDropDownFieldVO",
						fieldType: "AuthorizationType",
						value: {
							id: "None",
							name: "Без подтверждения"
						},
						fields: [
							{
								id: "None",
								name: "Без подтверждения"
							}, {
								id: "SMS",
								name: "SMS/Push-код"
							}, {
								id: "ChallengeResponse",
								name: "Генератор (режим \"A\")"
							}, {
								id: "MAC",
								name: "Генератор (режим \"Б\")"
							}
						],
						keyField: "id"
					}
				],
				operation: 9210,
				command: "CONFIRM"
			}),
			ignoreCache: false,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось подготовиться к подтверждению перевода');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('5. Готовимся подтвердить перевод');
	callId++;

	// 6. Подтверждаем перевод
	data = ZenMoney.requestPost(g_baseurl + 'processor/process/minerva/operation',
		{
			action: "confirm",
			command: "DONE",
			inputStageResponseId: data.inputStageResponseId,
			jsonObj: JSON.stringify({
				inputStageResponseId: data.inputStageResponseId,
				stage: "NOTIFICATION",
				elements: [],
				operation: 9210,
				command: "DONE"
			}),
			ignoreCache: true,
			hasTemplate: false,
			callId: callId,
			pageSecurityID: g_pageSecurityID,
			pageToken: g_pageToken
		},
		addHeaders({Referer: g_url_login}));
	if (!data) throw new ZenMoney.Error('Не удалось подтвердить перевод');
	data = getJson(data);
	checkErrors(data);
	ZenMoney.trace('6. Подтверждаем перевод');
}

/**
 * Проверить данные на наличие ошибок
 * @param data
 */
function checkErrors(data) {
	if (data.errors.length > 0) {
		ZenMoney.trace('Ответ с ошибкой: '+ JSON.stringify(data));
		if (data.errors[0].msg)
			throw new ZenMoney.Error('Перевод не удался. '+ data.errors[0].msg);
		else
			throw new ZenMoney.Error('Перевод не удался. Пожалуйста, сообщите нам об этом и пришлите лог синхронизации, чтобы мы могли исправить это.');
	}
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
 * Получить значение listTicket из JSON
 * @param {JSON} json
 * @param {string} elementFieldType
 * @param {boolean} throwError
 */
function getJsonListTicket(json, elementFieldType, throwError){
	throwError = throwError || true;

	if (!elementFieldType)
		return null;

	if (!json.elements) {
		ZenMoney.trace("В ответе банка не найдено свойство 'elements': " + JSON.stringify(json));

		if (throwError)
			throw new ZenMoney.Error("Ошибка распознавания ответа от банка. Возможно, изменилась структура интернет-банка. Обратитесь к разработчикам.");
		else
			return null;
	}

	for(var e = 0; e < json.elements.length; e++) {
		var element = json.elements[e];
		if (!element || !element.hasOwnProperty('fieldType') || element.fieldType != elementFieldType)
			continue;

		return element.listTicket;
	}

	ZenMoney.trace('В ответе сервера не найдено свойство "'+ elementFieldType +'"');
	return null;
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

		// попытаемся представить, что это html
		if (message = /page__error-panel-text.*?>(.*?)<\/div/i.exec(html))
			throw new ZenMoney.Error('Ответ банка: '+message);

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

	var paramsStr = params.length > 0 ? '?' + params.join('&') : '';
	var url = g_baseurl + requestCode;
	if (parameters.post)
		data = ZenMoney.requestPost(url + paramsStr, parameters.post, headers || g_headers2);
	else {
		if (parameters) for (var k in parameters) params.push(encodeURIComponent(k) + "=" + encodeURIComponent(parameters[k]));
		data = ZenMoney.requestGet(url + paramsStr, headers || g_headers2);
	}

	var resultCode = ZenMoney.getLastStatusCode();

	if (resultCode == '403')
		throw new ZenMoney.Error("Доступ к странице интернет-банка запрещён: "+ url);

	if (!data) {
		ZenMoney.trace('Пришёл пустой ответ во время запроса по адресу "' + url + '" [ResultCode: ' + resultCode + ']');
		return null;
	}

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

/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) {
	return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

/**
 * Получить дату из строки
 * @param str
 * @returns {Date}
 */
function getDateFromStr(str) {
	return new Date(parseInt(str.substr(6, 4)), parseInt(str.substr(3, 2))-1, parseInt(str.substr(0, 2)))
}
