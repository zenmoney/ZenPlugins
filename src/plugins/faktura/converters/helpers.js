/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

const mapContractToAccount = (data) => {
  const map = {}

  for (const item of data) {
    map[item.contractId.toString()] = cardUniqueAccountId(item.id)
  }

  return map
}

const resolveCurrencyCode = (code) => {
  return code === 'RUR' ? 'RUB' : code
}

const cardUniqueAccountId = (id) => {
  return uniqueAccountId('c', id)
}

const walletUniqueAccountId = (id) => {
  return uniqueAccountId('w', id)
}

const uniqueAccountId = (prefix, id) => {
  return prefix + '-' + id
}

export {
  mapContractToAccount,
  resolveCurrencyCode,
  cardUniqueAccountId,
  walletUniqueAccountId
}
