export function convertAccounts (apiAccounts) {
  let accounts = []
  let converter
  const cardAccounts = apiAccounts.filter(apiAccount => apiAccount.type === 'cardAccount')
  accounts.push(...convertCardAccounts(cardAccounts))
  for (const apiAccount of apiAccounts) {
    switch (apiAccount.type) {
      case 'cardAccount':
        continue
      case 'card':
        converter = convertCard
        break
      default:
        console.assert(false, `Unsupported account ${apiAccount.type}`)
        break
    }
    accounts = converter(apiAccount, accounts)
  }
  return accounts
}

function convertCardAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    const isArchived = Boolean(apiAccount.cardAccount.status !== 'active')
    const account = {
      id: apiAccount.id,
      type: 'ccard',
      title: 'Card Account',
      syncID: [
        apiAccount.number
      ],
      available: Math.round(apiAccount.balances.available.value * 100) / 100,
      instrument: apiAccount.balances.available.currency,
      // creditLimit: Math.round(apiAccount.limit * 100) / 100, // кредитный лимит у карты, а не у аккаунта
      ...isArchived && { archive: true }
    }
    const mainProduct = {
      id: apiAccount.id,
      type: 'cardAccount'
    }
    accounts.push({
      mainProduct,
      products: [],
      account
    })
  }
  return accounts
}

function convertCard (apiAccount, accounts) {
  const isArchived = Boolean(apiAccount.card.status !== 'active')

  const existAccount = accounts.find(account => account.account.syncID.indexOf(apiAccount.parentNumber) >= 0)
  if (existAccount) {
    if (!isArchived) {
      existAccount.products.push({
        id: apiAccount.id,
        type: 'card'
      })
      existAccount.account.syncID.push(apiAccount.number)
      if (existAccount.products.length === 1) {
        existAccount.account.title = apiAccount.product.brand + ' *' + apiAccount.number.slice(-4)
        // берем creditLimit 1й карты
        existAccount.account.creditLimit = Math.round(apiAccount.balances.cr_limit.value * 100) / 100
      }
    }
    return accounts
  }

  const account = {
    id: apiAccount.parentId || apiAccount.id,
    type: 'ccard',
    title: apiAccount.product.brand + ' *' + apiAccount.number.slice(-4),
    syncID: [
      apiAccount.number,
      apiAccount.parentNumber
    ],
    available: Math.round(apiAccount.balances.available.value * 100) / 100,
    instrument: apiAccount.balances.available.currency,
    creditLimit: Math.round(apiAccount.balances.cr_limit.value * 100) / 100, // кредитный лимит у карты, а не у аккаунта
    ...isArchived && { archive: true }
  }
  const products = [
    {
      id: apiAccount.id,
      type: 'card'
    }
  ]
  const mainProduct = {
    id: apiAccount.parentId,
    type: 'cardAccount'
  }

  accounts.push({
    mainProduct,
    products,
    account
  })
  return accounts
}

function getInvoice (apiTransaction) {
  const invoice = {
    sum: (apiTransaction.transAmount && Math.round(parseFloat(apiTransaction.transAmount.value) * 100) / 100) || Math.round(parseFloat(apiTransaction.totalAmount.value) * 100) / 100,
    instrument: apiTransaction.transAmount?.currency || apiTransaction.totalAmount.currency
  }
  return invoice
}

export function convertTransaction (apiTransaction, account) {
  if ((!apiTransaction.transAmount && !apiTransaction.totalAmount) || apiTransaction.status === 'failed') {
    return null
  }
  const invoice = getInvoice(apiTransaction)
  const fee = apiTransaction.fees?.totalFee?.value && Math.round(parseFloat(apiTransaction.fees.totalFee.value) * 100) / 100
  const transaction = {
    comment: null,
    date: new Date(apiTransaction.operationTime),
    hold: apiTransaction.isAuth,
    merchant: null,
    movements: [
      {
        id: apiTransaction.id || null,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : Math.round(parseFloat(apiTransaction.totalAmount?.value) * 100) / 100 || null,
        fee: (fee !== invoice.sum && fee) || 0
      }
    ]
  };
  [
    parseInnerTransfer,
    parseCashTransfer,
    parseOuterTransfer,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /Снятие нал/,
    /Пополн. наличными ATM/
  ].some(regexp => {
    return regexp.test(apiTransaction.description)
  })) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  transaction.merchant = {
    country: apiTransaction.location?.country || null,
    city: apiTransaction.location?.city?.trim() || null,
    title: apiTransaction.location?.merchant.replace(/\\"/g, '"'),
    mcc: null,
    location: null
  }
  return true
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /Alimentare card/ // Перевод на собственную карту
  ].some(regexp => {
    return regexp.test(apiTransaction.description)
  }) || [
    /P2P_ONUS/ // Перевод на собственную карту
  ].some(regexp => {
    return regexp.test(apiTransaction.service?.id)
  })) {
    transaction.groupKeys = [`${apiTransaction.operationTime.slice(0, 10)}_${invoice.instrument}_${Math.abs(invoice.sum).toString()}`]
    return true
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /Пополнение карты/,
    /Cl Deposit Int Due Special/,
    /P2P MOB_BANKING/,
    /P2P Catre card/, // Перевод на карту другого клиента Moldindconbank-a
    /Alim.cont: Transfer alte/
  ].some(regexp => {
    return regexp.test(apiTransaction.description)
  }) || [
    /P2P_INBANK/ // Перевод на карту другого клиента Moldindconbank-a
  ].some(regexp => {
    return regexp.test(apiTransaction.service?.id)
  })) {
    transaction.movements.push({
      id: null,
      account: {
        type: 'ccard',
        instrument: invoice.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return true
  }
  return false
}

function parseComment (transaction, apiTransaction, account, invoice) {
  if (![
    /RF: Taxa lunara/,
    /uFR1 -> Cl Deposit/,
    /Credit Account: Client Account --> Bank Account/,
    /SMS: Taxa/,
    /Comis/
  ].some(regexp => {
    return regexp.test(apiTransaction.description)
  })) {
    return false
  }

  transaction.comment = apiTransaction.description
  return true
}

function parsePayee (transaction, apiTransaction, account, invoice) {
  if (![
    /Оплата тов.\/услуг/i,
    /Plata retail/i
  ].some(regexp => {
    return regexp.test(apiTransaction.description)
  })) {
    return false
  }

  if (apiTransaction?.merchantCategory === 'Payments') {
    transaction.merchant = {
      fullTitle: apiTransaction.service?.name || apiTransaction.description.replace('Оплата тов./услуг ', ''),
      mcc: null,
      location: null
    }
    return true
  }

  if (apiTransaction.location) {
    const title = apiTransaction.location.merchant?.replace(/\\"/g, '"')
    transaction.merchant = title
      ? {
          country: apiTransaction.location.country || null,
          city: apiTransaction.location.city?.trim() || null,
          title,
          mcc: null,
          location: null
        }
      : null
    return true
  }
  transaction.comment = apiTransaction.description
  return true
}
