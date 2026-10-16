export async function beforeDeadline<T> (operation: () => Promise<T>, deadline: number, error: () => Error, expire: () => void = () => {}): Promise<T> {
  const remaining = deadline - Date.now()
  if (remaining <= 0) {
    expire()
    throw error()
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((resolve, reject) => {
        timer = setTimeout(() => {
          expire()
          reject(error())
        }, remaining)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}
