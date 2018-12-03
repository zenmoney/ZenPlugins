import { reduceDuplicatesByTypeAndId, resolveCycles } from './vtb'

describe('reduceDuplicatesByTypeAndId', () => {
  it('reduces duplicates in child objects', () => {
    const object = {
      __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
      id: '0000000000000000000000000',
      child: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.Product2',
        id: '1111111111111111111111111',
        parent: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
          id: '0000000000000000000000000',
          parentKey: 'parentValue',
          child: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.Product2',
            id: '1111111111111111111111111',
            childKey: 'childValue'
          }
        }
      }
    }
    object.child.parent.child.parent = object
    reduceDuplicatesByTypeAndId(object)
    expect(object).toMatchObject({
      __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
      id: '0000000000000000000000000',
      parentKey: 'parentValue',
      child: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.Product2',
        id: '1111111111111111111111111',
        childKey: 'childValue'
      }
    })
    expect(Object.keys(object).length).toBe(4)
    expect(Object.keys(object.child).length).toBe(4)
    expect(object.child.parent).toBe(object)
  })

  it('reduces duplicates in array', () => {
    const object = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
        id: '0000000000000000000000000',
        key1: 'value1',
        key2: null
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
        id: '0000000000000000000000000',
        key2: 'value2'
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
        id: '0000000000000000000000000',
        key3: 'value3',
        child: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
          id: '0000000000000000000000000',
          key4: 'value4'
        }
      }
    ]
    reduceDuplicatesByTypeAndId(object)
    expect(object.length).toBe(3)
    expect(object[2]).toBe(object[0])
    expect(object[1]).toBe(object[0])
    expect(object[0]).toMatchObject({
      __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
      id: '0000000000000000000000000',
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4'
    })
    expect(Object.keys(object[0]).length).toBe(7)
    expect(object[0].child).toBe(object[0])
  })

  it('reduces duplicates in different objects', () => {
    const object = [
      {
        child: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
          id: '0000000000000000000000000',
          key1: 'value1'
        }
      },
      {
        child: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
          id: '0000000000000000000000000',
          key2: 'value2'
        }
      }
    ]
    reduceDuplicatesByTypeAndId(object)
    expect(object.length).toBe(2)
    const child = object[0].child
    expect(object[0]).toEqual({
      child
    })
    expect(object[1]).toEqual({
      child
    })
    expect(child).toEqual({
      __type: 'ru.vtb24.mobilebanking.protocol.product.Product1',
      id: '0000000000000000000000000',
      key1: 'value1',
      key2: 'value2'
    })
  })
})

describe('resolveCycles', () => {
  it('resolves cycles', () => {
    const parent = {
      child: {
        childKey: 'childValue'
      },
      children: []
    }
    parent.child.parent = parent
    parent.children.push(parent.child)
    expect(resolveCycles(parent)).toEqual({
      __id: 0,
      child: {
        __id: 1,
        childKey: 'childValue',
        parent: '<ref[0]>'
      },
      children: [
        '<ref[1]>'
      ]
    })
  })
})
