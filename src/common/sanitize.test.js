import { sanitize } from './sanitize'

describe('sanitize', () => {
  it('should sanitize values by truthy mask', () => {
    const sampleValues = [true, false, new Date(), { key: 'secure value' }, 1, 'secure value']
    const sanitizedValues = ['<bool>', '<bool>', '<date>', { 'key': '<string[12]>' }, '<number>', '<string[12]>']

    expect(sampleValues.map(value => sanitize(value, true)))
      .toEqual(sanitizedValues)
    expect(sanitize(sampleValues, true))
      .toEqual(sanitizedValues)

    expect(sanitize({
      a: 'secure value',
      b: { c: 'secure value', d: 'secure value' }
    }, {
      a: true,
      b: { d: true }
    })).toEqual({
      a: '<string[12]>',
      b: { c: 'secure value', d: '<string[12]>' }
    })

    expect(sampleValues.map(value => sanitize(value, false)))
      .toEqual(sampleValues)
    expect(sanitize(sampleValues, false))
      .toEqual(sampleValues)

    expect(sanitize({
      a: [
        { a1: 12345, a2: '12345', a3: 'some data' },
        { a1: 12345, a2: '12345', a3: 'some data' }
      ],
      b: [
        { b1: 12345, b2: '12345', b3: 'some data' },
        { b1: 12345, b2: '12345', b3: 'some data' }
      ]
    }, {
      a: true,
      b: { b1: true, b2: true }
    })).toEqual({
      a: [
        { a1: '<number>', a2: '<string[5]>', a3: '<string[9]>' },
        { a1: '<number>', a2: '<string[5]>', a3: '<string[9]>' }
      ],
      b: [
        { b1: '<number>', b2: '<string[5]>', b3: 'some data' },
        { b1: '<number>', b2: '<string[5]>', b3: 'some data' }
      ]
    })
  })

  it('should preserve value if value is unexpected for the mask', () => {
    expect(sanitize({
      a: 'unexpected value'
    }, { a: { b: true } })).toEqual({
      a: 'unexpected value'
    })
    expect(sanitize('unexpected value', { a: { b: true } })).toEqual('unexpected value')
  })

  it('should call mask if it is function', () => {
    const sanitizedValue = {}
    const mask = jest.fn().mockReturnValue(sanitizedValue)
    expect(sanitize('unexpected value', mask)).toStrictEqual(sanitizedValue)
    expect(mask.mock.calls.length).toBe(1)
    expect(mask).toBeCalledWith('unexpected value')
  })
})
