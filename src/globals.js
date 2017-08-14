/* eslint-disable no-restricted-globals */
const getGlobalScope = () => {
  try {
    return window;
  } catch (e) {
  }
  try {
    return self;
  } catch (e) {
  }
  throw new Error("Neither window nor self are accessible in current runtime");
};

export const global = getGlobalScope();

export let ZenMoney = global.ZenMoney;

export const injectApiInstance = (value) => {
  global.ZenMoney = value;
  ZenMoney = value;
};
