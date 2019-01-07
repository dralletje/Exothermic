jest
  .dontMock('./_tests')

const tests = require('./_tests').default
const exothermic = require('../exothermic').default

tests(data =>{
  return exothermic({
    delay: -1,
    data: data,
  })
})
