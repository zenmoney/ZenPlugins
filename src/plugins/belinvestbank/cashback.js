const { QUALIFIED_CASHBACK_MCCS } = require('./cashback-mccs')

function normalizeComment (comment) {
  const normalizedComment = comment?.trim()
  return normalizedComment || ''
}

function parseMcc (mcc) {
  const digits = String(mcc ?? '').replace(/\D/g, '')
  if (digits === '') return null

  const parsedMcc = Number(digits)
  return Number.isInteger(parsedMcc) && parsedMcc > 0
    ? parsedMcc
    : null
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
    return comment || null
  }

  const normalizedComment = normalizeComment(comment)
  const cashbackCommentLine = getCashbackCommentLine(parseMcc(mcc))

  if (normalizedComment === '') {
    return cashbackCommentLine
  }

  return `${normalizedComment}\n${cashbackCommentLine}`
}

module.exports = {
  QUALIFIED_CASHBACK_MCCS,
  appendCashbackComment
}
