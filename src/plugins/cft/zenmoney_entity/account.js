/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

/**
 * @returns {{id: null, title: null, syncID: Array, type: null, balance: number, startBalance: undefined, creditLimit: number, savings: undefined, capitalization: undefined, percent: undefined, startDate: undefined, endDateOffset: undefined, endDateOffsetInterval: undefined, payoffStep: undefined, payoffInterval: undefined}}
 */
const entity = () => {
  return {
    id: null,
    title: null,
    syncID: [],
    type: null,
    balance: 0,
    startBalance: undefined,
    creditLimit: 0,
    savings: undefined,
    capitalization: undefined,
    percent: undefined,
    startDate: undefined,
    endDateOffset: undefined,
    endDateOffsetInterval: undefined,
    payoffStep: undefined,
    payoffInterval: undefined
  }
}

export {
  entity
}
