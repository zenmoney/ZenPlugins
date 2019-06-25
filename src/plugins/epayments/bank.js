function addAccounts (accounts) {
  accounts.forEach(function (account) {
    console.debug('Обрабатываем счет: ' + JSON.stringify(account), 'trace-account')

    try {
      ZenMoney.addAccount(account)
    } catch (exception) {
      console.debug('Не удалось добавить счет: ' + JSON.stringify(account), 'error-account')
    }
  })
};

function addOperations (operations) {
  operations.reverse().forEach(function (operation) {
    console.debug('Обрабатываем транзакцию: ' + JSON.stringify(operation), 'trace-operation')

    try {
      ZenMoney.addTransaction(operation)
    } catch (exception) {
      console.debug('Не удалось добавить транзакцию: ' + JSON.stringify(operation), 'error-operation')
    }
  })
};
