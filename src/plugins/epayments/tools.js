export function getTimestamp (date) {
  return Math.floor(date.getTime() / 1000)
}

export function cleanUpText (text) {
  if (!text) { return null } else {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, '\'')
      .replace(/&lt;/g, ' ')
      .replace(/&gt;/g, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\\/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
