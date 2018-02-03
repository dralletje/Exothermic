jest
  .dontMock('./_tests')

const tests = require('./_tests').default
const exothermic = require('../exothermic').default

tests(data =>
  exothermic(data, {delay: -1})
)
