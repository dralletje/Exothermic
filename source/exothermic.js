import EventEmitter from './EventEmitter'
import firebasechild from './firebasechild'

const possibleEvents = ['value']
const rootKey = Symbol('Root of the state tree')
const rawEvents = ['set', 'update', 'subscription', 'unsubscription'];

const exothermic = (initdata, {delay = 0} = {}) => {
  let rawEventsEmitter = EventEmitter(rawEvents);
  let data = initdata

  const root = {
    __get: _ => {
      return data
    },
    update: (value) => {
      data = {
        ...data,
        ...value[rootKey],
      };
    },

    on: () => {},

    __emitRawEvent: (event) => {
      console.log('event:', event);
      rawEventsEmitter.emit(event.type, event);
    },
    __rawEvents: rawEventsEmitter,
  }

  return firebasechild(root, rootKey, {delay})
}

const exothermicLocalstorage = (initdata, window, {delay = 0} = {}) => {
  const getData = () => JSON.parse(window.localStorage.getItem('exothermic'))
  const setData = data => window.localStorage.setItem('exothermic', JSON.stringify(data))
  const emitter = EventEmitter(possibleEvents)
  const rawEventsEmitter = EventEmitter(rawEvents)
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

    __emitRawEvent: (event) => {
      rawEventsEmitter.emit(event.type, event);
    },
    __rawEvents: rawEventsEmitter,
  }

  return firebasechild(root, rootKey, {delay})
}

exothermic.exothermicLocalstorage = exothermicLocalstorage
export default exothermic
