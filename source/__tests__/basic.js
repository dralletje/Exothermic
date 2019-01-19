const tests = require('./suite.setup.js').default
const exothermic = require('../exothermic').default

tests(data =>{
  return exothermic({
    delay: -1,
    data: data,
  })
})
