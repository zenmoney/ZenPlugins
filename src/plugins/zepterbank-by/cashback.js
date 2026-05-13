const QUALIFIED_CASHBACK_MCCS = new Set([
  7999,
  5552,
  5462,
  4111,
  4112,
  5262,
  5300,
  5309,
  5962,
  4511,
  7011,
  3501,
  5912,
  5541,
  5542,
  5943,
  5641,
  5942,
  5311,
  5812,
  5814,
  4121,
  7512,
  3351,
  5411,
  5499,
  5094,
  5945,
  5995,
  5719,
  5999,
  7832,
  7996,
  7998
])

function normalizeComment (comment) {
  const normalizedComment = comment?.trim()

  return normalizedComment || ''
}

function isCashbackQualified (mcc) {
  return typeof mcc === 'number' && QUALIFIED_CASHBACK_MCCS.has(mcc)
}

function getCashbackCommentLine (mcc) {
  if (typeof mcc !== 'number') {
    return 'MCC не указан ❌'
  }

  return `MCC ${mcc} ${isCashbackQualified(mcc) ? '✅' : '❌'}`
}

function appendCashbackComment (comment, mcc) {
  if (!global.ZenMoney?.getPreferences()?.includeMccInComment) {
    return null
  }

  const normalizedComment = normalizeComment(comment)
  const cashbackCommentLine = getCashbackCommentLine(mcc)

  if (normalizedComment === '') {
    return cashbackCommentLine
  }

  return `${normalizedComment}\n${cashbackCommentLine}`
}

module.exports = {
  QUALIFIED_CASHBACK_MCCS,
  isCashbackQualified,
  getCashbackCommentLine,
  appendCashbackComment
}
