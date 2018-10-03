export const extractErrorDetails = (error) => [
  error.message,
  error.stack && error.stack.replace('Error: ' + error.message + '\n', '')
].filter(Boolean).join('\n')

export const waitForOpenDevtools = () => new Promise(function fn (resolve) {
  const threshold = 100
  const eatenWidth = window.outerWidth - window.innerWidth
  const eatenHeight = window.outerHeight - window.innerHeight
  if (eatenWidth > threshold || eatenHeight > threshold) {
    resolve()
  } else {
    setTimeout(fn, 100, resolve)
  }
})

export const isFlagPresent = (flag) => new RegExp(`[?&]${flag}\\b`).test(window.location.search)
