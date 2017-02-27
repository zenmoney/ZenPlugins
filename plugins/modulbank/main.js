// chukaev@live.ru +79991554646

var g_headers = {},
	g_authurl =  "https://oauth.modulbank.ru/api/oauth2/",
	g_baseurl =  "https://api.modulbank.ru/v1/",
	g_sessionid,
	g_preferences,
	g_accounts = []; // линки активных счетов, по ним фильтруем обработку операций

var g_clientId     = "",
    g_clientSecret = "";

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
 * @returns {*}
 */
function login() {

	g_sessionid = ZenMoney.getData('mb_session', undefined);
	
	requestJson("account-info");
	
	if (g_sessionid) return;
	
	if (!g_preferences.login) 

		throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
	
	if (!g_preferences.password) 

		throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);


	var code = ZenMoney.requestPost(g_authurl, {
		"CellPhone":g_preferences.login,
		"Password":g_preferences.password,
		"ClientId":g_clientId,
		"Scope":"operation-history account-info",
		"RedirectUri":"https://zenmoney.ru"
	});

	var smsCode = ZenMoney.retrieveCode("Введите код подтверждения из смс для авторизации приложения в интернет-банке Модульбанк", null, {
		inputType: "number",
		time: 300000 // TODO: 5 минут
	});

	code = getJson(ZenMoney.requestPost(g_authurl + "entersmscode", 
		{"CellPhone":g_preferences.login}, 
		{"MB-SMS-VALIDATION":smsCode}));
	
	if (code["exceptionType"] == "SmsWrongCode"){

		throw new ZenMoney.Error("Не верный код смс!", null, true);
	}

	code = ZenMoney.requestPost(g_authurl + "accept", 
	{	
		"Token":code["Token"],
		"RedirectUri":"https://zenmoney.ru"
	})
	.split('=')[1];

	code = code.substring(0, code.length - 1);
		
	g_sessionid = getJson(ZenMoney.requestPost(g_baseurl + "oauth/token", {
		"ClientId":g_clientId,
		"clientSecret":g_clientSecret,
		"redirectUri":"https://zenmoney.ru",
    	"code":code
	}))["accessToken"];

	ZenMoney.setData('mb_session', g_sessionid);
	ZenMoney.saveData();
}

/**
 * Обработка счетов
 */
function processAccounts() {
	
	ZenMoney.trace('Запрашиваем данные по счетам...');
	
	var accounts = [];

	var accDict = []; 

	requestJson("account-info").forEach(function(company) {

		company.bankAccounts.forEach(function(account) { accounts.push(account); });
	});
	
	ZenMoney.trace('Получено счетов: '+ accounts.length);

	accounts.forEach(function(account) {
		
		if (isAccountSkipped(account.id)) {

			ZenMoney.trace('Пропускаем карту/счёт: ' + account.accountName);
		}

		// расчетный счет ------------------------------------
		if (account.category == 'CheckingAccount') {

			ZenMoney.trace('+ расчетный счет: ' + account.accountName);

			accDict.push({
				id:				account.id,
				title:			account.accountName,
				type:			'checking',
				balance:		account.balance,
				syncID: 		[account.number.substring(account.number.length-4)],
				creditLimit: 	0

			});
			g_accounts.push(account.id);
		}
		// депозитный счет ------------------------------------
		else if (account.category == 'DepositAccount') {

			ZenMoney.trace('+ депозитный счет: ' + account.accountName);

			accDict.push({
				id:						account.id,
				title:					account.accountName,
				type:					'deposit',
				balance:				account.balance,
				syncID: 				[account.number.substring(account.number.length-4)],
				startDate: 				account.beginDate,
				instrument:				account.currency,
				percent:				0,
				endDateOffsetInterval: 'month',
				capitalization: 		true,
				endDateOffset:			1,
				payoffInterval:			'month',
				payoffStep:				1,
				creditLimit: 			0
			});
			g_accounts.push(account.id);
		}
		// дебетовые карты ------------------------------------
		else if (account.category == 'CardAccount') {

			ZenMoney.trace('+ дебетовая карта: ' + account.accountName);

			accDict.push({
				id:				account.id,
				title:			account.accountName,
				type:			'ccard',
				balance:		account.balance,
				syncID: 		[account.number.substring(account.number.length-4)]
			});
			g_accounts.push(account.id);
		}
		// счет для процентов по депозиту ------------------------------------
		else if (account.category == 'DepositRateAccount') {

			ZenMoney.trace('+ счет для процентов: ' + account.accountName);

			accDict.push({
				id:				account.id,
				title:			account.accountName,
				type:			'deposit',
				balance:		account.balance,
				syncID: 		[account.number.substring(account.number.length-4)],
				creditLimit: 	0
			});
			g_accounts.push(account.id);
		}
		// счет учета резервов ------------------------------------
		else if (account.category == 'ReservationAccounting') {

			ZenMoney.trace('+ счет учета резервов: ' + account.accountName);

			accDict.push({
				id:				account.id,
				title:			account.accountName,
				type:			'deposit',
				balance:		account.balance,
				syncID: 		[account.number.substring(account.number.length-4)],
				creditLimit: 	0
			});
			g_accounts.push(account.id);
		}
	});

	ZenMoney.trace('Всего счетов добавлено: '+ accDict.length);

	ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 * @param data
 */
function processTransactions(data) {
	
	var lastSyncTime = ZenMoney.getData('last_sync', 0);

	// первоначальная инициализация
	if (lastSyncTime == 0) {
		
		// по умолчанию загружаем операции за неделю
		var period = !g_preferences.hasOwnProperty('period') || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

		if (period > 365) period = 365;	// на всякий случай, ограничим лимит, а то слишком долго будет

		lastSyncTime = Date.now() - period*24*60*60*1000;
	}

	ZenMoney.trace(lastSyncTime);

	// всегда захватываем одну неделю минимум
	lastSyncTime = Math.min(lastSyncTime, Date.now() - 7*24*60*60*1000);

	ZenMoney.trace('Запрашиваем операции с '+ new Date(lastSyncTime).toLocaleString());

	var accounts = [];

	var companies = requestJson("account-info");

	companies.forEach(function(company) {

		company.bankAccounts.forEach(function(account) { 

			// работаем только по активным счетам
			if (in_array(account.id, g_accounts)) 

				accounts.push(account); 
		});
	});

	var transactions = [];

	accounts.forEach(function(account) {
		
		transactions = transactions.concat(requestJson("operation-history/" + account.id, null, {"from": lastSyncTime}));
	});

	ZenMoney.trace('Получено операций: ' + transactions.length);

	var tranDict = {};

	transactions.forEach(function(transaction) {

		var account = null;

		for (var x = 0; x < accounts.length; x++) {
			
			for (var accountNumber = accounts[x].syncID.length - 1; i >= 0; i--) {

				if (accounts[x].syncID[accountNumber] == transaction.bankAccountNumber){

					account = accounts[accountNumber];
					break;
				}
			}
			if (account) break;
		}

		// учитываем только успешные операции
		if (transaction.status && transaction.status != 'Executed' && transaction.status != 'Received')

			return;

		var tran = {};
		var executed = new Date(transaction.executed);
		tran.date = n2(executed.getDate())+'.'+n2(executed.getMonth()+1)+'.'+executed.getFullYear();

		// доход ------------------------------------------------------------------
		if (transaction.category == "Debet") {
			tran.income = transaction.amountWithCommission;
			tran.incomeAccount = account.id;
			tran.outcome = 0;
			tran.outcomeAccount = account.id;
			tran.payee = transaction.contragentName ? transaction.contragentName : transaction.contragentBankAccountNumber;

			// операция в валюте
			if (account.currency != transaction.currency) {
				tran.opIncome = transaction.amountWithCommission;
				tran.opIncomeInstrument = transaction.currency;
			}
		}
		// расход -----------------------------------------------------------------
		else if (transaction.category == "Credit") {
			tran.outcome = transaction.amountWithCommission;
			tran.outcomeAccount = account.id;
			tran.income = 0;
			tran.incomeAccount = account.id;
			tran.comment = transaction.paymentPurpose;
			tran.payee = transaction.contragentName ? transaction.contragentName : transaction.contragentBankAccountNumber;
			tran.opOutcomeInstrument = transaction.currency;
			
			// операция в валюте
			if (account.currency != transaction.currency) {

				tran.opOutcome = transaction.amountWithCommission;				
			}				
		}

		// старый формат идентификатора
		tran.id = transaction.id;

		if (tranDict[tran.id] && tranDict[tran.id].income == 0 && tran.income > 0) {

			tranDict[tran.id].income = tran.income;
			tranDict[tran.id].incomeAccount = tran.incomeAccount;

			if (tran.opIncome) {
				tranDict[tran.id].opIncome = tran.opIncome;
				tranDict[tran.id].opIncomeInstrument = tran.opIncomeInstrument;
			}
		}
		else if (tranDict[tran.id] && tranDict[tran.id].outcome == 0 && tran.outcome > 0) {

			tranDict[tran.id].outcome = tran.outcome;
			tranDict[tran.id].outcomeAccount = tran.outcomeAccount;

			if (tran.opOutcome) {

				tranDict[tran.id].opOutcome = tran.opOutcome;
				tranDict[tran.id].opOutcomeInstrument = tran.opOutcomeInstrument;
			}

		} else { tranDict[tran.id] = tran; }

		if (tran.date > lastSyncTime)
			lastSyncTime = tran.date;
	});


	ZenMoney.trace('Всего операций добавлено: '+ Object.getOwnPropertyNames(tranDict).length);
	
	for (var k in tranDict) 

		ZenMoney.addTransaction(tranDict[k]);

	ZenMoney.setData('last_sync', lastSyncTime);
	ZenMoney.saveData();
}

/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) { return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id); }

/**
 * Обработка JSON-строки в объект
 * @param html
 */
function getJson(html) {

	try { return JSON.parse(html); } catch (e) {

		ZenMoney.trace('Bad json (' + e.message + '): ' + html);
		throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
	}
}

/**
 * Выполнение запроса с получением JSON-результата
 * @param requestCode
 * @param getparams
 * @param postbody
 * @returns {*}
 */
function requestJson(requestCode, getparams, postbody) {

	postbody || (postbody = {});

	var params = [];//["sandbox=on"];
	//g_sessionid = "sandboxtoken";

	g_headers["Authorization"] = "Bearer " + g_sessionid;

	if (getparams)
	{
		for (var param in getparams)

			params.push(encodeURIComponent(param) + "=" + encodeURIComponent(getparams[param]));
	}
	
	var url = g_baseurl + requestCode + "?" + params.join("&");

	var data = ZenMoney.requestPost(url, postbody, g_headers);

	if (ZenMoney.getLastStatusCode() == 401) {

    	g_sessionid = undefined;

        ZenMoney.setData("mb_session", null);
        ZenMoney.saveData();
        return;
    }

	if (!data) {

		ZenMoney.trace('Пустой ответ с url "' + url + '". Попытаемся ещё раз...');

		data = ZenMoney.requestPost(url, postbody, g_headers);
	}

	return getJson(data);
}

function in_array(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}

function n2(n) {
	return n < 10 ? '0' + n : '' + n;
}
