function lifecycle (key) {
  return window[key]
}

export function dispose (config) {
  lifecycle(config.key)?.dispose()
}

export function matchesDocument (config) {
  return lifecycle(config.key)?.documentId === config.documentId
}
