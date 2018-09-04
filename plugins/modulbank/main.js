//
// Точка входа
//
function main() {
	const preferences = ZenMoney.getPreferences()
	if (!preferences.apiKey) {
		throw new ZenMoney.Error("Не задан ключ API интернет-банка!", null, true)
	}

	const moduleBankAccounts = getModuleBankAccounts(preferences)
	const accounts = processAccounts(moduleBankAccounts)
	processTransactions(preferences, moduleBankAccounts, accounts)
	ZenMoney.setResult({ success: true })
}

//
// Получение информации по счетам.
//
function getModuleBankAccounts(preferences) {
	ZenMoney.trace('Запрашиваем данные по счетам...')
	const moduleBankAccounts = []
	requestAPI('account-info', {}, preferences.apiKey).forEach(company => {
		Array.prototype.push.apply(moduleBankAccounts, company.bankAccounts)
	})
	ZenMoney.trace(`Получено счетов: ${moduleBankAccounts.length}`)
	return moduleBankAccounts
}

//
// Обработка счетов
//
function processAccounts(moduleBankAccounts) {
	const accounts = []
	for (let account of moduleBankAccounts) {
		if (isAccountSkipped(account.id)) {
			ZenMoney.trace('Пропускаем карту/счёт: ' + account.accountName)
			continue
		}

		// Расчетный счет
		if (account.category === 'CheckingAccount') {
			ZenMoney.trace(`+ расчетный счет: ${account.accountName}`)
			accounts.push({
				id: account.id,
				title: account.accountName,
				syncID: [account.number.substring(account.number.length - 4)],

				instrument: account.currency === 'RUR' ? 'RUB' : account.currency,
				type: 'checking',

				balance: account.balance,
				startBalance: 0,
				creditLimit: 0,

				savings: false,
			})
		}

		// Дебетовая карта
		else if (account.category === 'CardAccount') {
			ZenMoney.trace(`+ дебетовая карта: ${account.accountName}`)
			accounts.push({
				id: account.id,
				title: account.accountName,
				syncID: [account.number.substring(account.number.length - 4)],

				instrument: account.currency === 'RUR' ? 'RUB' : account.currency,
				type: 'ccard',

				balance: account.balance,
				startBalance: 0,
				creditLimit: 0,

				savings: false,
			})
		}

		else {
			ZenMoney.trace(`Cчет ${account.accountName} имеет неподдерживаемый тип ${account.type}`)
			continue
		}
	}

	ZenMoney.trace(`Всего счетов добавлено: ${accounts.length}`)
	ZenMoney.addAccount(accounts)
	return accounts
}

//
// Обработка операций
//
function processTransactions(preferences, moduleBankAccounts, zenAccounts) {
	const zenAccountIdsSet = new Set(zenAccounts.map(acc => acc.id))
	const zenAccountsBySyncID = new Map(zenAccounts.map(acc => [acc.syncID[0], acc]))
	const millisecondsInDay = 24 * 60 * 60 * 1000

	let lastSyncTime = ZenMoney.getData('last_sync', 0)
	if (lastSyncTime === 0) {
		// По умолчанию загружаем операции за неделю
		let period = !preferences.hasOwnProperty('period') ||
							isNaN(period = parseInt(preferences.period)) ? 7 : period
		if (period > 365) {
			period = 365 // На всякий случай, ограничим лимит, а то слишком долго будет
		}
		lastSyncTime = Date.now() - period * millisecondsInDay
	}
	// Всегда захватываем одну неделю минимум
	lastSyncTime = Math.min(lastSyncTime, Date.now() - 7 * millisecondsInDay)
	const lastSyncDate = new Date(lastSyncTime)
	ZenMoney.trace(`Запрашиваем операции с ${lastSyncDate.toLocaleString()}`)

	const rawTransactions = []
	for (account of moduleBankAccounts) {
		if (!zenAccountIdsSet.has(account.id)) {
			ZenMoney.trace('Пропускаем карту/счёт: ' + account.accountName)
			continue
		}

		let transactions
		let skip = 0
		do {
			transactions = requestAPI(
								`operation-history/${account.id}`,
								{ from: lastSyncDate.toISOString().slice(0, 10), skip },
								preferences.apiKey)
			Array.prototype.push.apply(rawTransactions, transactions)
			skip += transactions.length
		} while (transactions.length)
	}
	ZenMoney.trace(`Получено операций: ${rawTransactions.length}`)

	const zenTransactions = []
	for (let rawTransaction of rawTransactions) {
		if (rawTransaction.status && rawTransaction.status !== 'Executed' &&
				rawTransaction.status !== 'Received') {
			ZenMoney.trace(`Пропускаем операцию с состоянием '${rawTransaction.status}'`)
			continue
		}
		if (rawTransaction.category !== 'Debet' && rawTransaction.category !== 'Credit') {
			ZenMoney.trace(`Пропускаем операцию категории '${rawTransaction.category}'`)
			continue
		}

		const number = rawTransaction.bankAccountNumber
		const syncID = number.substring(number.length - 4)
		const zenAccount = zenAccountsBySyncID.get(syncID)
		const zenTransaction = {
			id: rawTransaction.id,
			payee: rawTransaction.contragentName ? rawTransaction.contragentName :
												   rawTransaction.contragentBankAccountNumber,
			date: new Date(rawTransaction.executed).toISOString().slice(0, 10),
			incomeAccount: zenAccount.id,
			outcomeAccount: zenAccount.id,
		}
		if (rawTransaction.category === 'Debet') {
			zenTransaction.income = rawTransaction.amountWithCommission || rawTransaction.amount
			zenTransaction.outcome = 0

		}
		else if (rawTransaction.category === 'Credit') {
			zenTransaction.outcome = rawTransaction.amountWithCommission || rawTransaction.amount
			zenTransaction.income = 0
		}
		console.log(zenTransaction)

		zenTransactions.push(zenTransaction)
	}
	ZenMoney.addTransaction(zenTransactions)
	ZenMoney.trace(`Всего операций добавлено: ${zenTransactions.length}`)
	ZenMoney.setData('last_sync', lastSyncTime)
	ZenMoney.saveData()
}

//
// Вызов метода API
//
function requestAPI(path, body, apiKey) {
	ZenMoney.trace(`Requesting '${path}'`)
	const json = ZenMoney.requestPost(
						'https://api.modulbank.ru/v1/' + path,
						JSON.stringify(body),
						{
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Accept-Encoding': 'gzip, deflate, br',
							'Authorization': `Bearer ${apiKey}`
						})
	// ZenMoney.trace(`Response for '${path}': ${json}`)
	try {
		return JSON.parse(json)
	}
	catch (e) {
        ZenMoney.trace(`Bad response json: ${e.message}`)
        throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message)
    }
}

//
// Проверить не игнорируемый ли это счёт
//
function isAccountSkipped(id) {
	return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id)
}
