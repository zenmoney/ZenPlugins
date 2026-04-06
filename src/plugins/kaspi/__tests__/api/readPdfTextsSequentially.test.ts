import { readPdfTextsSequentially } from '../../api'

describe('readPdfTextsSequentially', () => {
  it('reads pdf files one by one', async () => {
    let firstResolved = false
    let secondStartedBeforeFirstFinished = false

    const parsePdfMock = jest.fn(async (_blob) => {
      const callNumber = parsePdfMock.mock.calls.length
      const response = { text: 'second' }

      if (callNumber === 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
        firstResolved = true
        const firstResponse = { text: 'first' }
        return firstResponse
      }

      if (!firstResolved) {
        secondStartedBeforeFirstFinished = true
      }

      return response
    })

    const result = await readPdfTextsSequentially([
      new Blob(['one'], { type: 'application/pdf' }),
      new Blob(['two'], { type: 'application/pdf' })
    ], parsePdfMock)

    expect(result).toEqual(['first', 'second'])
    expect(secondStartedBeforeFirstFinished).toBe(false)
    expect(parsePdfMock).toHaveBeenCalledTimes(2)
  })
})
