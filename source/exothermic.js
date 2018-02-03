import EventEmitter from './EventEmitter'
import firebasechild from './firebasechild'

const possibleEvents = ['value']
const rootKey = Symbol('Root of the state tree')

const clean_object = object => {
  if (!object || typeof object !== 'object') {
    return object
  }

  // Split the object in an array
  let cleaned =
    Object.entries(object)
    // My actual mutations I am interested in
    .map(([k,v]) => [k, clean_object(v)])
    .filter(([k, v]) => v !== null)
    // Bring it back to an object
    .reduce((o, [k, v]) => {
      o[k] = v
      return o
    }, {})

  // Object is empty after cleaning it's children... to bad
  if (Object.keys(cleaned).length === 0) {
    return null
  } else {
    return cleaned
  }
}

const exothermic = (initdata, {delay = 0} = {}) => {
  let data = initdata

  // TODO Clean all data either in `update` or in `__get`
  const root = {
    __get: _ => {
      return clean_object(data);
    },
    update: value => {
      // TODO Some way to "record" the changes applied
      data = {
        ...data,
        ...value[rootKey],
      }
    },
    on: () => {},
  }

  return firebasechild(root, rootKey, {delay})
}

// const exothermicLocalstorage = (initdata, window, {delay = 0} = {}) => {
//   const getData = () => JSON.parse(window.localStorage.getItem('exothermic'))
//   const setData = data => window.localStorage.setItem('exothermic', JSON.stringify(data))
//   const emitter = EventEmitter(possibleEvents)
//
//   // Initialize
//   setData(initdata)
//   // Listen for storage change
//   window.addEventListener('storage', event => {
//     if (event.key !== 'exothermic') {
//       return
//     }
//     emitter.emit('value') // Not even going to try to emit a snapshot here
//   })
//
//   const root = {
//     ...emitter,
//     __get: getData,
//     update: value => {
//       setData({
//         ...getData(),
//         ...value[rootKey],
//       })
//     },
//   }
//
//   return firebasechild(root, rootKey, {delay})
// }
//
// exothermic.exothermicLocalstorage = exothermicLocalstorage
export default exothermic
