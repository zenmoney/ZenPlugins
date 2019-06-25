export function getTimestamp (date) {
  var milllis = 0
  if (date instanceof Date) milllis = date.getTime()
  else if (typeof date === 'number') milllis = date

  return Math.floor(milllis / 1000)
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
