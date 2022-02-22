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
  let fee = 0
  if (tr.fee !== '(pending)') {
    fee = -getSumAmount(tr.fee)
  }
  return {
    date: new Date(tr.date),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: getSumAmount(tr.amount),
        fee
      }
    ],
    merchant: null,
    comment: null,
    hold: (tr.fee === '(pending)')
  }
}

function getSumAmount (strAmount) {
  return Number.parseFloat(strAmount.replace(/,/g, ''))
}
