export function handleGroupBy (groupHandlers, options) {
  return groupItems => {
    for (const handler of groupHandlers) {
      const items = handler(groupItems, options)
      if (items) {
        return items
      }
    }
    return null
  }
}

export function handleGroups ({
  items,
  makeGroupKeys,
  handleGroup
}) {
  let n = -1
  const dataArray = items.map(item => {
    const groupKeys = makeGroupKeys(item) || []
    if (groupKeys.length > 0) {
      if (n < 0) {
        n = groupKeys.length
      } else if (n !== groupKeys.length) {
        throw new Error('makeGroupKeys must return groupKeys with the same array length')
      }
    }
    return {
      isProcessed: false,
      item,
      groupKeys
    }
  })
  if (n < 0) {
    return items
  }
  const result = []
  for (let i = 0; i < n; i++) {
    const groups = {}
    for (const data of dataArray) {
      const groupKey = data.isProcessed || data.groupKeys.length <= 0 ? null : data.groupKeys[i]
      if (groupKey !== null) {
        let group = groups[groupKey]
        if (!group) {
          groups[groupKey] = group = []
        }
        group.push(data)
      }
    }
    for (const key of Object.keys(groups)) {
      const group = groups[key]
      const items = handleGroup(group.map(data => data.item))
      if (items) {
        for (const data of group) {
          data.isProcessed = true
          data.item = null
        }
        group[0].item = items
      }
    }
  }
  for (const data of dataArray) {
    if (!data.isProcessed) {
      result.push(data.item)
    } else if (data.item) {
      result.push(...data.item)
    }
  }
  return result
}
