export const makePluginDataApi = (initialData) => {
  let currentData = initialData
  let saveDataRequested = false
  return {
    get initialData () {
      return initialData
    },
    get currentData () {
      return currentData
    },
    get saveDataRequested () {
      return saveDataRequested
    },
    methods: {
      getData (name, defaultValue) {
        return currentData[name] !== undefined
          ? currentData[name]
          : defaultValue
      },
      setData (name, value) {
        currentData = {
          ...currentData,
          [name]: value
        }
      },
      clearData () {
        currentData = {}
      },
      saveData () {
        saveDataRequested = true
      }
    }
  }
}
