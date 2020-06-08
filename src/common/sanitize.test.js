import { sanitize, sanitizeUrl, sanitizeUrlContainingObject } from './sanitize'

describe('sanitize', () => {
  it('should sanitize values by truthy mask', () => {
    const sampleValues = [true, false, new Date(), { key: 'secure value' }, 1, 'secure value']
    const sanitizedValues = ['<bool>', '<bool>', '<date>', { key: '<string[12]>' }, '<number>', '<string[12]>']

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

describe('sanitizeUrl', () => {
  it.each([
    [
      'https://domain.com/?field1=123&secretField=jfasf&field2=lfsf',
      { query: { secretField: true } },
      'https://domain.com/?field1=123&secretField=<string[5]>&field2=lfsf'
    ],
    [
      'https://domain.com/?field1=123&secretField=jfasf&field2=lfsf',
      { query: { secretField: true, field2: true } },
      'https://domain.com/?field1=123&secretField=<string[5]>&field2=<string[4]>'
    ],
    [
      'https://domain.com/?field1=123&secretField=jfasf&field2=lfsf',
      true,
      '<string[60]>'
    ]
  ])('sanitizes url', (url, mask, result) => {
    expect(sanitizeUrl(url, mask)).toEqual(result)
  })
})

describe('sanitizeUrlContainingObject', () => {
  it.each([
    [
      {
        url: 'https://domain.com/?field1=123&secretField=jfasf&field2=lfsf',
        key: 'value'
      },
      {
        url: { query: { secretField: true } }
      },
      {
        url: 'https://domain.com/?field1=123&secretField=<string[5]>&field2=lfsf',
        key: 'value'
      }
    ]
  ])('sanitizes url containing object', (object, mask, result) => {
    expect(sanitizeUrlContainingObject(object, mask)).toEqual(result)
  })
})
