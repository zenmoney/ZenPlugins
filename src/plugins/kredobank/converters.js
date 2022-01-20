function parseType (apiAccount) {
  // 'card' or 'checking' or 'deposit' or 'loan'
  if (apiAccount.providerId === 'credit') {
    return 'loan'
  } else if (apiAccount.providerId === 'card' && apiAccount.creditLimit > 0) {
    return 'ccard'
  } else {
    return apiAccount.providerId
  }
}

export function convertAccounts (apiAccounts) {
  const accounts = []

  for (const apiAccount of apiAccounts) {
    if (apiAccount.isActiveProduct !== 'true') {
      continue
    }

    const type = parseType(apiAccount)
    console.log(type)

    let account = {
      available: apiAccount.balance / 100,
      balance: apiAccount.balance / 100,
      id: apiAccount.id,
      instrument: apiAccount.mainAccountCurrency,
      syncIds: [apiAccount.id],
      title: `${apiAccount.productTitle} - ${apiAccount.mainAccountNumber}`,
      type: type,
      iban: apiAccount.iban,
      bankType: apiAccount.providerId
    }

    if (account.type === 'ccard') {
      account = Object.assign(account, {
        available: (apiAccount.balance + apiAccount.creditLimit ?? 0) / 100,
        creditLimit: (apiAccount.creditLimit ?? 0) / 100,
        totalAmountDue: apiAccount.usedCreditLimit ?? 0 / 100
      })
    } else if (account.type === 'deposit') {
      account = Object.assign(account, {
        available: (apiAccount.balance + apiAccount.accruedInterest) / 100,
        balance: (apiAccount.balance + apiAccount.accruedInterest) / 100,
        startDate: new Date(apiAccount.startDate),
        capitalization: apiAccount.capitalization,
        percent: apiAccount.currentInterestRate,
        payoffInterval: apiAccount.regularInterestPayment ? apiAccount.regularInterestPaymentTermType.toLowerCase() : null,
        payoffStep: apiAccount.regularInterestPayment ? 1 : 0,
        endDateOffset: apiAccount.term.value,
        endDateOffsetInterval: apiAccount.term.type.toLowerCase(),
        startBalance: parseFloat(apiAccount.initialAmount) / 100
      })
    }

    if (['card', 'ccard'].includes(account.type) && Array.isArray(apiAccount.cardsList) && apiAccount.cardsList.length === 1) {
      account.cardId = apiAccount.cardsList[0].id
    }

    accounts.push(account)
  }

  return accounts
}

export function convertTransaction (apiTransaction, account) {
  return {
    hold: false,
    date: new Date(apiTransaction.operationDate),
    movements: [
      {
        id: apiTransaction.id || null,
        account: { id: account.id },
        sum: apiTransaction.localAmountInCents / 100,
        fee: 0,
        invoice: null
      }
    ],
    merchant: apiTransaction.description ? {
      fullTitle: apiTransaction.description,
      mcc: null,
      location: null
    } : null,
    comment: null
  }
}
