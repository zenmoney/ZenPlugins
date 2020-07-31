const PROXY_TARGET_HEADER = 'zp-proxy-target'

const getTargetUrl = (pathAndSearch, targetOrigin) => {
  const i = pathAndSearch.indexOf(PROXY_TARGET_HEADER)
  if (i > 0) {
    targetOrigin = pathAndSearch.substring(i + PROXY_TARGET_HEADER.length + 1)
    pathAndSearch = pathAndSearch.substring(0, i - 1)
  }
  return targetOrigin ? targetOrigin + pathAndSearch : null
}

module.exports = {
  PROXY_TARGET_HEADER,
  TRANSFERABLE_HEADER_PREFIX: 'zp-',
  MANUAL_REDIRECT_HEADER: 'zp-manual-redirect',
  getTargetUrl
}
