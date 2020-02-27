import { Account } from '../models/account'
import { Transaction } from '../models/transaction'

export class BrokerAccountConverter {
  convert (apiAccount) {
    if (['Tinkoff', 'TinkoffIis'].indexOf(apiAccount.brokerAccountType) === -1) {
      return
    }

    let id
    let name
    if (apiAccount.brokerAccountType === 'TinkoffIis') {
      if (apiAccount.currencyLimit.currency !== 'RUB') {
        // ИИС может быть только рублевым
        return
      }

      id = apiAccount.brokerAccountId
      name = 'ИИС'
    } else {
      id = apiAccount.brokerAccountId + '_' + apiAccount.currencyLimit.currency
      name = 'Брокерский счет'
      name += ' ' + apiAccount.currencyLimit.currency
    }

    // Stock - Акция, Bond - Облигация, ETF - Фонд
    const supportedSecurityTypes = ['Stock', 'Bond', 'ETF']
    const stocksPrice = apiAccount.purchasedSecurities
      .filter(x => supportedSecurityTypes.indexOf(x.securityType) !== -1)
      .flatMap(x => x.currentAmount.value).reduce((a, b) => a + b, 0)

    const account = new Account({
      initialized: true,
      id: id,
      title: name,
      type: 'checking',
      syncID: [id],
      instrument: apiAccount.currencyLimit.currency,
      balance: apiAccount.currencyLimit.currentBalance + stocksPrice,
      savings: true,
      accountType: 'investing'
    })
    const transactions = apiAccount.operations.map(x => this._convertTransaction(x, account)).filter(x => x)
    account.transactions = transactions

    return account
  }

  _convertTransaction (operation, account) {
    let transaction
    switch (operation.operationType) {
      case 'PayIn': //    Перевод  Пополнение брокерского счета
      case 'PayOut': //   Перевод  Вывод с брокерского счета
      case 'Dividend': // Доход    Выплата дивидендов по акции Apple
      case 'TaxBack': //  Доход    Корректировка налога
      case 'BrokCom': //  Расход   Комиссия брокера
      case 'Tax': //      Расход   Удержание НДФЛ
      case 'TaxDvd': //   Расход   Удержание НДФЛ по дивидендам
      case 'RegCom': //   Расход   Списание комиссии за обслуживание

        transaction = {
          investingTransfer:
            (
              operation.operationType === 'PayIn'
                ? 'in'
                : operation.operationType === 'PayOut'
                  ? 'out'
                  : null
            ),
          date: new Date(operation.date),
          movements: [
            {
              id: operation.id.toString(),
              account: { id: account.id },
              invoice: null,
              sum: operation.payment,
              fee: 0
            }
          ],
          merchant: null,
          comment: operation.description,
          hold: false
        }

        break

      case 'Buy': //  Перевод  Покупка валюты
      case 'Sell': // Перевод  Продажа валюты
        if (operation.instrumentType !== 'FX') {
          break
        }

        transaction = {
          date: new Date(operation.date),
          movements: [
            {
              id: operation.id.toString(),
              account: { id: account.id },
              invoice: null,
              sum: operation.payment,
              fee: 0
            },
            {
              id: operation.id.toString(),
              account: { needId: operation.ticker.replace(operation.currency, '') },
              invoice: null,
              sum: (operation.operationType === 'Sell' ? -1 : 1) * operation.quantity,
              fee: 0
            }
          ],
          merchant: null,
          comment: operation.description,
          hold: false
        }

        break
    }

    if (transaction &&
      transaction.movements &&
      transaction.movements[0].sum + transaction.movements[0].fee === 0) {
      transaction = null
    }

    return transaction ? new Transaction(transaction, account) : null
  }
}
