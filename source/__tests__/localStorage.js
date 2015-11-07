jest
  .dontMock('../exothermic')
  .dontMock('../EventEmitter')
  .dontMock('../pushId')
  .dontMock('./_tests')

const tests = require('./_tests')
const exothermic = require('../exothermic').exothermicLocalstorage

const localStorageMock = (() => {
  let data = {}

  return {
    setItem: (key, value) => {
      data[key] = value
    },
    getItem: key => data[key],
  }
})()

tests(data =>
  exothermic(data, localStorageMock, {delay: -1})
)
