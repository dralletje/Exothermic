import EventEmitter from './EventEmitter'
import firebasechild from './firebasechild'

const possibleEvents = ['value']
const rootKey = Symbol('Root of the state tree')

const exothermic = (initdata, {delay = 0} = {}) => {
  let data = initdata

  const root = {
    __get: _ => {
      return data
    },
    update: value => {
      data = {
        ...data,
        ...value[rootKey],
      }
    },
    on: () => {},
  }

  return firebasechild(root, rootKey, {delay})
}

const exothermicLocalstorage = (initdata, window, {delay = 0} = {}) => {
  const getData = () => JSON.parse(window.localStorage.getItem('exothermic'))
  const setData = data => window.localStorage.setItem('exothermic', JSON.stringify(data))
  const emitter = EventEmitter(possibleEvents)

  // Initialize
  setData(initdata)
  // Listen for storage change
  window.addEventListener('storage', event => {
    if (event.key !== 'exothermic') {
      return
    }
    emitter.emit('value') // Not even going to try to emit a snapshot here
  })

  const root = {
    ...emitter,
    __get: getData,
    update: value => {
      setData({
        ...getData(),
        ...value[rootKey],
      })
    },
  }

  return firebasechild(root, rootKey, {delay})
}

exothermic.exothermicLocalstorage = exothermicLocalstorage
export default exothermic
