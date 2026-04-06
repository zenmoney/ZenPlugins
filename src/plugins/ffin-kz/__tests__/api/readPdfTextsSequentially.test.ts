import { readPdfTextsSequentially } from '../../api'

function deferred<T> (): { promise: Promise<T>, resolve: (value: T) => void } {
  let deferredResolve!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    deferredResolve = resolve
  })
  return { promise, resolve: deferredResolve }
}

describe('readPdfTextsSequentially', () => {
  it('reads pdf texts strictly one by one', async () => {
    const firstPdf = { arrayBuffer: async () => new ArrayBuffer(0) }
    const secondPdf = { arrayBuffer: async () => new ArrayBuffer(0) }
    const firstDeferred = deferred<{ text: string }>()
    const secondDeferred = deferred<{ text: string }>()
    const parsePdfFn = jest.fn()
      .mockImplementationOnce(async () => await firstDeferred.promise)
      .mockImplementationOnce(async () => await secondDeferred.promise)

    const reading = readPdfTextsSequentially([firstPdf, secondPdf], parsePdfFn as any)
    await Promise.resolve()

    expect(parsePdfFn).toHaveBeenCalledTimes(1)
    expect(parsePdfFn).toHaveBeenNthCalledWith(1, firstPdf)

    firstDeferred.resolve({ text: 'first' })
    await Promise.resolve()
    await Promise.resolve()

    expect(parsePdfFn).toHaveBeenCalledTimes(2)
    expect(parsePdfFn).toHaveBeenNthCalledWith(2, secondPdf)

    secondDeferred.resolve({ text: 'second' })

    await expect(reading).resolves.toEqual(['first', 'second'])
  })
})
