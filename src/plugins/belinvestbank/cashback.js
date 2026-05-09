const QUALIFIED_CASHBACK_MCCS = new Set([
  742,
  2842,
  4112,
  4119,
  4121,
  4131,
  4468,
  4511,
  4582,
  4722,
  5013,
  5039,
  5045,
  5094,
  5111,
  5131,
  5139,
  5172,
  5192,
  5198,
  5200,
  5211,
  5231,
  5309,
  5311,
  5331,
  5411,
  5422,
  5441,
  5451,
  5462,
  5499,
  5531,
  5532,
  5533,
  5541,
  5542,
  5561,
  5611,
  5621,
  5631,
  5641,
  5651,
  5655,
  5661,
  5681,
  5691,
  5697,
  5699,
  5712,
  5713,
  5719,
  5722,
  5732,
  5733,
  5734,
  5735,
  5812,
  5813,
  5814,
  5912,
  5940,
  5941,
  5942,
  5943,
  5944,
  5945,
  5946,
  5947,
  5948,
  5949,
  5950,
  5970,
  5971,
  5975,
  5976,
  5977,
  5983,
  5992,
  5994,
  5995,
  5996,
  7210,
  7211,
  7216,
  7217,
  7221,
  7230,
  7251,
  7297,
  7298,
  7333,
  7349,
  7379,
  7531,
  7534,
  7535,
  7538,
  7542,
  7549,
  7629,
  7631,
  7829,
  7832,
  7932,
  7933,
  7991,
  7996,
  7998,
  8011,
  8021,
  8042,
  8062,
  8071,
  8099
])

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
