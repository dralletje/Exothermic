jest
  .dontMock('../exothermic')
  .dontMock('../EventEmitter')
  .dontMock('../pushId')
  .dontMock('./_tests')

const tests = require('./_tests')
const exothermic = require('../exothermic')

tests(data =>
  exothermic(data, {delay: -1})
)
