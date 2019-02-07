import { retry } from './retry'

describe('retry', () => {
  const _setTimeout = global.setTimeout

  afterEach(() => {
    global.setTimeout = _setTimeout
  })

  it('should resolve when working with sync getter', async () => {
    await expect(retry({
      getter: () => 1,
      predicate: (x) => x === 1
    })).resolves.toEqual(1)
    let result = 0
    await expect(retry({
      getter: () => {
        result += 10
        return result
      },
      predicate: (x) => x === 50,
      maxAttempts: 5
    })).resolves.toEqual(50)
  })

  it('should resolve when working with async getter', async () => {
    await expect(retry({
      getter: () => Promise.resolve(1),
      predicate: (value) => value === 1
    })).resolves.toEqual(1)
    let seed = 0
    await expect(retry({
      getter: () => Promise.resolve(seed += 10),
      predicate: (x) => x === 50,
      maxAttempts: 5
    })).resolves.toEqual(50)
  })

  it('should reject when working with sync getter', async () => {
    await expect(retry({
      getter: () => 1,
      predicate: (x) => false
    })).rejects.toMatchObject({ message: 'could not satisfy predicate in 1 attempt(s)' })
    await expect(retry({
      maxAttempts: 0
    })).rejects.toMatchObject({ message: 'could not satisfy predicate in 0 attempt(s)' })
  })

  it('should reject when working with async getter', async () => {
    await expect(retry({
      getter: () => Promise.resolve(1),
      predicate: (value) => false
    })).rejects.toMatchObject({ message: 'could not satisfy predicate in 1 attempt(s)' })
    let seed = 0
    await expect(retry({
      getter: () => {
        seed += 10
        return Promise.reject(seed)
      },
      predicate: (value) => false
    })).rejects.toEqual(10)
    await expect(retry({
      maxAttempts: 0
    })).rejects.toMatchObject({ message: 'could not satisfy predicate in 0 attempt(s)' })
  })

  it('should delay next try if delayMs is set', async () => {
    global.setTimeout = jest.fn(callback => callback())
    let i = 0
    const delayMs = 100
    await retry({
      getter: () => {
        if (i === 0) {
          expect(global.setTimeout).not.toHaveBeenCalled()
        } else {
          expect(global.setTimeout).toHaveBeenNthCalledWith(i, expect.anything(), delayMs)
        }
        expect(i).toBeLessThan(3)
        i++
        return i
      },
      predicate: i => i > 2,
      maxAttempts: 5,
      delayMs
    })
    expect(i).toEqual(3)
  })
})
