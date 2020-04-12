export function convertAccount (acc) {
  return {
    id: acc.id,
    type: 'investment',
    title: acc.id,
    instrument: acc.currency,
    balance: Number.parseFloat(acc.balance.replace(/,/g, '')),
    syncID: [acc.id]
  }
}

export function convertTransaction (tr, account) {
  return {
    date: new Date(tr.date),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: getSumAmount(tr.amount),
        fee: -getSumAmount(tr.fee)
      }
    ],
    merchant: null,
    comment: null,
    hold: false
  }
}

function getSumAmount (strAmount) {
  return Number.parseFloat(strAmount.replace(/,/g, ''))
}
