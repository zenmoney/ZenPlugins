import { handleGroups } from './handleGroups'

describe('handleGroups', () => {
  it('throws if groupKeys is inconsistent', () => {
    expect(() => {
      handleGroups({
        items: [1, 2],
        makeGroupKeys: n => {
          const groupKeys = []
          for (let i = 0; i < n; i++) {
            groupKeys.push(i)
          }
          return groupKeys
        }
      })
    }).toThrow('makeGroupKeys must return groupKeys with the same array length')
  })

  it('returns the same items if groupKeys is null', () => {
    const items = [1, 2, 3, 4, 5]
    expect(handleGroups({
      items: items,
      makeGroupKeys: () => null
    })).toEqual(items)
  })

  it('groups items according to group key priority and preserves order of group first items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const handleGroup = jest.fn(items => items)
    expect(handleGroups({
      items: items,
      makeGroupKeys: n => [
        n % 4 === 0 ? 'x4' : null,
        n % 2 === 0 ? 'x2' : null
      ],
      handleGroup
    })).toEqual([1, 2, 6, 10, 3, 4, 8, 5, 7, 9])
    expect(handleGroup.mock.calls.length).toBe(2)
    expect(handleGroup.mock.calls[0]).toEqual([[4, 8]])
    expect(handleGroup.mock.calls[1]).toEqual([[2, 6, 10]])
  })

  it('preserve items without group keys', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(handleGroups({
      items: items,
      makeGroupKeys: n => n % 2 === 0 ? ['even'] : null,
      handleGroup: items => [items.join(',')]
    })).toEqual([1, '2,4,6,8,10', 3, 5, 7, 9])
  })
})
